import { sqliteTable, sqliteView, integer, real, text, unique, index, check, primaryKey, foreignKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const sefarim = sqliteTable('sefarim', {
  id:        integer('id').primaryKey(),
  name:      text('name').notNull().unique(),
  nameEn:    text('name_en').notNull(),
  color:     text('color').notNull(),
  sortOrder: integer('sort_order').notNull().unique(),
});

export const torahChapters = sqliteTable('torah_chapters', {
  seferId:    integer('sefer_id').notNull().references(() => sefarim.id),
  chapter:    integer('chapter').notNull(),
  verseCount: integer('verse_count').notNull(),
}, (t) => [
  primaryKey({ columns: [t.seferId, t.chapter] }),
]);

export const parshiot = sqliteTable('parshiot', {
  id:           integer('id').primaryKey(),
  seferId:      integer('sefer_id').notNull().references(() => sefarim.id),
  name:         text('name').notNull().unique(),
  nameEn:       text('name_en').notNull(),
  sortOrder:    integer('sort_order').notNull(),
  chapterStart: integer('chapter_start').notNull().default(-1),
  verseStart:   integer('verse_start').notNull().default(-1),
  chapterEnd:   integer('chapter_end').notNull().default(-1),
  verseEnd:     integer('verse_end').notNull().default(-1),
}, (t) => [
  foreignKey({ columns: [t.seferId, t.chapterStart], foreignColumns: [torahChapters.seferId, torahChapters.chapter] }),
  foreignKey({ columns: [t.seferId, t.chapterEnd],   foreignColumns: [torahChapters.seferId, torahChapters.chapter] }),
]);

export const parshaPairs = sqliteTable('parsha_pairs', {
  id:        integer('id').primaryKey(),
  name:      text('name').notNull().unique(),
  nameEn:    text('name_en').notNull().unique(),
  parsha1Id: integer('parsha1_id').notNull().references(() => parshiot.id),
  parsha2Id: integer('parsha2_id').notNull().references(() => parshiot.id),
});

export const aliyot = sqliteTable('aliyot', {
  id:             integer('id').primaryKey(),
  parshaId:       integer('parsha_id').notNull().references(() => parshiot.id),
  aliyah:         integer('aliyah').notNull(),
  pairId:         integer('pair_id').references(() => parshaPairs.id),
  combinedAliyah: integer('combined_aliyah'),
  pseukim:        integer('pseukim').notNull(),
  chapterStart:   integer('chapter_start').notNull().default(-1),
  verseStart:     integer('verse_start').notNull().default(-1),
  chapterEnd:     integer('chapter_end').notNull().default(-1),
  verseEnd:       integer('verse_end').notNull().default(-1),
}, (t) => [
  unique().on(t.parshaId, t.aliyah),
  check('aliyah_range', sql`${t.aliyah} BETWEEN 1 AND 8`),
  check('pseukim_positive', sql`${t.pseukim} > 0`),
]);

export const readings = sqliteTable('readings', {
  id:          integer('id').primaryKey(),
  aliyahId:    integer('aliyah_id').notNull().references(() => aliyot.id, { onDelete: 'cascade' }),
  dateRead:    text('date_read').notNull(),
  occasion:    text('occasion'),
  location:    text('location'),
  readingType: text('reading_type').notNull().default('standard'),
  pairId:      integer('pair_id').references(() => parshaPairs.id),
  createdAt:   text('created_at').notNull().default(sql`(date('now'))`),
}, (t) => [
  unique('idx_readings_aliyah_date').on(t.aliyahId, t.dateRead),
  index('idx_readings_aliyah').on(t.aliyahId),
  index('idx_readings_date').on(t.dateRead),
  check('reading_type_check', sql`${t.readingType} IN ('standard', 'double_parsha', 'additional')`),
]);

// v_aliyot / v_readings are not queried by app code (queries.ts computes the same joins
// plus coverage-detection fallbacks the views don't have). They exist so an exported
// torah.db can be explored from a plain SQL client without hand-rewriting the joins.
export const vAliyot = sqliteView('v_aliyot', {
  aliyahId:       integer('aliyah_id'),
  seferId:        integer('sefer_id'),
  sefer:          text('sefer'),
  seferEn:        text('sefer_en'),
  seferColor:     text('sefer_color'),
  seferOrder:     integer('sefer_order'),
  parshaId:       integer('parsha_id'),
  parsha:         text('parsha'),
  parshaEn:       text('parsha_en'),
  parshaOrder:    integer('parsha_order'),
  aliyah:         integer('aliyah'),
  pairName:       text('pair_name'),
  pairNameEn:     text('pair_name_en'),
  combinedAliyah: integer('combined_aliyah'),
  pseukim:        integer('pseukim'),
  pct:            real('pct'),
}).as(sql`
  SELECT
    a.id                                                                    AS aliyah_id,
    s.id                                                                    AS sefer_id,
    s.name                                                                  AS sefer,
    s.name_en                                                               AS sefer_en,
    s.color                                                                 AS sefer_color,
    s.sort_order                                                            AS sefer_order,
    p.id                                                                    AS parsha_id,
    p.name                                                                  AS parsha,
    p.name_en                                                               AS parsha_en,
    p.sort_order                                                            AS parsha_order,
    a.aliyah,
    COALESCE(pp.name, '')                                                   AS pair_name,
    COALESCE(pp.name_en, '')                                                AS pair_name_en,
    a.combined_aliyah,
    a.pseukim,
    ROUND(CAST(a.pseukim AS REAL) / (SELECT SUM(pseukim) FROM aliyot WHERE aliyah != 8) * 100, 6) AS pct
  FROM aliyot a
  JOIN parshiot    p  ON p.id  = a.parsha_id
  JOIN sefarim     s  ON s.id  = p.sefer_id
  LEFT JOIN parsha_pairs pp ON pp.id = a.pair_id
`);

export const vReadings = sqliteView('v_readings', {
  readingId:   integer('reading_id'),
  dateRead:    text('date_read'),
  readingType: text('reading_type'),
  occasion:    text('occasion'),
  location:    text('location'),
  createdAt:   text('created_at'),
  aliyahId:    integer('aliyah_id'),
  sefer:       text('sefer'),
  seferEn:     text('sefer_en'),
  seferColor:  text('sefer_color'),
  parsha:      text('parsha'),
  parshaEn:    text('parsha_en'),
  aliyah:      integer('aliyah'),
  pairName:    text('pair_name'),
  pseukim:     integer('pseukim'),
  pct:         real('pct'),
}).as(sql`
  SELECT
    r.id          AS reading_id,
    r.date_read,
    r.reading_type,
    r.occasion,
    r.location,
    r.created_at,
    a.aliyah_id,
    a.sefer,
    a.sefer_en,
    a.sefer_color,
    a.parsha,
    a.parsha_en,
    a.aliyah,
    a.pair_name,
    a.pseukim,
    a.pct
  FROM readings r
  JOIN v_aliyot a ON a.aliyah_id = r.aliyah_id
`);

export const occasions = sqliteTable('occasions', {
  id:        integer('id').primaryKey(),
  name:      text('name').notNull().unique(),
  nameEn:    text('name_en').notNull().unique(),
  category:  text('category').notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const occasionAliyot = sqliteTable('occasion_aliyot', {
  id:               integer('id').primaryKey(),
  occasionId:       integer('occasion_id').notNull().references(() => occasions.id),
  parshaId:         integer('parsha_id').notNull().references(() => parshiot.id),
  aliyahKey:        text('aliyah_key').notNull(),
  isShabbatVariant: integer('is_shabbat_variant', { mode: 'boolean' }).notNull().default(false),
  pseukim:          integer('pseukim').notNull(),
  chapterStart:     integer('chapter_start').notNull().default(-1),
  verseStart:       integer('verse_start').notNull().default(-1),
  chapterEnd:       integer('chapter_end').notNull().default(-1),
  verseEnd:         integer('verse_end').notNull().default(-1),
  coversAliyahId:   integer('covers_aliyah_id').references(() => aliyot.id),
}, (t) => [
  unique().on(t.occasionId, t.aliyahKey, t.isShabbatVariant),
  check('oa_pseukim_positive', sql`${t.pseukim} > 0`),
]);

export const specialReadings = sqliteTable('special_readings', {
  id:               integer('id').primaryKey(),
  occasionAliyahId: integer('occasion_aliyah_id').notNull().references(() => occasionAliyot.id, { onDelete: 'cascade' }),
  dateRead:         text('date_read').notNull(),
  note:             text('note'),
  location:         text('location'),
  createdAt:        text('created_at').notNull().default(sql`(date('now'))`),
}, (t) => [
  unique('idx_special_readings_aliyah_date').on(t.occasionAliyahId, t.dateRead),
  index('idx_special_readings_date').on(t.dateRead),
]);

export const weekdayAliyot = sqliteTable('weekday_aliyot', {
  id:             integer('id').primaryKey(),
  parshaId:       integer('parsha_id').notNull().references(() => parshiot.id),
  aliyahNum:      integer('aliyah_num').notNull(),
  pseukim:        integer('pseukim').notNull(),
  chapterStart:   integer('chapter_start').notNull(),
  verseStart:     integer('verse_start').notNull(),
  chapterEnd:     integer('chapter_end').notNull(),
  verseEnd:       integer('verse_end').notNull(),
  coversAliyahId: integer('covers_aliyah_id').references(() => aliyot.id),
}, (t) => [
  unique().on(t.parshaId, t.aliyahNum),
  check('weekday_aliyah_num', sql`${t.aliyahNum} BETWEEN 1 AND 3`),
  check('weekday_pseukim_positive', sql`${t.pseukim} > 0`),
]);

export const weekdayReadings = sqliteTable('weekday_readings', {
  id:              integer('id').primaryKey(),
  weekdayAliyahId: integer('weekday_aliyah_id').notNull().unique().references(() => weekdayAliyot.id, { onDelete: 'cascade' }),
  dateRead:        text('date_read').notNull(),
  note:            text('note'),
  location:        text('location'),
  createdAt:       text('created_at').notNull().default(sql`(date('now'))`),
});

export const hosafotReadings = sqliteTable('hosafot_readings', {
  id:             integer('id').primaryKey(),
  sefer:          text('sefer').notNull(),
  parshaId1:      integer('parsha_id_1').references(() => parshiot.id),
  parshaId2:      integer('parsha_id_2').references(() => parshiot.id),
  occasionId:     integer('occasion_id').references(() => occasions.id),
  isDoubleParsha: integer('is_double_parsha').notNull().default(0),
  chapterStart:   integer('chapter_start').notNull(),
  verseStart:     integer('verse_start').notNull(),
  chapterEnd:     integer('chapter_end').notNull(),
  verseEnd:       integer('verse_end').notNull(),
  pseukim:        integer('pseukim').notNull(),
  dateRead:       text('date_read').notNull(),
  note:           text('note'),
  location:       text('location'),
  createdAt:      text('created_at').notNull().default(sql`(datetime('now'))`),
});

// Inferred row types
export type Sefer           = typeof sefarim.$inferSelect;
export type TorahChapter    = typeof torahChapters.$inferSelect;
export type Parsha          = typeof parshiot.$inferSelect;
export type ParshaPair      = typeof parshaPairs.$inferSelect;
export type Aliyah          = typeof aliyot.$inferSelect;
export type Reading         = typeof readings.$inferSelect;
export type VAliyah         = typeof vAliyot.$inferSelect;
export type VReading        = typeof vReadings.$inferSelect;
export type Occasion        = typeof occasions.$inferSelect;
export type OccasionAliyah  = typeof occasionAliyot.$inferSelect;
export type SpecialReading  = typeof specialReadings.$inferSelect;
export type WeekdayAliyah   = typeof weekdayAliyot.$inferSelect;
export type WeekdayReading  = typeof weekdayReadings.$inferSelect;
export type HosafahReading  = typeof hosafotReadings.$inferSelect;
