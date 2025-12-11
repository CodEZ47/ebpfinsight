"use client";

import React from "react";
import { getApiBase } from "@/libs/apiBase";

type AnalyzeTarget = {
  id: string | number;
  name?: string | null;
};

interface BulkCategoryAnalyzeButtonProps {
  repos: AnalyzeTarget[];
  disabled?: boolean;
  className?: string;
}

export default function BulkCategoryAnalyzeButton({
  repos,
  disabled,
  className,
}: BulkCategoryAnalyzeButtonProps) {
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState({ processed: 0, total: 0 });
  const [message, setMessage] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);

  const handleClick = React.useCallback(async () => {
    const queue = repos.filter((item) => item && item.id !== undefined);
    if (running || queue.length === 0) return;

    setRunning(true);
    setProgress({ processed: 0, total: queue.length });
    setMessage("Starting bulk analysis…");
    setErrors([]);

    const api = getApiBase();
    const failures: string[] = [];
    let successCount = 0;

    try {
      for (let index = 0; index < queue.length; index++) {
        const target = queue[index];
        const numericId = Number(target.id);
        if (!Number.isFinite(numericId)) {
          failures.push(
            `${target.name || `Repo ${target.id}`}: invalid repository id`
          );
          setErrors([...failures]);
          setProgress({ processed: index + 1, total: queue.length });
          continue;
        }

        const displayName = target.name || `Repo ${numericId}`;
        setMessage(
          `Analyzing ${displayName} (${index + 1} of ${queue.length})…`
        );

        try {
          const res = await fetch(`${api}/repos/bulk/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repoIds: [numericId] }),
          });
          const payload = await res.json().catch(() => ({}));

          if (!res.ok) {
            const reason =
              payload?.error || `Analyzer responded with ${res.status}`;
            failures.push(`${displayName}: ${reason}`);
          } else {
            const failureEntry = Array.isArray(payload?.failures)
              ? payload.failures[0]
              : null;
            if (failureEntry) {
              const reason = failureEntry?.reason || "unknown error";
              failures.push(`${displayName}: ${reason}`);
            } else {
              successCount += 1;
            }
          }
        } catch (err: any) {
          const reason = err?.message || String(err);
          failures.push(`${displayName}: ${reason}`);
        }

        setErrors([...failures]);
        setProgress({ processed: index + 1, total: queue.length });
      }
    } catch (error: any) {
      const detail = error?.message || String(error);
      setErrors([detail]);
      setMessage(detail);
    } finally {
      if (queue.length > 0) {
        const completedSummary = failures.length
          ? `Finished ${queue.length} analyses · ${successCount} succeeded · ${failures.length} failed.`
          : `Finished analyzing ${successCount} repositories.`;
        setMessage(completedSummary);
      }
      setRunning(false);
    }
  }, [repos, running]);

  const buttonDisabled = disabled || running || repos.length === 0;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={buttonDisabled}
        className={`px-4 py-2 text-sm font-medium rounded-md border border-brand/50 bg-brand/10 text-brand dark:text-brand shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          running ? "animate-pulse" : "hover:bg-brand/20"
        }`}
      >
        {running
          ? `Analyzing… (${progress.processed}/${progress.total})`
          : "Analyze All Category Repos"}
      </button>
      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {`Ready: ${repos.length} repos`}
      </p>
      {message && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {message}
        </p>
      )}
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-red-600 dark:text-red-400">
          {errors.map((err, idx) => (
            <li key={`${err}-${idx}`}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
