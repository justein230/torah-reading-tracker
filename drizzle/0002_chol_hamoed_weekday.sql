-- Seed: weekday Chol HaMoed readings for Sukkot and Pesach.
-- Only the Shabbat Chol HaMoed variant was seeded originally (occasions 9 and 24);
-- the plain weekday Chol HaMoed days (and Sukkot's Hoshana Rabbah) had no rows at all.
-- Sources: occasions/occasion_aliyot generated from hebcal.com's /leyning endpoint
-- (getLeyningForHolidayKey() output), same method used for the original 0001_seed.sql.
-- Weekday Chol HaMoed has 4 aliyot and no separate maftir.
INSERT OR IGNORE INTO occasions (id, name, name_en, category, sort_order) VALUES
(38, 'סוכות חול המועד יום א׳',      'Sukkot Chol HaMoed Day 1',      'yom_tov', 311),
(39, 'סוכות חול המועד יום ב׳',      'Sukkot Chol HaMoed Day 2',      'yom_tov', 312),
(40, 'סוכות חול המועד יום ג׳',      'Sukkot Chol HaMoed Day 3',      'yom_tov', 313),
(41, 'סוכות חול המועד יום ד׳',      'Sukkot Chol HaMoed Day 4',      'yom_tov', 314),
(42, 'הושענא רבה',                  'Hoshana Rabbah',                'yom_tov', 325),
(43, 'פסח חול המועד יום א׳',        'Pesach Chol HaMoed Day 1',      'yom_tov', 611),
(44, 'פסח חול המועד יום ב׳',        'Pesach Chol HaMoed Day 2',      'yom_tov', 612),
(45, 'פסח חול המועד יום ג׳',        'Pesach Chol HaMoed Day 3',      'yom_tov', 613),
(46, 'פסח חול המועד יום ד׳',        'Pesach Chol HaMoed Day 4',      'yom_tov', 614);
--> statement-breakpoint
-- Columns: (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant,
--           pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id)
INSERT OR IGNORE INTO occasion_aliyot (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant, pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id) VALUES
-- Sukkot Chol HaMoed Day 1 (4 aliyot from Pinchas, Numbers 29 sacrifice count)
(193, 38, 41, '1', 0, 3, 29, 17, 29, 19, NULL),
(194, 38, 41, '2', 0, 3, 29, 20, 29, 22, NULL),
(195, 38, 41, '3', 0, 3, 29, 23, 29, 25, NULL),
(196, 38, 41, '4', 0, 6, 29, 17, 29, 22, NULL),
-- Sukkot Chol HaMoed Day 2
(197, 39, 41, '1', 0, 3, 29, 20, 29, 22, NULL),
(198, 39, 41, '2', 0, 3, 29, 23, 29, 25, NULL),
(199, 39, 41, '3', 0, 3, 29, 26, 29, 28, NULL),
(200, 39, 41, '4', 0, 6, 29, 20, 29, 25, NULL),
-- Sukkot Chol HaMoed Day 3
(201, 40, 41, '1', 0, 3, 29, 23, 29, 25, NULL),
(202, 40, 41, '2', 0, 3, 29, 26, 29, 28, NULL),
(203, 40, 41, '3', 0, 3, 29, 29, 29, 31, NULL),
(204, 40, 41, '4', 0, 6, 29, 23, 29, 28, NULL),
-- Sukkot Chol HaMoed Day 4
(205, 41, 41, '1', 0, 3, 29, 26, 29, 28, NULL),
(206, 41, 41, '2', 0, 3, 29, 29, 29, 31, NULL),
(207, 41, 41, '3', 0, 3, 29, 32, 29, 34, NULL),
(208, 41, 41, '4', 0, 6, 29, 26, 29, 31, NULL),
-- Hoshana Rabbah (Sukkot day 7, still Chol HaMoed)
(209, 42, 41, '1', 0, 3, 29, 26, 29, 28, NULL),
(210, 42, 41, '2', 0, 3, 29, 29, 29, 31, NULL),
(211, 42, 41, '3', 0, 3, 29, 32, 29, 34, NULL),
(212, 42, 41, '4', 0, 6, 29, 29, 29, 34, NULL),
-- Pesach Chol HaMoed Day 1 (Bo / Exodus 13 + maftir from Pinchas, Numbers 28)
(213, 43, 15, '1', 0,  4, 13,  1, 13,  4, NULL),
(214, 43, 15, '2', 0,  6, 13,  5, 13, 10, NULL),
(215, 43, 15, '3', 0,  6, 13, 11, 13, 16, NULL),
(216, 43, 41, '4', 0,  7, 28, 19, 28, 25, NULL),
-- Pesach Chol HaMoed Day 2 (Mishpatim / Exodus 22-23 + maftir)
(217, 44, 18, '1', 0,  3, 22, 24, 22, 26, NULL),
(218, 44, 18, '2', 0,  9, 22, 27, 23,  5, 123),
(219, 44, 18, '3', 0, 14, 23,  6, 23, 19, 124),
(220, 44, 41, '4', 0,  7, 28, 19, 28, 25, NULL),
-- Pesach Chol HaMoed Day 3 (Ki Tisa / Exodus 34 + maftir)
(221, 45, 21, '1', 0, 10, 34,  1, 34, 10, NULL),
(222, 45, 21, '2', 0,  7, 34, 11, 34, 17, NULL),
(223, 45, 21, '3', 0,  9, 34, 18, 34, 26, NULL),
(224, 45, 41, '4', 0,  7, 28, 19, 28, 25, NULL),
-- Pesach Chol HaMoed Day 4 (Beha'alotcha / Numbers 9 + maftir)
(225, 46, 36, '1', 0,  5,  9,  1,  9,  5, NULL),
(226, 46, 36, '2', 0,  3,  9,  6,  9,  8, NULL),
(227, 46, 36, '3', 0,  6,  9,  9,  9, 14, NULL),
(228, 46, 41, '4', 0,  7, 28, 19, 28, 25, NULL);
