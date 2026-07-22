import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { SQLiteRunResult } from "expo-sqlite";
import * as schema from "../schema";

export type Db = BaseSQLiteDatabase<"sync", SQLiteRunResult, typeof schema>;
