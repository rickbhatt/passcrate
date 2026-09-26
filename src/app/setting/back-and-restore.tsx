import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useThemeColors } from "@/constants/theme";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import {
  upsertBackupState,
  upsertCloudAccount,
} from "@/db/mutations/backup.mutations";
import { backupStateQuery } from "@/db/queries/backup.queries";
import { findRemoteBackup, runBackup } from "@/lib/backup/backup";
import { deleteFile, findBackupFile, type DriveFile } from "@/lib/backup/drive";
import { openRestoreScreen } from "@/lib/backup/restore-route";
import { getGoogleUser } from "@/lib/google-auth";
import { formatBackupDate, formatBytes } from "@/lib/utils";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { toast } from "sonner-native";

const BackupAndRestoreScreen = () => {
  const COLORS = useThemeColors();
  const db = useDb();
  const router = useRouter();
  const { derivedKey } = useCrypto();
  const { data } = useLiveQuery(backupStateQuery(db));

  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingDrive, setIsCheckingDrive] = useState(false);

  const state = data?.[0];
  const isRunning = state?.backupStatus === "running";

  // Backups need a Google account: send the user to connect one first.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        const user = await getGoogleUser().catch(() => null);
        if (cancelled) return;

        if (!user) {
          toast.error("Connect a Google account to back up your vault");
          router.replace("/setting/account");
          return;
        }

        upsertCloudAccount({ db, email: user.email });
        setAccountEmail(user.email);
      })();

      return () => {
        cancelled = true;
      };
    }, [db, router]),
  );

  const openRestore = (file: DriveFile) =>
    openRestoreScreen(router, file, accountEmail ?? "");

  /** Looks for a Drive backup; `undefined` when the check itself failed. */
  const checkDrive = async () => {
    setIsCheckingDrive(true);
    try {
      return await findRemoteBackup();
    } catch (error) {
      console.error(error);
      toast.error("Couldn't check Google Drive. Please try again.");
      return undefined;
    } finally {
      setIsCheckingDrive(false);
    }
  };

  const handleRestore = async () => {
    const file = await checkDrive();
    if (file === undefined) return;
    if (!file) {
      toast.info("No backup found on this Google account");
      return;
    }
    openRestore(file);
  };

  const handleBackup = async () => {
    if (!derivedKey) return;

    // First backup from this phone: a backup already on Drive (e.g. from an
    // old phone) would be replaced, so make the user restore or skip it.
    if (!state?.driveFileId) {
      const file = await checkDrive();
      if (file === undefined) return;
      if (file) {
        toast.info("Restore or skip the backup on Google Drive first");
        openRestore(file);
        return;
      }
    }

    const result = await runBackup({ db, key: derivedKey });
    if (result.success) {
      toast.success("Backup complete");
    } else {
      toast.error(result.error.message);
    }
  };

  const handleAutoBackupToggle = (enabled: boolean) => {
    upsertBackupState({ db, data: { autoBackupEnabled: enabled } });
  };

  const handleDeleteDriveBackup = async () => {
    setIsDeleting(true);
    try {
      const fileId = state?.driveFileId ?? (await findBackupFile())?.id;
      if (fileId) await deleteFile(fileId);
      upsertBackupState({
        db,
        data: {
          driveFileId: null,
          backupFileName: null,
          backupSize: null,
          lastBackupAt: null,
          backupStatus: "idle",
          lastError: null,
        },
      });
      toast.success("Drive backup deleted");
    } catch (error) {
      console.error(error);
      toast.error("Couldn't delete the Drive backup");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!accountEmail) {
    return (
      <View className="main items-center justify-center">
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      className="main"
      contentContainerClassName="gap-y-6 pb-10"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-y-1">
        <Text className="text-sm font-sans-semibold text-text-secondary">
          Backup settings
        </Text>
        <Text className="text-sm font-sans text-text-secondary">
          Back up your vault to your Google Drive so you don&apos;t lose your
          passwords when you get a new phone.
        </Text>
      </View>

      <View className="gap-y-2">
        <Text className="base-paragraph">
          Last backup:{" "}
          {state?.lastBackupAt ? formatBackupDate(state.lastBackupAt) : "Never"}
        </Text>
        {state?.backupSize != null && (
          <Text className="base-paragraph">
            Size: {formatBytes(state.backupSize)}
          </Text>
        )}
        {state?.backupStatus === "failed" && (
          <Text className="text-sm font-sans text-danger">
            Last backup failed: {state.lastError ?? "Unknown error"}
          </Text>
        )}
      </View>

      <View className="flex-row gap-x-3">
        <Button
          onPress={handleBackup}
          disabled={isRunning || isCheckingDrive || !derivedKey}
          className="rounded-full px-8"
        >
          {isRunning && (
            <ActivityIndicator color={COLORS.primaryForeground} size="small" />
          )}
          <Text className="btn-label-white">
            {isRunning ? "Backing up…" : "Back up"}
          </Text>
        </Button>
        <Button
          variant="outline"
          onPress={handleRestore}
          disabled={isRunning || isCheckingDrive}
          className="rounded-full px-8"
        >
          {isCheckingDrive && (
            <ActivityIndicator color={COLORS.primary} size="small" />
          )}
          <Text className="btn-label-dark">Restore</Text>
        </Button>
      </View>

      <View className="h-px bg-border" />

      <Button
        variant="ghost"
        onPress={() => router.push("/setting/account")}
        className="h-auto w-full flex-row items-center gap-x-3 rounded-none px-1 py-1"
      >
        <View className="flex-1 gap-y-0.5">
          <Text className="text-base font-sans-semibold text-text-primary">
            Google Account
          </Text>
          <Text
            className="text-sm font-sans text-text-secondary"
            numberOfLines={1}
          >
            {accountEmail}
          </Text>
        </View>
        <DynamicIcon
          family="Feather"
          name="chevron-right"
          size={18}
          color={COLORS.textSecondary}
        />
      </Button>

      <View className="h-px bg-border" />

      <View className="flex-row items-center gap-x-3 px-1">
        <View className="flex-1 gap-y-0.5">
          <Text className="text-base font-sans-semibold text-text-primary">
            Daily auto backup
          </Text>
          <Text className="text-sm font-sans text-text-secondary">
            Backs up once a day when you open PassCrate
          </Text>
        </View>
        <Switch
          checked={state?.autoBackupEnabled ?? true}
          onCheckedChange={handleAutoBackupToggle}
          disabled={isRunning}
        />
      </View>

      <View className="flex-row gap-x-3 rounded-md border border-border bg-elevated p-4">
        <DynamicIcon
          family="Feather"
          name="lock"
          size={18}
          color={COLORS.primary}
        />
        <Text className="flex-1 text-sm font-sans text-text-secondary">
          Backups are encrypted with your master password before they leave
          this device. You&apos;ll need the same master password to restore
          them on a new phone.
        </Text>
      </View>

      {__DEV__ && (
        <Button
          variant="destructive"
          onPress={handleDeleteDriveBackup}
          disabled={isDeleting || isRunning}
        >
          <Text className="btn-label-white">Delete Drive backup (dev)</Text>
        </Button>
      )}
    </ScrollView>
  );
};

export default BackupAndRestoreScreen;
