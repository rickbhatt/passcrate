import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// APP CONFIG — stores salt and app-level settings
export const appConfig = sqliteTable("app_config", {
  id: text("id").primaryKey(),
  salt: text("salt").notNull(),
  biometricEnabled: integer("biometric_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  passwordVerifier: text("password_verifier").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
