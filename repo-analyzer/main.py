import os
import re
from datetime import datetime
from typing import Optional

import httpx
import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Analyzer Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"]
    ,
    allow_headers=["*"],
)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL")
POSTGRES_SCHEMA = os.getenv("POSTGRES_SCHEMA")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set for analyzer service")

# Simple postgres connection helper

def get_conn():
    # psycopg2 doesn't support the prisma-style ?schema=public in URI
    # Strip query params and capture schema separately, then set search_path
    import urllib.parse as up
    parsed = up.urlparse(DATABASE_URL)
    qs = up.parse_qs(parsed.query)
    schema = POSTGRES_SCHEMA or qs.get("schema", [None])[0]
    # rebuild DSN without query
    dsn_no_query = up.urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", parsed.fragment))
    conn = psycopg2.connect(dsn_no_query)
    if schema:
        with conn.cursor() as cur:
            cur.execute(f"SET search_path TO {schema}")
    return conn

class AnalyzeRequest(BaseModel):
    repoUrl: HttpUrl
    repoId: Optional[int] = None

GITHUB_API_BASE = "https://api.github.com"

_repo_re = re.compile(r"https?://github.com/(?P<owner>[^/]+)/(?P<repo>[^/#?]+)")

def parse_owner_repo(url: str):
    m = _repo_re.match(url)
    if not m:
        raise ValueError("Invalid GitHub URL")
    return m.group("owner"), m.group("repo")

async def fetch_repo_metadata(owner: str, repo: str):
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        # Repo info
        r = await client.get(f"{GITHUB_API_BASE}/repos/{owner}/{repo}", headers=headers)
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail="Repo not found on GitHub")
        if r.status_code == 401:
            raise HTTPException(status_code=401, detail="Unauthorized to GitHub API. Ensure GITHUB_TOKEN is set and valid.")
        r.raise_for_status()
        info = r.json()

        # Readme (raw markdown)
        readme_text = None
        rr = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/readme",
            headers={**headers, "Accept": "application/vnd.github.raw"},
        )
        if rr.status_code == 200:
            readme_text = rr.text

        # Commits count via Link header pagination (best-effort)
        commits = None
        cr = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits",
            params={"per_page": 1, "sha": info.get("default_branch", "main")},
            headers=headers,
        )
        if cr.status_code == 200:
            link = cr.headers.get("link")
            if link and "rel=\"last\"" in link:
                # format: <...&page=345>; rel="last"
                try:
                    last_url = [p for p in link.split(",") if 'rel="last"' in p][0]
                    # extract page number
                    import urllib.parse as up
                    start = last_url.find("<") + 1
                    end = last_url.find(">")
                    last_href = last_url[start:end]
                    q = up.urlparse(last_href).query
                    qs = up.parse_qs(q)
                    commits = int(qs.get("page", [None])[0] or 1)
                except Exception:
                    commits = None
            else:
                # If only one page, count is length of response (0 or 1)
                try:
                    commits = len(cr.json())
                except Exception:
                    commits = None

        # Parse timestamps
        created_at = info.get("created_at")
        updated_at = info.get("updated_at")
        try:
            created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00")) if created_at else None
        except Exception:
            created_dt = None
        try:
            updated_dt = datetime.fromisoformat(updated_at.replace("Z", "+00:00")) if updated_at else None
        except Exception:
            updated_dt = None

        data = {
            "stars": info.get("stargazers_count"),
            "forks": info.get("forks_count"),
            "watchers": info.get("subscribers_count") or info.get("watchers_count"),
            "issues": info.get("open_issues_count"),
            "language": info.get("language"),
            "commits": commits,
            "readmeText": readme_text,
            "cloneUrl": info.get("clone_url"),
            "defaultBranch": info.get("default_branch"),
            "repoCreatedAt": created_dt,
            "repoUpdatedAt": updated_dt,
        }
        return data

@app.post("/analyze")
async def analyze(payload: AnalyzeRequest):
    owner, repo = parse_owner_repo(str(payload.repoUrl))
    meta = await fetch_repo_metadata(owner, repo)

    # If repoId not provided, attempt to look it up by URL
    repo_id = payload.repoId
    with get_conn() as conn:
        with conn.cursor() as cur:
            if repo_id is None:
                cur.execute("SELECT id FROM repos WHERE url = %s LIMIT 1", (str(payload.repoUrl),))
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Repository not found in DB")
                repo_id = row[0]

            cur.execute(
                """
                INSERT INTO analysis(
                  "repoId","stars","forks","watchers","issues","language","commits",
                  "readmeText","cloneUrl","defaultBranch","repoCreatedAt","repoUpdatedAt","analyzedAt"
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id
                """,
                (
                    repo_id,
                    meta.get("stars"),
                    meta.get("forks"),
                    meta.get("watchers"),
                    meta.get("issues"),
                    meta.get("language"),
                    meta.get("commits"),
                    meta.get("readmeText"),
                    meta.get("cloneUrl"),
                    meta.get("defaultBranch"),
                    meta.get("repoCreatedAt"),
                    meta.get("repoUpdatedAt"),
                    datetime.utcnow(),
                ),
            )
            new_id = cur.fetchone()[0]
            conn.commit()

    return {"status": "created", "analysisId": new_id}
