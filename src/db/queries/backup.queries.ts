import { BACKUP_STATE_ID } from "@/constants";
import { backupState, cloudAccount } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Db } from "type";

export const getCloudAccountInfo = async (db: Db) => {
  let [row] = await db.select().from(cloudAccount).limit(1);
  return row;
};

export const checkCloudAccountExists = async (db: Db, email: string) => {
  let row = await db
    .select()
    .from(cloudAccount)
    .where(eq(cloudAccount.accountEmail, email))
    .limit(1);

  return !!row[0];
};

export const getBackupState = (db: Db) => {
  const [row] = db
    .select()
    .from(backupState)
    .where(eq(backupState.id, BACKUP_STATE_ID))
    .limit(1)
    .all();
  return row;
};
