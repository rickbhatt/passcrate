import { BACKUP } from "@/constants/backup";
import { backupState, cloudAccount } from "@/db/schema";
import { Db } from "@/db/types";
import { eq } from "drizzle-orm";

type BackupStateValues = Partial<
  Omit<typeof backupState.$inferInsert, "id" | "cloudAccountId">
>;

/**
 * Records the connected Google account. Connecting a different account
 * drops the old account's backup state (cascade): its Drive file id and
 * last-backup time don't apply to the new account's Drive.
 */
const upsertCloudAccount = ({ db, email }: { db: Db; email: string }) => {
  db.transaction((tx) => {
    const [existing] = tx
      .select()
      .from(cloudAccount)
      .where(eq(cloudAccount.id, BACKUP.CLOUD_ACCOUNT_ID))
      .all();

    if (existing && existing.accountEmail !== email) {
      tx.delete(cloudAccount)
        .where(eq(cloudAccount.id, BACKUP.CLOUD_ACCOUNT_ID))
        .run();
    }

    tx.insert(cloudAccount)
      .values({
        id: BACKUP.CLOUD_ACCOUNT_ID,
        provider: BACKUP.PROVIDER,
        accountEmail: email,
        connectedAt: new Date(),
      })
      .onConflictDoNothing()
      .run();
  });
};

/** Removes the account and, via cascade, its backup state. */
const deleteCloudAccount = (db: Db) => {
  db.delete(cloudAccount)
    .where(eq(cloudAccount.id, BACKUP.CLOUD_ACCOUNT_ID))
    .run();
};

/**
 * Upserts the single backup_state row. Needs the cloud_account row to exist
 * (FK); callers only run backups for a connected account, which creates it.
 */
const upsertBackupState = ({
  db,
  data,
}: {
  db: Db;
  data: BackupStateValues;
}) => {
  db.insert(backupState)
    .values({
      id: BACKUP.STATE_ID,
      cloudAccountId: BACKUP.CLOUD_ACCOUNT_ID,
      ...data,
    })
    .onConflictDoUpdate({ target: backupState.id, set: data })
    .run();
};

export { deleteCloudAccount, upsertBackupState, upsertCloudAccount };
