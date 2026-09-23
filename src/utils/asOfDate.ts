import type { ReadingArrays } from '../types/index.js';
import { enrichPartialOrig, enrichOccasionPartialOrig, enrichWeekdayPartialOrig, enrichHosafotPartialOrig } from '../compute.js';
import { revertRow, revertOccasion, revertWeekday, revertHosafah } from './whatIf.js';

/**
 * Returns a snapshot of the real row arrays as they would have looked on `cutoff`
 * (a past-or-present date): any reading dated after `cutoff` is reverted to unread,
 * then partialOrig/isCoveredPast cross-references are recomputed against that
 * trimmed set so they stay consistent with the snapshot. The result can be fed
 * straight into computeStats() to preview the completion percentage as of that date.
 */
export function applyAsOfDate(
  { allRows, occasionAliyot, weekdayAliyot, hosafotReadings }: ReadingArrays,
  cutoff: string,
): ReadingArrays {
  const trimmedRows     = allRows.map(r => r.orig !== '' && r.orig <= cutoff ? { ...r, partialOrig: '' } : revertRow(r));
  const trimmedOccasion = occasionAliyot.map(oa => oa.orig !== '' && oa.orig <= cutoff ? { ...oa, partialOrig: '' } : revertOccasion(oa));
  const trimmedWeekday  = weekdayAliyot.map(wa => wa.dateRead !== '' && wa.dateRead <= cutoff ? { ...wa, partialOrig: '' } : revertWeekday(wa));
  const trimmedHosafot  = hosafotReadings.map(hr => hr.dateRead !== '' && hr.dateRead <= cutoff ? { ...hr, partialOrig: '' } : revertHosafah(hr));

  return {
    allRows:         enrichPartialOrig(trimmedRows, trimmedOccasion, trimmedWeekday, trimmedHosafot),
    occasionAliyot:  enrichOccasionPartialOrig(trimmedOccasion, trimmedRows, trimmedWeekday, trimmedHosafot),
    weekdayAliyot:   enrichWeekdayPartialOrig(trimmedWeekday, trimmedRows, trimmedOccasion, trimmedHosafot),
    hosafotReadings: enrichHosafotPartialOrig(trimmedHosafot, trimmedRows, trimmedOccasion, trimmedWeekday),
  };
}
