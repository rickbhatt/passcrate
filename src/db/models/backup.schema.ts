import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// CLOUD ACCOUNT — the Google account backups are uploaded to (single row)
export const cloudAccount = sqliteTable("cloud_account", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  accountEmail: text("account_email").notNull(),
  connectedAt: integer("connected_at", { mode: "timestamp" }).notNull(),
});

// BACKUP STATE — the latest backup on the connected account (single row)
export const backupState = sqliteTable("backup_state", {
  id: text("id").primaryKey(),
  cloudAccountId: text("cloud_account_id")
    .notNull()
    .unique()
    .references(() => cloudAccount.id, { onDelete: "cascade" }),
  driveFileId: text("drive_file_id"),
  backupFileName: text("backup_file_name"),
  backupStatus: text("backup_status", {
    enum: ["idle", "running", "success", "failed"],
  })
    .notNull()
    .default("idle"),
  backupSize: integer("backup_size"),
  lastBackupAt: integer("last_backup_at", { mode: "timestamp" }),
  lastError: text("last_error"),
  autoBackupEnabled: integer("auto_backup_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
});
