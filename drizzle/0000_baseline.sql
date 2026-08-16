CREATE TABLE `admin_password` (
	`id` integer PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
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
	CONSTRAINT "aliyah_range" CHECK("aliyot"."aliyah" BETWEEN 1 AND 8),
	CONSTRAINT "pseukim_positive" CHECK("aliyot"."pseukim" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `aliyot_parsha_id_aliyah_unique` ON `aliyot` (`parsha_id`,`aliyah`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` integer PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_token_hash_unique` ON `auth_sessions` (`token_hash`);--> statement-breakpoint
CREATE TABLE `hosafot_readings` (
	`id` integer PRIMARY KEY NOT NULL,
	`sefer` text NOT NULL,
	`parsha_id_1` integer,
	`parsha_id_2` integer,
	`occasion_id` integer,
	`is_double_parsha` integer DEFAULT 0 NOT NULL,
	`chapter_start` integer NOT NULL,
	`verse_start` integer NOT NULL,
	`chapter_end` integer NOT NULL,
	`verse_end` integer NOT NULL,
	`pseukim` integer NOT NULL,
	`date_read` text NOT NULL,
	`note` text,
	`location` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`parsha_id_1`) REFERENCES `parshiot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parsha_id_2`) REFERENCES `parshiot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`occasion_id`) REFERENCES `occasions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
	FOREIGN KEY (`sefer_id`) REFERENCES `sefarim`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sefer_id`,`chapter_start`) REFERENCES `torah_chapters`(`sefer_id`,`chapter`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sefer_id`,`chapter_end`) REFERENCES `torah_chapters`(`sefer_id`,`chapter`) ON UPDATE no action ON DELETE no action
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
CREATE TABLE `torah_chapters` (
	`sefer_id` integer NOT NULL,
	`chapter` integer NOT NULL,
	`verse_count` integer NOT NULL,
	PRIMARY KEY(`sefer_id`, `chapter`),
	FOREIGN KEY (`sefer_id`) REFERENCES `sefarim`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `weekday_aliyot` (
	`id` integer PRIMARY KEY NOT NULL,
	`parsha_id` integer NOT NULL,
	`aliyah_num` integer NOT NULL,
	`pseukim` integer NOT NULL,
	`chapter_start` integer NOT NULL,
	`verse_start` integer NOT NULL,
	`chapter_end` integer NOT NULL,
	`verse_end` integer NOT NULL,
	`covers_aliyah_id` integer,
	FOREIGN KEY (`parsha_id`) REFERENCES `parshiot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`covers_aliyah_id`) REFERENCES `aliyot`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "weekday_aliyah_num" CHECK("weekday_aliyot"."aliyah_num" BETWEEN 1 AND 3),
	CONSTRAINT "weekday_pseukim_positive" CHECK("weekday_aliyot"."pseukim" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weekday_aliyot_parsha_id_aliyah_num_unique` ON `weekday_aliyot` (`parsha_id`,`aliyah_num`);--> statement-breakpoint
CREATE TABLE `weekday_readings` (
	`id` integer PRIMARY KEY NOT NULL,
	`weekday_aliyah_id` integer NOT NULL,
	`date_read` text NOT NULL,
	`note` text,
	`location` text,
	`created_at` text DEFAULT (date('now')) NOT NULL,
	FOREIGN KEY (`weekday_aliyah_id`) REFERENCES `weekday_aliyot`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weekday_readings_weekday_aliyah_id_unique` ON `weekday_readings` (`weekday_aliyah_id`);--> statement-breakpoint
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
    ROUND(CAST(a.pseukim AS REAL) / (SELECT SUM(pseukim) FROM aliyot WHERE aliyah != 8) * 100, 6) AS pct
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