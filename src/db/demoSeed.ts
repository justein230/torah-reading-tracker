import { eq } from 'drizzle-orm';
import type { AppDb } from './drizzle-server.js';
import type { Repository } from './repository.js';
import { sefarim, parshiot, parshaPairs, aliyot, occasions, occasionAliyot, weekdayAliyot } from './schema.js';
import type { DemoPlan, DemoReference } from '../utils/demoReadings.js';

// Glue between a migrated database and the pure demo planner (src/utils/demoReadings.ts):
// reads the reference rows it plans from, and writes its plan back through the repository.

export function loadDemoReference(db: AppDb): DemoReference {
  const aliyahRows = db.select({
    parsha: parshiot.name, parshaEn: parshiot.nameEn, parshaId: parshiot.id, sefer: sefarim.name, seferEn: sefarim.nameEn,
    aliyah: aliyot.aliyah, pseukim: aliyot.pseukim, pairId: aliyot.pairId, combinedAliyah: aliyot.combinedAliyah,
    chapterStart: aliyot.chapterStart, verseStart: aliyot.verseStart, chapterEnd: aliyot.chapterEnd, verseEnd: aliyot.verseEnd,
  })
    .from(aliyot)
    .innerJoin(parshiot, eq(parshiot.id, aliyot.parshaId))
    .innerJoin(sefarim,  eq(sefarim.id,  parshiot.seferId))
    .orderBy(sefarim.sortOrder, parshiot.sortOrder, aliyot.aliyah)
    .all();
  const pairRows = db.select({ id: parshaPairs.id, nameEn: parshaPairs.nameEn, parsha1Id: parshaPairs.parsha1Id, parsha2Id: parshaPairs.parsha2Id }).from(parshaPairs).all();
  const occasionRows = db.select({ id: occasionAliyot.id, occasionEn: occasions.nameEn })
    .from(occasionAliyot)
    .innerJoin(occasions, eq(occasions.id, occasionAliyot.occasionId))
    .orderBy(occasions.sortOrder, occasionAliyot.id)
    .all();
  const weekdayRows = db.select({ id: weekdayAliyot.id, parshaId: weekdayAliyot.parshaId, aliyahNum: weekdayAliyot.aliyahNum })
    .from(weekdayAliyot)
    .orderBy(weekdayAliyot.id)
    .all();
  return { aliyot: aliyahRows, pairs: pairRows, occasionAliyot: occasionRows, weekdayAliyot: weekdayRows };
}

/** Writes a plan in date order, so the first reading of each aliyah is the one counted and later ones become re-reads. */
export async function writeDemoPlan(repo: Repository, plan: DemoPlan): Promise<void> {
  const byDate = <T extends { date_read: string }>(rows: T[]) => [...rows].sort((a, b) => a.date_read.localeCompare(b.date_read));
  for (const body of byDate(plan.readings)) await repo.postReading(body);
  for (const body of byDate(plan.special))  await repo.postSpecialReading(body);
  for (const body of byDate(plan.weekday))  await repo.postWeekdayReading(body);
  for (const body of byDate(plan.hosafot))  await repo.postHosafah(body);
}
