import FormInput from "@/components/form-input";
import { Button } from "@/components/ui/button";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { RefObject, useRef, useState } from "react";
import { Keyboard, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { FolderInserType } from "types";

const renderBackdrop = (props: any) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.6}
  />
);

const FolderBottomSheet = ({
  ref,
}: {
  ref: RefObject<BottomSheetModal | null>;
}) => {
  const insets = useSafeAreaInsets();
  const nameInputRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState<Partial<FolderInserType>>({
    name: "",
  });

  const handleOnChange = (fieldName: string, rawValue: string) => {
    setFormData((prev: Partial<FolderInserType>) => ({
      ...prev,
      [fieldName]: rawValue,
    }));
  };

  const handleOnDismiss = () => {
    setFormData({ name: "" });
  };

  const handleOnSubmit = async () => {
    if (formData.name.length < 2) {
      toast.info("Folders name must be at least 2 characters long.");
      return;
    }
    nameInputRef.current?.blur();
    Keyboard.dismiss();
    ref.current?.dismiss();
    console.log("formData", formData);
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["75%"]}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      bottomInset={insets.bottom}
      topInset={insets.top}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      keyboardBehavior="extend"
      onChange={(index) => {
        if (index === 0) {
          // sheet fully settled at its open snap point -> safe to focus now
          nameInputRef.current?.focus();
        }
        if (index === -1) {
          nameInputRef.current?.blur();
          Keyboard.dismiss();
        }
      }}
      onDismiss={handleOnDismiss}
    >
      <BottomSheetView className="main">
        <View className="flex-col gap-y-5">
          <Text className="h3-bold text-center">Create Folder</Text>
          <View className="form-group">
            <FormInput
              ref={nameInputRef}
              label="Folder Name"
              value={formData.name}
              onChange={handleOnChange}
              inputName="name"
              inputType="text"
              placeholder="Work, Office,..."
              autoCapitalize="words"
              insideBottomSheet
            />
            <Button disabled={!formData.name} onPress={handleOnSubmit}>
              <Text className="btn-label">Create</Text>
            </Button>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default FolderBottomSheet;
