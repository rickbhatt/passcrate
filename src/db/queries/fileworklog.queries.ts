import { getPreviousMonthRange } from "@/lib/utils";
import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { Db } from "type";

import { fileLogs, targetInfo } from "../schema";

interface FileLogsWithFilers {
  db: Db;
  filters: {
    journalId?: string | undefined;
    articleId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
  };
  sortOrder?: "asc" | "desc";
}

export const getFileLogs = ({
  db,
  filters,
  sortOrder = "desc",
}: FileLogsWithFilers) => {
  const conditions = [];

  const { startDate, endDate } = filters;

  if (startDate && endDate) {
    conditions.push(
      gte(fileLogs.workedAt, startDate),
      lte(fileLogs.workedAt, endDate),
    );
  }

  if (filters.journalId) {
    conditions.push(eq(fileLogs.journalId, filters.journalId.toUpperCase()));
  }

  if (filters.articleId) {
    conditions.push(eq(fileLogs.articleId, filters.articleId));
  }

  let data = db
    .select()
    .from(fileLogs)
    .where(and(...conditions))
    .orderBy(
      sortOrder === "asc" ? asc(fileLogs.workedAt) : desc(fileLogs.workedAt),
    );

  return data;
};

export const getPreviousMonthSummary = ({
  db,
  month,
}: {
  db: Db;
  month: string;
}) => {
  const currentYear = new Date().getFullYear();
  const { start, end } = getPreviousMonthRange(month, currentYear.toString());

  return db
    .select({
      totalLogs: count(),

      totalLepPages: sql<number>`
        sum(${fileLogs.lepPages})
      `,
    })
    .from(fileLogs)
    .where(and(gte(fileLogs.workedAt, start), lte(fileLogs.workedAt, end)));
};

export const getFileLogById = async (db: Db, id: string) => {
  let [row] = await db.select().from(fileLogs).where(eq(fileLogs.id, id));

  return row;
};

export const getAllTargetHour = (db: Db) => {
  const latestRow = db
    .select()
    .from(targetInfo)
    .orderBy(desc(targetInfo.createdAt));

  return latestRow;
};

export const getLatestTargetHour = (db: Db) => {
  const row = db
    .select()
    .from(targetInfo)
    .orderBy(desc(targetInfo.createdAt))
    .limit(1);

  return row;
};

export const checkTargetInfoExists = async (db: Db) => {
  const row = await db
    .select()
    .from(targetInfo)
    .orderBy(desc(targetInfo.createdAt))
    .limit(1);

  return !!row[0];
};

export const checkHasUserData = (db: Db): boolean => {
  const row = db.select().from(fileLogs).limit(1).get();
  return row !== undefined;
};
