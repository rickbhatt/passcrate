PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_passwords` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`username` text,
	`encrypted_password` text NOT NULL,
	`url` text,
	`notes` text,
	`crate_id` text,
	`expiry_days` integer,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`crate_id`) REFERENCES `crates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_passwords`("id", "title", "username", "encrypted_password", "url", "notes", "crate_id", "expiry_days", "expires_at", "created_at", "updated_at") SELECT "id", "title", "username", "encrypted_password", "url", "notes", "crate_id", "expiry_days", "expires_at", "created_at", "updated_at" FROM `passwords`;--> statement-breakpoint
DROP TABLE `passwords`;--> statement-breakpoint
ALTER TABLE `__new_passwords` RENAME TO `passwords`;--> statement-breakpoint
PRAGMA foreign_keys=ON;