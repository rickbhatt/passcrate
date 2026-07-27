ALTER TABLE `folders` ADD `name_key` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `folders_name_key_unique` ON `folders` (`name_key`);