import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// FOLDERS
export const folders = sqliteTable("folders", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// TAGS
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// PASSWORDS
export const passwords = sqliteTable("passwords", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  username: text("username"),
  encryptedPassword: text("encrypted_password").notNull(),
  url: text("url"),
  notes: text("notes"),
  folderId: text("folder_id").references(() => folders.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// PASSWORDS <-> TAGS (many-to-many)
export const passwordTags = sqliteTable("password_tags", {
  passwordId: text("password_id")
    .notNull()
    .references(() => passwords.id, { onDelete: "cascade" }),
  tagId: text("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});
