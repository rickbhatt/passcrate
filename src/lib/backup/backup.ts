import { BACKUP } from "@/constants/backup";
import { SECURE_KEYS } from "@/constants/secure-keys";
import { closeDb, getDbInstance, getDrizzleInstance } from "@/db/client";
import { changeMasterPassword } from "@/db/mutations/appConfig.mutation";
import {
  upsertBackupState,
  upsertCloudAccount,
} from "@/db/mutations/backup.mutations";
import { getAppConfig } from "@/db/queries/appConfig.queries";
import { getBackupState, hasVaultData } from "@/db/queries/backup.queries";
import * as schema from "@/db/schema";
import { appConfig, backupState } from "@/db/schema";
import { Db } from "@/db/types";
import migrations from "@/drizzle/migrations";
import {
  buildHeader,
  CURRENT_SCHEMA_VERSION,
  decodeBackupFile,
  encodeBackupFile,
} from "@/lib/backup/backup-file";
import {
  createBackupFile,
  downloadFileContent,
  DriveError,
  findBackupFile,
  uploadFileContent,
  type DriveFile,
} from "@/lib/backup/drive";
import {
  showBackupFailed,
  showBackupInProgress,
  showBackupSuccess,
} from "@/lib/backup/notifications";
import { applyMerge, planMerge, readVault } from "@/lib/backup/merge";
import {
  decrypt,
  decryptBytes,
  encryptBytes,
  getDerivedKey,
} from "@/lib/crypto";
import { getGoogleUser, isGoogleSignedIn } from "@/lib/google-auth";
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from "@/lib/secure-storage";
import { generateUUID } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { File, Paths } from "expo-file-system";
import { openDatabaseAsync } from "expo-sqlite";
import * as Updates from "expo-updates";
import { DevSettings } from "react-native";

export type BackupResult = { success: true } | { success: false; error: Error };

type PendingBackupSync = {
  driveFileId: string;
  backupFileName: string;
  backupSize: number;
  lastBackupAt: string;
  accountEmail: string;
  /** Passwords from this phone added to the restored vault. */
  keptPasswords: number;
};

export type RestoreSummary = { keptPasswords: number };

const SNAPSHOT_FILE_NAME = "passcrate-snapshot.db";
const RESTORED_FILE_NAME = "passcrate-restored.db";
const SQLITE_MAGIC = "SQLite format 3\0";

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

const toFileUri = (path: string) =>
  path.startsWith("file://") ? path : `file://${path}`;

