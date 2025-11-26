"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { getApiBase } from "../lib/apiBase";

type Snack = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

export default function AnalyzeButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const counterRef = useRef(0);

  // Auto-dismiss queue items after 4s
  useEffect(() => {
    if (!snacks.length) return;
    const timers = snacks.map((snack) =>
      setTimeout(() => {
        setSnacks((curr) => curr.filter((s) => s.id !== snack.id));
      }, 4000)
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [snacks]);

  const pushSnack = (message: string, type: Snack["type"]) => {
    counterRef.current += 1;
    const id = counterRef.current;
    setSnacks((curr) => [...curr, { id, message, type }]);
  };

  const onAnalyze = async () => {
    if (loading) return;
    setLoading(true);
    const API = getApiBase();
    try {
      const res = await fetch(`${API}/repos/${id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.ok) {
        pushSnack("Analyze request accepted", "success");
      } else if (res.status === 401) {
        pushSnack("Unauthorized (GitHub token?)", "error");
      } else {
        pushSnack("Analyze request failed", "error");
      }
      router.refresh();
    } catch (e) {
      pushSnack("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={onAnalyze}
        disabled={loading}
        className={`px-3 py-1 text-sm rounded ${
          loading
            ? "bg-green-300 text-white cursor-not-allowed"
            : "bg-green-600 text-white"
        }`}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 bg-white border rounded shadow px-4 py-3 text-sm">
            Starting analysis...
          </div>
        </div>
      )}

      {/* Snackbar queue */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[min(90vw,360px)]">
        {snacks.map((s) => {
          const color =
            s.type === "success"
              ? "bg-green-600"
              : s.type === "error"
              ? "bg-red-600"
              : "bg-gray-800";
          return (
            <div
              key={s.id}
              className={`text-white text-sm px-4 py-2 rounded shadow transform transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 ${color} flex items-start justify-between gap-3`}
            >
              <span>{s.message}</span>
              <button
                onClick={() =>
                  setSnacks((curr) => curr.filter((x) => x.id !== s.id))
                }
                className="text-white/80 hover:text-white text-xs"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
