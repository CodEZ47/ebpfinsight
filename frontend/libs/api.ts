const API = process.env.NEXT_PUBLIC_API_BASE || "http://server:8000";

export async function fetchRepos() {
  const res = await fetch(`${API}/repos`);
  return res.json();
}

export async function createRepo(data: any) {
  const res = await fetch(`${API}/repos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
