"use client";

import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import type { SortDirection } from "@/lib/table/sort";

type SortableTableHeaderProps = {
  label: string;
  active: boolean;
  direction: SortDirection;
  onToggle: () => void;
  align?: "left" | "right";
};

export default function SortableTableHeader({
  label,
  active,
  direction,
  onToggle,
  align = "left",
}: SortableTableHeaderProps) {
  const Icon = active
    ? direction === "asc"
      ? ChevronUp
      : ChevronDown
    : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 text-left text-sm font-semibold text-gray-700 transition-colors hover:text-red-600 ${
        align === "right" ? "ml-auto" : ""
      }`}
    >
      <span>{label}</span>
      <Icon
        className={`h-4 w-4 ${active ? "text-red-600" : "text-gray-400"}`}
      />
    </button>
  );
}
