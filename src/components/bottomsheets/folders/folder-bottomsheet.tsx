import FormInput from "@/components/form-input";
import { Button } from "@/components/ui/button";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { RefObject, useState } from "react";
import { Text, View } from "react-native";
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

  const [isCreateFolder, setIsCreateFolder] = useState(false);

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
    setFormData({
      name: "",
    });
  };

  const handleOnSubmit = async () => {
    if (formData.name.length < 2) {
      toast.info("Folders name must be at least 2 characters long.");
    }
    console.log(formData);
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["75%"]}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      bottomInset={insets.bottom}
      onDismiss={handleOnDismiss}
    >
      <BottomSheetView className="main">
        {true ? (
          <View className="flex-col gap-y-5">
            <Text className="h3-bold text-center">Create Folder</Text>
            <View className="form-group">
              <FormInput
                label="Folder Name"
                value={formData.name}
                onChange={handleOnChange}
                inputName="name"
                inputType="text"
                placeholder="Work, Office,..."
                autoFocus
                autoCapitalize="words"
              />
              <Button disabled={!formData.name} onPress={handleOnSubmit}>
                <Text className="btn-label">Create</Text>
              </Button>
            </View>
          </View>
        ) : (
          <View>
            <Text>List of folders</Text>
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default FolderBottomSheet;
