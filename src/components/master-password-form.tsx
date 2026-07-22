import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLORS } from "@/constants/theme";
import { useState } from "react";
import { Text, View } from "react-native";

interface MasterPasswordFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  buttonLabel: string;
  disabled?: boolean;
}

const MasterPasswordForm = ({
  value,
  onChange,
  onSubmit,
  buttonLabel,
  disabled,
}: MasterPasswordFormProps) => {
  const [masterPassword, setMasterPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const toggleSecureText = () => {
    setSecureTextEntry((prev) => !prev);
  };

  return (
    <View className="flex-col gap-y-3">
      <View className="flex-row rounded-md border border-black h-14 overflow-hidden">
        <Input
          value={value}
          onChangeText={onChange}
          className="flex-1 rounded-none border-0 pl-3 pr-5"
          cursorColor="#000000"
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textContentType="newPassword"
          placeholder="your password here..."
          textAlignVertical="center"
          placeholderTextColor={COLORS.textSecondary}
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
      <Button onPress={onSubmit} className="py-3 w-full" disabled={disabled}>
        <Text className="btn-label">{buttonLabel}</Text>
      </Button>
    </View>
  );
};

export default MasterPasswordForm;
