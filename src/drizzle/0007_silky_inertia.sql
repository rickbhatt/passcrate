CREATE TABLE `backup_state` (
	`id` text PRIMARY KEY NOT NULL,
	`cloud_account_id` text NOT NULL,
	`drive_file_id` text,
	`backup_file_name` text,
	`backup_status` text DEFAULT 'idle' NOT NULL,
	`backup_size` integer,
	`last_backup_at` integer,
	`last_error` text,
	`auto_backup_enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`cloud_account_id`) REFERENCES `cloud_account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `backup_state_cloud_account_id_unique` ON `backup_state` (`cloud_account_id`);--> statement-breakpoint
CREATE TABLE `cloud_account` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`account_email` text NOT NULL,
	`connected_at` integer NOT NULL
);
