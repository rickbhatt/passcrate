import { folders } from "@/db/schema";
import { Db } from "@/db/types";
import { generateUUID } from "@/lib/utils";
import { eq } from "drizzle-orm";

const addFolder = async ({ db, name }: { db: Db; name: string }) => {
  const [folder] = await db
    .insert(folders)
    .values({
      id: generateUUID(),
      name,
      createdAt: new Date(),
    })
    .returning();

  return folder;
};

const updateFolder = async ({
  db,
  id,
  name,
}: {
  db: Db;
  id: string;
  name: string;
}) => {
  const [folder] = await db
    .update(folders)
    .set({ name })
    .where(eq(folders.id, id))
    .returning();

  return folder;
};

const deleteFolder = async ({ db, id }: { db: Db; id: string }) => {
  await db.delete(folders).where(eq(folders.id, id));
};

export { addFolder, deleteFolder, updateFolder };
