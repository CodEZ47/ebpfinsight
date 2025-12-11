"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import SelectMenu from "@/components/SelectMenu";

const sortOptions = [
  { value: "createdAt", label: "Added to Collection" },
  { value: "repoCreatedAt", label: "Repository Creation Date" },
  { value: "name", label: "Name" },
  { value: "stars", label: "Stars" },
  { value: "forks", label: "Forks" },
  { value: "watchers", label: "Watchers" },
  { value: "issues", label: "Issues" },
  { value: "commits", label: "Commits" },
];

const orderOptions = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

type RepoFiltersFormProps = {
  search?: string;
  category?: string;
  sort?: string;
  order?: string;
  categories: string[];
  pageSize?: string;
};

export default function RepoFiltersForm({
  search,
  category,
  sort,
  order,
  categories,
  pageSize,
}: RepoFiltersFormProps) {
  const [selectedCategory, setSelectedCategory] = useState(category || "");
  const [selectedSort, setSelectedSort] = useState(sort || "createdAt");
  const [selectedOrder, setSelectedOrder] = useState(order || "desc");
  const [selectedPageSize, setSelectedPageSize] = useState(pageSize || "20");

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All Categories" },
      ...categories.map((value) => ({
        value,
        label:
          value === "UNCATEGORIZED"
            ? "Uncategorized"
            : value.replace(/_/g, " "),
      })),
    ],
    [categories]
  );

  const pageSizeOptions = useMemo(
    () => [
      { value: "10", label: "10 per page" },
      { value: "20", label: "20 per page" },
      { value: "50", label: "50 per page" },
      { value: "100", label: "100 per page" },
    ],
    []
  );

  return (
    <form
      className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-lg dark:shadow-slate-900/20"
      method="get"
    >
      <input type="hidden" name="page" value="1" />
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex min-w-[220px] flex-1 flex-col gap-2 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Search
          <input
            type="text"
            name="search"
            placeholder="Name, URL, description"
            defaultValue={search}
            className="w-full rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/40"
          />
        </label>
        <label className="flex w-full max-w-[220px] flex-col gap-2 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Category
          <SelectMenu
            name="category"
            options={categoryOptions}
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            placeholder="All Categories"
            className="w-full"
          />
        </label>
        <label className="flex w-full max-w-[200px] flex-col gap-2 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Sort by
          <SelectMenu
            name="sort"
            options={sortOptions}
            value={selectedSort}
            onValueChange={setSelectedSort}
            className="w-full"
          />
        </label>
        <label className="flex w-full max-w-[160px] flex-col gap-2 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Order
          <SelectMenu
            name="order"
            options={orderOptions}
            value={selectedOrder}
            onValueChange={setSelectedOrder}
            className="w-full"
          />
        </label>
        <label className="flex w-full max-w-[160px] flex-col gap-2 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Page size
          <SelectMenu
            name="pageSize"
            options={pageSizeOptions}
            value={selectedPageSize}
            onValueChange={setSelectedPageSize}
            className="w-full"
          />
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-600 hover:bg-emerald-600"
          >
            Apply
          </button>
          <Link
            href="/repos"
            className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-slate-900"
          >
            Reset
          </Link>
        </div>
      </div>
    </form>
  );
}
