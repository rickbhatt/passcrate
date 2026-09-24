import journal from "@/drizzle/meta/_journal.json";
import { Buffer } from "@craftzdog/react-native-buffer";
import Constants from "expo-constants";

/**
 * Backup file layout:
 *   "PCBK" | u8 format version | u32 BE header length | header JSON | payload
 * where payload is the SQLite snapshot encrypted by `encryptBytes`.
 *
 * The header is plaintext so a restore can check the master password (salt +
 * verifier) and schema compatibility before decrypting anything. Both values
 * are already stored as-is in app_config, so exposing them adds nothing.
 */
const MAGIC = "PCBK";
const FORMAT_VERSION = 1;
const PREFIX_LENGTH = MAGIC.length + 1 + 4;

export type BackupHeader = {
  salt: string;
  passwordVerifier: string;
  /** Number of DB migrations applied when the backup was made. */
  schemaVersion: number;
  createdAt: string;
  appVersion: string;
};

/** How many migrations this build knows about. */
export const CURRENT_SCHEMA_VERSION = journal.entries.length;

export const buildHeader = ({
  salt,
  passwordVerifier,
}: Pick<BackupHeader, "salt" | "passwordVerifier">): BackupHeader => ({
  salt,
  passwordVerifier,
  schemaVersion: CURRENT_SCHEMA_VERSION,
  createdAt: new Date().toISOString(),
  appVersion: Constants.expoConfig?.version ?? "unknown",
});

export const encodeBackupFile = (
  header: BackupHeader,
  payload: Uint8Array,
): Uint8Array => {
  const headerBytes = Buffer.from(JSON.stringify(header), "utf8");
  const prefix = Buffer.alloc(PREFIX_LENGTH);
  prefix.write(MAGIC, 0, MAGIC.length, "ascii");
  prefix.writeUInt8(FORMAT_VERSION, MAGIC.length);
  prefix.writeUInt32BE(headerBytes.length, MAGIC.length + 1);

  return new Uint8Array(
    Buffer.concat([prefix, headerBytes, Buffer.from(payload)]),
  );
};

export const decodeBackupFile = (
  bytes: Uint8Array,
): { header: BackupHeader; payload: Uint8Array } => {
  const buffer = Buffer.from(bytes);

  if (
    buffer.length < PREFIX_LENGTH ||
    buffer.toString("ascii", 0, MAGIC.length) !== MAGIC
  ) {
    throw new Error("This file is not a PassCrate backup.");
  }
  if (buffer.readUInt8(MAGIC.length) > FORMAT_VERSION) {
    throw new Error(
      "This backup was made by a newer version of PassCrate. Update the app to restore it.",
    );
  }

  const headerLength = buffer.readUInt32BE(MAGIC.length + 1);
  const headerEnd = PREFIX_LENGTH + headerLength;
  const header = JSON.parse(
    buffer.toString("utf8", PREFIX_LENGTH, headerEnd),
  ) as BackupHeader;

  return { header, payload: new Uint8Array(buffer.subarray(headerEnd)) };
};
