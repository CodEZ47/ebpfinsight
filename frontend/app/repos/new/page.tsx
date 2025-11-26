"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBase } from "../../../lib/apiBase";

const API = getApiBase();

export default function NewRepo() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");

  const submitSingle = async (e: any) => {
    e.preventDefault();
    if (!url) return;
    await fetch(`${API}/repos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || undefined, url }),
    });
    router.push("/repos");
  };

  const submitBulk = async (e: any) => {
    e.preventDefault();
    const lines = bulkInput
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    await fetch(`${API}/repos/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: lines }),
    });
    router.push("/repos");
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded shadow space-y-6">
      <h1 className="text-xl font-bold">Add Repositories</h1>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`px-3 py-1 rounded border ${
            mode === "single" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`px-3 py-1 rounded border ${
            mode === "bulk" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Bulk
        </button>
      </div>
      {mode === "single" && (
        <form onSubmit={submitSingle} className="space-y-4">
          <div>
            <label className="block mb-1">Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border"
              placeholder="Will derive from URL if omitted"
            />
          </div>
          <div>
            <label className="block mb-1">Repository URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border"
              placeholder="https://github.com/owner/repo"
              required
            />
          </div>
          <p className="text-sm text-gray-600">
            Category will be set to uncategorized. Description & README fetched
            on analysis.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            Add Repository
          </button>
        </form>
      )}
      {mode === "bulk" && (
        <form onSubmit={submitBulk} className="space-y-4">
          <div>
            <label className="block mb-1">
              Repository URLs or owner/repo (one per line)
            </label>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="w-full p-2 border h-48 font-mono text-sm"
              placeholder={
                "https://github.com/cilium/cilium\nowner/repo\nhttps://github.com/iovisor/bcc"
              }
              required
            />
          </div>
          <p className="text-sm text-gray-600">
            Names will be auto-derived. Existing URLs are skipped.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            Bulk Add
          </button>
        </form>
      )}
    </div>
  );
}
