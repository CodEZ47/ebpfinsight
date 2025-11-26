"use client";
import { useRouter } from "next/navigation";

import { getApiBase } from "../lib/apiBase";

export default function DeleteRepoButton({ id }: { id: number }) {
  const router = useRouter();

  const onDelete = async () => {
    if (!confirm("Delete this repository?")) return;
    const API = getApiBase();
    await fetch(`${API}/repos/${id}`, { method: "DELETE" });
    router.push("/repos");
    router.refresh();
  };

  return (
    <button
      onClick={onDelete}
      className="px-3 py-1 text-sm bg-red-600 text-white rounded"
    >
      Delete
    </button>
  );
}
