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

--> statement-breakpoint
-- Maftir aliyot (aliyah 8) for the 53 non-final parshiot
INSERT OR IGNORE INTO aliyot (id, parsha_id, aliyah, pair_id, combined_aliyah, pseukim, chapter_start, verse_start, chapter_end, verse_end) VALUES
  (379, 1, 8, NULL, NULL, 4, 6, 5, 6, 8),
  (380, 2, 8, NULL, NULL, 4, 11, 29, 11, 32),
  (381, 3, 8, NULL, NULL, 4, 17, 24, 17, 27),
  (382, 4, 8, NULL, NULL, 5, 22, 20, 22, 24),
  (383, 5, 8, NULL, NULL, 3, 25, 16, 25, 18),
  (384, 6, 8, NULL, NULL, 3, 28, 7, 28, 9),
  (385, 7, 8, NULL, NULL, 3, 32, 1, 32, 3),
  (386, 8, 8, NULL, NULL, 4, 36, 40, 36, 43),
  (387, 9, 8, NULL, NULL, 4, 40, 20, 40, 23),
  (388, 10, 8, NULL, NULL, 4, 44, 14, 44, 17),
  (389, 11, 8, NULL, NULL, 3, 47, 25, 47, 27),
  (390, 12, 8, NULL, NULL, 4, 50, 23, 50, 26),
  (391, 13, 8, NULL, NULL, 3, 5, 22, 6, 1),
  (392, 14, 8, NULL, NULL, 3, 9, 33, 9, 35),
  (393, 15, 8, NULL, NULL, 3, 13, 14, 13, 16),
  (394, 16, 8, NULL, NULL, 3, 17, 14, 17, 16),
  (395, 17, 8, NULL, NULL, 5, 20, 19, 20, 23),
  (396, 18, 8, NULL, NULL, 4, 24, 15, 24, 18),
  (397, 19, 8, NULL, NULL, 3, 27, 17, 27, 19),
  (398, 20, 8, NULL, NULL, 3, 30, 8, 30, 10),
  (399, 21, 8, NULL, NULL, 3, 34, 33, 34, 35),
  (400, 22, 8, NULL, NULL, 3, 38, 18, 38, 20),
  (401, 23, 8, NULL, NULL, 5, 40, 34, 40, 38),
  (402, 24, 8, NULL, NULL, 3, 5, 24, 5, 26),
  (403, 25, 8, NULL, NULL, 4, 8, 33, 8, 36),
  (404, 26, 8, NULL, NULL, 3, 11, 45, 11, 47),
  (405, 27, 8, NULL, NULL, 3, 13, 57, 13, 59),
  (406, 28, 8, NULL, NULL, 3, 15, 31, 15, 33),
  (407, 29, 8, NULL, NULL, 3, 18, 28, 18, 30),
  (408, 30, 8, NULL, NULL, 3, 20, 25, 20, 27),
  (409, 31, 8, NULL, NULL, 3, 24, 21, 24, 23),
  (410, 32, 8, NULL, NULL, 3, 25, 55, 26, 2),
  (411, 33, 8, NULL, NULL, 3, 27, 32, 27, 34),
  (412, 34, 8, NULL, NULL, 4, 4, 17, 4, 20),
  (413, 35, 8, NULL, NULL, 3, 7, 87, 7, 89),
  (414, 36, 8, NULL, NULL, 3, 12, 14, 12, 16),
  (415, 37, 8, NULL, NULL, 5, 15, 37, 15, 41),
  (416, 38, 8, NULL, NULL, 3, 18, 30, 18, 32),
  (417, 39, 8, NULL, NULL, 3, 21, 34, 22, 1),
  (418, 40, 8, NULL, NULL, 3, 25, 7, 25, 9),
  (419, 41, 8, NULL, NULL, 6, 29, 35, 30, 1),
  (420, 42, 8, NULL, NULL, 4, 32, 39, 32, 42),
  (421, 43, 8, NULL, NULL, 3, 36, 11, 36, 13),
  (422, 44, 8, NULL, NULL, 3, 3, 20, 3, 22),
  (423, 45, 8, NULL, NULL, 3, 7, 9, 7, 11),
  (424, 46, 8, NULL, NULL, 4, 11, 22, 11, 25),
  (425, 47, 8, NULL, NULL, 5, 16, 13, 16, 17),
  (426, 48, 8, NULL, NULL, 3, 21, 7, 21, 9),
  (427, 49, 8, NULL, NULL, 3, 25, 17, 25, 19),
  (428, 50, 8, NULL, NULL, 3, 29, 6, 29, 8),
  (429, 51, 8, NULL, NULL, 6, 30, 15, 30, 20),
  (430, 52, 8, NULL, NULL, 3, 31, 28, 31, 30),
  (431, 53, 8, NULL, NULL, 5, 32, 48, 32, 52);

