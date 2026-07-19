import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { useSQLiteContext } from "expo-sqlite";

export const useDrizzleStudioDev = () => {
  const sqlite = useSQLiteContext();
  useDrizzleStudio(__DEV__ ? sqlite : null);
};
