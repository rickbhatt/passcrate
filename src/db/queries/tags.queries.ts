import { passwordTags, passwords, tags } from "@/db/schema";
import { Db } from "@/db/types";
import { asc, eq } from "drizzle-orm";

const tagsQuery = (db: Db) => {
  return db.select().from(tags).orderBy(asc(tags.name));
};

const tagsByPasswordId = ({
  db,
  passwordId,
}: {
  db: Db;
  passwordId: string;
}) => {
  return db
    .select({ id: tags.id, name: tags.name })
    .from(passwordTags)
    .innerJoin(tags, eq(passwordTags.tagId, tags.id))
    .where(eq(passwordTags.passwordId, passwordId))
    .orderBy(asc(tags.name));
};

const tagsByCrateId = ({ db, crateId }: { db: Db; crateId: string }) => {
  return db
    .select({
      passwordId: passwordTags.passwordId,
      id: tags.id,
      name: tags.name,
    })
    .from(passwordTags)
    .innerJoin(tags, eq(passwordTags.tagId, tags.id))
    .innerJoin(passwords, eq(passwordTags.passwordId, passwords.id))
    .where(eq(passwords.crateId, crateId))
    .orderBy(asc(tags.name));
};

export { tagsByCrateId, tagsByPasswordId, tagsQuery };
