import QuickCrypto from "react-native-quick-crypto";

const PWNED_PASSWORDS_RANGE_URL = "https://api.pwnedpasswords.com/range/";

// In-memory only: caches by SHA-1 hash (never the plaintext password) so
// re-checking the same password within a session doesn't re-hit the API.
const pwnedCache = new Map<string, boolean>();

const sha1Hex = (value: string): string =>
  QuickCrypto.createHash("sha1").update(value).digest("hex").toUpperCase();

// Checks a password against the HIBP Pwned Passwords range API using
// k-anonymity: only the first 5 characters of its SHA-1 hash are sent, so
// the full password/hash never leaves the device.
// https://haveibeenpwned.com/API/v3#PwnedPasswords
export const isPasswordPwned = async (password: string): Promise<boolean> => {
  const hash = sha1Hex(password);

  const cached = pwnedCache.get(hash);
  if (cached !== undefined) return cached;

  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(`${PWNED_PASSWORDS_RANGE_URL}${prefix}`, {
    headers: { "Add-Padding": "true" },
  });

  if (!response.ok) {
    throw new Error(`Pwned Passwords lookup failed (${response.status})`);
  }

  const body = await response.text();
  const isPwned = body
    .split("\n")
    .some((line) => line.startsWith(suffix));

  pwnedCache.set(hash, isPwned);
  return isPwned;
};
