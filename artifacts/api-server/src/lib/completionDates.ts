/** Mirrors the client's canonical completion-date merge for offline sync. */
export function normalizeCompletedAt(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value ? value : undefined;
}

export function mergeCompletionDates(left: unknown, right: unknown): string | undefined {
  const a = normalizeCompletedAt(left);
  const b = normalizeCompletedAt(right);
  return a && b ? (a < b ? a : b) : a ?? b;
}
