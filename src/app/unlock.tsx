import image from "@/constants/images";
import { SECURE_KEYS } from "@/constants/secure-keys";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import {
  biometricConfigQuery,
  getAppConfig,
} from "@/db/queries/appConfig.queries";
import { decrypt, getDerivedKey } from "@/lib/crypto";
import { getSecureItem } from "@/lib/secure-storage";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { toast } from "sonner-native";

const UnlockScreen = () => {
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const db = useDb();
  const { setAppState, setDerivedKey } = useCrypto();
  const { data } = useLiveQuery(biometricConfigQuery(db));

  let isBiometricEnabled = data?.[0]?.biometricEnabled ?? null;

  const biometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm your identity",
      fallbackLabel: "Use master password", // shows if biometric fails
      cancelLabel: "Cancel",
      disableDeviceFallback: true,
    });

    if (result.success) {
      const masterPassword = await getSecureItem(SECURE_KEYS.MASTER_PASSWORD);

      const appConfig = await getAppConfig(db);

      const salt = appConfig?.salt;

      if (!masterPassword || !salt) {
        toast.error("Something went wrong, cannot authenticate user");
        return;
      }

      const derivedKey = await getDerivedKey({ masterPassword, salt });

      const decrypted = decrypt(appConfig.passwordVerifier, derivedKey);
      if (decrypted !== SECURE_KEYS.PASSWORD_VERFIER) {
        toast.error("Something went wrong, cannot authenticate user");
        return;
      }

      setDerivedKey(derivedKey);
      setAppState("unlocked");
    } else {
      switch (result.error) {
        case "user_cancel":
        case "app_cancel":
        case "system_cancel":
          toast.info("Biometric cancelled. Please use master password.");
          setShowPasswordFallback(true);
          break;

        case "authentication_failed":
        case "timeout":
        case "unable_to_process":
          toast.info("Biometric failed. Please use master password.");
          setShowPasswordFallback(true);
          break;

        case "not_enrolled":
        case "not_available":
        case "passcode_not_set":
          toast.info("Biometric unavailable. Please use master password.");
          setShowPasswordFallback(true);
          break;

        case "user_fallback":
          // user explicitly tapped the fallback label
          setShowPasswordFallback(true);
          break;

        case "unknown":
        default:
          toast.error("Something went wrong. Please use master password.");
          setShowPasswordFallback(true);
          break;
      }
    }
  };

  useEffect(() => {
    if (isBiometricEnabled) {
      biometricAuth();
    }
  }, [isBiometricEnabled]);

  return (
    <View className="main flex-col items-center">
      <View className="flex-row justify-center mt-10">
        <Image source={image.lock} className="size-56" />
      </View>
      {(isBiometricEnabled === false || showPasswordFallback) && (
        <Text>Master Password</Text>
      )}
    </View>
  );
};

export default UnlockScreen;
