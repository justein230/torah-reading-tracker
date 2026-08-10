CREATE TABLE `torah_chapters` (
	`sefer_id` integer NOT NULL,
	`chapter` integer NOT NULL,
	`verse_count` integer NOT NULL,
	PRIMARY KEY(`sefer_id`, `chapter`),
	FOREIGN KEY (`sefer_id`) REFERENCES `sefarim`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP VIEW IF EXISTS `v_readings`;--> statement-breakpoint
DROP VIEW IF EXISTS `v_aliyot`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_parshiot` (
	`id` integer PRIMARY KEY NOT NULL,
	`sefer_id` integer NOT NULL,
	`name` text NOT NULL,
	`name_en` text NOT NULL,
	`sort_order` integer NOT NULL,
	`chapter_start` integer DEFAULT -1 NOT NULL,
	`verse_start` integer DEFAULT -1 NOT NULL,
	`chapter_end` integer DEFAULT -1 NOT NULL,
	`verse_end` integer DEFAULT -1 NOT NULL,
	FOREIGN KEY (`sefer_id`) REFERENCES `sefarim`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sefer_id`,`chapter_start`) REFERENCES `torah_chapters`(`sefer_id`,`chapter`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sefer_id`,`chapter_end`) REFERENCES `torah_chapters`(`sefer_id`,`chapter`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_parshiot`("id", "sefer_id", "name", "name_en", "sort_order", "chapter_start", "verse_start", "chapter_end", "verse_end") SELECT "id", "sefer_id", "name", "name_en", "sort_order", "chapter_start", "verse_start", "chapter_end", "verse_end" FROM `parshiot`;--> statement-breakpoint
DROP TABLE `parshiot`;--> statement-breakpoint
ALTER TABLE `__new_parshiot` RENAME TO `parshiot`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `parshiot_name_unique` ON `parshiot` (`name`);--> statement-breakpoint
ALTER TABLE `sefarim` DROP COLUMN `chapter_verses`;--> statement-breakpoint
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
;--> statement-breakpoint
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
;