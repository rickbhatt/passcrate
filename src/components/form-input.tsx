import { Input } from "@/components/ui/input";
import { Text, View } from "react-native";
import { FieldName } from "types";

interface FormInputProps<TExtraFields extends Record<string, unknown> = {}> {
  inputType: "text" | "date" | "checkbox" | "textarea" | "select";
  label?: string;
  inputName: string;
  onChange: (field: FieldName<TExtraFields>, rawValue: string | number) => void;
  value: string;
}

const FormInput = ({ value, inputType, label, inputName }: FormInputProps) => {
  const handleOnChange = (field: FieldName, rawValue: string) => {};

  switch (inputType) {
    case "text":
      return (
        <View>
          <Text>{label}</Text>
          <Input
            value={value}
            onChangeText={(text) => handleOnChange(inputName, text)}
          />
        </View>
      );
  }
};

export default FormInput;
