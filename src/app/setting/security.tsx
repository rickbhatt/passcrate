import DynamicIcon from "@/components/dynamic-icon";
import MasterPasswordForm from "@/components/master-password-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { SECURE_KEYS } from "@/constants/secure-keys";
import { useThemeColors } from "@/constants/theme";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import { updateBiometric } from "@/db/mutations/appConfig.mutation";
import {
  biometricEnabledQuery,
  getAppConfig,
} from "@/db/queries/appConfig.queries";
import { getDerivedKey } from "@/lib/crypto";
import { deleteSecureItem, setSecureItem } from "@/lib/secure-storage";
import { checkBiometricSupport } from "@/lib/utils";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { toast } from "sonner-native";

const SecurityScreen = () => {
  const COLORS = useThemeColors();
  const db = useDb();
  const router = useRouter();
  const { derivedKey, setBiometricAuthInProgress } = useCrypto();
  const { data } = useLiveQuery(biometricEnabledQuery(db));

  const [isBusy, setIsBusy] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const isAuthenticating = useRef(false);

  const isBiometricEnabled = data?.[0]?.biometricEnabled ?? false;

  const closePasswordDialog = (open: boolean) => {
    setIsPasswordDialogOpen(open);
    if (!open) setMasterPassword("");
  };

  const handleToggle = async (enabled: boolean) => {
    if (!enabled) {
      await disableBiometric();
      return;
    }

    const isSupported = await checkBiometricSupport();
    if (!isSupported) {
      toast.error("No fingerprint or face unlock is set up on this device");
      return;
    }
    setIsPasswordDialogOpen(true);
  };

  const disableBiometric = async () => {
    setIsBusy(true);
    try {
      await deleteSecureItem(SECURE_KEYS.MASTER_PASSWORD);
      await updateBiometric({ db, enabled: false });
      toast.success("Fingerprint lock disabled");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const enableBiometric = async () => {
    if (isAuthenticating.current) return;
    isAuthenticating.current = true;
    setIsBusy(true);
    // The OS prompt can blip the app to "background"; don't lock the vault.
    setBiometricAuthInProgress(true);

    try {
      const appConfig = await getAppConfig(db);
      if (!appConfig?.salt) {
        throw new Error("Missing salt");
      }

      const key = await getDerivedKey({ masterPassword, salt: appConfig.salt });
      if (key !== derivedKey) {
        toast.error("Incorrect master password");
        return;
      }

      if (Platform.OS === "ios") {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Confirm your identity",
          cancelLabel: "Cancel",
          disableDeviceFallback: true,
        });
        if (!result.success) return;
      }

      await setSecureItem(SECURE_KEYS.MASTER_PASSWORD, masterPassword, {
        requireAuthentication: true,
        authenticationPrompt: "Verify it's you",
      });
      await updateBiometric({ db, enabled: true });

      closePasswordDialog(false);
      toast.success("Fingerprint lock enabled");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      isAuthenticating.current = false;
      setBiometricAuthInProgress(false);
      setIsBusy(false);
    }
  };

  return (
    <View className="main">
      <View className="flex-row items-center gap-x-3 px-1 py-3">
        <View className="flex-1 gap-y-0.5">
          <Text className="text-base font-sans-semibold text-text-primary">
            Fingerprint Lock
          </Text>
          <Text className="text-sm font-sans text-text-secondary">
            Unlock with your fingerprint instead of your master password
          </Text>
        </View>
        <Switch
          checked={isBiometricEnabled}
          onCheckedChange={handleToggle}
          disabled={isBusy}
        />
      </View>

      <View className="h-px bg-border" />

      <Button
        variant="ghost"
        onPress={() => router.push("/setting/change-master-password")}
        className="h-auto w-full flex-row items-center gap-x-3 rounded-none px-1 py-3"
      >
        <View className="flex-1 gap-y-0.5">
          <Text className="text-base font-sans-semibold text-text-primary">
            Change Master Password
          </Text>
          <Text className="text-sm font-sans text-text-secondary">
            Re-encrypts all your saved passwords with a new master password
          </Text>
        </View>
        <DynamicIcon
          family="Feather"
          name="chevron-right"
          size={18}
          color={COLORS.textSecondary}
        />
      </Button>

      <Dialog open={isPasswordDialogOpen} onOpenChange={closePasswordDialog}>
        <DialogContent
          className="bg-elevated"
          closeIconColor={COLORS.textPrimary}
        >
          <DialogHeader>
            <DialogTitle className="h3-bold">
              Confirm master password
            </DialogTitle>
            <DialogDescription className="base-paragraph">
              Enter your master password to turn on fingerprint lock.
            </DialogDescription>
          </DialogHeader>
          <MasterPasswordForm
            value={masterPassword}
            onChange={setMasterPassword}
            onSubmit={enableBiometric}
            buttonLabel="Enable"
            disabled={isBusy || masterPassword.length < 1}
          />
        </DialogContent>
      </Dialog>
    </View>
  );
};

export default SecurityScreen;
