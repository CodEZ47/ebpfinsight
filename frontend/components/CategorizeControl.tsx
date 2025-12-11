"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBase } from "../libs/apiBase";
import SelectMenu from "@/components/SelectMenu";
import { useSnackbar } from "./SnackbarProvider";

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
  const { showSnackbar } = useSnackbar();
  const [isSaving, setIsSaving] = useState(false);

  const labelFor = (category: string | null | undefined) => {
    if (!category || category === "UNCATEGORIZED") return "Uncategorized";
    return category.replace(/_/g, " ");
  };

  const onSave = async () => {
    const API = getApiBase();
    const body = { category: value || "UNCATEGORIZED" };
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/repos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        showSnackbar({
          message: payload?.error || "Failed to update category",
          intent: "error",
        });
        return;
      }
      const resolvedCategory =
        payload?.category ?? body.category ?? value ?? null;
      showSnackbar({
        message: `Category updated to ${labelFor(resolvedCategory)}`,
        intent: "success",
      });
      router.refresh();
    } catch (err: any) {
      showSnackbar({
        message: err?.message || "Network error while updating category",
        intent: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SelectMenu
        options={[
          { value: "", label: "Select category" },
          ...categories.map((categoryValue) => ({
            value: categoryValue,
            label: labelFor(categoryValue),
          })),
        ]}
        value={value}
        onValueChange={(next) => setValue(next as Category | "")}
        placeholder="Select category"
        className="min-w-[220px]"
        disabled={isSaving}
      />
      <button
        onClick={onSave}
        className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSaving}
      >
        Categorize
      </button>
    </div>
  );
}
