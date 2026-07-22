import { Button } from "@/components/ui/button";
import image from "@/constants/images";
import { SECURE_KEYS } from "@/constants/secure-keys";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import { updateBiometric } from "@/db/mutations/appConfig.mutation";
import { deleteSecureItem } from "@/lib/secure-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Image, Text, View } from "react-native";
import { toast } from "sonner-native";

const SetupBiometric = () => {
  const { setAppState } = useCrypto();

  const db = useDb();

  const handleSkip = async () => {
    await deleteSecureItem(SECURE_KEYS.MASTER_PASSWORD);
    setAppState("unlocked");
  };

  const handleEnable = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm your identity",
      fallbackLabel: "Use master password", // shows if biometric fails
      cancelLabel: "Cancel",
      disableDeviceFallback: true, // I do not want device pin as fallback
    });

    if (result.success) {
      await updateBiometric(db);
      toast.success("Biometric enabled successfully");
      setAppState("unlocked");
    } else {
      switch (result.error) {
        case "user_cancel":
        case "system_cancel":
          // user dismissed the prompt — do nothing, let them try again or skip
          break;

        case "lockout":
          // too many failed attempts, device locked biometric
          // treat as skip, inform user
          await deleteSecureItem(SECURE_KEYS.MASTER_PASSWORD);
          setAppState("unlocked");
          toast.info("Biometric locked, you can enable it later in settings");
          break;

        default:
          // any other failure — let them retry or skip
          break;
      }
    }
  };

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
            className="flex-1 basis-0 p-4"
          >
            <Text className="text-base font-sans-semibold text-text-primary">
              Skip
            </Text>
          </Button>
          <Button onPress={handleEnable} className="flex-1 basis-0 p-4">
            <Text className="btn-label">Enable</Text>
          </Button>
        </View>
      </View>
    </View>
  );
};

export default SetupBiometric;
