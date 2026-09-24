import ConfirmDialog from "@/components/confirm-dialog";
import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/constants/theme";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import {
  deleteCloudAccount,
  upsertCloudAccount,
} from "@/db/mutations/backup.mutations";
import {
  findRemoteBackup,
  hasUnadoptedRemoteBackup,
} from "@/lib/backup/backup";
import { openRestoreScreen } from "@/lib/backup/restore-route";
import {
  getGoogleUser,
  signInWithGoogle,
  signOutGoogle,
  type GoogleUser,
} from "@/lib/google-auth";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { toast } from "sonner-native";

const AccountScreen = () => {
  const COLORS = useThemeColors();
  const db = useDb();
  const router = useRouter();
  const { setBiometricAuthInProgress } = useCrypto();

  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const currentUser = await getGoogleUser();
        if (!cancelled) setUser(currentUser);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Like WhatsApp: if this account already has a backup this phone hasn't
   * restored or skipped, offer it right away. Best-effort: a Drive error
   * doesn't undo the connect (backups re-check before overwriting anyway).
   */
  const offerRestore = async (email: string) => {
    try {
      if (!(await hasUnadoptedRemoteBackup(db))) return;
      const file = await findRemoteBackup();
      if (file) openRestoreScreen(router, file, email);
    } catch (error) {
      console.error("offerRestore: FAILED", error);
    }
  };

  const connect = async () => {
    setIsBusy(true);
    // The Google account picker backgrounds the app; don't lock the vault.
    setBiometricAuthInProgress(true);

    try {
      let connectedUser: GoogleUser | null;
      try {
        connectedUser = await signInWithGoogle();
      } finally {
        setBiometricAuthInProgress(false);
      }
      if (!connectedUser) return;

      upsertCloudAccount({ db, email: connectedUser.email });
      setUser(connectedUser);
      toast.success("Google account connected");

      await offerRestore(connectedUser.email);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const disconnect = async () => {
    setIsDisconnectDialogOpen(false);
    setIsBusy(true);

    try {
      await signOutGoogle();
      deleteCloudAccount(db);
      setUser(null);
      toast.success("Google account disconnected");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View className="main gap-y-6">
      <View className="flex-row gap-x-3 rounded-md border border-border bg-elevated p-4">
        <DynamicIcon
          family="Feather"
          name="info"
          size={18}
          color={COLORS.primary}
        />
        <Text className="flex-1 text-sm font-sans text-text-secondary">
          A Google account is needed to upload and restore your backups. Your
          passwords are encrypted before they leave this device, and are stored
          in a private app folder on your Google Drive.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : user ? (
        <View className="gap-y-4">
          <View className="flex-row items-center gap-x-3 px-1">
            {user.photo ? (
              <Image
                source={{ uri: user.photo }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
            ) : (
              <View className="h-12 w-12 items-center justify-center rounded-full bg-elevated">
                <DynamicIcon
                  family="Feather"
                  name="user"
                  size={22}
                  color={COLORS.textSecondary}
                />
              </View>
            )}
            <View className="flex-1 gap-y-0.5">
              <Text
                className="text-base font-sans-semibold text-text-primary"
                numberOfLines={1}
              >
                {user.name ?? "Google account"}
              </Text>
              <Text
                className="text-sm font-sans text-text-secondary"
                numberOfLines={1}
              >
                {user.email}
              </Text>
            </View>
          </View>

          <Button
            variant="outline"
            onPress={() => setIsDisconnectDialogOpen(true)}
            disabled={isBusy}
          >
            <Text className="btn-label-dark">Disconnect</Text>
          </Button>
        </View>
      ) : (
        <Button onPress={connect} disabled={isBusy}>
          <Text className="btn-label-white">Connect Google Account</Text>
        </Button>
      )}

      <ConfirmDialog
        open={isDisconnectDialogOpen}
        onOpenChange={setIsDisconnectDialogOpen}
        title="Disconnect account?"
        description="You won't be able to upload or restore backups until you connect a Google account again. Existing backups on Drive are not deleted."
        onConfirm={disconnect}
        confirmText="Disconnect"
        confirmVariant="destructive"
      />
    </View>
  );
};

export default AccountScreen;
