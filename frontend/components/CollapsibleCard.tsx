"use client";

import React from "react";
import { Card } from "@/components/ui";

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
  collapsedContent?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function CollapsibleCard({
  title,
  children,
  className,
  defaultCollapsed = false,
  collapsedContent,
  actions,
}: CollapsibleCardProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const renderedActions = React.useMemo(() => {
    return (
      <div className="flex items-center gap-2">
        {actions}
        <button
          type="button"
          onClick={toggleCollapse}
          className="text-xs px-2 py-1 border rounded bg-gray-100 dark:bg-gray-800 dark:border-gray-700"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
    );
  }, [actions, collapsed, toggleCollapse]);

  return (
    <Card title={title} className={className} actions={renderedActions}>
      {collapsed
        ? collapsedContent || (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Chart collapsed.
            </p>
          )
        : children}
    </Card>
  );
}
