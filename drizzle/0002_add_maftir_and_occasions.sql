CREATE TABLE `occasion_aliyot` (
	`id` integer PRIMARY KEY NOT NULL,
	`occasion_id` integer NOT NULL,
	`parsha_id` integer NOT NULL,
	`aliyah_key` text NOT NULL,
	`is_shabbat_variant` integer DEFAULT false NOT NULL,
	`pseukim` integer NOT NULL,
	`chapter_start` integer DEFAULT -1 NOT NULL,
	`verse_start` integer DEFAULT -1 NOT NULL,
	`chapter_end` integer DEFAULT -1 NOT NULL,
	`verse_end` integer DEFAULT -1 NOT NULL,
	`covers_aliyah_id` integer,
	FOREIGN KEY (`occasion_id`) REFERENCES `occasions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parsha_id`) REFERENCES `parshiot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`covers_aliyah_id`) REFERENCES `aliyot`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "oa_pseukim_positive" CHECK("occasion_aliyot"."pseukim" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `occasion_aliyot_occasion_id_aliyah_key_is_shabbat_variant_unique` ON `occasion_aliyot` (`occasion_id`,`aliyah_key`,`is_shabbat_variant`);--> statement-breakpoint
CREATE TABLE `occasions` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_en` text NOT NULL,
	`category` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `occasions_name_unique` ON `occasions` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `occasions_name_en_unique` ON `occasions` (`name_en`);--> statement-breakpoint
CREATE TABLE `special_readings` (
	`id` integer PRIMARY KEY NOT NULL,
	`occasion_aliyah_id` integer NOT NULL,
	`date_read` text NOT NULL,
	`note` text,
	`location` text,
	`created_at` text DEFAULT (date('now')) NOT NULL,
	FOREIGN KEY (`occasion_aliyah_id`) REFERENCES `occasion_aliyot`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_special_readings_date` ON `special_readings` (`date_read`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_special_readings_aliyah_date` ON `special_readings` (`occasion_aliyah_id`,`date_read`);--> statement-breakpoint
-- Drop views that depend on aliyot before the table recreation
DROP VIEW IF EXISTS `v_readings`;
--> statement-breakpoint
DROP VIEW IF EXISTS `v_aliyot`;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_aliyot` (
	`id` integer PRIMARY KEY NOT NULL,
	`parsha_id` integer NOT NULL,
	`aliyah` integer NOT NULL,
	`pair_id` integer,
	`combined_aliyah` integer,
	`pseukim` integer NOT NULL,
	`chapter_start` integer DEFAULT -1 NOT NULL,
	`verse_start` integer DEFAULT -1 NOT NULL,
	`chapter_end` integer DEFAULT -1 NOT NULL,
	`verse_end` integer DEFAULT -1 NOT NULL,
	FOREIGN KEY (`parsha_id`) REFERENCES `parshiot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pair_id`) REFERENCES `parsha_pairs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "aliyah_range" CHECK("__new_aliyot"."aliyah" BETWEEN 1 AND 8),
	CONSTRAINT "pseukim_positive" CHECK("__new_aliyot"."pseukim" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_aliyot`("id", "parsha_id", "aliyah", "pair_id", "combined_aliyah", "pseukim", "chapter_start", "verse_start", "chapter_end", "verse_end") SELECT "id", "parsha_id", "aliyah", "pair_id", "combined_aliyah", "pseukim", "chapter_start", "verse_start", "chapter_end", "verse_end" FROM `aliyot`;--> statement-breakpoint
DROP TABLE `aliyot`;--> statement-breakpoint
ALTER TABLE `__new_aliyot` RENAME TO `aliyot`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `aliyot_parsha_id_aliyah_unique` ON `aliyot` (`parsha_id`,`aliyah`);
--> statement-breakpoint
-- Recreate views that were dropped before the aliyot table recreation
CREATE VIEW `v_aliyot` AS
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
    ROUND(CAST(a.pseukim AS REAL) / (SELECT SUM(pseukim) FROM aliyot) * 100, 6) AS pct
  FROM aliyot a
  JOIN parshiot    p  ON p.id  = a.parsha_id
  JOIN sefarim     s  ON s.id  = p.sefer_id
  LEFT JOIN parsha_pairs pp ON pp.id = a.pair_id
;
--> statement-breakpoint
CREATE VIEW `v_readings` AS
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
;--> statement-breakpoint
-- Maftir rows (aliyah = 8) for the 53 parshiyot that have a standard maftir.
-- Source: @hebcal/leyning getLeyningForParsha(name_en).fullkriyah['M']
-- Vezot Haberakhah (parsha_id=54) has no standard Shabbat maftir; its maftir is
-- Bereshit on Simchat Torah, which is tracked through the occasions table.
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
