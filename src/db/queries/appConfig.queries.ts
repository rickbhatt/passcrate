import { appConfig } from "@/db/schema";
import { Db } from "@/db/types";

const biometricConfigQuery = (db: Db) => {
  return db.select().from(appConfig).limit(1);
};

const getAppConfig = async (db: Db) => {
  const [config] = await db.select().from(appConfig).limit(1);
  return config;
};

export { biometricConfigQuery, getAppConfig };
