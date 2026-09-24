import type { DriveFile } from "@/lib/backup/drive";
import type { useRouter } from "expo-router";

type Router = ReturnType<typeof useRouter>;

/** Opens the Restore Backup screen for a backup found on Drive. */
export const openRestoreScreen = (
  router: Router,
  file: DriveFile,
  accountEmail: string,
) => {
  router.push({
    pathname: "/setting/restore",
    params: {
      fileId: file.id,
      name: file.name,
      size: String(file.size),
      modifiedTime: file.modifiedTime.toISOString(),
      accountEmail,
    },
  });
};
