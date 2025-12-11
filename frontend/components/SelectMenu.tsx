"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import {
  selectFieldClasses,
  selectMenuListClasses,
  selectMenuOptionActiveClasses,
  selectMenuOptionClasses,
} from "@/libs/formStyles";

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

type SelectMenuProps = {
  name?: string;
  options: SelectOption[];
  value: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function SelectMenu({
  name,
  options,
  value,
  onValueChange,
  placeholder = "Select",
  className,
  disabled,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value);
  const displayLabel = selected?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue);
    setOpen(false);
  };

  return (
    <div className={clsx("relative", className)} ref={containerRef}>
      {typeof name === "string" && (
        <input type="hidden" name={name} value={value} />
      )}
      <button
        type="button"
        className={clsx(
          "inline-flex w-full items-center justify-between gap-3 text-left pr-9",
          selectFieldClasses,
          disabled && "cursor-not-allowed"
        )}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
      >
        <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
          {displayLabel}
        </span>
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-emerald-600 transition",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className={selectMenuListClasses} role="listbox">
          {options.length === 0 && (
            <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-300">
              No options available
            </div>
          )}
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value || option.label}
                type="button"
                role="option"
                aria-selected={isActive}
                className={clsx(
                  selectMenuOptionClasses,
                  isActive && selectMenuOptionActiveClasses
                )}
                onClick={() => handleSelect(option.value)}
              >
                <span className="truncate">{option.label}</span>
                {isActive && (
                  <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.17l-4.25 3.37a.75.75 0 0 1-.94 0l-4.25-3.37a.75.75 0 0 1 .02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
