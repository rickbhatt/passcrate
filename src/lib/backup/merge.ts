import { crates, passwords, passwordTags, tags } from "@/db/schema";
import { Db } from "@/db/types";

type Crate = typeof crates.$inferSelect;
type Tag = typeof tags.$inferSelect;
type Password = typeof passwords.$inferSelect;
type PasswordTag = typeof passwordTags.$inferSelect;

export type VaultRows = {
  crates: Crate[];
  tags: Tag[];
  passwords: Password[];
  passwordTags: PasswordTag[];
};

export type MergePlan = VaultRows & { added: number; skipped: number };

/**
 * Works out which of this phone's rows to add to a restored vault. Both
 * vaults must be encrypted with the same key.
 *
 * - Crates match by `nameKey`, tags by `name`: a match reuses the restored row.
 * - A password is a duplicate if title, username, url and the decrypted
 *   password all match (ciphertexts differ per IV, so they're compared plain).
 * - Ids already taken in the restored vault get a fresh one.
 */
export const planMerge = ({
  local,
  restored,
  decryptPassword,
  newId,
}: {
  local: VaultRows;
  restored: VaultRows;
  decryptPassword: (cipherText: string) => string;
  newId: () => string;
}): MergePlan => {
  const takenIds = new Set([
    ...restored.crates.map((c) => c.id),
    ...restored.tags.map((t) => t.id),
    ...restored.passwords.map((p) => p.id),
  ]);
  const freeId = (id: string) => {
    const result = takenIds.has(id) ? newId() : id;
    takenIds.add(result);
    return result;
  };

  const plan: MergePlan = {
    crates: [],
    tags: [],
    passwords: [],
    passwordTags: [],
    added: 0,
    skipped: 0,
  };

  const crateIdMap = new Map<string, string>();
  const restoredCrates = new Map(restored.crates.map((c) => [c.nameKey, c.id]));
  for (const crate of local.crates) {
    const existingId = restoredCrates.get(crate.nameKey);
    if (existingId) {
      crateIdMap.set(crate.id, existingId);
      continue;
    }
    const id = freeId(crate.id);
    crateIdMap.set(crate.id, id);
    plan.crates.push({ ...crate, id });
  }

  const tagIdMap = new Map<string, string>();
  const restoredTags = new Map(restored.tags.map((t) => [t.name, t.id]));
  for (const tag of local.tags) {
    const existingId = restoredTags.get(tag.name);
    if (existingId) {
      tagIdMap.set(tag.id, existingId);
      continue;
    }
    const id = freeId(tag.id);
    tagIdMap.set(tag.id, id);
    plan.tags.push({ ...tag, id });
  }

  const fingerprint = (p: Password) =>
    JSON.stringify([
      p.title,
      p.username ?? null,
      p.url ?? null,
      decryptPassword(p.encryptedPassword),
    ]);
  const restoredFingerprints = new Set(restored.passwords.map(fingerprint));

  for (const password of local.passwords) {
    if (restoredFingerprints.has(fingerprint(password))) {
      plan.skipped++;
      continue;
    }

    const id = freeId(password.id);
    plan.passwords.push({
      ...password,
      id,
      crateId: password.crateId
        ? (crateIdMap.get(password.crateId) ?? null)
        : null,
    });
    plan.added++;

    for (const link of local.passwordTags) {
      if (link.passwordId !== password.id) continue;
      const tagId = tagIdMap.get(link.tagId);
      if (tagId) plan.passwordTags.push({ passwordId: id, tagId });
    }
  }

  return plan;
};

export const readVault = (db: Db): VaultRows => ({
  crates: db.select().from(crates).all(),
  tags: db.select().from(tags).all(),
  passwords: db.select().from(passwords).all(),
  passwordTags: db.select().from(passwordTags).all(),
});

/**
 * Inserts a merge plan into the restored vault, all or nothing. Row by row,
 * so a large vault can't exceed SQLite's bound-variable limit.
 */
export const applyMerge = (db: Db, plan: MergePlan) => {
  db.transaction((tx) => {
    for (const row of plan.crates) tx.insert(crates).values(row).run();
    for (const row of plan.tags) tx.insert(tags).values(row).run();
    for (const row of plan.passwords) tx.insert(passwords).values(row).run();
    for (const row of plan.passwordTags) {
      tx.insert(passwordTags).values(row).run();
    }
  });
};