--> statement-breakpoint
-- Custom SQL migration file, put your code below! --
-- Seed: occasions (37 rows) and occasion_aliyot (192 rows)
-- Sources:
--   occasions: curated list of Jewish holiday Torah readings with Hebrew names
--   occasion_aliyot: generated from @hebcal/leyning getLeyningForHolidayKey()
--     covers_aliyah_id is set when a holiday aliyah verse range exactly matches
--     a standard aliyah (e.g. Shabbat Zachor maftir = Ki Teitzei maftir, id=427)
-- Shabbat variants (is_shabbat_variant=1) share the same occasion_id as weekday rows;
-- the UI Shabbat toggle filters by is_shabbat_variant.
INSERT OR IGNORE INTO occasions (id, name, name_en, category, sort_order) VALUES
(1,  'ראש השנה א׳',         'Rosh Hashana Day 1',           'yom_tov',        100),
(2,  'ראש השנה א׳ (שבת)',   'Rosh Hashana Day 1 (Shabbat)', 'yom_tov',        101),
(3,  'ראש השנה ב׳',         'Rosh Hashana Day 2',           'yom_tov',        110),
(4,  'יום כיפור',            'Yom Kippur',                   'yom_tov',        200),
(5,  'יום כיפור (שבת)',     'Yom Kippur (Shabbat)',          'yom_tov',        201),
(6,  'סוכות א׳',             'Sukkot Day 1',                 'yom_tov',        300),
(7,  'סוכות א׳ (שבת)',      'Sukkot Day 1 (Shabbat)',        'yom_tov',        301),
(8,  'סוכות ב׳',             'Sukkot Day 2',                 'yom_tov',        310),
(9,  'שבת חול המועד סוכות', 'Sukkot Shabbat Chol HaMoed',   'yom_tov',        320),
(10, 'שמחת תורה',            'Simchat Torah',                'yom_tov',        330),
(11, 'שמחת תורה (שבת)',     'Simchat Torah (Shabbat)',       'yom_tov',        331),
(12, 'חנוכה א׳',             'Chanukah Day 1',               'chanukah',       400),
(13, 'חנוכה ב׳',             'Chanukah Day 2',               'chanukah',       410),
(14, 'חנוכה ג׳',             'Chanukah Day 3',               'chanukah',       420),
(15, 'חנוכה ד׳',             'Chanukah Day 4',               'chanukah',       430),
(16, 'חנוכה ה׳',             'Chanukah Day 5',               'chanukah',       440),
(17, 'חנוכה ו׳',             'Chanukah Day 6',               'chanukah',       450),
(18, 'חנוכה ז׳',             'Chanukah Day 7',               'chanukah',       460),
(19, 'חנוכה ח׳',             'Chanukah Day 8',               'chanukah',       470),
(20, 'פורים',                'Purim',                        'other',          500),
(21, 'פסח א׳',               'Pesach Day 1',                 'yom_tov',        600),
(22, 'פסח א׳ (שבת)',         'Pesach Day 1 (Shabbat)',        'yom_tov',        601),
(23, 'פסח ב׳',               'Pesach Day 2',                 'yom_tov',        610),
(24, 'שבת חול המועד פסח',   'Pesach Shabbat Chol HaMoed',   'yom_tov',        620),
(25, 'פסח ז׳',               'Pesach Day 7',                 'yom_tov',        630),
(26, 'פסח ז׳ (שבת)',         'Pesach Day 7 (Shabbat)',        'yom_tov',        631),
(27, 'פסח ח׳',               'Pesach Day 8',                 'yom_tov',        640),
(28, 'פסח ח׳ (שבת)',         'Pesach Day 8 (Shabbat)',        'yom_tov',        641),
(29, 'שבועות א׳',            'Shavuot Day 1',                'yom_tov',        700),
(30, 'שבועות ב׳',            'Shavuot Day 2',                'yom_tov',        710),
(31, 'שבועות ב׳ (שבת)',     'Shavuot Day 2 (Shabbat)',       'yom_tov',        711),
(32, 'תשעה באב',             'Tisha B''Av',                  'other',          800),
(33, 'ראש חודש',              'Rosh Chodesh',                 'rosh_chodesh',   900),
(34, 'שבת שקלים',            'Shabbat Shekalim',             'maftir_special', 1000),
(35, 'שבת זכור',             'Shabbat Zachor',               'maftir_special', 1010),
(36, 'שבת פרה',              'Shabbat Parah',                'maftir_special', 1020),
(37, 'שבת החודש',            'Shabbat HaChodesh',            'maftir_special', 1030);
--> statement-breakpoint
-- Columns: (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant,
--           pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id)
INSERT OR IGNORE INTO occasion_aliyot (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant, pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id) VALUES
-- Rosh Hashana Day 1 (weekday: 5 aliyot + M, from Vayera / Genesis 21)
(1,  1,  4,  '1', 0,  4, 21,  1, 21,  4, NULL),
(2,  1,  4,  '2', 0,  8, 21,  5, 21, 12, NULL),
(3,  1,  4,  '3', 0,  9, 21, 13, 21, 21, NULL),
(4,  1,  4,  '4', 0,  6, 21, 22, 21, 27, NULL),
(5,  1,  4,  '5', 0,  7, 21, 28, 21, 34, NULL),
(6,  1,  41, 'M', 0,  6, 29,  1, 29,  6, NULL),
-- Rosh Hashana Day 1 Shabbat (7 aliyot + M)
(7,  2,  4,  '1', 1,  4, 21,  1, 21,  4, NULL),
(8,  2,  4,  '2', 1,  4, 21,  5, 21,  8, NULL),
(9,  2,  4,  '3', 1,  4, 21,  9, 21, 12, NULL),
(10, 2,  4,  '4', 1,  5, 21, 13, 21, 17, NULL),
(11, 2,  4,  '5', 1,  4, 21, 18, 21, 21, NULL),
(12, 2,  4,  '6', 1,  6, 21, 22, 21, 27, NULL),
(13, 2,  4,  '7', 1,  7, 21, 28, 21, 34, NULL),
(14, 2,  41, 'M', 1,  6, 29,  1, 29,  6, NULL),
-- Rosh Hashana Day 2 (weekday: 5 aliyot + M, from Vayera / Genesis 22)
(15, 3,  4,  '1', 0,  3, 22,  1, 22,  3, NULL),
(16, 3,  4,  '2', 0,  5, 22,  4, 22,  8, NULL),
(17, 3,  4,  '3', 0,  6, 22,  9, 22, 14, NULL),
(18, 3,  4,  '4', 0,  5, 22, 15, 22, 19, NULL),
(19, 3,  4,  '5', 0,  5, 22, 20, 22, 24, 382),
(20, 3,  41, 'M', 0,  6, 29,  1, 29,  6, NULL),
-- Yom Kippur (weekday: 6 aliyot + M, from Acharei Mot / Leviticus 16)
(21, 4,  29, '1', 0,  6, 16,  1, 16,  6, NULL),
(22, 4,  29, '2', 0,  5, 16,  7, 16, 11, NULL),
(23, 4,  29, '3', 0,  6, 16, 12, 16, 17, NULL),
(24, 4,  29, '4', 0,  7, 16, 18, 16, 24, 198),
(25, 4,  29, '5', 0,  6, 16, 25, 16, 30, NULL),
(26, 4,  29, '6', 0,  4, 16, 31, 16, 34, NULL),
(27, 4,  41, 'M', 0,  5, 29,  7, 29, 11, NULL),
-- Yom Kippur Shabbat (7 aliyot + M)
(28, 5,  29, '1', 1,  3, 16,  1, 16,  3, NULL),
(29, 5,  29, '2', 1,  3, 16,  4, 16,  6, NULL),
(30, 5,  29, '3', 1,  5, 16,  7, 16, 11, NULL),
(31, 5,  29, '4', 1,  6, 16, 12, 16, 17, NULL),
(32, 5,  29, '5', 1,  7, 16, 18, 16, 24, 198),
(33, 5,  29, '6', 1,  6, 16, 25, 16, 30, NULL),
(34, 5,  29, '7', 1,  4, 16, 31, 16, 34, NULL),
(35, 5,  41, 'M', 1,  5, 29,  7, 29, 11, NULL),
-- Sukkot Day 1 (weekday: 5 aliyot + M, from Emor / Leviticus 22-23)
(36, 6,  31, '1', 0, 11, 22, 26, 23,  3, NULL),
(37, 6,  31, '2', 0, 11, 23,  4, 23, 14, NULL),
(38, 6,  31, '3', 0,  8, 23, 15, 23, 22, NULL),
(39, 6,  31, '4', 0, 10, 23, 23, 23, 32, NULL),
(40, 6,  31, '5', 0, 12, 23, 33, 23, 44, NULL),
(41, 6,  41, 'M', 0,  5, 29, 12, 29, 16, NULL),
-- Sukkot Day 1 Shabbat (7 aliyot + M)
(42, 7,  31, '1', 1,  4, 22, 26, 22, 29, NULL),
(43, 7,  31, '2', 1,  4, 22, 30, 22, 33, NULL),
(44, 7,  31, '3', 1,  5, 22, 34, 22, 38, NULL),
(45, 7,  31, '4', 1,  5, 22, 39, 22, 43, NULL),
(46, 7,  31, '5', 1,  5, 23,  1, 23,  5, NULL),
(47, 7,  31, '6', 1,  5, 23,  6, 23, 10, NULL),
(48, 7,  31, '7', 1,  5, 23, 11, 23, 15, NULL),
(49, 7,  41, 'M', 1,  5, 29, 12, 29, 16, NULL),
-- Sukkot Day 2 (weekday: 5 aliyot + M, same reading as Day 1)
(50, 8,  31, '1', 0, 11, 22, 26, 23,  3, NULL),
(51, 8,  31, '2', 0, 11, 23,  4, 23, 14, NULL),
(52, 8,  31, '3', 0,  8, 23, 15, 23, 22, NULL),
(53, 8,  31, '4', 0, 10, 23, 23, 23, 32, NULL),
(54, 8,  31, '5', 0, 12, 23, 33, 23, 44, NULL),
(55, 8,  41, 'M', 0,  5, 29, 12, 29, 16, NULL),
-- Sukkot Shabbat Chol HaMoed (7 aliyot from Ki Tisa + M from day 2 intermediate week)
(56, 9,  21, '1', 0,  5, 33, 12, 33, 16, 143),
(57, 9,  21, '2', 0,  3, 33, 17, 33, 19, NULL),
(58, 9,  21, '3', 0,  4, 33, 20, 33, 23, NULL),
(59, 9,  21, '4', 0,  3, 34,  1, 34,  3, NULL),
(60, 9,  21, '5', 0,  7, 34,  4, 34, 10, NULL),
(61, 9,  21, '6', 0,  7, 34, 11, 34, 17, NULL),
(62, 9,  21, '7', 0,  9, 34, 18, 34, 26, NULL),
(63, 9,  41, 'M', 0,  6, 29, 17, 29, 22, NULL),
-- Simchat Torah (weekday: 6 aliyot from Vezot Haberakhah + M from Pinchas)
(64, 10, 54, '1', 0, 15, 33,  1, 33, 17, NULL),
(65, 10, 54, '2', 0, 12, 33, 18, 33, 29, NULL),
(66, 10, 54, '3', 0,  7, 33, 29, 34,  4, NULL),
(67, 10, 54, '4', 0, 12, 34,  5, 34, 12, NULL),
(68, 10, 54, '5', 0, 12, 34, 13, 34, 26, NULL),
(69, 10, 54, '6', 0, 12, 34, 27, 34, 38, NULL),
(70, 10, 41, 'M', 0,  6, 29, 35, 30,  1, 419),
-- Simchat Torah Shabbat (7 aliyot + M)
(71, 11, 54, '1', 1,  9, 33,  1, 33,  9, NULL),
(72, 11, 54, '2', 1,  8, 33, 10, 33, 17, NULL),
(73, 11, 54, '3', 1, 12, 33, 18, 33, 29, NULL),
(74, 11, 54, '4', 1,  7, 33, 29, 34,  4, NULL),
(75, 11, 54, '5', 1,  8, 34,  5, 34, 12, NULL),
(76, 11, 54, '6', 1, 14, 34, 13, 34, 26, NULL),
(77, 11, 54, '7', 1, 12, 34, 27, 34, 38, NULL),
(78, 11, 41, 'M', 1,  6, 29, 35, 30,  1, 419),
-- Chanukah Day 1 (2 aliyot + M from Naso, Numbers 7)
(79, 12, 35, '1', 0,  6,  7,  1,  7, 11, NULL),
(80, 12, 35, '2', 0, 11,  7, 12,  7, 17, NULL),
(81, 12, 35, 'M', 0,  6,  7, 48,  7, 53, NULL),
-- Chanukah Day 2
(82, 13, 35, '1', 0,  6,  7, 18,  7, 23, NULL),
(83, 13, 35, '2', 0,  5,  7, 24,  7, 29, NULL),
(84, 13, 35, 'M', 0,  6,  7, 48,  7, 53, NULL),
-- Chanukah Day 3
(85, 14, 35, '1', 0,  5,  7, 30,  7, 35, NULL),
(86, 14, 35, '2', 0,  5,  7, 36,  7, 41, NULL),
(87, 14, 35, 'M', 0,  6,  7, 48,  7, 53, NULL),
-- Chanukah Day 4
(88, 15, 35, '1', 0,  6,  7, 42,  7, 47, NULL),
(89, 15, 35, '2', 0,  6,  7, 48,  7, 53, NULL),
(90, 15, 35, 'M', 0,  7,  7, 48,  7, 54, NULL),
-- Chanukah Day 5
(91, 16, 35, '1', 0,  6,  7, 54,  7, 59, NULL),
(92, 16, 35, '2', 0,  6,  7, 60,  7, 65, NULL),
(93, 16, 35, 'M', 0,  7,  7, 48,  7, 54, NULL),
-- Chanukah Day 6
(94, 17, 35, '1', 0, 11,  7, 66,  7, 71, NULL),
(95, 17, 35, '2', 0, 17,  7, 72,  7, 89, NULL),
(96, 17, 35, 'M', 0,  3,  8,  1,  8,  4, NULL),
-- Chanukah Day 7
(97,  18, 36, '1', 0,  3,  8,  1,  8,  4, NULL),
(98,  18, 36, '2', 0,  7,  8,  5,  8, 11, NULL),
(99,  18, 36, 'M', 0,  6,  7, 48,  7, 53, NULL),
-- Chanukah Day 8
(100, 19, 36, '1', 0,  5,  8, 12,  8, 17, NULL),
(101, 19, 36, '2', 0,  6,  8, 18,  8, 23, NULL),
(102, 19, 36, 'M', 0,  6,  7, 48,  7, 53, NULL),
-- Purim (3 aliyot from Ki Tisa, Exodus 17:8-16)
(103, 20, 33, '1', 0,  9, 17,  8, 17, 16, NULL),
(104, 20, 33, '2', 0,  9, 17, 17, 17, 25, NULL),
(105, 20, 33, 'M', 0, 10, 17,  8, 17, 16, NULL),
-- Pesach Day 1 (weekday: 5 aliyot + M from Bo / Numbers 28)
(106, 21, 15, '1', 0,  4, 12, 21, 12, 24, NULL),
(107, 21, 15, '2', 0,  4, 12, 25, 12, 28, NULL),
(108, 21, 15, '3', 0,  8, 12, 29, 12, 36, NULL),
(109, 21, 15, '4', 0,  6, 12, 37, 12, 42, NULL),
(110, 21, 15, '5', 0,  9, 12, 43, 12, 51, NULL),
(111, 21, 41, 'M', 0, 10, 28, 16, 28, 25, NULL),
-- Pesach Day 1 Shabbat (7 aliyot + M)
(112, 22, 15, '1', 1,  3, 12, 21, 12, 23, NULL),
(113, 22, 15, '2', 1,  4, 12, 24, 12, 27, NULL),
(114, 22, 15, '3', 1,  6, 12, 28, 12, 33, NULL),
(115, 22, 15, '4', 1,  5, 12, 34, 12, 38, NULL),
(116, 22, 15, '5', 1,  3, 12, 39, 12, 41, NULL),
(117, 22, 15, '6', 1,  5, 12, 37, 12, 42, NULL),
(118, 22, 15, '7', 1,  4, 12, 48, 12, 51, NULL),
(119, 22, 41, 'M', 1, 10, 28, 16, 28, 25, NULL),
-- Pesach Day 2 (weekday: 5 aliyot from Emor / Leviticus 22-23 + M)
(120, 23, 31, '1', 0, 11, 22, 26, 23,  3, NULL),
(121, 23, 31, '2', 0, 11, 23,  4, 23, 14, NULL),
(122, 23, 31, '3', 0,  8, 23, 15, 23, 22, NULL),
(123, 23, 31, '4', 0, 10, 23, 23, 23, 32, NULL),
(124, 23, 31, '5', 0, 12, 23, 33, 23, 44, NULL),
(125, 23, 41, 'M', 0, 10, 28, 16, 28, 25, NULL),
-- Pesach Shabbat Chol HaMoed (Ki Tisa / Exodus 33-34, 7 aliyot + M)
(126, 24, 21, '1', 0,  5, 33, 12, 33, 16, 143),
(127, 24, 21, '2', 0,  3, 33, 17, 33, 19, NULL),
(128, 24, 21, '3', 0,  4, 33, 20, 33, 23, NULL),
(129, 24, 21, '4', 0,  3, 34,  1, 34,  3, NULL),
(130, 24, 21, '5', 0,  7, 34,  4, 34, 10, NULL),
(131, 24, 21, '6', 0,  7, 34, 11, 34, 17, NULL),
(132, 24, 21, '7', 0,  9, 34, 18, 34, 26, NULL),
(133, 24, 41, 'M', 0,  7, 28, 19, 28, 25, NULL),
-- Pesach Day 7 (weekday: 5 aliyot from Beshalach / Exodus 13-15 + M)
(134, 25, 16, '1', 0,  6, 13, 17, 13, 22, NULL),
(135, 25, 16, '2', 0,  8, 14,  1, 14,  8, NULL),
(136, 25, 16, '3', 0,  6, 14,  9, 14, 14, 107),
(137, 25, 16, '4', 0, 11, 14, 15, 14, 25, 108),
(138, 25, 16, '5', 0, 32, 14, 26, 15, 26, 109),
(139, 25, 41, 'M', 0,  7, 28, 19, 28, 25, NULL),
-- Pesach Day 7 Shabbat (7 aliyot + M)
(140, 26, 16, '1', 1,  3, 13, 17, 13, 19, NULL),
(141, 26, 16, '2', 1,  3, 13, 20, 13, 22, NULL),
(142, 26, 16, '3', 1,  4, 14,  1, 14,  4, NULL),
(143, 26, 16, '4', 1,  4, 14,  5, 14,  8, NULL),
(144, 26, 16, '5', 1,  6, 14,  9, 14, 14, 107),
(145, 26, 16, '6', 1, 11, 14, 15, 14, 25, 108),
(146, 26, 16, '7', 1, 32, 14, 26, 15, 26, 109),
(147, 26, 41, 'M', 1,  7, 28, 19, 28, 25, NULL),
-- Pesach Day 8 (weekday: 5 aliyot from Re''eh / Deuteronomy 15-16 + M)
(148, 27, 47, '1', 0,  5, 15, 19, 15, 23, NULL),
(149, 27, 47, '2', 0,  3, 16,  1, 16,  3, NULL),
(150, 27, 47, '3', 0,  5, 16,  4, 16,  8, NULL),
(151, 27, 47, '4', 0,  4, 16,  9, 16, 12, NULL),
(152, 27, 47, '5', 0,  5, 16, 13, 16, 17, 425),
(153, 27, 41, 'M', 0,  7, 28, 19, 28, 25, NULL),
-- Pesach Day 8 Shabbat (7 aliyot + M)
(154, 28, 47, '1', 1,  8, 14, 22, 14, 29, 327),
(155, 28, 47, '2', 1, 18, 15,  1, 15, 18, 328),
(156, 28, 47, '3', 1,  5, 15, 19, 15, 23, NULL),
(157, 28, 47, '4', 1,  3, 16,  1, 16,  3, NULL),
(158, 28, 47, '5', 1,  5, 16,  4, 16,  8, NULL),
(159, 28, 47, '6', 1,  4, 16,  9, 16, 12, NULL),
(160, 28, 47, '7', 1,  5, 16, 13, 16, 17, 425),
(161, 28, 41, 'M', 1,  7, 28, 19, 28, 25, NULL),
-- Shavuot Day 1 (weekday: 5 aliyot from Yitro / Exodus 19-20 + M)
(162, 29, 17, '1', 0,  6, 19,  1, 19,  6, 116),
(163, 29, 17, '2', 0,  7, 19,  7, 19, 13, NULL),
(164, 29, 17, '3', 0,  6, 19, 14, 19, 19, NULL),
(165, 29, 17, '4', 0, 20, 19, 20, 20, 14, 118),
(166, 29, 17, '5', 0,  9, 20, 15, 20, 23, 119),
(167, 29, 41, 'M', 0,  6, 28, 26, 28, 31, NULL),
-- Shavuot Day 2 (weekday: 5 aliyot from Re''eh / Deuteronomy 15-16 + M)
(168, 30, 47, '1', 0,  5, 15, 19, 15, 23, NULL),
(169, 30, 47, '2', 0,  3, 16,  1, 16,  3, NULL),
(170, 30, 47, '3', 0,  5, 16,  4, 16,  8, NULL),
(171, 30, 47, '4', 0,  4, 16,  9, 16, 12, NULL),
(172, 30, 47, '5', 0,  5, 16, 13, 16, 17, 425),
(173, 30, 41, 'M', 0,  6, 28, 26, 28, 31, NULL),
-- Shavuot Day 2 Shabbat (7 aliyot + M)
(174, 31, 47, '1', 1,  8, 14, 22, 14, 29, 327),
(175, 31, 47, '2', 1, 18, 15,  1, 15, 18, 328),
(176, 31, 47, '3', 1,  5, 15, 19, 15, 23, NULL),
(177, 31, 47, '4', 1,  3, 16,  1, 16,  3, NULL),
(178, 31, 47, '5', 1,  5, 16,  4, 16,  8, NULL),
(179, 31, 47, '6', 1,  4, 16,  9, 16, 12, NULL),
(180, 31, 47, '7', 1,  5, 16, 13, 16, 17, 425),
(181, 31, 41, 'M', 1,  6, 28, 26, 28, 31, NULL),
-- Tisha B'Av (3 aliyot from Devarim 4)
(182, 32, 45, '1', 0,  5,  4, 25,  4, 29, NULL),
(183, 32, 45, '2', 0,  6,  4, 30,  4, 35, NULL),
(184, 32, 45, '3', 0,  5,  4, 36,  4, 40, NULL),
-- Rosh Chodesh (4 aliyot from Pinchas, Numbers 28:1-15)
(185, 33, 41, '1', 0,  3, 28,  1, 28,  3, NULL),
(186, 33, 41, '2', 0,  3, 28,  3, 28,  5, NULL),
(187, 33, 41, '3', 0,  5, 28,  6, 28, 10, NULL),
(188, 33, 41, '4', 0,  5, 28, 11, 28, 15, NULL),
-- Shabbat Shekalim (maftir only: Ki Tisa, Exodus 30:11-16)
(189, 34, 21, 'M', 0,  6, 30, 11, 30, 16, NULL),
-- Shabbat Zachor (maftir only: Ki Teitzei, Deut 25:17-19 = maftir of Ki Teitzei, id=427)
(190, 35, 49, 'M', 0,  3, 25, 17, 25, 19, 427),
-- Shabbat Parah (maftir only: Chukat, Numbers 19:1-22)
(191, 36, 39, 'M', 0, 22, 19,  1, 19, 22, NULL),
-- Shabbat HaChodesh (maftir only: Bo, Exodus 12:1-20)
(192, 37, 15, 'M', 0, 20, 12,  1, 12, 20, NULL);

