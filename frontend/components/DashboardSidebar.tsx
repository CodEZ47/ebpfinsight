"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiDatabase,
  FiBarChart2,
  FiLayers,
  FiHome,
  FiChevronRight,
} from "react-icons/fi";

const navSections = [
  {
    title: "Overview",
    links: [
      { href: "/", label: "Dashboard", icon: FiHome },
      { href: "/repos", label: "Repositories", icon: FiDatabase },
    ],
  },
  {
    title: "Insights",
    links: [
      { href: "/repo-insights", label: "Repo Insights", icon: FiBarChart2 },
      {
        href: "/category-insights",
        label: "Category Insights",
        icon: FiLayers,
      },
    ],
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen min-h-screen w-full max-w-[268px] flex-col border-r border-emerald-100 bg-white/80 px-4 pb-6 pt-8 shadow-lg shadow-emerald-100/40 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3 px-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-base font-semibold text-emerald-600">
          eI
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            eBPF Insight
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Modern operations console
          </p>
        </div>
      </div>

      <nav
        className="mt-10 flex-1 space-y-8 overflow-y-auto pr-1 text-sm"
        aria-label="Main"
      >
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {section.title}
            </p>
            <ul className="mt-3 space-y-1">
              {section.links.map((link) => {
                const active =
                  pathname === link.href ||
                  pathname?.startsWith(link.href + "/");
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`group flex items-center justify-between gap-3 rounded-2xl px-3 py-2 font-medium transition-all ${
                        active
                          ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-inset ring-emerald-500/30 shadow-sm dark:text-emerald-300"
                          : "text-slate-600 hover:bg-emerald-50/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {link.icon && <link.icon className="text-base" />}
                        {link.label}
                      </span>
                      <FiChevronRight className="text-xs opacity-0 transition group-hover:opacity-70" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mx-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
        <p className="font-semibold text-emerald-700 dark:text-slate-200">
          Need more insights?
        </p>
        <p className="mt-1 leading-snug">
          Explore category and repository analytics to discover optimization
          opportunities.
        </p>
      </div>
    </aside>
  );
}
