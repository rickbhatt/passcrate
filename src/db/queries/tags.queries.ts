import { tags } from "@/db/schema";
import { Db } from "@/db/types";
import { asc } from "drizzle-orm";

const tagsQuery = (db: Db) => {
  return db.select().from(tags).orderBy(asc(tags.name));
};

export { tagsQuery };
