/*
 * Date & number formatting — single source of truth (CONTEXT/04 §7).
 *
 * Every date/number shown in the UI goes through these helpers so formatting
 * never drifts. All dates render in mono (typography rule); callers apply the
 * `font-mono` utility — these helpers only produce the string.
 */

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DATETIME_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true,
});

/** `MMM d, yyyy` → `Jun 20, 2026`. */
export function formatDate(input: Date | string | number | null | undefined): string {
  if (input == null) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return DATE_FMT.format(d);
}

/** `MMM d, yyyy · h:mm a` → `Jun 20, 2026 · 3:45 PM`. */
export function formatDateTime(input: Date | string | number | null | undefined): string {
  if (input == null) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return DATETIME_FMT.format(d);
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/**
 * Relative within 24h ("just now", "5m ago", "3h ago", "yesterday"), absolute
 * otherwise. Never mix relative and absolute in the same column (CONTEXT/04 §7).
 */
export function formatRelative(input: Date | string | number | null | undefined): string {
  if (input == null) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";

  const now = Date.now();
  const then = d.getTime();
  const diff = now - then;
  const abs = Math.abs(diff);

  if (abs < MINUTE) return "just now";
  if (abs < HOUR) {
    const mins = Math.round(abs / MINUTE);
    return `${mins}m ago`;
  }
  if (abs < DAY) {
    const hrs = Math.round(abs / HOUR);
    return `${hrs}h ago`;
  }

  // Calendar-relative "yesterday": within the last two calendar days.
  const yesterday = new Date(now);
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  const thenDay = new Date(then);
  thenDay.setHours(0, 0, 0, 0);
  if (thenDay.getTime() === yesterday.getTime()) return "yesterday";

  // Older than ~24h → absolute date.
  return DATE_FMT.format(d);
}

/** Plain integer in mono-friendly form (no thousands separators in UI copy). */
export function formatCount(n: number): string {
  return String(Math.max(0, Math.trunc(n)));
}

/** Compact form for large counts: `12.4k` past 9,999, otherwise plain. */
export function formatCompact(n: number): string {
  if (n < 10_000) return formatCount(n);
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** Initials (max 2 chars) for the avatar. */
export function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
