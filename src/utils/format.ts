export function formatNaira(minorUnits: number | string): string {
  const naira = Number(minorUnits) / 100;
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

export function formatAuctionWindow(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const sameDay = start.toDateString() === end.toDateString();
  const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  if (sameDay) {
    return `${start.toLocaleDateString(undefined, dateOpts)} · ${start.toLocaleTimeString(undefined, timeOpts)} – ${end.toLocaleTimeString(undefined, timeOpts)}`;
  }
  return `${start.toLocaleDateString(undefined, dateOpts)} – ${end.toLocaleDateString(undefined, dateOpts)}`;
}
