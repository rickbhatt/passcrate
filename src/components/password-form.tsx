import FormInput from "@/components/form-input";
import { styled } from "nativewind";
import { View } from "react-native";
import {
  KeyboardAwareScrollView as RNKeyboardAwareScrollView,
  useKeyboardState,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PasswordFormProps } from "types";

const KeyboardAwareScrollView = styled(
  RNKeyboardAwareScrollView as React.ComponentType<any>,
);

const PasswordForm = ({ value, onChange, onSubmit }: PasswordFormProps) => {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardState();

  return (
    <View className="flex-1 bg-background">
      <KeyboardAwareScrollView
        bottomOffset={insets.bottom}
        className="screen-x-padding"
        contentContainerClassName="flex-1 gap-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: keyboard.isVisible ? 0 : insets.bottom,
        }}
      >
        <FormInput
          label="Title"
          inputType="text"
          inputName="title"
          value={value.title}
          onChange={onChange}
        />
        <FormInput
          label="Username"
          inputType="text"
          inputName="username"
          value={value.username}
          onChange={onChange}
        />
        <FormInput
          label="Password"
          inputType="text"
          inputName="password"
          value={value.password}
          onChange={onChange}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default PasswordForm;
