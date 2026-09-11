/**
 * `ref` and `insideBottomSheet` are forwarded straight through to Input.
 * The ref is required for manual .focus()/.blur() control from parents
 * like FolderBottomSheet - autoFocus is intentionally NOT relied on for
 * inputs inside a bottom sheet (see gorhom/react-native-bottom-sheet
 * issue #2661 - autoFocus races the sheet's open animation and can leave
 * the keyboard/focus state stuck).
 */

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Text, TextInput, View } from "react-native";
import { FieldName } from "types";

interface FormInputProps<TExtraFields extends Record<string, unknown> = {}> {
  inputType: "text" | "date" | "checkbox" | "textarea" | "select";
  label?: string;
  isRequired?: boolean;
  inputName: string;
  onChange: (field: FieldName<TExtraFields>, rawValue: string) => void;
  value: string | null | undefined;
  error?: string;
  secureTextEntry?: boolean;
  placeholder?: string;
  className?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoFocus?: boolean;
  maxLength?: number;
  editable?: boolean;
  insideBottomSheet?: boolean;
  keyboardType?: "default" | "numeric";
  ref?: React.Ref<TextInput>;
}

const FormInput = ({
  value,
  inputType,
  label,
  isRequired = false,
  inputName,
  error,
  secureTextEntry = false,
  placeholder = "",
  className,
  autoCapitalize = "none",
  autoFocus = false,
  maxLength = undefined,
  editable = true,
  insideBottomSheet = false,
  keyboardType = "default",
  onChange,
  ref,
}: FormInputProps) => {
  const handleOnChange = (field: string, rawValue: string) => {
    onChange(field as FieldName, rawValue);
  };

  switch (inputType) {
    case "text":
      return (
        <View className="form-group">
          <Text className="form-label">
            {label}
            {isRequired && <Text className="text-red-500"> *</Text>}
          </Text>
          <Input
            ref={ref}
            value={value ?? ""}
            onChangeText={(text) => handleOnChange(inputName, text)}
            secureTextEntry={secureTextEntry}
            placeholder={placeholder}
            className={cn(
              "h-14 text-base bg-background",
              error && "border-red-500",
              className,
            )}
            autoCapitalize={autoCapitalize}
            autoFocus={autoFocus}
            numberOfLines={1}
            multiline={false}
            maxLength={maxLength}
            editable={editable}
            insideBottomSheet={insideBottomSheet}
            keyboardType={keyboardType}
          />
          {error && (
            <Text className="text-red-500 text-sm mt-1">{error}</Text>
          )}
        </View>
      );
  }
};

export default FormInput;
