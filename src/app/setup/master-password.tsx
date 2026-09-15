import MasterPasswordForm from "@/components/master-password-form";
import PasswordStrengthMeter from "@/components/password-strength-meter";
import image from "@/constants/images";
import { SECURE_KEYS } from "@/constants/secure-keys";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import { storeSalt } from "@/db/mutations/appConfig.mutation";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import { encrypt, getDerivedKey } from "@/lib/crypto";
import { checkBiometricSupport } from "@/lib/utils";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import QuickCrypto from "react-native-quick-crypto";
import { toast } from "sonner-native";

const SetupMasterPassword = () => {
  const [masterPassword, setMasterPassword] = useState("");

  const { score: passwordStrengthScore } = usePasswordStrength(masterPassword);

  const db = useDb();

  const { setDerivedKey, setAppState, setPendingMasterPassword } = useCrypto();

  const router = useRouter();

  const handleCreatePassword = async () => {
    const saltBytes = QuickCrypto.randomBytes(16);
    const salt = saltBytes.toString("hex");

    try {
      // derive key
      const derivedKey = await getDerivedKey({ masterPassword, salt });

      const verifier = encrypt(SECURE_KEYS.PASSWORD_VERIFIER, derivedKey);

      await storeSalt({ db, salt, verifier });

      setDerivedKey(derivedKey);

      toast.success("Password created successfully");

      let isBiometric = await checkBiometricSupport();

      if (isBiometric) {
        setPendingMasterPassword(masterPassword);
        router.replace("/setup/biometric");
      } else {
        setAppState("unlocked");
      }
    } catch (error) {
      console.error("🚀 ~ handleCreatePassword ~ error", error);
      return;
    }
  };

  return (
    <View className="flex-1 flex-col items-center bg-background screen-x-padding pt-safe gap-y-3">
      <View className="flex-col items-center mt-10 gap-y-1">
        <Image source={image.key} className="size-40" />
        <Text className="font-sans-bold text-2xl">Master Password</Text>
      </View>

      <View className="flex-col mt-5 w-full gap-y-3">
        <PasswordStrengthMeter
          password={masterPassword}
          hintText="Recommended strength: Good or higher."
        />
        <MasterPasswordForm
          value={masterPassword}
          onChange={setMasterPassword}
          onSubmit={handleCreatePassword}
          buttonLabel="Create password"
          disabled={passwordStrengthScore < 3}
        />
      </View>

      <View>
        <Text className="text-text-primary font-sans-semibold text-sm">
          Choose a strong master password you can remember. If you forget it,
          your data cannot be recovered.
        </Text>
      </View>
    </View>
  );
};

export default SetupMasterPassword;
