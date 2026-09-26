import { BACKUP } from "@/constants/backup";
import { backupState, cloudAccount, passwords } from "@/db/schema";
import { Db } from "@/db/types";
import { eq } from "drizzle-orm";

const backupStateQuery = (db: Db) => {
  return db
    .select()
    .from(backupState)
    .where(eq(backupState.id, BACKUP.STATE_ID))
    .limit(1);
};

const cloudAccountQuery = (db: Db) => {
  return db
    .select()
    .from(cloudAccount)
    .where(eq(cloudAccount.id, BACKUP.CLOUD_ACCOUNT_ID))
    .limit(1);
};

const getBackupState = (db: Db) => {
  const [state] = backupStateQuery(db).all();
  return state;
};

const getCloudAccount = (db: Db) => {
  const [account] = cloudAccountQuery(db).all();
  return account;
};

const hasVaultData = (db: Db) => {
  const rows = db.select({ id: passwords.id }).from(passwords).limit(1).all();
  return rows.length > 0;
};

export {
  backupStateQuery,
  cloudAccountQuery,
  getBackupState,
  getCloudAccount,
  hasVaultData,
};
