import { Button } from "@/components/ui/button";
import image from "@/constants/images";
import { SECURE_KEYS } from "@/constants/secure-keys";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import { updateBiometric } from "@/db/mutations/appConfig.mutation";
import { setSecureItem } from "@/lib/secure-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { BackHandler, Image, Platform, Text, View } from "react-native";
import { toast } from "sonner-native";

const SetupBiometric = () => {
  const { setAppState, pendingMasterPassword, setPendingMasterPassword } =
    useCrypto();

  const db = useDb();

  const router = useRouter();

  const [isBusy, setIsBusy] = useState(false);
  const isAuthenticating = useRef(false);

  const handleSkip = async () => {
    toast.info("You can enable it later in settings");
    setPendingMasterPassword(null);
    setAppState("unlocked");
  };

  const handleEnable = async () => {
    if (isAuthenticating.current) return;
    isAuthenticating.current = true;
    setIsBusy(true);

    try {
      if (Platform.OS === "ios") {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Confirm your identity",
          fallbackLabel: "Use master password",
          cancelLabel: "Cancel",
          disableDeviceFallback: true,
        });

        if (!result.success) {
          if (result.error === "lockout") {
            setPendingMasterPassword(null);
            setAppState("unlocked");
          }
          return;
        }
      }
      try {
        if (!pendingMasterPassword) {
          toast.error(
            "Something went wrong. Please set up your master password again.",
          );
          router.replace("/setup/master-password");
          return;
        }

        await setSecureItem(
          SECURE_KEYS.MASTER_PASSWORD,
          pendingMasterPassword,
          {
            requireAuthentication: true,
            authenticationPrompt: "Verify it's you",
          },
        );

        setPendingMasterPassword(null);
        await updateBiometric(db);
        toast.success("Biometric enabled successfully");
        setAppState("unlocked");
      } catch (error) {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      isAuthenticating.current = false;
      setIsBusy(false);
    }
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleSkip();
        return true; // prevents the default "exit app" behavior
      },
    );
    return () => subscription.remove();
  }, []);
  return (
    <View className="flex-1 flex-col items-center bg-background screen-x-padding pt-safe gap-y-3">
      <View className="flex-col items-center mt-10 gap-y-1">
        <Image source={image.fingerPrint} className="size-40" />
        <Text className="font-sans-bold text-2xl">Setup Biometric</Text>
      </View>
      <View className="flex-col mt-5 w-full gap-y-3">
        <Text className="font-sans-bold text-base">
          If you don't enable biometric authentication, you'll need to enter
          your master password every time you open the app. Enabling biometrics
          lets you unlock the app using your fingerprint or face instead.
        </Text>
        <View className="flex-row items-center gap-x-3">
          <Button
            onPress={handleSkip}
            variant={"outline"}
            disabled={isBusy}
            className="flex-1 basis-0 p-4"
          >
            <Text className="text-base font-sans-semibold text-text-primary">
              Skip
            </Text>
          </Button>
          <Button
            onPress={handleEnable}
            disabled={isBusy}
            className="flex-1 basis-0 p-4"
          >
            <Text className="btn-label">Enable</Text>
          </Button>
        </View>
      </View>
    </View>
  );
};

export default SetupBiometric;
