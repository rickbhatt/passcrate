import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import image from "@/constants/images";
import { SECURE_KEYS } from "@/constants/storage-keys";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import { storeSalt } from "@/db/mutations/appConfig.mutation";
import { setSecureItem } from "@/lib/secure-storage";
import { checkBiometricSupport, cn } from "@/lib/utils";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import QuickCrypto from "react-native-quick-crypto";
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const PASSWORD_STRENGTH_INDICATOR = [
  { label: "Very Weak", color: "bg-red-500" },
  { label: "Weak", color: "bg-orange-500" },
  { label: "Fair", color: "bg-yellow-500" },
  { label: "Good", color: "bg-sky-500" },
  { label: "Strong", color: "bg-green-500" },
];
const options = {
  dictionary: {
    ...zxcvbnEnPackage.dictionary,
  },

  translations: zxcvbnEnPackage.translations,
};
const zxcvbn = new ZxcvbnFactory(options);
const SetupMasterPassword = () => {
  const [masterPassword, setMasterPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0);
  const [isTypingPassword, setIsTypingPassword] = useState(false);

  const db = useDb();

  const { setDerivedKey, setAppState } = useCrypto();

  const router = useRouter();

  const progress = useSharedValue(0);

  const toggleSecureText = () => {
    setSecureTextEntry((prev) => !prev);
  };

  const handleTextChange = (password: string) => {
    setIsTypingPassword(password.length > 0);
    setMasterPassword(password);
    let result = zxcvbn.check(password);
    progress.value = withTiming((result.score + 1) / 5, {
      duration: 250,
    });
    setPasswordStrengthScore(result.score);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleCreatePassword = async () => {
    const saltBytes = QuickCrypto.randomBytes(16);
    const salt = saltBytes.toString("hex");

    try {
      // derive key
      const derivedKey = await new Promise<string>((resolve, reject) => {
        QuickCrypto.pbkdf2(
          masterPassword,
          salt,
          100000,
          32,
          "sha256",
          (err, key) => {
            if (err || !key) return reject(err);
            resolve(key.toString("hex"));
          },
        );
      });

      await storeSalt({ db, salt });

      setDerivedKey(derivedKey);

      let isBiometric = await checkBiometricSupport();

      if (isBiometric) {
        await setSecureItem(SECURE_KEYS.MASTER_PASSWORD, masterPassword);
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
        {/* password strength indicator section */}
        {isTypingPassword && (
          <Animated.View
            className="flex-col gap-y-3"
            entering={FadeInDown.duration(250)}
            exiting={FadeOutUp.duration(150)}
          >
            {/* progress bar */}
            <View className="h-3 rounded-full bg-gray-200 w-full">
              <Animated.View
                className={cn(
                  "h-3 rounded-full",
                  PASSWORD_STRENGTH_INDICATOR[passwordStrengthScore].color,
                )}
                style={animatedStyle}
              />
            </View>
            <Text className="font-sans-semibold text-sm">
              {PASSWORD_STRENGTH_INDICATOR[passwordStrengthScore].label}
            </Text>

            <Text className="font-sans-semibold text-sm">
              Recommended strength: Good or higher.
            </Text>
          </Animated.View>
        )}
        <View className="flex-row rounded-md border border-black h-14 overflow-hidden">
          <Input
            value={masterPassword}
            onChangeText={handleTextChange}
            className="flex-1 rounded-none border-0 pl-3 pr-5"
            cursorColor="#000000"
            secureTextEntry={secureTextEntry}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textContentType="newPassword"
          />
          <Button variant="ghost" onPress={toggleSecureText}>
            <DynamicIcon
              family="Entypo"
              name={secureTextEntry ? "eye" : "eye-with-line"}
              size={24}
              color={"#000000"}
            />
          </Button>
        </View>
      </View>

      <Button
        onPress={handleCreatePassword}
        className="py-3 w-full"
        disabled={passwordStrengthScore < 3}
      >
        <Text className="btn-label">Create Password</Text>
      </Button>
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
