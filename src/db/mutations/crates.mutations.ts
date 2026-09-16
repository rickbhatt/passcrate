import { crates } from "@/db/schema";
import { Db } from "@/db/types";
import { generateUUID } from "@/lib/utils";
import { eq, inArray } from "drizzle-orm";

const addCrate = async ({ db, name }: { db: Db; name: string }) => {
  const normalizedName = name.trim();
  const nameKey = normalizedName.toLowerCase();
  const [existingCrate] = await db
    .select()
    .from(crates)
    .where(eq(crates.nameKey, nameKey))
    .limit(1);

  if (existingCrate) {
    return existingCrate;
  }

  const [crate] = await db
    .insert(crates)
    .values({
      id: generateUUID(),
      name: normalizedName,
      nameKey,
      createdAt: new Date(),
    })
    .returning();

  return crate;
};

const updateCrate = async ({
  db,
  id,
  name,
}: {
  db: Db;
  id: string;
  name: string;
}) => {
  const normalizedName = name.trim();
  const nameKey = normalizedName.toLowerCase();
  const [crate] = await db
    .update(crates)
    .set({
      name: normalizedName,
      nameKey,
    })
    .where(eq(crates.id, id))
    .returning();

  return crate;
};

const deleteCrate = async ({ db, id }: { db: Db; id: string }) => {
  await db.delete(crates).where(eq(crates.id, id));
};

const deleteCrates = async ({ db, ids }: { db: Db; ids: string[] }) => {
  await db.delete(crates).where(inArray(crates.id, ids));
};

export { addCrate, deleteCrate, deleteCrates, updateCrate };
