import { passwordTags, passwords } from "@/db/schema";
import { Db } from "@/db/types";
import { encrypt } from "@/lib/crypto";
import { generateUUID } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { PasswordFormValue } from "types";
import { resolveTags } from "./tags.mutations";

const parseExpiryDays = (rawExpiryDays: string | undefined) => {
  const trimmed = rawExpiryDays?.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
};

const computeExpiresAt = (from: Date, expiryDays: number | null) => {
  if (expiryDays === null) return null;

  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + expiryDays);
  return expiresAt;
};

const addPassword = async ({
  db,
  derivedKey,
  values,
}: {
  db: Db;
  derivedKey: string;
  values: PasswordFormValue;
}) => {
  const now = new Date();
  const expiryDays = parseExpiryDays(values.expiryDays);

  const [password] = await db
    .insert(passwords)
    .values({
      id: generateUUID(),
      title: (values.title ?? "").trim(),
      username: values.username?.trim() || null,
      encryptedPassword: encrypt(values.password ?? "", derivedKey),
      url: values.url?.trim() || null,
      notes: values.notes?.trim() || null,
      folderId: values.folderId || null,
      expiryDays,
      expiresAt: computeExpiresAt(now, expiryDays),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const resolvedTags = await resolveTags({ db, tags: values.tags ?? [] });
  if (resolvedTags.length > 0) {
    await db.insert(passwordTags).values(
      resolvedTags.map((tag) => ({
        passwordId: password.id,
        tagId: tag.id,
      })),
    );
  }

  return password;
};

const updatePassword = async ({
  db,
  id,
  derivedKey,
  values,
}: {
  db: Db;
  id: string;
  derivedKey: string;
  values: PasswordFormValue;
}) => {
  const now = new Date();
  const expiryDays = parseExpiryDays(values.expiryDays);

  const [password] = await db
    .update(passwords)
    .set({
      title: (values.title ?? "").trim(),
      username: values.username?.trim() || null,
      ...(values.password ? { encryptedPassword: encrypt(values.password, derivedKey) } : {}),
      url: values.url?.trim() || null,
      notes: values.notes?.trim() || null,
      folderId: values.folderId || null,
      expiryDays,
      expiresAt: computeExpiresAt(now, expiryDays),
      updatedAt: now,
    })
    .where(eq(passwords.id, id))
    .returning();

  const resolvedTags = await resolveTags({ db, tags: values.tags ?? [] });
  await db.delete(passwordTags).where(eq(passwordTags.passwordId, id));
  if (resolvedTags.length > 0) {
    await db.insert(passwordTags).values(
      resolvedTags.map((tag) => ({
        passwordId: id,
        tagId: tag.id,
      })),
    );
  }

  return password;
};

const deletePassword = async ({ db, id }: { db: Db; id: string }) => {
  await db.delete(passwords).where(eq(passwords.id, id));
};

export { addPassword, deletePassword, updatePassword };
