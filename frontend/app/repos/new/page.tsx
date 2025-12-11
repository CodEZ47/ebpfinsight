"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBase } from "../../../libs/apiBase";
import { useSnackbar } from "@/components/SnackbarProvider";

const API = getApiBase();

export default function NewRepo() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClasses =
    "w-full rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40";
  const labelClasses =
    "text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300";

  const handleModeChange = (nextMode: "single" | "bulk") => {
    setMode(nextMode);
  };

  const submitSingle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url) {
      showSnackbar({ message: "Repository URL required", intent: "warning" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/repos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, url }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        showSnackbar({
          message: payload?.error || `Failed to add repository (${res.status})`,
          intent: "error",
        });
        return;
      }
      showSnackbar({
        message: `Added ${payload?.name || "repository"}`,
        intent: "success",
      });
      router.push("/repos");
      router.refresh();
    } catch (err: any) {
      showSnackbar({
        message: err?.message || "Network error while adding repository",
        intent: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitBulk = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const lines = bulkInput
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) {
      showSnackbar({ message: "Enter at least one URL", intent: "warning" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/repos/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: lines }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        showSnackbar({
          message: payload?.error || `Bulk add failed (${res.status})`,
          intent: "error",
        });
        return;
      }
      const createdCount = payload?.created?.length ?? 0;
      const skippedCount = payload?.skipped?.length ?? 0;
      const createdLabel = createdCount === 1 ? "repo" : "repos";
      const skippedLabel = skippedCount === 1 ? "entry" : "entries";
      const baseMessage = createdCount
        ? `Added ${createdCount} ${createdLabel}`
        : "No new repositories added";
      const detail = skippedCount
        ? `; skipped ${skippedCount} ${skippedLabel}`
        : "";
      showSnackbar({
        message: `${baseMessage}${detail}`,
        intent: createdCount ? "success" : "info",
      });
      router.push("/repos");
      router.refresh();
    } catch (err: any) {
      showSnackbar({
        message: err?.message || "Network error while bulk adding",
        intent: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 p-8 shadow-sm dark:border-slate-800 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-950/70 dark:shadow-lg dark:shadow-slate-900/30">
        <div className="flex flex-col gap-4 text-slate-900 md:flex-row md:items-center md:justify-between dark:text-slate-100">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              Import catalog
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Add repositories
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Register individual sources or paste a list to onboard multiple
              repositories at once.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Choose import mode
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Switch between single entry and bulk upload depending on your
                workflow.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-white p-1 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              <button
                type="button"
                onClick={() => handleModeChange("single")}
                className={`rounded-full px-4 py-1.5 transition ${
                  mode === "single"
                    ? "bg-emerald-500 text-white shadow"
                    : "hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-800/80"
                }`}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("bulk")}
                className={`rounded-full px-4 py-1.5 transition ${
                  mode === "bulk"
                    ? "bg-emerald-500 text-white shadow"
                    : "hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-800/80"
                }`}
              >
                Bulk
              </button>
            </div>
          </header>

          <div className="mt-6">
            {mode === "single" && (
              <form onSubmit={submitSingle} className="space-y-5">
                <div className="space-y-2">
                  <label className={labelClasses}>Name (optional)</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClasses}
                    placeholder="Will derive from URL if omitted"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Repository URL</label>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={inputClasses}
                    placeholder="https://github.com/owner/repo"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  New repositories start as uncategorized. Description and
                  README details populate after the first analysis run.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600 disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding..." : "Add repository"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName("");
                      setUrl("");
                    }}
                    className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
                  >
                    Clear
                  </button>
                </div>
              </form>
            )}

            {mode === "bulk" && (
              <form onSubmit={submitBulk} className="space-y-5">
                <div className="space-y-2">
                  <label className={labelClasses}>
                    Repository URLs or owner/repo (one per line)
                  </label>
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    className={`${inputClasses} h-48 resize-none font-mono`}
                    placeholder={
                      "https://github.com/cilium/cilium\nowner/repo\nhttps://github.com/iovisor/bcc"
                    }
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  URLs are normalized automatically. Existing entries are
                  skipped and reported back to you.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600 disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Bulk add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkInput("")}
                    className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
                  >
                    Clear list
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Tips for clean imports
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="rounded-2xl border border-emerald-100/70 bg-emerald-50/80 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              Include the full HTTPS URL when possible. Owner/repo pairs are
              also accepted and normalized.
            </li>
            <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              Duplicate URLs are automatically skipped so you can paste existing
              lists without manual cleanup.
            </li>
            <li className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              Trigger an analysis from the repository list after import to
              populate metrics and category insights.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
