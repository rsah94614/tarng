/**
 * General utility functions
 */

/**
 * Format a date string into relative time (e.g. "2h ago", "3d ago")
 */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 52) return `${diffWeeks}w`;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Format a large number into compact notation (e.g. 1200 → "1.2K")
 */
export function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1_000_000) return `${(count / 1000).toFixed(1).replace(".0", "")}K`;
  return `${(count / 1_000_000).toFixed(1).replace(".0", "")}M`;
}

/**
 * Truncate text with an ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Generate initials from a display name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Build a media URL from a key (falls back to direct URL)
 */
export function getMediaUrl(key: string): string {
  const base =
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "http://localhost:9000/tarng-media";
  if (key.startsWith("http")) return key;
  return `${base}/${key}`;
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
