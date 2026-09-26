export const BACKUP = {
  CLOUD_ACCOUNT_ID: "gdrive",
  PROVIDER: "google_drive",
  STATE_ID: "gdrive_backup",
  /** The single backup file kept in the Drive appDataFolder. */
  FILE_NAME: "passcrate_backup.pcb",
  AUTO_BACKUP_INTERVAL_MS: 24 * 60 * 60 * 1000,
  CHANNEL_ID: "backup",
  NOTIFICATION_ID: "gdrive-backup-progress",
  DRIVE_BASE_URL: "https://www.googleapis.com",
} as const;
