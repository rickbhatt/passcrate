import ConfirmDialog from "@/components/confirm-dialog";
import DynamicIcon from "@/components/dynamic-icon";
import PasswordInput from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/constants/theme";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import {
  adoptRemoteBackup,
  restartApp,
  restoreBackup,
  RestoreFailedAfterCloseError,
} from "@/lib/backup/backup";
import type { DriveFile } from "@/lib/backup/drive";
import { formatBackupDate, formatBytes } from "@/lib/utils";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useCallback, useState } from "react";
import { ActivityIndicator, BackHandler, Text, View } from "react-native";
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from "react-native-keyboard-controller";
import { toast } from "sonner-native";

const KeyboardAwareScrollView = styled(
  RNKeyboardAwareScrollView as React.ComponentType<any>,
);

const RESTART_DELAY_MS = 2000;

type RestoreParams = {
  fileId: string;
  name: string;
  size: string;
  modifiedTime: string;
  accountEmail: string;
};

/**
 * Opened when a Drive backup is found (on connecting Google, or from Backup &
 * Restore). Restore brings the backup into this phone's vault, keeping the
 * phone's passwords and master password; skip hands the Drive file over to
 * this device, so the next backup replaces it, like WhatsApp's prompt.
 */
const RestoreScreen = () => {
  const COLORS = useThemeColors();
  const db = useDb();
  const router = useRouter();
  const params = useLocalSearchParams<RestoreParams>();
  const { derivedKey } = useCrypto();

  const [masterPassword, setMasterPassword] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSkipDialogOpen, setIsSkipDialogOpen] = useState(false);

  // Android hardware back would leave without a decision; swallow it.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  const file: DriveFile = {
    id: params.fileId,
    name: params.name,
    size: Number(params.size),
    modifiedTime: new Date(params.modifiedTime),
  };

  const skip = () => {
    setIsSkipDialogOpen(false);
    adoptRemoteBackup(db, file.id);
    router.back();
  };

  const restore = async () => {
    if (!derivedKey) return;
    setIsRestoring(true);
    try {
      await restoreBackup({ file, masterPassword, currentKey: derivedKey });
      // The app restarts on success.
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Couldn't restore the backup.",
      );
      if (error instanceof RestoreFailedAfterCloseError) {
        setTimeout(restartApp, RESTART_DELAY_MS);
        return;
      }
      setIsRestoring(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={16}
      className="flex-1 bg-background"
      contentContainerClassName="screen-x-padding pt-3 pb-10 gap-y-6"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-y-2 rounded-md border border-border bg-elevated p-4">
        <View className="flex-row items-center gap-x-2">
          <DynamicIcon
            family="Feather"
            name="cloud"
            size={18}
            color={COLORS.primary}
          />
          <Text className="base-bold">Backup found</Text>
        </View>
        <Text className="text-sm font-sans text-text-primary">
          Last backup: {formatBackupDate(file.modifiedTime)}
        </Text>
        <Text className="text-sm font-sans text-text-primary">
          Size: {formatBytes(file.size)}
        </Text>
        <Text
          className="text-sm font-sans text-text-secondary"
          numberOfLines={1}
        >
          {params.accountEmail}
        </Text>
      </View>

      <View className="flex-row gap-x-3 rounded-md border border-danger/40 bg-danger/10 p-4">
        <DynamicIcon
          family="Feather"
          name="alert-triangle"
          size={18}
          color={COLORS.danger}
        />
        <View className="flex-1 gap-y-1">
          <Text className="text-sm font-sans-semibold text-text-primary">
            If you skip, you won&apos;t be able to restore this backup later.
          </Text>
          <Text className="text-sm font-sans text-text-secondary">
            Your next backup will replace it on Google Drive. If you restore,
            passwords already on this phone are kept and added to the restored
            vault.
          </Text>
        </View>
      </View>

      <View className="form-group">
        <Text className="form-label">Master password of this backup</Text>
        <PasswordInput
          value={masterPassword}
          onChange={setMasterPassword}
          textContentType="password"
          placeholder="master password..."
        />
        <Text className="text-sm font-sans text-text-secondary">
          Enter the master password you used when this backup was made. After
          restoring, PassCrate restarts and you keep unlocking it with your
          current master password.
        </Text>
      </View>

      {isRestoring ? (
        <View className="items-center gap-y-3 py-4">
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text className="text-sm font-sans text-text-secondary">
            Restoring your vault…
          </Text>
        </View>
      ) : (
        <View className="gap-y-3">
          <Button
            onPress={restore}
            disabled={!derivedKey || masterPassword.length < 1}
          >
            <Text className="btn-label-white">Restore</Text>
          </Button>
          <Button variant="outline" onPress={() => setIsSkipDialogOpen(true)}>
            <Text className="btn-label-dark">Skip</Text>
          </Button>
        </View>
      )}

      <ConfirmDialog
        open={isSkipDialogOpen}
        onOpenChange={setIsSkipDialogOpen}
        title="Skip restore?"
        description="You won't be able to restore this backup later. Your next backup will replace it on Google Drive."
        onConfirm={skip}
        confirmText="Skip"
        confirmVariant="destructive"
      />
    </KeyboardAwareScrollView>
  );
};

export default RestoreScreen;
