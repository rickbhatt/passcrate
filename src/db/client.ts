import migrations from "@/drizzle/migrations";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { SQLiteRunResult, type SQLiteDatabase } from "expo-sqlite";

import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

export type Db = BaseSQLiteDatabase<"sync", SQLiteRunResult, typeof schema>;
let sqliteInstance: SQLiteDatabase | null = null;
let drizzleInstance: Db | null = null;

export const registerDbInstance = (sqliteDb: SQLiteDatabase) => {
  sqliteInstance = sqliteDb;
};

export const getDbInstance = () => {
  if (!sqliteInstance) {
    const error = new Error("SQLite instance has not been registered");

    throw error;
  }

  return sqliteInstance;
};

export const getDrizzleInstance = () => {
  if (!drizzleInstance) {
    const sqlite = getDbInstance();

    drizzleInstance = drizzle(sqlite, { schema });
  }

  return drizzleInstance;
};

export const closeDb = async () => {
  if (!sqliteInstance) return;

  console.log("closeDb: closing");

  try {
    await sqliteInstance.execAsync("PRAGMA wal_checkpoint(FULL);");

    await sqliteInstance.closeAsync();

    console.log("closeDb: closed");
  } catch (error) {
    console.error("closeDb: FAILED", error);

    throw error;
  } finally {
    sqliteInstance = null;
    drizzleInstance = null;
  }
};

export const initialiseDb = async (sqliteDb: SQLiteDatabase) => {
  registerDbInstance(sqliteDb);

  try {
    await sqliteDb.execAsync(`PRAGMA busy_timeout = 3000;`);

    await sqliteDb.execAsync(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
    `);

    drizzleInstance = drizzle(sqliteDb, { schema });

    await migrate(drizzleInstance, migrations);
  } catch (e) {
    console.error("initialiseDb: FAILED", e);

    throw e;
  }
};

// not required for the time being, just commenting out
export const validateDb = async () => {
  try {
    const db = getDrizzleInstance();

    const result = await db.get(sql`SELECT 1 as ok`);

    console.log("DB healthy:", result);

    return true;
  } catch (error) {
    console.error("DB unhealthy:", error);

    return false;
  }
};
