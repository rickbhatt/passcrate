import { getDrizzleInstance } from "@/db/client";

export const useDb = () => {
  return getDrizzleInstance();
};
