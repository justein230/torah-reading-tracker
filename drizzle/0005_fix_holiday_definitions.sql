-- Custom SQL migration file, put your code below! --
-- Fix: verse ranges and aliyah structure of existing holiday occasions that did not match
-- hebcal.com's /leyning fullkriyah breakdown (Diaspora, 2016-2036, cached in .cache/hebcal-audit/).
-- Rows are updated in place (ids preserved) so any special_readings that reference them survive.
--
-- Purim: was Exodus 17:8-25 in Bechukotai (Exodus 17 only has 16 verses); really three aliyot
-- from Beshalach, Exodus 17:8-16.
-- Columns updated below: (parsha_id, aliyah_key, pseukim, chapter_start, verse_start, chapter_end, verse_end)
UPDATE occasion_aliyot SET parsha_id = 16, aliyah_key = '1', pseukim = 3, chapter_start = 17, verse_start =  8, chapter_end = 17, verse_end = 10 WHERE id = 103;
--> statement-breakpoint
UPDATE occasion_aliyot SET parsha_id = 16, aliyah_key = '2', pseukim = 3, chapter_start = 17, verse_start = 11, chapter_end = 17, verse_end = 13 WHERE id = 104;
--> statement-breakpoint
UPDATE occasion_aliyot SET parsha_id = 16, aliyah_key = '3', pseukim = 3, chapter_start = 17, verse_start = 14, chapter_end = 17, verse_end = 16 WHERE id = 105;
--> statement-breakpoint
-- Simchat Torah: Deuteronomy 34 ends at verse 12 (aliyah 6 was 34:13-38 nonsense), and the
-- seventh aliyah, Genesis 1:1-2:3 (Bereshit), was missing.
UPDATE occasion_aliyot SET pseukim =  7, chapter_start = 33, verse_start =  1, chapter_end = 33, verse_end =  7 WHERE id = 64;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim =  5, chapter_start = 33, verse_start =  8, chapter_end = 33, verse_end = 12 WHERE id = 65;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim =  5, chapter_start = 33, verse_start = 13, chapter_end = 33, verse_end = 17 WHERE id = 66;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim =  4, chapter_start = 33, verse_start = 18, chapter_end = 33, verse_end = 21 WHERE id = 67;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim =  5, chapter_start = 33, verse_start = 22, chapter_end = 33, verse_end = 26 WHERE id = 68;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 15, chapter_start = 33, verse_start = 27, chapter_end = 34, verse_end = 12 WHERE id = 69;
--> statement-breakpoint
-- Simchat Torah (Shabbat) cannot occur in the Diaspora (23 Tishrei is never Shabbat) and no
-- special_readings reference it.
DELETE FROM occasion_aliyot WHERE occasion_id = 11;
--> statement-breakpoint
DELETE FROM occasions WHERE id = 11;
--> statement-breakpoint
-- Sukkot Day 1 (Shabbat): Leviticus 22 ends at verse 33.
UPDATE occasion_aliyot SET pseukim =  8, chapter_start = 22, verse_start = 26, chapter_end = 22, verse_end = 33 WHERE id = 42;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim =  3, chapter_start = 23, verse_start =  1, chapter_end = 23, verse_end =  3 WHERE id = 43;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim =  5, chapter_start = 23, verse_start =  4, chapter_end = 23, verse_end =  8 WHERE id = 44;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim =  6, chapter_start = 23, verse_start =  9, chapter_end = 23, verse_end = 14 WHERE id = 45;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim =  8, chapter_start = 23, verse_start = 15, chapter_end = 23, verse_end = 22 WHERE id = 46;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 10, chapter_start = 23, verse_start = 23, chapter_end = 23, verse_end = 32 WHERE id = 47;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 12, chapter_start = 23, verse_start = 33, chapter_end = 23, verse_end = 44 WHERE id = 48;
--> statement-breakpoint
-- Pesach Day 1 (Shabbat): aliyah 6 repeated earlier verses and 12:43-47 was missing.
UPDATE occasion_aliyot SET pseukim = 4, chapter_start = 12, verse_start = 21, chapter_end = 12, verse_end = 24 WHERE id = 112;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 4, chapter_start = 12, verse_start = 25, chapter_end = 12, verse_end = 28 WHERE id = 113;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 4, chapter_start = 12, verse_start = 29, chapter_end = 12, verse_end = 32 WHERE id = 114;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 4, chapter_start = 12, verse_start = 33, chapter_end = 12, verse_end = 36 WHERE id = 115;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 6, chapter_start = 12, verse_start = 37, chapter_end = 12, verse_end = 42 WHERE id = 116;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 5, chapter_start = 12, verse_start = 43, chapter_end = 12, verse_end = 47 WHERE id = 117;
--> statement-breakpoint
-- Chanukah Days 1-8: a weekday reading is 3 aliyot with no maftir (the third aliyah previews the
-- next day's reading). Rows keep their ids: the old 'M' row becomes aliyah '3'.
-- Day 1
UPDATE occasion_aliyot SET pseukim = 11, chapter_start = 7, verse_start =  1, chapter_end = 7, verse_end = 11 WHERE id = 79;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim =  3, chapter_start = 7, verse_start = 12, chapter_end = 7, verse_end = 14 WHERE id = 80;
--> statement-breakpoint
UPDATE occasion_aliyot SET aliyah_key = '3', pseukim = 3, chapter_start = 7, verse_start = 15, chapter_end = 7, verse_end = 17 WHERE id = 81;
--> statement-breakpoint
-- Day 2
UPDATE occasion_aliyot SET pseukim = 3, chapter_start = 7, verse_start = 18, chapter_end = 7, verse_end = 20 WHERE id = 82;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 3, chapter_start = 7, verse_start = 21, chapter_end = 7, verse_end = 23 WHERE id = 83;
--> statement-breakpoint
UPDATE occasion_aliyot SET aliyah_key = '3', pseukim = 6, chapter_start = 7, verse_start = 24, chapter_end = 7, verse_end = 29 WHERE id = 84;
--> statement-breakpoint
-- Day 3
UPDATE occasion_aliyot SET pseukim = 3, chapter_start = 7, verse_start = 24, chapter_end = 7, verse_end = 26 WHERE id = 85;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 3, chapter_start = 7, verse_start = 27, chapter_end = 7, verse_end = 29 WHERE id = 86;
--> statement-breakpoint
UPDATE occasion_aliyot SET aliyah_key = '3', pseukim = 6, chapter_start = 7, verse_start = 30, chapter_end = 7, verse_end = 35 WHERE id = 87;
--> statement-breakpoint
-- Day 4
UPDATE occasion_aliyot SET pseukim = 3, chapter_start = 7, verse_start = 30, chapter_end = 7, verse_end = 32 WHERE id = 88;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 3, chapter_start = 7, verse_start = 33, chapter_end = 7, verse_end = 35 WHERE id = 89;
--> statement-breakpoint
UPDATE occasion_aliyot SET aliyah_key = '3', pseukim = 6, chapter_start = 7, verse_start = 36, chapter_end = 7, verse_end = 41 WHERE id = 90;
--> statement-breakpoint
-- Day 5
UPDATE occasion_aliyot SET pseukim = 3, chapter_start = 7, verse_start = 36, chapter_end = 7, verse_end = 38 WHERE id = 91;
--> statement-breakpoint
UPDATE occasion_aliyot SET pseukim = 3, chapter_start = 7, verse_start = 39, chapter_end = 7, verse_end = 41 WHERE id = 92;
--> statement-breakpoint
UPDATE occasion_aliyot SET aliyah_key = '3', pseukim = 6, chapter_start = 7, verse_start = 42, chapter_end = 7, verse_end = 47 WHERE id = 93;
--> statement-breakpoint
-- Day 6 is always Rosh Chodesh (30 Kislev or 1 Tevet): the three Rosh Chodesh aliyot
-- (Numbers 28:1-15, Pinchas) then the Chanukah day-6 aliyah (Numbers 7:42-47, Nasso).
UPDATE occasion_aliyot SET parsha_id = 41, pseukim = 5, chapter_start = 28, verse_start =  1, chapter_end = 28, verse_end =  5 WHERE id = 94;
--> statement-breakpoint
UPDATE occasion_aliyot SET parsha_id = 41, pseukim = 5, chapter_start = 28, verse_start =  6, chapter_end = 28, verse_end = 10 WHERE id = 95;
--> statement-breakpoint
UPDATE occasion_aliyot SET parsha_id = 41, aliyah_key = '3', pseukim = 5, chapter_start = 28, verse_start = 11, chapter_end = 28, verse_end = 15 WHERE id = 96;
--> statement-breakpoint
INSERT INTO occasion_aliyot (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant, pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id) VALUES
(273, 17, 35, '4', 0, 6, 7, 42, 7, 47, NULL);
--> statement-breakpoint
-- Day 7 (when it is not Rosh Chodesh)
UPDATE occasion_aliyot SET parsha_id = 35, pseukim = 3, chapter_start = 7, verse_start = 48, chapter_end = 7, verse_end = 50 WHERE id = 97;
--> statement-breakpoint
UPDATE occasion_aliyot SET parsha_id = 35, pseukim = 3, chapter_start = 7, verse_start = 51, chapter_end = 7, verse_end = 53 WHERE id = 98;
--> statement-breakpoint
UPDATE occasion_aliyot SET parsha_id = 35, aliyah_key = '3', pseukim = 6, chapter_start = 7, verse_start = 54, chapter_end = 7, verse_end = 59 WHERE id = 99;
--> statement-breakpoint
-- Day 8: Numbers 7:54-8:4 (the last aliyah crosses from Nasso into Beha'alotcha; filed under Nasso)
UPDATE occasion_aliyot SET parsha_id = 35, pseukim =  3, chapter_start = 7, verse_start = 54, chapter_end = 7, verse_end = 56 WHERE id = 100;
--> statement-breakpoint
UPDATE occasion_aliyot SET parsha_id = 35, pseukim =  3, chapter_start = 7, verse_start = 57, chapter_end = 7, verse_end = 59 WHERE id = 101;
--> statement-breakpoint
UPDATE occasion_aliyot SET parsha_id = 35, aliyah_key = '3', pseukim = 34, chapter_start = 7, verse_start = 60, chapter_end = 8, verse_end = 4 WHERE id = 102;
--> statement-breakpoint
-- Simchat Torah's seventh aliyah: Genesis 1:1-2:3 (Bereshit)
INSERT INTO occasion_aliyot (id, occasion_id, parsha_id, aliyah_key, is_shabbat_variant, pseukim, chapter_start, verse_start, chapter_end, verse_end, covers_aliyah_id) VALUES
(274, 10, 1, '7', 0, 34, 1, 1, 2, 3, NULL);
--> statement-breakpoint
-- covers_aliyah_id is set where a range exactly matches a standard aliyah (0001 convention);
-- recompute it for every row whose range was touched above.
UPDATE occasion_aliyot SET covers_aliyah_id = (
  SELECT a.id FROM aliyot a
  WHERE a.parsha_id = occasion_aliyot.parsha_id
    AND a.chapter_start = occasion_aliyot.chapter_start AND a.verse_start = occasion_aliyot.verse_start
    AND a.chapter_end   = occasion_aliyot.chapter_end   AND a.verse_end   = occasion_aliyot.verse_end
  ORDER BY a.aliyah LIMIT 1
) WHERE occasion_id IN (7, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22);
