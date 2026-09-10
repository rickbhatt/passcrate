import { folders } from "@/db/schema";
import { Db } from "@/db/types";
import { asc, eq } from "drizzle-orm";

const foldersQuery = (db: Db) => {
  return db.select().from(folders).orderBy(asc(folders.name));
};

const folderById = async ({ db, id }: { db: Db; id: string }) => {
  const [folder] = await db
    .select()
    .from(folders)
    .where(eq(folders.id, id))
    .limit(1);

  return folder;
};

export { folderById, foldersQuery };
