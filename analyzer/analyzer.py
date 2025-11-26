import requests
import pandas as pd
import base64
from tqdm import tqdm
import time

# ==== CONFIG ====
GITHUB_TOKEN = "..."
INPUT_FILE = "echo_github_links_and_echo_descp.csv"
OUTPUT_FILE = "new_repo_profile.csv"
# =================

headers = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json"
}

# --- TEST TOKEN ---
r = requests.get("https://api.github.com/user", headers=headers)
print(f"🔑 Token check → {r.status_code}, user: {r.json().get('login')}")

def get_repo_metadata(repo_slug):
    """Fetch repo info from GitHub REST API (e.g., 'iovisor/bcc')."""
    url = f"https://api.github.com/repos/{repo_slug}"
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        print(f"❌ Metadata failed for {repo_slug}: {r.status_code}")
        return None
    return r.json()

def get_readme_text(repo_slug):
    """Fetch README file contents and decode from base64."""
    url = f"https://api.github.com/repos/{repo_slug}/readme"
    r = requests.get(url, headers=headers)
    if r.status_code == 200:
        try:
            content = r.json().get("content", "")
            return base64.b64decode(content).decode("utf-8", errors="ignore")
        except Exception:
            return ""
    return ""

def get_commit_count(repo_slug):
    """Fetch commit count using contributor stats (sums total contributions)."""
    url = f"https://api.github.com/repos/{repo_slug}/contributors?per_page=100&anon=true"
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        print(f"⚠️ Commit count failed for {repo_slug}: {r.status_code}")
        return None

    try:
        contributors = r.json()
        return sum(c.get("contributions", 0) for c in contributors)
    except Exception:
        return None

def main():
    # Load your existing CSV with the repo_slug column
    df = pd.read_csv(INPUT_FILE)

    if "repo_slug" not in df.columns:
        raise ValueError("❌ The input file must contain a 'repo_slug' column.")

    slugs = df["repo_slug"].dropna().unique()
    print(f"Found {len(slugs)} unique repo slugs to fetch.\n")

    data = []
    for repo_slug in tqdm(slugs, desc="Fetching repo data"):
        meta = get_repo_metadata(repo_slug)
        if not meta:
            continue

        stars = meta.get("stargazers_count", 0)
        forks = meta.get("forks_count", 0)
        watchers = meta.get("watchers_count", 0)
        issues = meta.get("open_issues_count", 0)
        language = meta.get("language", "")
        description = meta.get("description", "")
        created_at = meta.get("created_at", "")
        updated_at = meta.get("updated_at", "")

        commits = get_commit_count(repo_slug)
        readme = get_readme_text(repo_slug)

        data.append({
            "repo_slug": repo_slug,
            "stars": stars,
            "forks": forks,
            "watchers": watchers,
            "issues": issues,
            "language": language,
            "description": description,
            "created_at": created_at,
            "updated_at": updated_at,
            "commits": commits,
            "readme_text": readme
        })

        # polite pause to avoid hitting GitHub API limits
        time.sleep(0.5)

    result = pd.DataFrame(data)
    # Merge echo_description from original df based on repo_slug
    if "echo_description" in df.columns:
        result = result.merge(df[["repo_slug", "echo_description"]], on="repo_slug", how="left")
    result.to_csv(OUTPUT_FILE, index=False)
    print(f"\n✅ Done! Saved metadata for {len(result)} repos → {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