--> statement-breakpoint
-- Custom SQL migration file, put your code below! --
-- Seed: weekday_aliyot (162 rows — 3 aliyot per parsha)
-- Source: @hebcal/leyning getLeyningForParsha(name_en).weekday
-- covers_aliyah_id: Shabbat aliyah that fully contains this weekday aliyah (NULL if spans boundary).
INSERT OR IGNORE INTO weekday_aliyot (id, parsha_id, aliyah_num, pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id) VALUES
(1, 1, 1, 5, 1, 1, 1, 5, 1),
(2, 1, 2, 3, 1, 6, 1, 8, 1),
(3, 1, 3, 5, 1, 9, 1, 13, 1),
(4, 2, 1, 8, 6, 9, 6, 16, 8),
(5, 2, 2, 3, 6, 17, 6, 19, 8),
(6, 2, 3, 3, 6, 20, 6, 22, 8),
(7, 3, 1, 3, 12, 1, 12, 3, 15),
(8, 3, 2, 6, 12, 4, 12, 9, 15),
(9, 3, 3, 4, 12, 10, 12, 13, 15),
(10, 4, 1, 5, 18, 1, 18, 5, 22),
(11, 4, 2, 3, 18, 6, 18, 8, 22),
(12, 4, 3, 6, 18, 9, 18, 14, 22),
(13, 5, 1, 7, 23, 1, 23, 7, 29),
(14, 5, 2, 5, 23, 8, 23, 12, 29),
(15, 5, 3, 4, 23, 13, 23, 16, 29),
(16, 6, 1, 4, 25, 19, 25, 22, 36),
(17, 6, 2, 4, 25, 23, 25, 26, 36),
(18, 6, 3, 13, 25, 27, 26, 5, 36),
(19, 7, 1, 3, 28, 10, 28, 12, 43),
(20, 7, 2, 5, 28, 13, 28, 17, 43),
(21, 7, 3, 5, 28, 18, 28, 22, 43),
(22, 8, 1, 3, 32, 4, 32, 6, 50),
(23, 8, 2, 3, 32, 7, 32, 9, 50),
(24, 8, 3, 4, 32, 10, 32, 13, 50),
(25, 9, 1, 3, 37, 1, 37, 3, 57),
(26, 9, 2, 4, 37, 4, 37, 7, 57),
(27, 9, 3, 4, 37, 8, 37, 11, 57),
(28, 10, 1, 4, 41, 1, 41, 4, 64),
(29, 10, 2, 3, 41, 5, 41, 7, 64),
(30, 10, 3, 7, 41, 8, 41, 14, 64),
(31, 11, 1, 3, 44, 18, 44, 20, 71),
(32, 11, 2, 4, 44, 21, 44, 24, 71),
(33, 11, 3, 6, 44, 25, 44, 30, 71),
(34, 12, 1, 4, 47, 28, 47, 31, 78),
(35, 12, 2, 3, 48, 1, 48, 3, 78),
(36, 12, 3, 6, 48, 4, 48, 9, 78),
(37, 13, 1, 7, 1, 1, 1, 7, 85),
(38, 13, 2, 5, 1, 8, 1, 12, 85),
(39, 13, 3, 5, 1, 13, 1, 17, 85),
(40, 14, 1, 4, 6, 2, 6, 5, 92),
(41, 14, 2, 4, 6, 6, 6, 9, 92),
(42, 14, 3, 4, 6, 10, 6, 13, 92),
(43, 15, 1, 3, 10, 1, 10, 3, 99),
(44, 15, 2, 3, 10, 4, 10, 6, 99),
(45, 15, 3, 5, 10, 7, 10, 11, 99),
(46, 16, 1, 6, 13, 17, 13, 22, 106),
(47, 16, 2, 4, 14, 1, 14, 4, 106),
(48, 16, 3, 4, 14, 5, 14, 8, 106),
(49, 17, 1, 4, 18, 1, 18, 4, 113),
(50, 17, 2, 4, 18, 5, 18, 8, 113),
(51, 17, 3, 4, 18, 9, 18, 12, 113),
(52, 18, 1, 6, 21, 1, 21, 6, 120),
(53, 18, 2, 5, 21, 7, 21, 11, 120),
(54, 18, 3, 8, 21, 12, 21, 19, 120),
(55, 19, 1, 5, 25, 1, 25, 5, 127),
(56, 19, 2, 4, 25, 6, 25, 9, 127),
(57, 19, 3, 7, 25, 10, 25, 16, 127),
(58, 20, 1, 7, 27, 20, 28, 5, 134),
(59, 20, 2, 4, 28, 6, 28, 9, 134),
(60, 20, 3, 3, 28, 10, 28, 12, 134),
(61, 21, 1, 3, 30, 11, 30, 13, 141),
(62, 21, 2, 3, 30, 14, 30, 16, 141),
(63, 21, 3, 5, 30, 17, 30, 21, 141),
(64, 22, 1, 3, 35, 1, 35, 3, 148),
(65, 22, 2, 7, 35, 4, 35, 10, 148),
(66, 22, 3, 10, 35, 11, 35, 20, 148),
(67, 23, 1, 3, 38, 21, 38, 23, 155),
(68, 23, 2, 4, 38, 24, 38, 27, 155),
(69, 23, 3, 5, 38, 28, 39, 1, 155),
(70, 24, 1, 4, 1, 1, 1, 4, 162),
(71, 24, 2, 5, 1, 5, 1, 9, 162),
(72, 24, 3, 4, 1, 10, 1, 13, 162),
(73, 25, 1, 3, 6, 1, 6, 3, 169),
(74, 25, 2, 3, 6, 4, 6, 6, 169),
(75, 25, 3, 5, 6, 7, 6, 11, 169),
(76, 26, 1, 6, 9, 1, 9, 6, 176),
(77, 26, 2, 4, 9, 7, 9, 10, 176),
(78, 26, 3, 6, 9, 11, 9, 16, 176),
(79, 27, 1, 4, 12, 1, 12, 4, 183),
(80, 27, 2, 4, 12, 5, 12, 8, 183),
(81, 27, 3, 5, 13, 1, 13, 5, 183),
(82, 28, 1, 5, 14, 1, 14, 5, 190),
(83, 28, 2, 4, 14, 6, 14, 9, 190),
(84, 28, 3, 3, 14, 10, 14, 12, 190),
(85, 29, 1, 6, 16, 1, 16, 6, 197),
(86, 29, 2, 5, 16, 7, 16, 11, 197),
(87, 29, 3, 6, 16, 12, 16, 17, 197),
(88, 30, 1, 4, 19, 1, 19, 4, 204),
(89, 30, 2, 6, 19, 5, 19, 10, 204),
(90, 30, 3, 4, 19, 11, 19, 14, 204),
(91, 31, 1, 6, 21, 1, 21, 6, 211),
(92, 31, 2, 6, 21, 7, 21, 12, 211),
(93, 31, 3, 3, 21, 13, 21, 15, 211),
(94, 32, 1, 3, 25, 1, 25, 3, 218),
(95, 32, 2, 4, 25, 4, 25, 7, 218),
(96, 32, 3, 6, 25, 8, 25, 13, 218),
(97, 33, 1, 3, 26, 3, 26, 5, 225),
(98, 33, 2, 4, 26, 6, 26, 9, 226),
(99, 33, 3, 4, 26, 10, 26, 13, 227),
(100, 34, 1, 4, 1, 1, 1, 4, 232),
(101, 34, 2, 12, 1, 5, 1, 16, 232),
(102, 34, 3, 3, 1, 17, 1, 19, 232),
(103, 35, 1, 4, 4, 21, 4, 24, 239),
(104, 35, 2, 4, 4, 25, 4, 28, 239),
(105, 35, 3, 5, 4, 29, 4, 33, 239),
(106, 36, 1, 4, 8, 1, 8, 4, 246),
(107, 36, 2, 5, 8, 5, 8, 9, 246),
(108, 36, 3, 5, 8, 10, 8, 14, 246),
(109, 37, 1, 3, 13, 1, 13, 3, 253),
(110, 37, 2, 13, 13, 4, 13, 16, 253),
(111, 37, 3, 4, 13, 17, 13, 20, 253),
(112, 38, 1, 3, 16, 1, 16, 3, 260),
(113, 38, 2, 4, 16, 4, 16, 7, 260),
(114, 38, 3, 6, 16, 8, 16, 13, 260),
(115, 39, 1, 6, 19, 1, 19, 6, 267),
(116, 39, 2, 3, 19, 7, 19, 9, 267),
(117, 39, 3, 8, 19, 10, 19, 17, 267),
(118, 40, 1, 3, 22, 2, 22, 4, 274),
(119, 40, 2, 3, 22, 5, 22, 7, 274),
(120, 40, 3, 5, 22, 8, 22, 12, 274),
(121, 41, 1, 3, 25, 10, 25, 12, 281),
(122, 41, 2, 3, 25, 13, 25, 15, 281),
(123, 41, 3, 8, 25, 16, 26, 4, 281),
(124, 42, 1, 8, 30, 2, 30, 9, 288),
(125, 42, 2, 4, 30, 10, 30, 13, 288),
(126, 42, 3, 4, 30, 14, 30, 17, 288),
(127, 43, 1, 3, 33, 1, 33, 3, 295),
(128, 43, 2, 3, 33, 4, 33, 6, 295),
(129, 43, 3, 4, 33, 7, 33, 10, 295),
(130, 44, 1, 3, 1, 1, 1, 3, 302),
(131, 44, 2, 4, 1, 4, 1, 7, 302),
(132, 44, 3, 4, 1, 8, 1, 11, NULL),
(133, 45, 1, 3, 3, 23, 3, 25, 309),
(134, 45, 2, 8, 3, 26, 4, 4, 309),
(135, 45, 3, 4, 4, 5, 4, 8, 310),
(136, 46, 1, 10, 7, 12, 7, 21, 316),
(137, 46, 2, 8, 7, 22, 8, 3, 316),
(138, 46, 3, 7, 8, 4, 8, 10, 316),
(139, 47, 1, 6, 11, 26, 11, 31, 323),
(140, 47, 2, 6, 11, 32, 12, 5, 323),
(141, 47, 3, 5, 12, 6, 12, 10, 323),
(142, 48, 1, 3, 16, 18, 16, 20, 330),
(143, 48, 2, 12, 16, 21, 17, 10, 330),
(144, 48, 3, 3, 17, 11, 17, 13, 330),
(145, 49, 1, 5, 21, 10, 21, 14, 337),
(146, 49, 2, 3, 21, 15, 21, 17, 337),
(147, 49, 3, 4, 21, 18, 21, 21, 337),
(148, 50, 1, 3, 26, 1, 26, 3, 344),
(149, 50, 2, 8, 26, 4, 26, 11, 344),
(150, 50, 3, 4, 26, 12, 26, 15, 345),
(151, 51, 1, 3, 29, 9, 29, 11, 351),
(152, 51, 2, 3, 29, 12, 29, 14, 352),
(153, 51, 3, 14, 29, 15, 29, 28, 353),
(154, 52, 1, 3, 31, 1, 31, 3, 358),
(155, 52, 2, 3, 31, 4, 31, 6, 359),
(156, 52, 3, 7, 31, 7, 31, 13, NULL),
(157, 53, 1, 3, 32, 1, 32, 3, 365),
(158, 53, 2, 3, 32, 4, 32, 6, 365),
(159, 53, 3, 6, 32, 7, 32, 12, 366),
(160, 54, 1, 7, 33, 1, 33, 7, 372),
(161, 54, 2, 5, 33, 8, 33, 12, 373),
(162, 54, 3, 5, 33, 13, 33, 17, 374);

