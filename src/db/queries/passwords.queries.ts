import { crates, passwordTags, passwords, tags } from "@/db/schema";
import { Db } from "@/db/types";
import { asc, eq, like, or } from "drizzle-orm";

const passwordsByCrateId = ({ db, crateId }: { db: Db; crateId: string }) => {
  return db
    .select()
    .from(passwords)
    .where(eq(passwords.crateId, crateId))
    .orderBy(asc(passwords.title));
};

const passwordById = ({ db, id }: { db: Db; id: string }) => {
  return db.select().from(passwords).where(eq(passwords.id, id)).limit(1);
};

const passwordWithCrateById = ({ db, id }: { db: Db; id: string }) => {
  return db
    .select({
      id: passwords.id,
      title: passwords.title,
      username: passwords.username,
      encryptedPassword: passwords.encryptedPassword,
      url: passwords.url,
      notes: passwords.notes,
      crateId: passwords.crateId,
      crateName: crates.name,
      expiryDays: passwords.expiryDays,
      expiresAt: passwords.expiresAt,
      createdAt: passwords.createdAt,
      updatedAt: passwords.updatedAt,
    })
    .from(passwords)
    .leftJoin(crates, eq(passwords.crateId, crates.id))
    .where(eq(passwords.id, id))
    .limit(1);
};

const passwordsBySearch = ({ db, query }: { db: Db; query: string }) => {
  const term = `%${query}%`;
  return db
    .selectDistinct({
      id: passwords.id,
      title: passwords.title,
      username: passwords.username,
    })
    .from(passwords)
    .leftJoin(passwordTags, eq(passwordTags.passwordId, passwords.id))
    .leftJoin(tags, eq(passwordTags.tagId, tags.id))
    .where(
      or(
        like(passwords.title, term),
        like(passwords.username, term),
        like(tags.name, term),
      ),
    )
    .orderBy(asc(passwords.title));
};

export {
  passwordById,
  passwordsByCrateId,
  passwordsBySearch,
  passwordWithCrateById,
};
