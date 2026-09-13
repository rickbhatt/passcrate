import { crates } from "@/db/schema";
import { Db } from "@/db/types";
import { asc, eq } from "drizzle-orm";

const cratesQuery = (db: Db) => {
  return db.select().from(crates).orderBy(asc(crates.name));
};

const crateById = ({ db, id }: { db: Db; id: string }) => {
  return db.select().from(crates).where(eq(crates.id, id)).limit(1);
};

export { crateById, cratesQuery };
