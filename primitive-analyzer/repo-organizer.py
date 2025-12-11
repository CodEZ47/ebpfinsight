import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from typing import Tuple

from flask import Flask, jsonify, request

app = Flask(__name__)

# Accept broader git URLs, not only GitHub
GIT_URL_RE = re.compile(r"^https?://.+/.+/.+(\.git)?/?$")
CLONE_BASE = os.environ.get("CLONE_BASE", "/tmp/repos")
APP_DIR = os.path.dirname(os.path.abspath(__file__))
MAIN_PY = os.path.join(APP_DIR, "main.py")
FEATURES_YAML = os.path.join(APP_DIR, "data", "feature-versions.yaml")


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def clone_repo(repo_url: str) -> Tuple[str, str]:
    ensure_dir(CLONE_BASE)
    ts = int(time.time())
    repo_name = repo_url.rstrip("/").split("/")[-1]
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]
    dest = os.path.join(CLONE_BASE, f"{repo_name}_{ts}")
    cmd = [
        "git",
        "clone",
        "--depth",
        "1",
        repo_url,
        dest,
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"git clone failed: {proc.stderr.strip()}")
    return dest, proc.stdout


def run_analyzer(repo_path: str, json_output: bool = True):
    # Call the existing CLI without modifying its logic
    cmd = [
        "python",
        MAIN_PY,
        "--repo",
        repo_path,
        "--features",
        FEATURES_YAML,
    ]
    if json_output:
        cmd.append("--json")
    proc = subprocess.run(cmd, cwd=APP_DIR, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or f"analyzer failed with code {proc.returncode}")
    if json_output:
        try:
            return json.loads(proc.stdout)
        except json.JSONDecodeError:
            # If not valid JSON, return raw text
            return {"raw": proc.stdout}
    return {"raw": proc.stdout}


@app.route("/healthz", methods=["GET"])
def healthz():
    return jsonify({"status": "ok"})


@app.route("/clone-and-analyze", methods=["POST"])
def clone_and_analyze():
    body = request.get_json(silent=True) or {}
    repo_url = body.get("repo_url")
    if not repo_url or not isinstance(repo_url, str):
        return jsonify({"error": "repo_url is required"}), 400
    if not GIT_URL_RE.match(repo_url.strip()):
        return jsonify({"error": "repo_url must be a valid git URL (https://host/owner/repo[.git])"}), 400

    keep = bool(body.get("keep", False))
    try:
        repo_path, clone_stdout = clone_repo(repo_url.strip())
        results = run_analyzer(repo_path, json_output=True)
        resp = {
            "repo_path": repo_path,
            "clone_log": clone_stdout,
            "results": results,
        }
        return jsonify(resp)
    except Exception as e:
        # Surface more diagnostic context
        return jsonify({
            "error": str(e),
            "repo_url": repo_url,
            "hint": "Ensure the repo is public and reachable; if private, provide credentials via URL."
        }), 500
    finally:
        if not keep:
            try:
                if 'repo_path' in locals() and os.path.isdir(repo_path):
                    shutil.rmtree(repo_path, ignore_errors=True)
            except Exception:
                pass


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
