import { appConfig } from "@/db/schema";
import { Db } from "@/db/types";
import { generateUUID } from "@/lib/utils";
import { eq } from "drizzle-orm";

const storeSalt = async ({
  db,
  salt,
  verifier,
}: {
  db: Db;
  salt: string;
  verifier: string;
}) => {
  await db.insert(appConfig).values({
    id: generateUUID(),
    salt: salt,
    passwordVerifier: verifier,
    createdAt: new Date(),
  });
};

const updateBiometric = async (db: Db) => {
  const [config] = await db.select().from(appConfig).limit(1);

  if (!config) {
    throw new Error("App config not found.");
  }
  await db
    .update(appConfig)
    .set({ biometricEnabled: true })
    .where(eq(appConfig.id, config.id));
};

export { storeSalt, updateBiometric };
