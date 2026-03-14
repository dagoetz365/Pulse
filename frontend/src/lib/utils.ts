/**
 * Shared utility functions used across the frontend.
 *
 * - `cn()` — Merges Tailwind CSS class names, deduplicating and resolving
 *   conflicts (via clsx + tailwind-merge).
 * - `formatDate()` — Formats an ISO date string to "Mon DD, YYYY" or "—".
 * - `formatDateTime()` — Formats an ISO datetime string to include time.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind CSS class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an ISO date string as "Jan 1, 2025", or "—" if null/undefined. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format an ISO datetime string as "Jan 1, 2025, 02:30 PM", or "—" if null/undefined. */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
