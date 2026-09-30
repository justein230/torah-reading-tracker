-- Custom SQL migration file, put your code below! --
-- Seed: holiday variants that had no occasion rows, from hebcal.com's /leyning endpoint
-- (fullkriyah breakdown, Diaspora, 2016-2036, cached in .cache/hebcal-audit/):
--  - Erev Simchat Torah (Mincha): Deuteronomy 33:1-17, three aliyot.
--  - Chanukah Day 7 on Rosh Chodesh (1 Tevet, when Kislev has 30 days): 3 Rosh Chodesh aliyot + day 7.
--    (Day 6 is always Rosh Chodesh, so occasion 17 was made the Rosh Chodesh form in 0005.)
--  - Shabbat maftir variants. These have a maftir only, like Shabbat Shekalim (occasion 34), because
--    the seven standard aliyot are the parsha's own: Shabbat Rosh Chodesh (Numbers 28:9-15),
--    Shabbat Chanukah by day, Shabbat Rosh Chodesh Chanukah (Hebcal lists only its 7:42-47
--    part; the 28:9-15 part is the Shabbat Rosh Chodesh maftir), Shekalim/HaChodesh on Rosh Chodesh.
--    Chanukah Day 5 never fell on Shabbat in 2016-2036, so it is omitted.
--  - Sukkot Shabbat Chol HaMoed maftir varies with the date (Chol HaMoed Day 1: 29:17-22, already
--    occasion 9; Day 3: 29:23-28; Day 4: 29:26-31). Only the maftir differs, so the variants hold it alone.
INSERT OR IGNORE INTO occasions (id, name, name_en, category, sort_order) VALUES
(59, 'ערב שמחת תורה',                      'Erev Simchat Torah',                       'yom_tov',        329),
(60, 'חנוכה ז׳ (ראש חודש)',                'Chanukah Day 7 (Rosh Chodesh)',            'chanukah',       461),
(61, 'שבת ראש חודש',                       'Shabbat Rosh Chodesh',                     'maftir_special', 1005),
(62, 'שבת חנוכה א׳',                       'Shabbat Chanukah Day 1',                   'maftir_special', 1041),
(63, 'שבת חנוכה ב׳',                       'Shabbat Chanukah Day 2',                   'maftir_special', 1042),
(64, 'שבת חנוכה ג׳',                       'Shabbat Chanukah Day 3',                   'maftir_special', 1043),
(65, 'שבת חנוכה ד׳',                       'Shabbat Chanukah Day 4',                   'maftir_special', 1044),
(66, 'שבת ראש חודש חנוכה',                 'Shabbat Rosh Chodesh Chanukah',            'maftir_special', 1046),
(67, 'שבת חנוכה ז׳',                       'Shabbat Chanukah Day 7',                   'maftir_special', 1047),
(68, 'שבת חנוכה ח׳',                       'Shabbat Chanukah Day 8',                   'maftir_special', 1048),
(69, 'שבת שקלים (ראש חודש)',               'Shabbat Shekalim (Rosh Chodesh)',          'maftir_special', 1001),
(70, 'שבת החודש (ראש חודש)',               'Shabbat HaChodesh (Rosh Chodesh)',         'maftir_special', 1031),
(71, 'שבת חול המועד סוכות (יום ג׳)',       'Sukkot Shabbat Chol HaMoed (Day 3)',       'yom_tov',        321),
(72, 'שבת חול המועד סוכות (יום ד׳)',       'Sukkot Shabbat Chol HaMoed (Day 4)',       'yom_tov',        322);
--> statement-breakpoint
-- Columns: (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant,
--           pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id)
INSERT OR IGNORE INTO occasion_aliyot (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant, pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id) VALUES
-- Erev Simchat Torah (Vezot Haberakhah)
(275, 59, 54, '1', 0,  7, 33,  1, 33,  7, NULL),
(276, 59, 54, '2', 0,  5, 33,  8, 33, 12, NULL),
(277, 59, 54, '3', 0,  5, 33, 13, 33, 17, NULL),
-- Chanukah Day 7 on Rosh Chodesh
(278, 60, 41, '1', 0,  5, 28,  1, 28,  5, NULL),
(279, 60, 41, '2', 0,  5, 28,  6, 28, 10, NULL),
(280, 60, 41, '3', 0,  5, 28, 11, 28, 15, NULL),
(281, 60, 35, '4', 0,  6,  7, 48,  7, 53, NULL),
-- Shabbat Rosh Chodesh maftir (Pinchas)
(282, 61, 41, 'M', 0,  7, 28,  9, 28, 15, NULL),
-- Shabbat Chanukah maftirs (Nasso)
(283, 62, 35, 'M', 0, 17,  7,  1,  7, 17, NULL),
(284, 63, 35, 'M', 0,  6,  7, 18,  7, 23, NULL),
(285, 64, 35, 'M', 0,  6,  7, 24,  7, 29, NULL),
(286, 65, 35, 'M', 0,  6,  7, 30,  7, 35, NULL),
(287, 66, 35, 'M', 0,  6,  7, 42,  7, 47, NULL),
(288, 67, 35, 'M', 0,  6,  7, 48,  7, 53, NULL),
(289, 68, 35, 'M', 0, 40,  7, 54,  8,  4, NULL),
-- Shabbat Shekalim / HaChodesh on Rosh Chodesh (same maftir as occasions 34 and 37)
(290, 69, 21, 'M', 0,  6, 30, 11, 30, 16, NULL),
(291, 70, 15, 'M', 0, 20, 12,  1, 12, 20, NULL),
-- Sukkot Shabbat Chol HaMoed maftir variants (Pinchas)
(292, 71, 41, 'M', 1,  6, 29, 23, 29, 28, NULL),
(293, 72, 41, 'M', 1,  6, 29, 26, 29, 31, NULL);
--> statement-breakpoint
-- covers_aliyah_id where a range exactly matches a standard aliyah (0001 convention)
UPDATE occasion_aliyot SET covers_aliyah_id = (
  SELECT a.id FROM aliyot a
  WHERE a.parsha_id = occasion_aliyot.parsha_id
    AND a.chapter_start = occasion_aliyot.chapter_start AND a.verse_start = occasion_aliyot.verse_start
    AND a.chapter_end   = occasion_aliyot.chapter_end   AND a.verse_end   = occasion_aliyot.verse_end
  ORDER BY a.aliyah LIMIT 1
) WHERE id BETWEEN 275 AND 293;
