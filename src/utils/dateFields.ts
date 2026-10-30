/** Splits/combines an ISO datetime into separate date/time text-input strings (local time). */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function isoToDateField(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isoToTimeField(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Returns null if the date/time strings don't parse into a valid date. */
export function combineDateTimeToIso(dateField: string, timeField: string): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateField.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeField.trim());
  if (!dateMatch || !timeMatch) return null;
  const [, y, mo, da] = dateMatch;
  const [, h, mi] = timeMatch;
  const d = new Date(Number(y), Number(mo) - 1, Number(da), Number(h), Number(mi));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
