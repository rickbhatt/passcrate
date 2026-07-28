import { appConfig } from "@/db/schema";
import { Db } from "@/db/types";
import { eq } from "drizzle-orm";

const APP_CONFIG_ID = "app-config";

const storeSalt = async ({
  db,
  salt,
  verifier,
}: {
  db: Db;
  salt: string;
  verifier: string;
}) => {
  await db
    .insert(appConfig)
    .values({
      id: APP_CONFIG_ID,
      salt,
      passwordVerifier: verifier,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appConfig.id,
      set: { salt, passwordVerifier: verifier, createdAt: new Date() },
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
