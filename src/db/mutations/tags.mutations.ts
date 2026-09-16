import { tags } from "@/db/schema";
import { Db } from "@/db/types";
import { generateUUID } from "@/lib/utils";
import { sql } from "drizzle-orm";
import { TagType } from "types";

const addTag = async ({ db, name }: { db: Db; name: string }) => {
  const normalizedName = name.trim();

  const [existingTag] = await db
    .select()
    .from(tags)
    .where(sql`lower(${tags.name}) = lower(${normalizedName})`)
    .limit(1);

  if (existingTag) {
    return existingTag;
  }

  const [tag] = await db
    .insert(tags)
    .values({
      id: generateUUID(),
      name: normalizedName,
      createdAt: new Date(),
    })
    .returning();

  return tag;
};

const resolveTags = async ({
  db,
  tags: tagsToResolve,
}: {
  db: Db;
  tags: TagType[];
}) => {
  const resolved: { id: string; name: string }[] = [];

  for (const tag of tagsToResolve) {
    if (tag.id) {
      resolved.push({ id: tag.id, name: tag.name });
      continue;
    }

    const created = await addTag({ db, name: tag.name });
    resolved.push({ id: created.id, name: created.name });
  }

  return resolved;
};

export { addTag, resolveTags };
