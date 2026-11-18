/** Naira text from a form field to integer kobo, or undefined if it is empty or not a number. */
export function nairaToMinor(value: string): number | undefined {
  const cleaned = value.replace(/[,\s]/g, '');
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) return undefined;
  return Math.round(parsed * 100);
}

export function minorToNairaField(minor?: number | null): string {
  if (minor == null) return '';
  return String(Number(minor) / 100);
}
