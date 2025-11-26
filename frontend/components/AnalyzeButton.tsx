"use client";
import { useRouter } from "next/navigation";
import { getApiBase } from "../lib/apiBase";

export default function AnalyzeButton({ id }: { id: number }) {
  const router = useRouter();
  const onAnalyze = async () => {
    const API = getApiBase();
    await fetch(`${API}/repos/${id}/analyze`, { method: "POST" });
    router.refresh();
    alert("Analyze job accepted (stub)");
  };
  return (
    <button
      onClick={onAnalyze}
      className="px-3 py-1 text-sm bg-green-600 text-white rounded"
    >
      Analyze
    </button>
  );
}
