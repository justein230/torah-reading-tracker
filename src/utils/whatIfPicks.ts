import { fmtAliyah } from './format.js';
import { standardRowKey } from './whatIf.js';
import type { WhatIfPick } from './whatIf.js';
import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah } from '../types/index.js';

export interface PendingPick {
  kind: WhatIfPick['kind'];
  /* Row id for occasion/weekday/hosafah picks; undefined for standard aliyot (keyed by parsha+aliyah). */
  id?: number;
  parsha: string;
  sefer: string;
  aliyah: string;
  date: string;
  pseukim: number;
  /* Already scheduled for real (seeded from the real arrays) vs. added in this preview session. */
  existing: boolean;
  /* Precomputed display strings so the render stays uniform across all reading kinds. */
  title: string;   /* Hebrew heading line */
  detail: string;  /* secondary descriptor shown before the sefer + pseukim */
}

/* The key applyWhatIfPicks matches a pick against: parsha+aliyah for standard aliyot, row id for
   the special-reading kinds (see WhatIfPick / applyWhatIfPicks in utils/whatIf.ts). */
export function whatIfKeyOf(p: PendingPick): string {
  return p.kind === 'standard' ? standardRowKey(p) : String(p.id);
}

/* Stable identity for React keys / removal / the cumulative-stats map. Prefixed with kind so a
   standard aliyah and a special reading that happen to share an id/key can never collide. */
export function pickId(p: PendingPick): string {
  return `${p.kind}:${whatIfKeyOf(p)}`;
}

/* Mirrors ReadingRow's aliyahHebrew logic. Numbered aliyot render as עליה N; the maftir
   (aliyah 8, or the 'M' key used by occasion readings) renders as מפטיר. */
function aliyahHebrew(aliyah: string): string {
  return Number(aliyah) === 8 || aliyah === 'M' ? 'מפטיר' : `עליה ${aliyah}`;
}

export function standardPick(r: MappedRow, date: string, existing: boolean, TLIT: Record<string, string>): PendingPick {
  return {
    kind: 'standard', parsha: r.parsha, sefer: r.sefer, aliyah: String(r.aliyah), date, pseukim: r.pseukim, existing,
    title: `${r.parsha} — ${aliyahHebrew(String(r.aliyah))}`,
    detail: `${TLIT[r.parsha] ?? ''} · ${fmtAliyah(r.aliyah)}`,
  };
}

function occasionPick(oa: MappedOccasionAliyah): PendingPick {
  return {
    kind: 'occasion', id: oa.id, parsha: oa.parsha, sefer: oa.sefer, aliyah: oa.aliyahKey,
    date: oa.orig, pseukim: oa.pseukim, existing: true,
    title: `${oa.occasion} — ${oa.parsha} · ${aliyahHebrew(oa.aliyahKey)}`,
    detail: `${oa.occasionEn} · ${oa.parshaEn} · ${fmtAliyah(oa.aliyahKey)}`,
  };
}

function weekdayPick(wa: MappedWeekdayAliyah): PendingPick {
  return {
    kind: 'weekday', id: wa.id, parsha: wa.parsha, sefer: wa.sefer, aliyah: String(wa.aliyahNum),
    date: wa.dateRead, pseukim: wa.pseukim, existing: true,
    title: `${wa.parsha} — ${aliyahHebrew(String(wa.aliyahNum))}`,
    detail: `Weekday · ${wa.parshaEn} · ${fmtAliyah(wa.aliyahNum)}`,
  };
}

function hosafahPick(hr: MappedHosafah): PendingPick {
  const parshaLabel = hr.parsha2 ? `${hr.parsha1}–${hr.parsha2}` : hr.parsha1;
  return {
    kind: 'hosafah', id: hr.id, parsha: parshaLabel, sefer: hr.sefer, aliyah: '',
    date: hr.dateRead, pseukim: hr.pseukim, existing: true,
    title: `${hr.occasion ?? parshaLabel} — הוספה`,
    detail: `Hosafah · ${hr.occasionEn ?? hr.parsha1En}`,
  };
}

export function seedExistingFuturePicks(
  allRows: MappedRow[],
  occasionAliyot: MappedOccasionAliyah[],
  weekdayAliyot: MappedWeekdayAliyah[],
  hosafotReadings: MappedHosafah[],
  TLIT: Record<string, string>,
): PendingPick[] {
  return [
    ...allRows.filter(r => r.isReadFuture).map(r => standardPick(r, r.orig, true, TLIT)),
    ...occasionAliyot.filter(oa => oa.isReadFuture).map(occasionPick),
    ...weekdayAliyot.filter(wa => wa.isReadFuture).map(weekdayPick),
    ...hosafotReadings.filter(hr => hr.isReadFuture).map(hosafahPick),
  ];
}

/**
 * Brings an open preview's picks back in line with the real data after it changed underneath
 * (a reading was added, edited or deleted while the preview stayed open), preserving the user's
 * own edits to the preview:
 *  - a real future reading that is still scheduled gets its fresh date/pseukim;
 *  - one that no longer is (deleted, or its date has passed) is dropped;
 *  - one newly scheduled for real since the last seed (id not in `prevSeedIds`) is added — without
 *    this, applyWhatIfPicks would revert it as if the user had removed it;
 *  - one the user removed in the preview (in `prevSeedIds` but not in `picks`) stays removed;
 *  - a hypothetical pick whose aliyah has since been read for real is dropped, since
 *    withHypotheticalRowDate would otherwise turn that past read into a future one.
 * A hypothetical pick that now collides with a newly scheduled real one yields to the real one.
 */
export function reconcilePicks(
  picks: PendingPick[],
  prevSeedIds: ReadonlySet<string>,
  newSeed: PendingPick[],
  allRows: MappedRow[],
): PendingPick[] {
  const newSeedById = new Map(newSeed.map(p => [pickId(p), p] as const));
  const pastReadKeys = new Set(allRows.filter(r => r.isReadPast).map(standardRowKey));

  const kept: PendingPick[] = [];
  for (const p of picks) {
    const id = pickId(p);
    const fresh = newSeedById.get(id);
    if (p.existing) {
      if (fresh) kept.push(fresh);
    } else if (fresh && !prevSeedIds.has(id)) {
      kept.push(fresh);
    } else if (!pastReadKeys.has(whatIfKeyOf(p))) {
      kept.push(p);
    }
  }

  const keptIds = new Set(kept.map(pickId));
  const added = newSeed.filter(p => !prevSeedIds.has(pickId(p)) && !keptIds.has(pickId(p)));
  return [...kept, ...added];
}