--> statement-breakpoint
-- Custom SQL migration file, put your code below! --
-- Sukkot Shabbat Chol HaMoed and Pesach Shabbat Chol HaMoed are inherently Shabbat-only
-- readings (no weekday counterpart). Mark their aliyot as shabbat variants so they appear
-- in the Shabbat reading section of the holiday grid, not the weekday section.
UPDATE occasion_aliyot
SET is_shabbat_variant = 1
WHERE occasion_id IN (
  SELECT id FROM occasions
  WHERE name_en IN ('Sukkot Shabbat Chol HaMoed', 'Pesach Shabbat Chol HaMoed')
);

--> statement-breakpoint
INSERT INTO `torah_chapters` (`sefer_id`, `chapter`, `verse_count`) VALUES
  (1,1,31),(1,2,25),(1,3,24),(1,4,26),(1,5,32),(1,6,22),(1,7,24),(1,8,22),(1,9,29),(1,10,32),
  (1,11,32),(1,12,20),(1,13,18),(1,14,24),(1,15,21),(1,16,16),(1,17,27),(1,18,33),(1,19,38),(1,20,18),
  (1,21,34),(1,22,24),(1,23,20),(1,24,67),(1,25,34),(1,26,35),(1,27,46),(1,28,22),(1,29,35),(1,30,43),
  (1,31,54),(1,32,33),(1,33,20),(1,34,31),(1,35,29),(1,36,43),(1,37,36),(1,38,30),(1,39,23),(1,40,23),
  (1,41,57),(1,42,38),(1,43,34),(1,44,34),(1,45,28),(1,46,34),(1,47,31),(1,48,22),(1,49,33),(1,50,26),
  (2,1,22),(2,2,25),(2,3,22),(2,4,31),(2,5,23),(2,6,30),(2,7,29),(2,8,28),(2,9,35),(2,10,29),
  (2,11,10),(2,12,51),(2,13,22),(2,14,31),(2,15,27),(2,16,36),(2,17,16),(2,18,27),(2,19,25),(2,20,23),
  (2,21,37),(2,22,30),(2,23,33),(2,24,18),(2,25,40),(2,26,37),(2,27,21),(2,28,43),(2,29,46),(2,30,38),
  (2,31,18),(2,32,35),(2,33,23),(2,34,35),(2,35,35),(2,36,38),(2,37,29),(2,38,31),(2,39,43),(2,40,38),
  (3,1,17),(3,2,16),(3,3,17),(3,4,35),(3,5,26),(3,6,23),(3,7,38),(3,8,36),(3,9,24),(3,10,20),
  (3,11,47),(3,12,8),(3,13,59),(3,14,57),(3,15,33),(3,16,34),(3,17,16),(3,18,30),(3,19,37),(3,20,27),
  (3,21,24),(3,22,33),(3,23,44),(3,24,23),(3,25,55),(3,26,46),(3,27,34),
  (4,1,54),(4,2,34),(4,3,51),(4,4,49),(4,5,31),(4,6,27),(4,7,89),(4,8,26),(4,9,23),(4,10,36),
  (4,11,35),(4,12,16),(4,13,33),(4,14,45),(4,15,41),(4,16,35),(4,17,28),(4,18,32),(4,19,22),(4,20,29),
  (4,21,35),(4,22,41),(4,23,30),(4,24,25),(4,25,19),(4,26,65),(4,27,23),(4,28,31),(4,29,39),(4,30,17),
  (4,31,54),(4,32,42),(4,33,56),(4,34,29),(4,35,34),(4,36,13),
  (5,1,46),(5,2,37),(5,3,29),(5,4,49),(5,5,30),(5,6,25),(5,7,26),(5,8,20),(5,9,29),(5,10,22),
  (5,11,32),(5,12,31),(5,13,19),(5,14,29),(5,15,23),(5,16,22),(5,17,20),(5,18,22),(5,19,21),(5,20,20),
  (5,21,23),(5,22,29),(5,23,26),(5,24,22),(5,25,19),(5,26,19),(5,27,26),(5,28,69),(5,29,28),(5,30,20),
  (5,31,30),(5,32,52),(5,33,29),(5,34,12);