const toFsPath = (uri: string) =>
  decodeURIComponent(uri.replace(/^file:\/\//, ""));

const deleteIfExists = (file: File) => {
  if (file.exists) file.delete();
};

/** Guards against uploading a backup that the vault key can't open. */
const assertKeyMatches = (passwordVerifier: string, key: string) => {
  let matches = false;
  try {
    matches = decrypt(passwordVerifier, key) === SECURE_KEYS.PASSWORD_VERIFIER;
  } catch {}
  if (!matches) throw new Error("Incorrect master password for this backup.");
};

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

/**
 * An atomic, consistent copy of the live DB. Unlike checkpoint + file copy,
 * `VACUUM INTO` can't miss a write that lands mid-copy.
 */
const createSnapshot = async (): Promise<File> => {
  const snapshot = new File(Paths.cache, SNAPSHOT_FILE_NAME);
  deleteIfExists(snapshot);

  const path = toFsPath(snapshot.uri).replace(/'/g, "''");
  await getDbInstance().execAsync(`VACUUM INTO '${path}';`);
  return snapshot;
};

/** Uploads to the known file, else the existing Drive file, else a new one. */
const uploadToDrive = async (
  knownFileId: string | null | undefined,
  bytes: Uint8Array,
): Promise<DriveFile> => {
  const resolveFileId = async () =>
    (await findBackupFile())?.id ?? (await createBackupFile());

  const fileId = knownFileId ?? (await resolveFileId());
  try {
    return await uploadFileContent(fileId, bytes);
  } catch (error) {
    // The file was deleted from Drive since the last backup.
    if (knownFileId && error instanceof DriveError && error.status === 404) {
      return uploadFileContent(await resolveFileId(), bytes);
    }
    throw error;
  }
};

let inFlightBackup: Promise<BackupResult> | null = null;

/**
 * Snapshots, encrypts and uploads the vault. Only one backup runs at a time;
 * a concurrent call joins the running one. Never throws.
 */
export const runBackup = ({
  db,
  key,
}: {
  db: Db;
  key: string;
}): Promise<BackupResult> => {
  if (inFlightBackup) return inFlightBackup;

  inFlightBackup = (async (): Promise<BackupResult> => {
    let snapshot: File | null = null;
    let isStateTracked = false;

    try {
      const user = await getGoogleUser();
      if (!user) throw new Error("Connect a Google account to back up.");

      upsertCloudAccount({ db, email: user.email });
      upsertBackupState({
        db,
        data: { backupStatus: "running", lastError: null },
      });
      isStateTracked = true;
      await showBackupInProgress();

      const config = await getAppConfig(db);
      if (!config) throw new Error("App config not found.");
      assertKeyMatches(config.passwordVerifier, key);

      snapshot = await createSnapshot();
      const encrypted = encodeBackupFile(
        buildHeader({
          salt: config.salt,
          passwordVerifier: config.passwordVerifier,
        }),
        encryptBytes(await snapshot.bytes(), key),
      );

      const uploaded = await uploadToDrive(
        getBackupState(db)?.driveFileId,
        encrypted,
      );

      upsertBackupState({
        db,
        data: {
          driveFileId: uploaded.id,
          backupFileName: uploaded.name,
          backupSize: uploaded.size,
          lastBackupAt: uploaded.modifiedTime,
          backupStatus: "success",
          lastError: null,
        },
      });
      await showBackupSuccess(uploaded.modifiedTime);

      return { success: true };
    } catch (error) {
      console.error("runBackup: FAILED", error);
      const err = toError(error);

      if (isStateTracked) {
        try {
          upsertBackupState({
            db,
            data: { backupStatus: "failed", lastError: err.message },
          });
        } catch {}
        await showBackupFailed();
      }

      return { success: false, error: err };
    } finally {
      if (snapshot) {
        try {
          deleteIfExists(snapshot);
        } catch {}
      }
      inFlightBackup = null;
    }
  })();

  return inFlightBackup;
};

/**
 * Called when the vault is unlocked (the key only exists then). Backs up if
 * a Google account is connected, auto backup is on, and either 24h passed
 * since the last backup or there has never been one and the vault has data.
 */
export const checkAndAutoBackup = async ({
  db,
  key,
}: {
  db: Db;
  key: string;
}) => {
  if (!isGoogleSignedIn()) return;

  const state = getBackupState(db);
  if (state && !state.autoBackupEnabled) return;

  if (state?.lastBackupAt) {
    const elapsed = Date.now() - state.lastBackupAt.getTime();
    if (elapsed < BACKUP.AUTO_BACKUP_INTERVAL_MS) return;
  } else if (!hasVaultData(db)) {
    return;
  }

  // Never silently overwrite a backup the user hasn't restored or skipped.
  if (await hasUnadoptedRemoteBackup(db)) return;

  await runBackup({ db, key });
};

// ---------------------------------------------------------------------------
// Restore
// ---------------------------------------------------------------------------

/** The backup file on the connected account's Drive, or `null`. */
export const findRemoteBackup = async (): Promise<DriveFile | null> => {
  const user = await getGoogleUser();
  if (!user) throw new Error("Connect a Google account first.");
  return findBackupFile();
};

/**
 * True when Drive holds a backup this device has never backed up to, e.g.
 * one from an old phone. Backing up now would replace it, so the user must
 * restore or explicitly skip it first.
 */
export const hasUnadoptedRemoteBackup = async (db: Db) => {
  if (getBackupState(db)?.driveFileId) return false;
  return (await findBackupFile()) !== null;
};

/**
 * Skipping a restore: this device takes over the Drive file, so the next
 * backup replaces it (the "can't restore later" the user agreed to).
 */
export const adoptRemoteBackup = (db: Db, fileId: string) => {
  upsertBackupState({ db, data: { driveFileId: fileId } });
};

export const restartApp = async () => {
  if (__DEV__) {
    DevSettings.reload();
    return;
  }
  try {
    await Updates.reloadAsync();
  } catch (error) {
    console.error("restartApp: reloadAsync FAILED", error);
    DevSettings.reload();
  }
};

/** Thrown when the live DB was already closed, so the app must restart. */
export class RestoreFailedAfterCloseError extends Error {}

/**
 * Prepares the downloaded vault in place of the live one:
 * - migrates it, so an older backup has this build's columns,
 * - re-encrypts it with this phone's key, so the phone's master password
 *   (and fingerprint unlock) keep working after the restore,
 * - merges in this phone's crates, tags and passwords, so nothing added
 *   before restoring is lost.
 * Only touches the downloaded copy; the live DB is just read.
 */
const prepareRestoredVault = async ({
  backupKey,
  currentKey,
}: {
  backupKey: string;
  currentKey: string;
}) => {
  const liveDb = getDrizzleInstance();
  const liveConfig = await getAppConfig(liveDb);
  if (!liveConfig) throw new Error("App config not found.");
  assertKeyMatches(liveConfig.passwordVerifier, currentKey);

  const restoredSqlite = await openDatabaseAsync(
    RESTORED_FILE_NAME,
    {},
    toFsPath(Paths.cache.uri),
  );

  try {
    const restoredDb: Db = drizzle(restoredSqlite, { schema });
    await migrate(restoredDb, migrations);

    changeMasterPassword({
      db: restoredDb,
      oldKey: backupKey,
      newKey: currentKey,
      newSalt: liveConfig.salt,
    });
    restoredDb
      .update(appConfig)
      .set({ biometricEnabled: liveConfig.biometricEnabled })
      .run();

    const plan = planMerge({
      local: readVault(liveDb),
      restored: readVault(restoredDb),
      decryptPassword: (cipherText) => decrypt(cipherText, currentKey),
      newId: generateUUID,
    });
    applyMerge(restoredDb, plan);

    // Fold any WAL back in, so the single file is the whole vault.
    await restoredSqlite.execAsync("PRAGMA journal_mode = DELETE;");

    return { keptPasswords: plan.added };
  } finally {
    await restoredSqlite.closeAsync();
  }
};

/**
 * Restores the backup into the vault on this phone, then restarts the app.
 * Everything that can fail on bad input (password, schema, decryption,
 * merge) happens on a downloaded copy before the live DB is touched.
 */
export const restoreBackup = async ({
  file,
  masterPassword,
  currentKey,
}: {
  file: DriveFile;
  masterPassword: string;
  currentKey: string;
}) => {
  const user = await getGoogleUser();
  if (!user) throw new Error("Connect a Google account first.");

  const { header, payload } = decodeBackupFile(
    await downloadFileContent(file.id),
  );

  if (header.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      "This backup was made by a newer version of PassCrate. Update the app to restore it.",
    );
  }

  const backupKey = await getDerivedKey({ masterPassword, salt: header.salt });
  assertKeyMatches(header.passwordVerifier, backupKey);

  const plain = decryptBytes(payload, backupKey);
  if (String.fromCharCode(...plain.subarray(0, 16)) !== SQLITE_MAGIC) {
    throw new Error("The backup is corrupted.");
  }

  const cacheDir = Paths.cache.uri;
  const restored = new File(Paths.cache, RESTORED_FILE_NAME);
  const restoredSidecars = ["-wal", "-shm", "-journal"].map(
    (suffix) => new File(`${cacheDir}${RESTORED_FILE_NAME}${suffix}`),
  );
  const cleanRestored = () =>
    [restored, ...restoredSidecars].forEach(deleteIfExists);

  cleanRestored();
  restored.write(plain);

  let summary: RestoreSummary;
  try {
    summary = await prepareRestoredVault({ backupKey, currentKey });
  } catch (error) {
    cleanRestored();
    throw error;
  }
  restoredSidecars.forEach(deleteIfExists);

  // The restored DB's own backup_state predates this backup, so record the
  // backup that was actually restored for the next launch to apply.
  await setSecureItem<PendingBackupSync>(SECURE_KEYS.PENDING_BACKUP_SYNC, {
    driveFileId: file.id,
    backupFileName: file.name,
    backupSize: file.size,
    lastBackupAt: file.modifiedTime.toISOString(),
    accountEmail: user.email,
    keptPasswords: summary.keptPasswords,
  });

  const livePath = toFileUri(getDbInstance().databasePath);
  const liveDb = new File(livePath);
  const oldDb = new File(`${livePath}.old`);

  try {
    await closeDb();
    deleteIfExists(new File(`${livePath}-wal`));
    deleteIfExists(new File(`${livePath}-shm`));
    deleteIfExists(oldDb);
    if (liveDb.exists) {
      liveDb.copySync(oldDb);
      liveDb.delete();
    }
    restored.moveSync(new File(livePath));
    deleteIfExists(oldDb);
  } catch (error) {
    console.error("restoreBackup: FAILED after close", error);
    try {
      deleteIfExists(restored);
      // `.old` only survives a swap that didn't finish: put it back.
      if (oldDb.exists) oldDb.moveSync(new File(livePath), { overwrite: true });
      await deleteSecureItem(SECURE_KEYS.PENDING_BACKUP_SYNC);
    } catch (rollbackError) {
      console.error("restoreBackup: rollback FAILED", rollbackError);
    }
    throw new RestoreFailedAfterCloseError(
      "Restore failed. PassCrate will restart.",
    );
  }

  await restartApp();
};

/**
 * Runs at boot, after migrations. Applies the metadata of a just-restored
 * backup; returns a summary to show once unlocked, or `null`.
 */
export const syncPendingRestoreState = async (
  db: Db,
): Promise<RestoreSummary | null> => {
  // A backup interrupted by the app being killed would show as running forever.
  db.update(backupState)
    .set({ backupStatus: "failed", lastError: "Backup was interrupted." })
    .where(eq(backupState.backupStatus, "running"))
    .run();

  const pending = await getSecureItem<PendingBackupSync>(
    SECURE_KEYS.PENDING_BACKUP_SYNC,
  );
  if (!pending) return null;

  upsertCloudAccount({ db, email: pending.accountEmail });
  upsertBackupState({
    db,
    data: {
      driveFileId: pending.driveFileId,
      backupFileName: pending.backupFileName,
      backupSize: pending.backupSize,
      lastBackupAt: new Date(pending.lastBackupAt),
      backupStatus: "success",
      lastError: null,
    },
  });

  await deleteSecureItem(SECURE_KEYS.PENDING_BACKUP_SYNC);
  return { keptPasswords: pending.keptPasswords ?? 0 };
};
