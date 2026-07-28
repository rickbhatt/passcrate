// secure-storage.ts
import * as SecureStore from "expo-secure-store";

/**
 * Store a value in SecureStore.
 */
export const setSecureItem = async <T>(
  key: string,
  value: T,
  options?: SecureStore.SecureStoreOptions,
): Promise<void> => {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  await SecureStore.setItemAsync(key, stringValue, options);
};

/**
 * Retrieve a value from SecureStore.
 * Returns null if the key doesn't exist.
 */
export const getSecureItem = async <T = string>(
  key: string,
  options?: SecureStore.SecureStoreOptions,
): Promise<T | null> => {
  const value = await SecureStore.getItemAsync(key, options);
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
};
/**
 * Delete a value from SecureStore.
 */
export const deleteSecureItem = async (key: string): Promise<void> => {
  await SecureStore.deleteItemAsync(key);
};
