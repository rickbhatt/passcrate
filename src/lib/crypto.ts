// lib/crypto.ts
import { Buffer } from "@craftzdog/react-native-buffer";
import QuickCrypto from "react-native-quick-crypto";

export const encrypt = (plainText: string, derivedKey: string): string => {
  const iv = QuickCrypto.randomBytes(12); // 12 bytes for GCM
  const keyBuffer = Buffer.from(derivedKey, "hex");

  const cipher = QuickCrypto.createCipheriv("aes-256-gcm", keyBuffer, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  // bundle iv + authTag + ciphertext into one string
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (cipherText: string, derivedKey: string): string => {
  try {
    const [ivHex, authTagHex, encrypted] = cipherText.split(":");
    const keyBuffer = Buffer.from(derivedKey, "hex");
    const iv = Buffer.from(ivHex, "hex");

    const decipher = QuickCrypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Invalid password or corrupted encrypted data.");
  }
};

/** AES-256-GCM over raw bytes. Output: iv(12) | authTag(16) | ciphertext. */
export const encryptBytes = (
  data: Uint8Array,
  derivedKey: string,
): Uint8Array => {
  const iv = QuickCrypto.randomBytes(12);
  const keyBuffer = Buffer.from(derivedKey, "hex");

  const cipher = QuickCrypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(data)),
    cipher.final(),
  ]);

  return new Uint8Array(
    Buffer.concat([Buffer.from(iv), cipher.getAuthTag(), encrypted]),
  );
};

export const decryptBytes = (
  data: Uint8Array,
  derivedKey: string,
): Uint8Array => {
  try {
    const buffer = Buffer.from(data);
    const keyBuffer = Buffer.from(derivedKey, "hex");

    const decipher = QuickCrypto.createDecipheriv(
      "aes-256-gcm",
      keyBuffer,
      buffer.subarray(0, 12),
    );
    decipher.setAuthTag(buffer.subarray(12, 28));

    return new Uint8Array(
      Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]),
    );
  } catch {
    throw new Error("Invalid password or corrupted encrypted data.");
  }
};

export const getDerivedKey = async ({
  masterPassword,
  salt,
}: {
  masterPassword: string;
  salt: string;
}) => {
  const derivedKey = await new Promise<string>((resolve, reject) => {
    QuickCrypto.pbkdf2(
      masterPassword,
      salt,
      100000,
      32,
      "sha256",
      (err, key) => {
        if (err || !key) return reject(err);
        resolve(key.toString("hex"));
      },
    );
  });

  return derivedKey;
};
