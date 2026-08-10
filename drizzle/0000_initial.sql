CREATE TABLE `aliyot` (
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
	CONSTRAINT "aliyah_range" CHECK("aliyot"."aliyah" BETWEEN 1 AND 7),
	CONSTRAINT "pseukim_positive" CHECK("aliyot"."pseukim" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `aliyot_parsha_id_aliyah_unique` ON `aliyot` (`parsha_id`,`aliyah`);--> statement-breakpoint
CREATE TABLE `parsha_pairs` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_en` text NOT NULL,
	`parsha1_id` integer NOT NULL,
	`parsha2_id` integer NOT NULL,
	FOREIGN KEY (`parsha1_id`) REFERENCES `parshiot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parsha2_id`) REFERENCES `parshiot`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parsha_pairs_name_unique` ON `parsha_pairs` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `parsha_pairs_name_en_unique` ON `parsha_pairs` (`name_en`);--> statement-breakpoint
CREATE TABLE `parshiot` (
	`id` integer PRIMARY KEY NOT NULL,
	`sefer_id` integer NOT NULL,
	`name` text NOT NULL,
	`name_en` text NOT NULL,
	`sort_order` integer NOT NULL,
	`chapter_start` integer DEFAULT -1 NOT NULL,
	`verse_start` integer DEFAULT -1 NOT NULL,
	`chapter_end` integer DEFAULT -1 NOT NULL,
	`verse_end` integer DEFAULT -1 NOT NULL,
	FOREIGN KEY (`sefer_id`) REFERENCES `sefarim`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parshiot_name_unique` ON `parshiot` (`name`);--> statement-breakpoint
CREATE TABLE `readings` (
	`id` integer PRIMARY KEY NOT NULL,
	`aliyah_id` integer NOT NULL,
	`date_read` text NOT NULL,
	`occasion` text,
	`location` text,
	`reading_type` text DEFAULT 'standard' NOT NULL,
	`pair_id` integer,
	`created_at` text DEFAULT (date('now')) NOT NULL,
	FOREIGN KEY (`aliyah_id`) REFERENCES `aliyot`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pair_id`) REFERENCES `parsha_pairs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "reading_type_check" CHECK("readings"."reading_type" IN ('standard', 'double_parsha', 'additional'))
);
--> statement-breakpoint
CREATE INDEX `idx_readings_aliyah` ON `readings` (`aliyah_id`);--> statement-breakpoint
CREATE INDEX `idx_readings_date` ON `readings` (`date_read`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_readings_aliyah_date` ON `readings` (`aliyah_id`,`date_read`);--> statement-breakpoint
CREATE TABLE `sefarim` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_en` text NOT NULL,
	`color` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sefarim_name_unique` ON `sefarim` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `sefarim_sort_order_unique` ON `sefarim` (`sort_order`);--> statement-breakpoint
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