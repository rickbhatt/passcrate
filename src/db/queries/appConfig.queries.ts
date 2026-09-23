import { appConfig } from "@/db/schema";
import { Db } from "@/db/types";

const biometricConfigQuery = (db: Db) => {
  return db.select().from(appConfig).limit(1);
};

// Only the flag, so live-query consumers never pull salt/verifier into state.
const biometricEnabledQuery = (db: Db) => {
  return db
    .select({ biometricEnabled: appConfig.biometricEnabled })
    .from(appConfig)
    .limit(1);
};

const getAppConfig = async (db: Db) => {
  const [config] = await db.select().from(appConfig).limit(1);
  return config;
};

export { biometricConfigQuery, biometricEnabledQuery, getAppConfig };
