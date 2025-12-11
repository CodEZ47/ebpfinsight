export function getApiBase() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_BROWSER || "http://localhost:8000";
  }
  return process.env.NEXT_PUBLIC_API_BASE || "http://server:8000";
}
