"use client";

import { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  markdown?: string | null;
};

export default function ReadmeModal({ markdown }: Props) {
  const [open, setOpen] = useState(false);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  const hasReadme = !!(markdown && markdown.trim().length > 0);

  const content = useMemo(() => markdown ?? "", [markdown]);

  return (
    <div>
      <button
        type="button"
        disabled={!hasReadme}
        onClick={() => setOpen(true)}
        className={`px-3 py-2 rounded text-sm font-medium border transition ${
          hasReadme
            ? "bg-white hover:bg-gray-50 border-gray-300 text-gray-800"
            : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        title={hasReadme ? "Open README" : "README not available"}
      >
        Open README
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-[min(960px,92vw)] max-h-[86vh] bg-white rounded shadow-lg border border-gray-200 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <h3 className="font-semibold">README</h3>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-gray-100"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="px-4 pt-4 pb-6 overflow-y-auto min-h-0">
              {hasReadme ? (
                <article className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </article>
              ) : (
                <p className="text-sm text-gray-600">README not available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
