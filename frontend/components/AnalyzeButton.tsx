"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getApiBase } from "../libs/apiBase";
import { useSnackbar } from "./SnackbarProvider";

export default function AnalyzeButton({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

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
        showSnackbar({
          message: "Analyze request accepted",
          intent: "success",
        });
      } else if (res.status === 401) {
        showSnackbar({
          message: "Unauthorized – check GitHub credentials",
          intent: "error",
        });
      } else {
        const payload = await res.json().catch(() => ({}));
        showSnackbar({
          message: payload?.error || "Analyze request failed",
          intent: "error",
        });
      }
      router.refresh();
    } catch (e) {
      showSnackbar({
        message: "Network error while analyzing",
        intent: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzePrimitives = async () => {
    if (loading) return;
    setLoading(true);
    const API = getApiBase();
    try {
      const res = await fetch(`${API}/repos/${id}/analyze-primitives`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showSnackbar({
          message: data.error || "Primitive analysis failed",
          intent: "error",
        });
      } else {
        showSnackbar({
          message: "Primitive analysis recorded",
          intent: "success",
        });
        router.refresh();
      }
    } catch (e: any) {
      showSnackbar({ message: String(e), intent: "error" });
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

      <button
        onClick={analyzePrimitives}
        disabled={loading}
        className={`ml-2 px-3 py-1 text-sm rounded ${
          loading
            ? "bg-purple-300 text-white cursor-not-allowed"
            : "bg-purple-600 text-white"
        }`}
      >
        {loading ? "Analyzing primitives..." : "Analyze Primitives"}
      </button>
    </>
  );
}
