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
CREATE UNIQUE INDEX `weekday_readings_weekday_aliyah_id_unique` ON `weekday_readings` (`weekday_aliyah_id`);