import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Text, View } from "react-native";
import { FieldName } from "types";

interface FormInputProps<TExtraFields extends Record<string, unknown> = {}> {
  inputType: "text" | "date" | "checkbox" | "textarea" | "select";
  label?: string;
  inputName: string;
  onChange: (field: FieldName<TExtraFields>, rawValue: string) => void;
  value: string;
  secureTextEntry?: boolean;
  placeholder?: string;
  className?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoFocus?: boolean;
  maxLength?: number;
  editable?: boolean;
}

const FormInput = ({
  value,
  inputType,
  label,
  inputName,
  secureTextEntry = false,
  placeholder = "",
  className,
  autoCapitalize = "none",
  autoFocus = false,
  maxLength = undefined,
  editable = true,
  onChange,
}: FormInputProps) => {
  const handleOnChange = (field: FieldName, rawValue: string) => {
    onChange(field, rawValue);
  };

  switch (inputType) {
    case "text":
      return (
        <View className="form-group">
          <Text className="form-label">{label}</Text>
          <Input
            value={value}
            onChangeText={(text) => handleOnChange(inputName, text)}
            secureTextEntry={secureTextEntry}
            placeholder={placeholder}
            className={cn("h-14 text-base bg-background", className)}
            autoCapitalize={autoCapitalize}
            autoFocus={autoFocus}
            numberOfLines={1}
            multiline={false}
            maxLength={maxLength}
            editable={editable}
          />
        </View>
      );
  }
};

export default FormInput;
