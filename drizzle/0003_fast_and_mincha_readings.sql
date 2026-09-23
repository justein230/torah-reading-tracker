-- Seed: minor fast day readings (Tzom Gedaliah, Asara B'Tevet, Ta'anit Esther, Tzom Tammuz —
-- morning and Mincha) and the Mincha readings for Tisha B'Av and Yom Kippur.
-- The four minor fast days had no rows at all; Tisha B'Av and Yom Kippur only had their
-- morning readings seeded — the afternoon (Mincha) Torah-reading service was missing.
-- Sources: occasions/occasion_aliyot generated from hebcal.com's /leyning endpoint
-- (fullkriyah breakdown), same method used for 0001_seed.sql and 0002_chol_hamoed_weekday.sql.
-- The four fast days share one reading (Exodus 32:11-14, 34:1-10, parsha Ki Tisa id=21):
-- morning has 3 aliyot; Mincha has the same 3 sections but the last is the maftir.
-- Yom Kippur Mincha reads Leviticus 18:1-30 (parsha Achrei Mot id=29): 2 aliyot + maftir.
INSERT OR IGNORE INTO occasions (id, name, name_en, category, sort_order) VALUES
(47, 'צום גדליה',              'Tzom Gedaliah',                'other',   150),
(48, 'צום גדליה (מנחה)',       'Tzom Gedaliah (Mincha)',        'other',   151),
(49, 'יום כיפור (מנחה)',       'Yom Kippur (Mincha)',           'yom_tov', 202),
(50, 'עשרה בטבת',              'Asara B''Tevet',                'other',   480),
(51, 'עשרה בטבת (מנחה)',       'Asara B''Tevet (Mincha)',        'other',   481),
(52, 'תענית אסתר',             'Ta''anit Esther',                'other',   495),
(53, 'תענית אסתר (מנחה)',      'Ta''anit Esther (Mincha)',        'other',   496),
(54, 'צום תמוז',                'Tzom Tammuz',                   'other',   750),
(55, 'צום תמוז (מנחה)',         'Tzom Tammuz (Mincha)',           'other',   751),
(56, 'תשעה באב (מנחה)',        'Tisha B''Av (Mincha)',           'other',   801);
--> statement-breakpoint
-- Columns: (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant,
--           pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id)
INSERT OR IGNORE INTO occasion_aliyot (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant, pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id) VALUES
-- Tzom Gedaliah (3 aliyot, from Ki Tisa / Exodus 32-34)
(229, 47, 21, '1', 0, 4, 32, 11, 32, 14, NULL),
(230, 47, 21, '2', 0, 3, 34,  1, 34,  3, NULL),
(231, 47, 21, '3', 0, 7, 34,  4, 34, 10, NULL),
-- Tzom Gedaliah (Mincha) (2 aliyot + maftir, same verses)
(232, 48, 21, '1', 0, 4, 32, 11, 32, 14, NULL),
(233, 48, 21, '2', 0, 3, 34,  1, 34,  3, NULL),
(234, 48, 21, 'M', 0, 7, 34,  4, 34, 10, NULL),
-- Yom Kippur (Mincha) (2 aliyot + maftir, from Achrei Mot / Leviticus 18)
(235, 49, 29, '1', 0,  5, 18,  1, 18,  5, NULL),
(236, 49, 29, '2', 0, 16, 18,  6, 18, 21, 202),
(237, 49, 29, 'M', 0,  9, 18, 22, 18, 30, 203),
-- Asara B'Tevet (3 aliyot, same reading as Tzom Gedaliah)
(238, 50, 21, '1', 0, 4, 32, 11, 32, 14, NULL),
(239, 50, 21, '2', 0, 3, 34,  1, 34,  3, NULL),
(240, 50, 21, '3', 0, 7, 34,  4, 34, 10, NULL),
-- Asara B'Tevet (Mincha) (2 aliyot + maftir, same verses)
(241, 51, 21, '1', 0, 4, 32, 11, 32, 14, NULL),
(242, 51, 21, '2', 0, 3, 34,  1, 34,  3, NULL),
(243, 51, 21, 'M', 0, 7, 34,  4, 34, 10, NULL),
-- Ta'anit Esther (3 aliyot, same reading as Tzom Gedaliah)
(244, 52, 21, '1', 0, 4, 32, 11, 32, 14, NULL),
(245, 52, 21, '2', 0, 3, 34,  1, 34,  3, NULL),
(246, 52, 21, '3', 0, 7, 34,  4, 34, 10, NULL),
-- Ta'anit Esther (Mincha) (2 aliyot + maftir, same verses)
(247, 53, 21, '1', 0, 4, 32, 11, 32, 14, NULL),
(248, 53, 21, '2', 0, 3, 34,  1, 34,  3, NULL),
(249, 53, 21, 'M', 0, 7, 34,  4, 34, 10, NULL),
-- Tzom Tammuz (3 aliyot, same reading as Tzom Gedaliah)
(250, 54, 21, '1', 0, 4, 32, 11, 32, 14, NULL),
(251, 54, 21, '2', 0, 3, 34,  1, 34,  3, NULL),
(252, 54, 21, '3', 0, 7, 34,  4, 34, 10, NULL),
-- Tzom Tammuz (Mincha) (2 aliyot + maftir, same verses)
(253, 55, 21, '1', 0, 4, 32, 11, 32, 14, NULL),
(254, 55, 21, '2', 0, 3, 34,  1, 34,  3, NULL),
(255, 55, 21, 'M', 0, 7, 34,  4, 34, 10, NULL),
-- Tisha B'Av (Mincha) (2 aliyot + maftir, same verses)
(256, 56, 21, '1', 0, 4, 32, 11, 32, 14, NULL),
(257, 56, 21, '2', 0, 3, 34,  1, 34,  3, NULL),
(258, 56, 21, 'M', 0, 7, 34,  4, 34, 10, NULL);