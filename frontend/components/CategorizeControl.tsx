"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBase } from "../lib/apiBase";

const categories = [
  "CLOUD_NATIVE_NETWORKING",
  "DEFENSIVE_SECURITY",
  "DEVELOPER_TOOLING_FRAMEWORKS",
  "EDUCATIONAL_DEMONSTRATION_RESOURCES",
  "KERNEL_DATAPLANE_NETWORKING",
  "OBSERVABILITY",
  "OFFENSIVE_SECURITY",
  "OPERATIONS_ORCHESTRATION_LIFECYCLE",
  "PLATFORM_RUNTIME_ACCELERATION",
  "RUNTIME_SECURITY",
  "UNCATEGORIZED",
] as const;

type Category = (typeof categories)[number];

export default function CategorizeControl({
  id,
  current,
}: {
  id: number;
  current: string | null;
}) {
  const [value, setValue] = useState<Category | "">(
    (current as Category) || ""
  );
  const router = useRouter();

  const onSave = async () => {
    const API = getApiBase();
    const body = { category: value || "UNCATEGORIZED" };
    const res = await fetch(`${API}/repos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      alert("Failed to update category");
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="border px-2 py-1 rounded text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value as Category)}
      >
        <option value="">Select category</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c === "UNCATEGORIZED" ? "Uncategorized" : c}
          </option>
        ))}
      </select>
      <button
        onClick={onSave}
        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded"
      >
        Categorize
      </button>
    </div>
  );
}
