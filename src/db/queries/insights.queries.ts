import { fileLogs } from "@/db/schema";
import { getMonthRange } from "@/lib/utils";
import { and, count, gte, lte, sql } from "drizzle-orm";
import { Db } from "type";

export const getInsightsQuery = ({ db, month }: { db: Db; month: string }) => {
  const currentYear = new Date().getFullYear();

  const { start, end } = getMonthRange(month, currentYear.toString());

  return db
    .select({
      totalLogs: count(),

      totalLepPages: sql<number>`
        sum(${fileLogs.lepPages})
      `,

      smlCount: sql<number>`
        sum(case when ${fileLogs.isSml} = 1 then 1 else 0 end)
      `,

      manualCount: sql<number>`
        sum(case when ${fileLogs.isSml} = 0 then 1 else 0 end)
      `,
    })
    .from(fileLogs)
    .where(and(gte(fileLogs.workedAt, start), lte(fileLogs.workedAt, end)));
};

export const getMonthlyTotalLepPagesQuery = ({ db }: { db: Db }) => {
  const currentYear = new Date().getFullYear().toString();

  return db
    .select({
      month: sql<string>`cast(strftime('%m', ${fileLogs.workedAt}) as integer)`,
      totalLepPages: sql<number>`
        sum(${fileLogs.lepPages})
      `,
    })
    .from(fileLogs)
    .where(sql`strftime('%Y', ${fileLogs.workedAt}) = ${currentYear}`)
    .groupBy(sql`strftime('%m', ${fileLogs.workedAt})`);
};

export const getAttendanceDatesQuery = ({
  db,
  month,
  targetLEP,
}: {
  db: Db;
  month: string;
  targetLEP: number;
}) => {
  const currentYear = new Date().getFullYear();
  const { start, end } = getMonthRange(month, currentYear.toString());

  const halfTargetPages = Math.ceil(targetLEP / 2);

  const minFullTarget = targetLEP - 5;

  return db
    .select({
      date: sql<number>`cast(strftime('%d', ${fileLogs.workedAt}) as integer)`,
      totalLepPages: sql<number>`sum(${fileLogs.lepPages})`,
      type: sql<"full" | "half" | "absent">`
          case 
            when sum(${fileLogs.lepPages}) >= ${minFullTarget} then 'full'
            when sum(${fileLogs.lepPages}) between ${halfTargetPages} and ${minFullTarget - 1} then 'half'
            else 'absent'
          end
      `,
    })
    .from(fileLogs)
    .where(and(gte(fileLogs.workedAt, start), lte(fileLogs.workedAt, end)))
    .groupBy(sql`strftime('%d', ${fileLogs.workedAt})`);
};
