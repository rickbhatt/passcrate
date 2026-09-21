ALTER TABLE `passwords` ADD `is_favourite` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `passwords` ADD `access_count` integer DEFAULT 0 NOT NULL;