import ConfirmDialog from "@/components/confirm-dialog";
import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/constants/theme";
import { useCrypto } from "@/contexts/CryptoContext";
import {
  configureGoogleSignIn,
  DRIVE_APPDATA_SCOPE,
  getGoogleUser,
  type GoogleUser,
} from "@/lib/google-auth";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { toast } from "sonner-native";

const AccountScreen = () => {
  const COLORS = useThemeColors();
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

  const connect = async () => {
    setIsBusy(true);
    // The Google account picker backgrounds the app; don't lock the vault.
    setBiometricAuthInProgress(true);

    try {
      configureGoogleSignIn();
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return;

      // The user can untick Drive access on the consent screen.
      if (!response.data.scopes.includes(DRIVE_APPDATA_SCOPE)) {
        const scoped = await GoogleSignin.addScopes({
          scopes: [DRIVE_APPDATA_SCOPE],
        });
        if (!scoped || !isSuccessResponse(scoped)) {
          await GoogleSignin.signOut();
          toast.error("Drive access is required for backups");
          return;
        }
      }

      setUser(response.data.user);
      toast.success("Google account connected");
    } catch (error) {
      console.error(error);
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            return;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            toast.error("Google Play Services is unavailable or outdated");
            return;
        }
      }
      toast.error("Couldn't connect your Google account. Please try again.");
    } finally {
      setBiometricAuthInProgress(false);
      setIsBusy(false);
    }
  };

  const disconnect = async () => {
    setIsDisconnectDialogOpen(false);
    setIsBusy(true);

    try {
      // Revoke so the next connect asks for Drive access again.
      await GoogleSignin.revokeAccess().catch(() => null);
      await GoogleSignin.signOut();
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
