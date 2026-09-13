ALTER TABLE `folders` RENAME TO `crates`;--> statement-breakpoint
ALTER TABLE `passwords` RENAME COLUMN `folder_id` TO `crate_id`;--> statement-breakpoint
DROP INDEX `folders_name_unique`;--> statement-breakpoint
DROP INDEX `folders_name_key_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `crates_name_unique` ON `crates` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `crates_name_key_unique` ON `crates` (`name_key`);
