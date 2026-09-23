import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThemeColors } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { View } from "react-native";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  textContentType?: "password" | "newPassword";
}

const PasswordInput = ({
  value,
  onChange,
  placeholder = "your password here...",
  hasError = false,
  textContentType = "newPassword",
}: PasswordInputProps) => {
  const COLORS = useThemeColors();
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const toggleSecureText = () => {
    setSecureTextEntry((prev) => !prev);
  };

  return (
    <View
      className={cn(
        "flex-row items-stretch rounded-md border border-border bg-card h-14 overflow-hidden",
        hasError && "border-danger",
      )}
    >
      <Input
        value={value}
        onChangeText={onChange}
        className="flex-1 h-full rounded-none border-0 pl-3 pr-5"
        cursorColor={COLORS.textPrimary}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textContentType={textContentType}
        placeholder={placeholder}
        textAlignVertical="center"
        placeholderTextColor={COLORS.textSecondary}
      />
      <Button
        className="h-full min-h-0 bg-card border-0 rounded-none"
        variant="ghost"
        onPress={toggleSecureText}
      >
        <DynamicIcon
          family="Entypo"
          name={secureTextEntry ? "eye" : "eye-with-line"}
          size={24}
          color={COLORS.textPrimary}
        />
      </Button>
    </View>
  );
};

export default PasswordInput;
