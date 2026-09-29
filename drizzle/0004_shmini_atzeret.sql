-- Custom SQL migration file, put your code below! --
-- Seed: Shmini Atzeret, which had no occasion rows at all (weekday and Shabbat variants).
-- Source: hebcal.com's /hebcal endpoint with leyning=on (fullkriyah breakdown), 2026-2035:
-- weekday years give 5 aliyot, Shabbat years give 7 aliyot, both from Re'eh (Deut 14:22-16:17),
-- with maftir Numbers 29:35-30:1 (same verses as the Simchat Torah maftir, aliyot id 419).
INSERT OR IGNORE INTO occasions (id, name, name_en, category, sort_order) VALUES
(57, 'שמיני עצרת',            'Shmini Atzeret',            'yom_tov', 326),
(58, 'שמיני עצרת (שבת)',      'Shmini Atzeret (Shabbat)',  'yom_tov', 327);
--> statement-breakpoint
-- Columns: (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant,
--           pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id)
INSERT OR IGNORE INTO occasion_aliyot (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant, pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id) VALUES
-- Shmini Atzeret (weekday: 5 aliyot + M, from Re'eh / Deuteronomy 14-16)
(259, 57, 47, '1', 0,  8, 14, 22, 14, 29, 327),
(260, 57, 47, '2', 0, 18, 15,  1, 15, 18, 328),
(261, 57, 47, '3', 0,  8, 15, 19, 16,  3, NULL),
(262, 57, 47, '4', 0,  5, 16,  4, 16,  8, NULL),
(263, 57, 47, '5', 0,  9, 16,  9, 16, 17, NULL),
(264, 57, 41, 'M', 0,  6, 29, 35, 30,  1, 419),
-- Shmini Atzeret Shabbat (7 aliyot + M)
(265, 58, 47, '1', 1,  8, 14, 22, 14, 29, 327),
(266, 58, 47, '2', 1, 18, 15,  1, 15, 18, 328),
(267, 58, 47, '3', 1,  5, 15, 19, 15, 23, NULL),
(268, 58, 47, '4', 1,  3, 16,  1, 16,  3, NULL),
(269, 58, 47, '5', 1,  5, 16,  4, 16,  8, NULL),
(270, 58, 47, '6', 1,  4, 16,  9, 16, 12, NULL),
(271, 58, 47, '7', 1,  5, 16, 13, 16, 17, 425),
(272, 58, 41, 'M', 1,  6, 29, 35, 30,  1, 419);
