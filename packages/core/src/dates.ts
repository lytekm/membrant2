/** Calendar dates are local YYYY-MM-DD strings, never UTC-truncated timestamps. */
export function today(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return today(value);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

export function weekStart(date = today()): string {
  const day = new Date(`${date}T12:00:00`).getDay();
  return addDays(date, -((day + 6) % 7));
}

export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', options);
}

export function uid(prefix = 'id'): string {
  // Entity IDs are identifiers, not authentication secrets. Works in native and web JS.
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
