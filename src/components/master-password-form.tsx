import PasswordInput from "@/components/password-input";
import { Button } from "@/components/ui/button";
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
  return (
    <View className="flex-col gap-y-3 self-stretch">
      <PasswordInput value={value} onChange={onChange} />
      <Button onPress={onSubmit} className="py-3 w-full" disabled={disabled}>
        <Text className="btn-label-white">{buttonLabel}</Text>
      </Button>
    </View>
  );
};

export default MasterPasswordForm;
