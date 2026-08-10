-- Seed: static reference data
-- Seed: 5 sefarim, 54 parshiot, 378 aliyot
-- Generated from seed.db, with chapter/verse ranges from @hebcal/leyning baked into inserts.

-- Sefarim
INSERT OR IGNORE INTO sefarim (id, name, name_en, color, sort_order) VALUES (1, 'בראשית', 'Genesis', '#0072B2', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO sefarim (id, name, name_en, color, sort_order) VALUES (2, 'שמות', 'Exodus', '#E69F00', 2);
--> statement-breakpoint
INSERT OR IGNORE INTO sefarim (id, name, name_en, color, sort_order) VALUES (3, 'ויקרא', 'Leviticus', '#009E73', 3);
--> statement-breakpoint
INSERT OR IGNORE INTO sefarim (id, name, name_en, color, sort_order) VALUES (4, 'במדבר', 'Numbers', '#D55E00', 4);
--> statement-breakpoint
INSERT OR IGNORE INTO sefarim (id, name, name_en, color, sort_order) VALUES (5, 'דברים', 'Deuteronomy', '#CC79A7', 5);
--> statement-breakpoint

-- Parshiot
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (1, 1, 'בראשית', 'Bereshit', 1, 1, 1, 6, 8);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (2, 1, 'נח', 'Noach', 2, 6, 9, 11, 32);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (3, 1, 'לך לך', 'Lech-Lecha', 3, 12, 1, 17, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (4, 1, 'וירא', 'Vayera', 4, 18, 1, 22, 24);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (5, 1, 'חיי שרה', 'Chayei Sara', 5, 23, 1, 25, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (6, 1, 'תולדות', 'Toldot', 6, 25, 19, 28, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (7, 1, 'ויצא', 'Vayetzei', 7, 28, 10, 32, 3);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (8, 1, 'וישלח', 'Vayishlach', 8, 32, 4, 36, 43);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (9, 1, 'וישב', 'Vayeshev', 9, 37, 1, 40, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (10, 1, 'מקץ', 'Miketz', 10, 41, 1, 44, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (11, 1, 'ויגש', 'Vayigash', 11, 44, 18, 47, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (12, 1, 'ויחי', 'Vayechi', 12, 47, 28, 50, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (13, 2, 'שמות', 'Shemot', 13, 1, 1, 6, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (14, 2, 'וארא', 'Vaera', 14, 6, 2, 9, 35);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (15, 2, 'בא', 'Bo', 15, 10, 1, 13, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (16, 2, 'בשלח', 'Beshalach', 16, 13, 17, 17, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (17, 2, 'יתרו', 'Yitro', 17, 18, 1, 20, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (18, 2, 'משפטים', 'Mishpatim', 18, 21, 1, 24, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (19, 2, 'תרומה', 'Terumah', 19, 25, 1, 27, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (20, 2, 'תצוה', 'Tetzaveh', 20, 27, 20, 30, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (21, 2, 'כי תשא', 'Ki Tisa', 21, 30, 11, 34, 35);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (22, 2, 'ויקהל', 'Vayakhel', 22, 35, 1, 38, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (23, 2, 'פקודי', 'Pekudei', 23, 38, 21, 40, 38);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (24, 3, 'ויקרא', 'Vayikra', 24, 1, 1, 5, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (25, 3, 'צו', 'Tzav', 25, 6, 1, 8, 36);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (26, 3, 'שמיני', 'Shmini', 26, 9, 1, 11, 47);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (27, 3, 'תזריע', 'Tazria', 27, 12, 1, 13, 59);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (28, 3, 'מצורע', 'Metzora', 28, 14, 1, 15, 33);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (29, 3, 'אחרי מות', 'Achrei Mot', 29, 16, 1, 18, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (30, 3, 'קדושים', 'Kedoshim', 30, 19, 1, 20, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (31, 3, 'אמור', 'Emor', 31, 21, 1, 24, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (32, 3, 'בהר', 'Behar', 32, 25, 1, 26, 2);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (33, 3, 'בחוקותי', 'Bechukotai', 33, 26, 3, 27, 34);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (34, 4, 'במדבר', 'Bamidbar', 34, 1, 1, 4, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (35, 4, 'נשא', 'Nasso', 35, 4, 21, 7, 89);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (36, 4, 'בהעלותך', 'Beha''alotcha', 36, 8, 1, 12, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (37, 4, 'שלך לך', 'Sh''lach', 37, 13, 1, 15, 41);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (38, 4, 'קרח', 'Korach', 38, 16, 1, 18, 32);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (39, 4, 'חקת', 'Chukat', 39, 19, 1, 22, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (40, 4, 'בלק', 'Balak', 40, 22, 2, 25, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (41, 4, 'פנחס', 'Pinchas', 41, 25, 10, 30, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (42, 4, 'מטות', 'Matot', 42, 30, 2, 32, 42);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (43, 4, 'מסעי', 'Masei', 43, 33, 1, 36, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (44, 5, 'דברים', 'Devarim', 44, 1, 1, 3, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (45, 5, 'ואתחנן', 'Vaetchanan', 45, 3, 23, 7, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (46, 5, 'עקב', 'Eikev', 46, 7, 12, 11, 25);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (47, 5, 'ראה', 'Re''eh', 47, 11, 26, 16, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (48, 5, 'שופטים', 'Shoftim', 48, 16, 18, 21, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (49, 5, 'כי תצא', 'Ki Teitzei', 49, 21, 10, 25, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (50, 5, 'כי תבוא', 'Ki Tavo', 50, 26, 1, 29, 8);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (51, 5, 'נצבים', 'Nitzavim', 51, 29, 9, 30, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (52, 5, 'וילך', 'Vayeilech', 52, 31, 1, 31, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (53, 5, 'האזינו', 'Ha''azinu', 53, 32, 1, 32, 52);
--> statement-breakpoint
INSERT OR IGNORE INTO parshiot (id, sefer_id, name, name_en, sort_order, chapter_start, verse_start, chapter_end, verse_end) VALUES (54, 5, 'וזאת הברכה', 'Vezot Haberakhah', 54, 33, 1, 34, 12);
--> statement-breakpoint

-- Parsha Pairs
INSERT OR IGNORE INTO parsha_pairs (id, name, name_en, parsha1_id, parsha2_id) VALUES (1, 'ויקהל-פקודי', 'Vayakhel-Pekudei', 22, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO parsha_pairs (id, name, name_en, parsha1_id, parsha2_id) VALUES (2, 'תזריע-מצורע', 'Tazria-Metzora', 27, 28);
--> statement-breakpoint
INSERT OR IGNORE INTO parsha_pairs (id, name, name_en, parsha1_id, parsha2_id) VALUES (3, 'אחרי מות-קדושים', 'Achrei Mot-Kedoshim', 29, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO parsha_pairs (id, name, name_en, parsha1_id, parsha2_id) VALUES (4, 'בהר-בחוקותי', 'Behar-Bechukotai', 32, 33);
--> statement-breakpoint
INSERT OR IGNORE INTO parsha_pairs (id, name, name_en, parsha1_id, parsha2_id) VALUES (5, 'חקת-בלק', 'Chukat-Balak', 39, 40);
--> statement-breakpoint
INSERT OR IGNORE INTO parsha_pairs (id, name, name_en, parsha1_id, parsha2_id) VALUES (6, 'מטות-מסעי', 'Matot-Masei', 42, 43);
--> statement-breakpoint
INSERT OR IGNORE INTO parsha_pairs (id, name, name_en, parsha1_id, parsha2_id) VALUES (7, 'נצבים-וילך', 'Nitzavim-Vayeilech', 51, 52);
--> statement-breakpoint

-- Aliyot
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (1, 1, 1, NULL, NULL, 34, 1, 1, 2, 3);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (2, 1, 2, NULL, NULL, 16, 2, 4, 2, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (3, 1, 3, NULL, NULL, 27, 2, 20, 3, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (4, 1, 4, NULL, NULL, 21, 3, 22, 4, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (5, 1, 5, NULL, NULL, 4, 4, 19, 4, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (6, 1, 6, NULL, NULL, 28, 4, 23, 5, 24);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (7, 1, 7, NULL, NULL, 16, 5, 25, 6, 8);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (8, 2, 1, NULL, NULL, 14, 6, 9, 6, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (9, 2, 2, NULL, NULL, 16, 7, 1, 7, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (10, 2, 3, NULL, NULL, 22, 7, 17, 8, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (11, 2, 4, NULL, NULL, 15, 8, 15, 9, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (12, 2, 5, NULL, NULL, 10, 9, 8, 9, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (13, 2, 6, NULL, NULL, 44, 9, 18, 10, 32);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (14, 2, 7, NULL, NULL, 32, 11, 1, 11, 32);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (15, 3, 1, NULL, NULL, 13, 12, 1, 12, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (16, 3, 2, NULL, NULL, 11, 12, 14, 13, 4);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (17, 3, 3, NULL, NULL, 14, 13, 5, 13, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (18, 3, 4, NULL, NULL, 20, 14, 1, 14, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (19, 3, 5, NULL, NULL, 10, 14, 21, 15, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (20, 3, 6, NULL, NULL, 37, 15, 7, 17, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (21, 3, 7, NULL, NULL, 21, 17, 7, 17, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (22, 4, 1, NULL, NULL, 14, 18, 1, 18, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (23, 4, 2, NULL, NULL, 19, 18, 15, 18, 33);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (24, 4, 3, NULL, NULL, 20, 19, 1, 19, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (25, 4, 4, NULL, NULL, 40, 19, 21, 21, 4);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (26, 4, 5, NULL, NULL, 17, 21, 5, 21, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (27, 4, 6, NULL, NULL, 13, 21, 22, 21, 34);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (28, 4, 7, NULL, NULL, 24, 22, 1, 22, 24);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (29, 5, 1, NULL, NULL, 16, 23, 1, 23, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (30, 5, 2, NULL, NULL, 13, 23, 17, 24, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (31, 5, 3, NULL, NULL, 17, 24, 10, 24, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (32, 5, 4, NULL, NULL, 26, 24, 27, 24, 52);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (33, 5, 5, NULL, NULL, 15, 24, 53, 24, 67);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (34, 5, 6, NULL, NULL, 11, 25, 1, 25, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (35, 5, 7, NULL, NULL, 7, 25, 12, 25, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (36, 6, 1, NULL, NULL, 21, 25, 19, 26, 5);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (37, 6, 2, NULL, NULL, 7, 26, 6, 26, 12);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (38, 6, 3, NULL, NULL, 10, 26, 13, 26, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (39, 6, 4, NULL, NULL, 7, 26, 23, 26, 29);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (40, 6, 5, NULL, NULL, 33, 26, 30, 27, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (41, 6, 6, NULL, NULL, 23, 27, 28, 28, 4);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (42, 6, 7, NULL, NULL, 5, 28, 5, 28, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (43, 7, 1, NULL, NULL, 13, 28, 10, 28, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (44, 7, 2, NULL, NULL, 17, 29, 1, 29, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (45, 7, 3, NULL, NULL, 31, 29, 18, 30, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (46, 7, 4, NULL, NULL, 14, 30, 14, 30, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (47, 7, 5, NULL, NULL, 32, 30, 28, 31, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (48, 7, 6, NULL, NULL, 26, 31, 17, 31, 42);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (49, 7, 7, NULL, NULL, 15, 31, 43, 32, 3);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (50, 8, 1, NULL, NULL, 10, 32, 4, 32, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (51, 8, 2, NULL, NULL, 17, 32, 14, 32, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (52, 8, 3, NULL, NULL, 8, 32, 31, 33, 5);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (53, 8, 4, NULL, NULL, 15, 33, 6, 33, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (54, 8, 5, NULL, NULL, 42, 34, 1, 35, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (55, 8, 6, NULL, NULL, 37, 35, 12, 36, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (56, 8, 7, NULL, NULL, 24, 36, 20, 36, 43);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (57, 9, 1, NULL, NULL, 11, 37, 1, 37, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (58, 9, 2, NULL, NULL, 11, 37, 12, 37, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (59, 9, 3, NULL, NULL, 14, 37, 23, 37, 36);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (60, 9, 4, NULL, NULL, 30, 38, 1, 38, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (61, 9, 5, NULL, NULL, 6, 39, 1, 39, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (62, 9, 6, NULL, NULL, 17, 39, 7, 39, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (63, 9, 7, NULL, NULL, 23, 40, 1, 40, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (64, 10, 1, NULL, NULL, 14, 41, 1, 41, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (65, 10, 2, NULL, NULL, 24, 41, 15, 41, 38);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (66, 10, 3, NULL, NULL, 14, 41, 39, 41, 52);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (67, 10, 4, NULL, NULL, 23, 41, 53, 42, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (68, 10, 5, NULL, NULL, 35, 42, 19, 43, 15);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (69, 10, 6, NULL, NULL, 14, 43, 16, 43, 29);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (70, 10, 7, NULL, NULL, 22, 43, 30, 44, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (71, 11, 1, NULL, NULL, 13, 44, 18, 44, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (72, 11, 2, NULL, NULL, 11, 44, 31, 45, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (73, 11, 3, NULL, NULL, 11, 45, 8, 45, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (74, 11, 4, NULL, NULL, 9, 45, 19, 45, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (75, 11, 5, NULL, NULL, 28, 45, 28, 46, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (76, 11, 6, NULL, NULL, 17, 46, 28, 47, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (77, 11, 7, NULL, NULL, 17, 47, 11, 47, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (78, 12, 1, NULL, NULL, 13, 47, 28, 48, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (79, 12, 2, NULL, NULL, 7, 48, 10, 48, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (80, 12, 3, NULL, NULL, 6, 48, 17, 48, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (81, 12, 4, NULL, NULL, 18, 49, 1, 49, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (82, 12, 5, NULL, NULL, 8, 49, 19, 49, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (83, 12, 6, NULL, NULL, 27, 49, 27, 50, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (84, 12, 7, NULL, NULL, 6, 50, 21, 50, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (85, 13, 1, NULL, NULL, 17, 1, 1, 1, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (86, 13, 2, NULL, NULL, 15, 1, 18, 2, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (87, 13, 3, NULL, NULL, 15, 2, 11, 2, 25);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (88, 13, 4, NULL, NULL, 15, 3, 1, 3, 15);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (89, 13, 5, NULL, NULL, 24, 3, 16, 4, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (90, 13, 6, NULL, NULL, 14, 4, 18, 4, 31);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (91, 13, 7, NULL, NULL, 24, 5, 1, 6, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (92, 14, 1, NULL, NULL, 12, 6, 2, 6, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (93, 14, 2, NULL, NULL, 15, 6, 14, 6, 28);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (94, 14, 3, NULL, NULL, 9, 6, 29, 7, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (95, 14, 4, NULL, NULL, 28, 7, 8, 8, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (96, 14, 5, NULL, NULL, 12, 8, 7, 8, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (97, 14, 6, NULL, NULL, 26, 8, 19, 9, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (98, 14, 7, NULL, NULL, 19, 9, 17, 9, 35);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (99, 15, 1, NULL, NULL, 11, 10, 1, 10, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (100, 15, 2, NULL, NULL, 12, 10, 12, 10, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (101, 15, 3, NULL, NULL, 9, 10, 24, 11, 3);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (102, 15, 4, NULL, NULL, 27, 11, 4, 12, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (103, 15, 5, NULL, NULL, 8, 12, 21, 12, 28);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (104, 15, 6, NULL, NULL, 23, 12, 29, 12, 51);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (105, 15, 7, NULL, NULL, 16, 13, 1, 13, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (106, 16, 1, NULL, NULL, 14, 13, 17, 14, 8);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (107, 16, 2, NULL, NULL, 6, 14, 9, 14, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (108, 16, 3, NULL, NULL, 11, 14, 15, 14, 25);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (109, 16, 4, NULL, NULL, 32, 14, 26, 15, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (110, 16, 5, NULL, NULL, 11, 15, 27, 16, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (111, 16, 6, NULL, NULL, 26, 16, 11, 16, 36);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (112, 16, 7, NULL, NULL, 16, 17, 1, 17, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (113, 17, 1, NULL, NULL, 12, 18, 1, 18, 12);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (114, 17, 2, NULL, NULL, 11, 18, 13, 18, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (115, 17, 3, NULL, NULL, 4, 18, 24, 18, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (116, 17, 4, NULL, NULL, 6, 19, 1, 19, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (117, 17, 5, NULL, NULL, 13, 19, 7, 19, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (118, 17, 6, NULL, NULL, 20, 19, 20, 20, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (119, 17, 7, NULL, NULL, 9, 20, 15, 20, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (120, 18, 1, NULL, NULL, 19, 21, 1, 21, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (121, 18, 2, NULL, NULL, 21, 21, 20, 22, 3);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (122, 18, 3, NULL, NULL, 23, 22, 4, 22, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (123, 18, 4, NULL, NULL, 9, 22, 27, 23, 5);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (124, 18, 5, NULL, NULL, 14, 23, 6, 23, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (125, 18, 6, NULL, NULL, 6, 23, 20, 23, 25);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (126, 18, 7, NULL, NULL, 26, 23, 26, 24, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (127, 19, 1, NULL, NULL, 16, 25, 1, 25, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (128, 19, 2, NULL, NULL, 24, 25, 17, 25, 40);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (129, 19, 3, NULL, NULL, 14, 26, 1, 26, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (130, 19, 4, NULL, NULL, 16, 26, 15, 26, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (131, 19, 5, NULL, NULL, 7, 26, 31, 26, 37);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (132, 19, 6, NULL, NULL, 8, 27, 1, 27, 8);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (133, 19, 7, NULL, NULL, 11, 27, 9, 27, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (134, 20, 1, NULL, NULL, 14, 27, 20, 28, 12);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (135, 20, 2, NULL, NULL, 18, 28, 13, 28, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (136, 20, 3, NULL, NULL, 13, 28, 31, 28, 43);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (137, 20, 4, NULL, NULL, 18, 29, 1, 29, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (138, 20, 5, NULL, NULL, 19, 29, 19, 29, 37);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (139, 20, 6, NULL, NULL, 9, 29, 38, 29, 46);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (140, 20, 7, NULL, NULL, 10, 30, 1, 30, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (141, 21, 1, NULL, NULL, 45, 30, 11, 31, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (142, 21, 2, NULL, NULL, 47, 31, 18, 33, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (143, 21, 3, NULL, NULL, 5, 33, 12, 33, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (144, 21, 4, NULL, NULL, 7, 33, 17, 33, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (145, 21, 5, NULL, NULL, 9, 34, 1, 34, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (146, 21, 6, NULL, NULL, 17, 34, 10, 34, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (147, 21, 7, NULL, NULL, 9, 34, 27, 34, 35);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (148, 22, 1, 1, 1, 20, 35, 1, 35, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (149, 22, 2, 1, 1, 9, 35, 21, 35, 29);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (150, 22, 3, 1, 2, 13, 35, 30, 36, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (151, 22, 4, 1, 2, 12, 36, 8, 36, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (152, 22, 5, 1, 2, 35, 36, 20, 37, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (153, 22, 6, 1, 3, 13, 37, 17, 37, 29);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (154, 22, 7, 1, 4, 20, 38, 1, 38, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (155, 23, 1, 1, 4, 12, 38, 21, 39, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (156, 23, 2, 1, 5, 20, 39, 2, 39, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (157, 23, 3, 1, 6, 11, 39, 22, 39, 32);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (158, 23, 4, 1, 6, 11, 39, 33, 39, 43);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (159, 23, 5, 1, 7, 16, 40, 1, 40, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (160, 23, 6, 1, 7, 11, 40, 17, 40, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (161, 23, 7, 1, 7, 11, 40, 28, 40, 38);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (162, 24, 1, NULL, NULL, 13, 1, 1, 1, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (163, 24, 2, NULL, NULL, 10, 1, 14, 2, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (164, 24, 3, NULL, NULL, 10, 2, 7, 2, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (165, 24, 4, NULL, NULL, 17, 3, 1, 3, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (166, 24, 5, NULL, NULL, 26, 4, 1, 4, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (167, 24, 6, NULL, NULL, 19, 4, 27, 5, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (168, 24, 7, NULL, NULL, 16, 5, 11, 5, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (169, 25, 1, NULL, NULL, 11, 6, 1, 6, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (170, 25, 2, NULL, NULL, 22, 6, 12, 7, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (171, 25, 3, NULL, NULL, 28, 7, 11, 7, 38);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (172, 25, 4, NULL, NULL, 13, 8, 1, 8, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (173, 25, 5, NULL, NULL, 8, 8, 14, 8, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (174, 25, 6, NULL, NULL, 8, 8, 22, 8, 29);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (175, 25, 7, NULL, NULL, 7, 8, 30, 8, 36);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (176, 26, 1, NULL, NULL, 16, 9, 1, 9, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (177, 26, 2, NULL, NULL, 7, 9, 17, 9, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (178, 26, 3, NULL, NULL, 12, 9, 24, 10, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (179, 26, 4, NULL, NULL, 4, 10, 12, 10, 15);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (180, 26, 5, NULL, NULL, 5, 10, 16, 10, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (181, 26, 6, NULL, NULL, 32, 11, 1, 11, 32);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (182, 26, 7, NULL, NULL, 15, 11, 33, 11, 47);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (183, 27, 1, 2, 1, 13, 12, 1, 13, 5);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (184, 27, 2, 2, 1, 12, 13, 6, 13, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (185, 27, 3, 2, 1, 6, 13, 18, 13, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (186, 27, 4, 2, 2, 5, 13, 24, 13, 28);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (187, 27, 5, 2, 2, 11, 13, 29, 13, 39);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (188, 27, 6, 2, 3, 15, 13, 40, 13, 54);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (189, 27, 7, 2, 4, 5, 13, 55, 13, 59);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (190, 28, 1, 2, 4, 12, 14, 1, 14, 12);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (191, 28, 2, 2, 4, 8, 14, 13, 14, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (192, 28, 3, 2, 5, 12, 14, 21, 14, 32);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (193, 28, 4, 2, 6, 21, 14, 33, 14, 53);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (194, 28, 5, 2, 6, 19, 14, 54, 15, 15);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (195, 28, 6, 2, 7, 13, 15, 16, 15, 28);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (196, 28, 7, 2, 7, 5, 15, 29, 15, 33);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (197, 29, 1, 3, 1, 17, 16, 1, 16, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (198, 29, 2, 3, 1, 7, 16, 18, 16, 24);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (199, 29, 3, 3, 2, 10, 16, 25, 16, 34);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (200, 29, 4, 3, 2, 7, 17, 1, 17, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (201, 29, 5, 3, 3, 14, 17, 8, 18, 5);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (202, 29, 6, 3, 3, 16, 18, 6, 18, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (203, 29, 7, 3, 4, 9, 18, 22, 18, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (204, 30, 1, 3, 4, 14, 19, 1, 19, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (205, 30, 2, 3, 5, 8, 19, 15, 19, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (206, 30, 3, 3, 5, 10, 19, 23, 19, 32);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (207, 30, 4, 3, 6, 5, 19, 33, 19, 37);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (208, 30, 5, 3, 6, 7, 20, 1, 20, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (209, 30, 6, 3, 7, 15, 20, 8, 20, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (210, 30, 7, 3, 7, 5, 20, 23, 20, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (211, 31, 1, NULL, NULL, 15, 21, 1, 21, 15);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (212, 31, 2, NULL, NULL, 25, 21, 16, 22, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (213, 31, 3, NULL, NULL, 17, 22, 17, 22, 33);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (214, 31, 4, NULL, NULL, 22, 23, 1, 23, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (215, 31, 5, NULL, NULL, 10, 23, 23, 23, 32);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (216, 31, 6, NULL, NULL, 12, 23, 33, 23, 44);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (217, 31, 7, NULL, NULL, 23, 24, 1, 24, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (218, 32, 1, 4, 1, 13, 25, 1, 25, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (219, 32, 2, 4, 1, 5, 25, 14, 25, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (220, 32, 3, 4, 2, 6, 25, 19, 25, 24);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (221, 32, 4, 4, 2, 4, 25, 25, 25, 28);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (222, 32, 5, 4, 3, 10, 25, 29, 25, 38);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (223, 32, 6, 4, 4, 8, 25, 39, 25, 46);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (224, 32, 7, 4, 4, 11, 25, 47, 26, 2);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (225, 33, 1, 4, 4, 3, 26, 3, 26, 5);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (226, 33, 2, 4, 4, 4, 26, 6, 26, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (227, 33, 3, 4, 5, 37, 26, 10, 26, 46);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (228, 33, 4, 4, 6, 15, 27, 1, 27, 15);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (229, 33, 5, 4, 7, 6, 27, 16, 27, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (230, 33, 6, 4, 7, 7, 27, 22, 27, 28);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (231, 33, 7, 4, 7, 6, 27, 29, 27, 34);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (232, 34, 1, NULL, NULL, 19, 1, 1, 1, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (233, 34, 2, NULL, NULL, 35, 1, 20, 1, 54);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (234, 34, 3, NULL, NULL, 34, 2, 1, 2, 34);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (235, 34, 4, NULL, NULL, 13, 3, 1, 3, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (236, 34, 5, NULL, NULL, 26, 3, 14, 3, 39);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (237, 34, 6, NULL, NULL, 12, 3, 40, 3, 51);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (238, 34, 7, NULL, NULL, 20, 4, 1, 4, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (239, 35, 1, NULL, NULL, 17, 4, 21, 4, 37);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (240, 35, 2, NULL, NULL, 12, 4, 38, 4, 49);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (241, 35, 3, NULL, NULL, 10, 5, 1, 5, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (242, 35, 4, NULL, NULL, 48, 5, 11, 6, 27);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (243, 35, 5, NULL, NULL, 41, 7, 1, 7, 41);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (244, 35, 6, NULL, NULL, 30, 7, 42, 7, 71);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (245, 35, 7, NULL, NULL, 18, 7, 72, 7, 89);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (246, 36, 1, NULL, NULL, 14, 8, 1, 8, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (247, 36, 2, NULL, NULL, 12, 8, 15, 8, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (248, 36, 3, NULL, NULL, 14, 9, 1, 9, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (249, 36, 4, NULL, NULL, 19, 9, 15, 10, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (250, 36, 5, NULL, NULL, 24, 10, 11, 10, 34);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (251, 36, 6, NULL, NULL, 31, 10, 35, 11, 29);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (252, 36, 7, NULL, NULL, 22, 11, 30, 12, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (253, 37, 1, NULL, NULL, 20, 13, 1, 13, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (254, 37, 2, NULL, NULL, 20, 13, 21, 14, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (255, 37, 3, NULL, NULL, 18, 14, 8, 14, 25);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (256, 37, 4, NULL, NULL, 27, 14, 26, 15, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (257, 37, 5, NULL, NULL, 9, 15, 8, 15, 16);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (258, 37, 6, NULL, NULL, 10, 15, 17, 15, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (259, 37, 7, NULL, NULL, 15, 15, 27, 15, 41);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (260, 38, 1, NULL, NULL, 13, 16, 1, 16, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (261, 38, 2, NULL, NULL, 6, 16, 14, 16, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (262, 38, 3, NULL, NULL, 24, 16, 20, 17, 8);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (263, 38, 4, NULL, NULL, 7, 17, 9, 17, 15);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (264, 38, 5, NULL, NULL, 9, 17, 16, 17, 24);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (265, 38, 6, NULL, NULL, 24, 17, 25, 18, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (266, 38, 7, NULL, NULL, 12, 18, 21, 18, 32);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (267, 39, 1, 5, 1, 17, 19, 1, 19, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (268, 39, 2, 5, 1, 11, 19, 18, 20, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (269, 39, 3, 5, 2, 7, 20, 7, 20, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (270, 39, 4, 5, 2, 8, 20, 14, 20, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (271, 39, 5, 5, 3, 17, 20, 22, 21, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (272, 39, 6, 5, 3, 11, 21, 10, 21, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (273, 39, 7, 5, 4, 16, 21, 21, 22, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (274, 40, 1, 5, 4, 11, 22, 2, 22, 12);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (275, 40, 2, 5, 5, 8, 22, 13, 22, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (276, 40, 3, 5, 5, 18, 22, 21, 22, 38);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (277, 40, 4, 5, 6, 15, 22, 39, 23, 12);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (278, 40, 5, 5, 6, 14, 23, 13, 23, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (279, 40, 6, 5, 7, 17, 23, 27, 24, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (280, 40, 7, 5, 7, 21, 24, 14, 25, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (281, 41, 1, NULL, NULL, 14, 25, 10, 26, 4);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (282, 41, 2, NULL, NULL, 47, 26, 5, 26, 51);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (283, 41, 3, NULL, NULL, 19, 26, 52, 27, 5);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (284, 41, 4, NULL, NULL, 18, 27, 6, 27, 23);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (285, 41, 5, NULL, NULL, 15, 28, 1, 28, 15);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (286, 41, 6, NULL, NULL, 27, 28, 16, 29, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (287, 41, 7, NULL, NULL, 29, 29, 12, 30, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (288, 42, 1, 6, 1, 16, 30, 2, 30, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (289, 42, 2, 6, 1, 12, 31, 1, 31, 12);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (290, 42, 3, 6, 2, 12, 31, 13, 31, 24);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (291, 42, 4, 6, 2, 17, 31, 25, 31, 41);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (292, 42, 5, 6, 2, 13, 31, 42, 31, 54);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (293, 42, 6, 6, 3, 19, 32, 1, 32, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (294, 42, 7, 6, 4, 23, 32, 20, 32, 42);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (295, 43, 1, 6, 4, 10, 33, 1, 33, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (296, 43, 2, 6, 4, 39, 33, 11, 33, 49);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (297, 43, 3, 6, 5, 22, 33, 50, 34, 15);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (298, 43, 4, 6, 6, 14, 34, 16, 34, 29);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (299, 43, 5, 6, 6, 8, 35, 1, 35, 8);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (300, 43, 6, 6, 7, 26, 35, 9, 35, 34);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (301, 43, 7, 6, 7, 13, 36, 1, 36, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (302, 44, 1, NULL, NULL, 10, 1, 1, 1, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (303, 44, 2, NULL, NULL, 11, 1, 11, 1, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (304, 44, 3, NULL, NULL, 17, 1, 22, 1, 38);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (305, 44, 4, NULL, NULL, 9, 1, 39, 2, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (306, 44, 5, NULL, NULL, 29, 2, 2, 2, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (307, 44, 6, NULL, NULL, 21, 2, 31, 3, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (308, 44, 7, NULL, NULL, 8, 3, 15, 3, 22);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (309, 45, 1, NULL, NULL, 11, 3, 23, 4, 4);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (310, 45, 2, NULL, NULL, 36, 4, 5, 4, 40);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (311, 45, 3, NULL, NULL, 9, 4, 41, 4, 49);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (312, 45, 4, NULL, NULL, 18, 5, 1, 5, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (313, 45, 5, NULL, NULL, 15, 5, 19, 6, 3);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (314, 45, 6, NULL, NULL, 22, 6, 4, 6, 25);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (315, 45, 7, NULL, NULL, 11, 7, 1, 7, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (316, 46, 1, NULL, NULL, 25, 7, 12, 8, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (317, 46, 2, NULL, NULL, 13, 8, 11, 9, 3);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (318, 46, 3, NULL, NULL, 26, 9, 4, 9, 29);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (319, 46, 4, NULL, NULL, 11, 10, 1, 10, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (320, 46, 5, NULL, NULL, 20, 10, 12, 11, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (321, 46, 6, NULL, NULL, 12, 11, 10, 11, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (322, 46, 7, NULL, NULL, 4, 11, 22, 11, 25);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (323, 47, 1, NULL, NULL, 17, 11, 26, 12, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (324, 47, 2, NULL, NULL, 18, 12, 11, 12, 28);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (325, 47, 3, NULL, NULL, 22, 12, 29, 13, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (326, 47, 4, NULL, NULL, 21, 14, 1, 14, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (327, 47, 5, NULL, NULL, 8, 14, 22, 14, 29);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (328, 47, 6, NULL, NULL, 18, 15, 1, 15, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (329, 47, 7, NULL, NULL, 22, 15, 19, 16, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (330, 48, 1, NULL, NULL, 18, 16, 18, 17, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (331, 48, 2, NULL, NULL, 7, 17, 14, 17, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (332, 48, 3, NULL, NULL, 5, 18, 1, 18, 5);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (333, 48, 4, NULL, NULL, 8, 18, 6, 18, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (334, 48, 5, NULL, NULL, 22, 18, 14, 19, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (335, 48, 6, NULL, NULL, 17, 19, 14, 20, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (336, 48, 7, NULL, NULL, 20, 20, 10, 21, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (337, 49, 1, NULL, NULL, 12, 21, 10, 21, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (338, 49, 2, NULL, NULL, 9, 21, 22, 22, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (339, 49, 3, NULL, NULL, 29, 22, 8, 23, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (340, 49, 4, NULL, NULL, 17, 23, 8, 23, 24);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (341, 49, 5, NULL, NULL, 6, 23, 25, 24, 4);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (342, 49, 6, NULL, NULL, 9, 24, 5, 24, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (343, 49, 7, NULL, NULL, 28, 24, 14, 25, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (344, 50, 1, NULL, NULL, 11, 26, 1, 26, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (345, 50, 2, NULL, NULL, 4, 26, 12, 26, 15);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (346, 50, 3, NULL, NULL, 4, 26, 16, 26, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (347, 50, 4, NULL, NULL, 10, 27, 1, 27, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (348, 50, 5, NULL, NULL, 22, 27, 11, 28, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (349, 50, 6, NULL, NULL, 63, 28, 7, 28, 69);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (350, 50, 7, NULL, NULL, 8, 29, 1, 29, 8);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (351, 51, 1, 7, 1, 3, 29, 9, 29, 11);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (352, 51, 2, 7, 1, 3, 29, 12, 29, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (353, 51, 3, 7, 1, 14, 29, 15, 29, 28);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (354, 51, 4, 7, 2, 6, 30, 1, 30, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (355, 51, 5, 7, 3, 4, 30, 7, 30, 10);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (356, 51, 6, 7, 3, 4, 30, 11, 30, 14);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (357, 51, 7, 7, 4, 6, 30, 15, 30, 20);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (358, 52, 1, 7, 4, 3, 31, 1, 31, 3);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (359, 52, 2, 7, 4, 3, 31, 4, 31, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (360, 52, 3, 7, 5, 3, 31, 7, 31, 9);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (361, 52, 4, 7, 5, 4, 31, 10, 31, 13);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (362, 52, 5, 7, 6, 6, 31, 14, 31, 19);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (363, 52, 6, 7, 7, 5, 31, 20, 31, 24);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (364, 52, 7, 7, 7, 6, 31, 25, 31, 30);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (365, 53, 1, NULL, NULL, 6, 32, 1, 32, 6);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (366, 53, 2, NULL, NULL, 6, 32, 7, 32, 12);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (367, 53, 3, NULL, NULL, 6, 32, 13, 32, 18);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (368, 53, 4, NULL, NULL, 10, 32, 19, 32, 28);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (369, 53, 5, NULL, NULL, 11, 32, 29, 32, 39);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (370, 53, 6, NULL, NULL, 4, 32, 40, 32, 43);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (371, 53, 7, NULL, NULL, 9, 32, 44, 32, 52);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (372, 54, 1, NULL, NULL, 7, 33, 1, 33, 7);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (373, 54, 2, NULL, NULL, 5, 33, 8, 33, 12);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (374, 54, 3, NULL, NULL, 5, 33, 13, 33, 17);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (375, 54, 4, NULL, NULL, 4, 33, 18, 33, 21);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (376, 54, 5, NULL, NULL, 5, 33, 22, 33, 26);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (377, 54, 6, NULL, NULL, 3, 33, 27, 33, 29);
--> statement-breakpoint
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES (378, 54, 7, NULL, NULL, 12, 34, 1, 34, 12);
