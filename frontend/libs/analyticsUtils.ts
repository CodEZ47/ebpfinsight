export const DEFAULT_CATEGORY_LABEL = "UNCATEGORIZED";

export function normalizeCategoryLabel(value?: string | null): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : DEFAULT_CATEGORY_LABEL;
}

export function sumRecordValues(record?: Record<string, unknown>): number {
  if (!record) return 0;
  let total = 0;
  for (const raw of Object.values(record)) {
    const value = Number(raw ?? 0);
    if (!Number.isNaN(value)) total += value;
  }
  return total;
}

export function uniqueKeyCount(record?: Record<string, unknown>): number {
  if (!record) return 0;
  return Object.keys(record).length;
}

export function formatCategoryDisplay(value: string): string {
  if (!value) return "Uncategorized";
  if (value === DEFAULT_CATEGORY_LABEL) return "Uncategorized";
  return value.replace(/_/g, " ");
}

export function formatProgramTypeLabel(value: string): string {
  if (!value) return "Unknown";
  const withoutPrefix = value.replace(/^BPF_PROG_TYPE_/, "");
  const spaced = withoutPrefix.replace(/_/g, " ");
  return spaced
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}
