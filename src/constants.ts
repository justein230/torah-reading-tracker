export const TABS: string[] = ['overview', 'grid', 'log', 'details', 'calendar'];

/* Ring/chart accent colors — must be hex because Chart.js and SVG strokes can't read CSS vars */
export const RING_PSEUKIM  = '#38BDF8'; /* matches --accent  in global.css */
export const RING_ALIYOT   = '#FB923C'; /* matches --accent2 in global.css */
export const RING_HOLIDAY  = '#A78BFA'; /* violet  — holiday aliyot ring  */
export const RING_WEEKDAY  = '#34D399'; /* emerald — weekday aliyot ring  */
export const TAB_LABELS: Record<string, string> = {
  overview: 'Overview', grid: 'Grids',
  log: 'Reading Log', details: 'Details',
  calendar: 'Calendar',
};
