import { SECURE_KEYS } from "@/constants/secure-keys";
import { appConfig, passwords } from "@/db/schema";
import { Db } from "@/db/types";
import { decrypt, encrypt } from "@/lib/crypto";
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

const updateBiometric = async ({
  db,
  enabled,
}: {
  db: Db;
  enabled: boolean;
}) => {
  const [config] = await db.select().from(appConfig).limit(1);

  if (!config) {
    throw new Error("App config not found.");
  }
  await db
    .update(appConfig)
    .set({ biometricEnabled: enabled })
    .where(eq(appConfig.id, config.id));
};

/**
 * Re-keys the whole vault. Every encrypted value is decrypted with the old
 * key and re-encrypted with the new one, and the salt + verifier are
 * replaced, all inside one transaction: if any row fails to decrypt nothing
 * is written, so the vault is never left half on the old key.
 */
const changeMasterPassword = ({
  db,
  oldKey,
  newKey,
  newSalt,
}: {
  db: Db;
  oldKey: string;
  newKey: string;
  newSalt: string;
}) => {
  db.transaction((tx) => {
    const [config] = tx.select().from(appConfig).limit(1).all();
    if (!config) {
      throw new Error("App config not found.");
    }

    const rows = tx
      .select({
        id: passwords.id,
        encryptedPassword: passwords.encryptedPassword,
      })
      .from(passwords)
      .all();

    for (const row of rows) {
      const plainText = decrypt(row.encryptedPassword, oldKey);
      tx.update(passwords)
        .set({ encryptedPassword: encrypt(plainText, newKey) })
        .where(eq(passwords.id, row.id))
        .run();
    }

    tx.update(appConfig)
      .set({
        salt: newSalt,
        passwordVerifier: encrypt(SECURE_KEYS.PASSWORD_VERIFIER, newKey),
      })
      .where(eq(appConfig.id, config.id))
      .run();
  });
};

export { changeMasterPassword, storeSalt, updateBiometric };
