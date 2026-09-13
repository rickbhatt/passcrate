import { passwords } from "@/db/schema";
import { Db } from "@/db/types";
import { asc, eq } from "drizzle-orm";

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

export { passwordById, passwordsByCrateId };
