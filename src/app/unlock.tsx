import MasterPasswordForm from "@/components/master-password-form";
import { Button } from "@/components/ui/button";
import { BIOMETRIC } from "@/constants/biometric";
import image from "@/constants/images";
import { SECURE_KEYS } from "@/constants/secure-keys";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import {
  biometricConfigQuery,
  getAppConfig,
} from "@/db/queries/appConfig.queries";
import { useSettleGuard } from "@/hooks/useSettleGuard";
import { decrypt, getDerivedKey } from "@/lib/crypto";
import { getSecureItem } from "@/lib/secure-storage";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  AppState as RNAppState,
  Text,
  View,
} from "react-native";
import { toast } from "sonner-native";

const UnlockScreen = () => {
  const [masterPassword, setMasterPassword] = useState("");
  const db = useDb();
  const { appState, setAppState, setDerivedKey, setBiometricAuthInProgress } =
    useCrypto();
  const { data } = useLiveQuery(biometricConfigQuery(db));
  const guard = useSettleGuard(BIOMETRIC.RETRY_SETTLE_MS);
  const [isBusy, setIsBusy] = useState(false);
  const appStateRef = useRef(appState);
  appStateRef.current = appState;

  let isBiometricEnabled = data?.[0]?.biometricEnabled ?? null;

  const deriveAndVerifyKey = async (masterPassword: string) => {
    const appConfig = await getAppConfig(db);

    const salt = appConfig?.salt;

    if (!salt) {
      throw new Error("Missing salt");
    }

    const derivedKey = await getDerivedKey({ masterPassword, salt });

    try {
      const decrypted = decrypt(appConfig.passwordVerifier, derivedKey);

      if (decrypted !== SECURE_KEYS.PASSWORD_VERIFIER) {
        throw new Error("Password verifier mismatch");
      }

      return derivedKey;
    } catch {
      throw new Error("Incorrect password");
    }
  };

  const biometricAuth = async () => {
    if (guard.isActive()) return;
    guard.start();
    setBiometricAuthInProgress(true);
    setIsBusy(true);

    try {
      const masterPassword = await getSecureItem(SECURE_KEYS.MASTER_PASSWORD, {
        requireAuthentication: true,
        authenticationPrompt: "Verify it's you",
      });

      if (!masterPassword) {
        toast.error("Something went wrong, cannot authenticate user");
        return;
      }
      const derivedKey = await deriveAndVerifyKey(masterPassword);

      if (!derivedKey) {
        toast.error("Something went wrong, cannot authenticate user");
        return;
      }

      setDerivedKey(derivedKey);
      setAppState("unlocked");
    } catch (error) {
      console.log(error);
    } finally {
      guard.end();
      setBiometricAuthInProgress(false);
      setIsBusy(false);
    }
  };

  // Always call the latest biometricAuth from the AppState listener below
  // without re-subscribing it every render.
  const biometricAuthRef = useRef(biometricAuth);
  biometricAuthRef.current = biometricAuth;

  const handlePasswordSubmit = async () => {
    try {
      const derivedKey = await deriveAndVerifyKey(masterPassword);

      setDerivedKey(derivedKey);
      setAppState("unlocked");
    } catch (error) {
      if (error instanceof Error && error.message === "Incorrect password") {
        toast.error("Incorrect master password");
      } else {
        toast.error("Something went wrong. Please try again.");
        console.error(error);
      }
    }
  };

  // The unlock screen can mount while the app is still backgrounded
  // (CryptoContext flips to "unlock" on the AppState "background" event
  // itself), so firing biometrics unconditionally on mount fails with no
  // resumed activity to attach the prompt to. Only attempt while actually
  // active, and retry when we're confirmed to have regained the foreground:
  // Android's "change" -> "active" event is unreliable for that, "focus" is
  // the reliable signal there; iOS doesn't have this problem. "focus" also
  // fires from the biometric dialog's own open/close (not just genuine
  // backgrounding), so `guard` (cooling down after any recent attempt) and
  // the appState freshness check below filter out those spurious retriggers.
  useEffect(() => {
    if (!isBiometricEnabled) return;

    const attempt = () => {
      if (appStateRef.current !== "unlock") return;
      if (RNAppState.currentState !== "active") return;
      biometricAuthRef.current();
    };

    attempt();

    const subscription =
      Platform.OS === "android"
        ? RNAppState.addEventListener("focus", attempt)
        : RNAppState.addEventListener("change", (state) => {
            if (state === "active") attempt();
          });

    return () => subscription.remove();
  }, [isBiometricEnabled]);

  return (
    <View className="main flex-col items-center justify-center screen-x-padding">
      <View className="flex-row justify-center">
        <Image source={image.logo} className="size-48" />
      </View>
      {isBiometricEnabled === true && (
        <View className="flex-col gap-y-4 items-center w-full mt-5">
          <Text className="h2-bold">PassCrate Locked</Text>
          <Button
            variant="outline"
            className="w-full"
            disabled={isBusy}
            onPress={() => biometricAuthRef.current()}
          >
            <Text className="font-sans-semibold text-base">Unlock</Text>
          </Button>
        </View>
      )}
      {isBiometricEnabled === false && (
        <View className="flex-col gap-y-4 items-center w-full">
          <View className="flex-col w-full gap-y-4">
            <Text className="form-label">Master Password</Text>
            <MasterPasswordForm
              value={masterPassword}
              onChange={setMasterPassword}
              onSubmit={handlePasswordSubmit}
              buttonLabel="Login"
              disabled={masterPassword.length < 1}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default UnlockScreen;
