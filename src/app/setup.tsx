import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import image from "@/constants/images";
import { cn } from "@/lib/utils";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import { useState } from "react";
import { Image, Text, View } from "react-native";

const PASSWORD_STRENGTH_INDICATOR = [
  { label: "Very Weak", color: "bg-red-500" },
  { label: "Weak", color: "bg-orange-500" },
  { label: "Fair", color: "bg-yellow-500" },
  { label: "Good", color: "bg-lime-500" },
  { label: "Strong", color: "bg-green-500" },
];
const options = {
  dictionary: {
    ...zxcvbnEnPackage.dictionary,
  },

  translations: zxcvbnEnPackage.translations,
};
const Setup = () => {
  const [masterPin, setMasterPin] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [passwordStrengthScore, setPasswordStrengthScore] = useState(0);
  const [passwordSuggestion, setPasswordSuggestion] = useState("");
  const [isTypingPassword, setIsTypingPassword] = useState(false);

  const zxcvbn = new ZxcvbnFactory(options);

  const toggleSecureText = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const handleTextChange = (password: string) => {
    setIsTypingPassword(true);
    setMasterPin(password);
    let result = zxcvbn.check(password);
    setPasswordStrengthScore(result.score);
    setPasswordSuggestion(result.feedback.suggestions.join(" "));
  };

  return (
    <View className="flex-1 flex-col items-center bg-background screen-x-padding pt-safe gap-y-3">
      <View className="flex-col items-center mt-10 gap-y-1">
        <Image source={image.key} className="size-40" />
        <Text className="font-sans-bold text-2xl">Master Password</Text>
      </View>

      <View className="flex-col mt-5 w-full gap-y-3">
        {/* password strength indicator */}
        {isTypingPassword && (
          <View className="flex-col gap-y-3">
            <View className="h-3 rounded-full bg-gray-200 w-full">
              <View
                className={cn(
                  "h-3 rounded-full",
                  PASSWORD_STRENGTH_INDICATOR[passwordStrengthScore].color,
                )}
                style={{ width: `${((passwordStrengthScore + 1) / 5) * 100}%` }}
              />
            </View>
            <Text className="font-sans-semibold text-sm">
              {PASSWORD_STRENGTH_INDICATOR[passwordStrengthScore].label}
            </Text>
            {passwordSuggestion.length > 0 && (
              <Text className="font-sans-semibold text-sm">
                {passwordSuggestion}
              </Text>
            )}
          </View>
        )}
        <View className="flex-row rounded-md border border-black h-14 overflow-hidden">
          <Input
            value={masterPin}
            onChangeText={handleTextChange}
            className="flex-1 rounded-none border-0 pl-3 pr-5"
            cursorColor="#000000"
            secureTextEntry={secureTextEntry}
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

      <Button className="py-3 w-full">
        <Text className="btn-label">Submit</Text>
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

export default Setup;
