import { BACKUP } from "@/constants/backup";
import { getAccessToken } from "@/lib/google-auth";
import { fetch } from "expo/fetch";

export type DriveFile = {
  id: string;
  name: string;
  size: number;
  modifiedTime: Date;
};

/** Thrown for non-2xx Drive responses so callers can branch on `status`. */
export class DriveError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const FILE_FIELDS = "id,name,size,modifiedTime";

const driveFetch = async (path: string, init: RequestInit = {}) => {
  const token = await getAccessToken();
  const response = await fetch(`${BACKUP.DRIVE_BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  } as Parameters<typeof fetch>[1]);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new DriveError(
      response.status,
      `Drive request failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }
  return response;
};

const toDriveFile = (raw: {
  id: string;
  name: string;
  size?: string;
  modifiedTime: string;
}): DriveFile => ({
  id: raw.id,
  name: raw.name,
  size: Number(raw.size ?? 0),
  modifiedTime: new Date(raw.modifiedTime),
});

/** The newest backup file in the app's hidden Drive folder, if any. */
export const findBackupFile = async (): Promise<DriveFile | null> => {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name = '${BACKUP.FILE_NAME}' and trashed = false`,
    orderBy: "modifiedTime desc",
    pageSize: "1",
    fields: `files(${FILE_FIELDS})`,
  });
  const response = await driveFetch(`/drive/v3/files?${params}`);
  const { files } = await response.json();
  return files?.[0] ? toDriveFile(files[0]) : null;
};

/** Creates an empty backup file in appDataFolder and returns its id. */
export const createBackupFile = async (): Promise<string> => {
  const response = await driveFetch("/drive/v3/files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: BACKUP.FILE_NAME,
      parents: ["appDataFolder"],
      mimeType: "application/octet-stream",
    }),
  });
  const { id } = await response.json();
  return id;
};

/** Replaces the content of an existing Drive file. */
export const uploadFileContent = async (
  fileId: string,
  bytes: Uint8Array,
): Promise<DriveFile> => {
  const response = await driveFetch(
    `/upload/drive/v3/files/${fileId}?uploadType=media&fields=${FILE_FIELDS}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/octet-stream" },
      body: bytes as BodyInit,
    },
  );
  return toDriveFile(await response.json());
};

export const downloadFileContent = async (
  fileId: string,
): Promise<Uint8Array> => {
  const response = await driveFetch(`/drive/v3/files/${fileId}?alt=media`);
  return response.bytes();
};

export const deleteFile = async (fileId: string) => {
  try {
    await driveFetch(`/drive/v3/files/${fileId}`, { method: "DELETE" });
  } catch (error) {
    // Already gone counts as deleted.
    if (!(error instanceof DriveError && error.status === 404)) throw error;
  }
};
