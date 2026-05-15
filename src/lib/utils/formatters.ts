/**
 * Date and number formatting helpers.
 * Pure functions — no side effects, no React imports.
 */

/**
 * Format a date as a human-readable label for snapshots.
 * Example: "May 13, 2026"
 */
export function formatSnapshotLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a number with locale-aware separators.
 * Example: 1234567 → "1,234,567"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format a change number with sign prefix.
 * Example: 15 → "+15", -8 → "-8"
 */
export function formatChange(n: number): string {
  if (n > 0) return `+${formatNumber(n)}`;
  return formatNumber(n);
}

/**
 * Format milliseconds to a human-readable duration.
 * Example: 1500 → "1.5s", 500 → "500ms"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format bytes to human-readable size.
 * Example: 1024 → "1.0 KB", 1048576 → "1.0 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Format a Unix timestamp (seconds) to ISO 8601.
 */
export function unixToISO(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}
