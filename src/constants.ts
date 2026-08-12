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

// ── Occasion category taxonomy ────────────────────────────────────────────────
// Shared by HolidayGrid (section headings) and AddReadingForm (holiday dropdown).
// yom_tov's label differs by context on purpose: the grid heading names the whole
// category, so it uses the plural "Yamim Tovim"; the form option is picked for one
// holiday at a time, so it uses the singular "Yom Tov".

export const CATEGORY_ORDER: string[] = ['yom_tov', 'chanukah', 'rosh_chodesh', 'maftir_special', 'other'];

export const CATEGORY_LABELS_GRID: Record<string, string> = {
  yom_tov:        'Yamim Tovim',
  chanukah:       'Chanukah',
  rosh_chodesh:   'Rosh Chodesh',
  maftir_special: 'Special Maftir Shabbatot',
  other:          'Other',
};

export const CATEGORY_LABELS_FORM: Record<string, string> = {
  ...CATEGORY_LABELS_GRID,
  yom_tov: 'Yom Tov',
};

export const CATEGORY_COLORS: Record<string, string> = {
  yom_tov:        '#7C3AED',
  chanukah:       '#2563EB',
  rosh_chodesh:   '#059669',
  maftir_special: '#D97706',
  other:          '#6B7280',
};
