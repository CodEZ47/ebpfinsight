"use client";
import { useRouter } from "next/navigation";

import { getApiBase } from "../libs/apiBase";
import { useSnackbar } from "./SnackbarProvider";

export default function DeleteRepoButton({ id }: { id: number }) {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const onDelete = async () => {
    if (!confirm("Delete this repository?")) return;
    const API = getApiBase();
    try {
      const res = await fetch(`${API}/repos/${id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        showSnackbar({
          message: payload?.error || "Failed to delete repository",
          intent: "error",
        });
        return;
      }
      showSnackbar({ message: "Repository deleted", intent: "success" });
      router.push("/repos");
      router.refresh();
    } catch (err: any) {
      showSnackbar({
        message: err?.message || "Network error while deleting",
        intent: "error",
      });
    }
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
