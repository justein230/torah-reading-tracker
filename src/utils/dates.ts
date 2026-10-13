/**
 * A Date's calendar day in LOCAL time, as YYYY-MM-DD. Reading dates are entered as local calendar
 * days, so comparisons against "today" must use this, not toISOString() (UTC), which lands on the
 * wrong day in the evening west of UTC and just after midnight east of it.
 */
export function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
