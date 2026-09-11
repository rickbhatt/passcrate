/**
 * isFolderSheetOpen + enabled={!isFolderSheetOpen} on KeyboardStickyView:
 *
 * KeyboardStickyView reacts to the GLOBAL native keyboard state, not
 * "is MY input focused." So while FolderBottomSheet's own input has the
 * keyboard, this screen's sticky Save button would otherwise still raise/
 * lower in sync with it, causing visible jerks. Disabling it while the
 * sheet is open freezes it at rest; onFullyClosed (passed to the sheet)
 * re-enables it only once the sheet's keyboard has actually finished
 * closing.
 *
 * triggerFolderBottomSheet also waits for this screen's own keyboard to
 * finish hiding (keyboardDidHide) before presenting the sheet, so the two
 * keyboards never overlap/race when opening from a focused parent input.
 */

import FolderBottomSheet from "@/components/bottomsheets/folders/folder-bottomsheet";
import FormInput from "@/components/form-input";
import TagsInput from "@/components/tags/tags-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { styled } from "nativewind";
import { useRef, useState } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import {
  KeyboardStickyView,
  KeyboardAwareScrollView as RNKeyboardAwareScrollView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FieldName,
  PasswordFormProps,
  PasswordFormValue,
  TagType,
} from "types";

const KeyboardAwareScrollView = styled(
  RNKeyboardAwareScrollView as React.ComponentType<any>,
);

const PasswordForm = ({
  value,
  onChange,
  onSubmit,
  errors = {},
}: PasswordFormProps) => {
  const insets = useSafeAreaInsets();

  const folderBottomSheetRef = useRef<BottomSheetModal | null>(null);
  const [isFolderSheetOpen, setIsFolderSheetOpen] = useState(false);

  const handleFormInputOnChange = (field: FieldName, rawValue: string) => {
    onChange((prev: PasswordFormValue) => ({
      ...prev,
      [field]: rawValue,
    }));
  };
  const triggerFolderBottomSheet = () => {
    setIsFolderSheetOpen(true);
    if (Keyboard.isVisible?.()) {
      const sub = Keyboard.addListener("keyboardDidHide", () => {
        sub.remove();
        folderBottomSheetRef.current?.present();
      });
      Keyboard.dismiss();
    } else {
      folderBottomSheetRef.current?.present();
    }
  };
  const handleFolderSheetFullyClosed = () => {
    setIsFolderSheetOpen(false);
  };
  const onFolderSelect = (folder: { id: string; name: string }) => {
    onChange((prev: PasswordFormValue) => ({
      ...prev,
      folderId: folder.id,
      folderName: folder.name.trim(),
    }));
  };

  const handleTagsChange = (tags: TagType[]) => {
    onChange((prev: PasswordFormValue) => ({
      ...prev,
      tags,
    }));
  };

  const handleFolderPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerFolderBottomSheet();
  };

  return (
    <>
      <View className="flex-1 bg-background header-mt">
        <KeyboardAwareScrollView
          bottomOffset={0}
          extraKeyboardSpace={0}
          className="screen-x-padding"
          contentContainerClassName="flex-col gap-5 pb-28"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          mode="layout"
        >
          <FormInput
            key={"title"}
            label="Title"
            isRequired
            inputType="text"
            inputName="title"
            value={value.title}
            error={errors.title}
            onChange={handleFormInputOnChange}
            placeholder="office gmail account..."
            autoCapitalize="words"
            autoFocus={false}
          />
          <FormInput
            key={"username"}
            label="Username"
            inputType="text"
            inputName="username"
            value={value.username}
            onChange={handleFormInputOnChange}
            placeholder="username@gmail.com"
          />
          <FormInput
            key={"password"}
            label="Password"
            isRequired
            inputType="text"
            inputName="password"
            value={value.password}
            error={errors.password}
            onChange={handleFormInputOnChange}
            placeholder="**********"
          />
          <FormInput
            key={"url"}
            label="URL"
            inputType="text"
            inputName="url"
            value={value.url}
            onChange={handleFormInputOnChange}
            placeholder="https://github.com"
          />
          <View className="form-group bg-background">
            <Text className="form-label">
              Folder<Text className="text-red-500"> *</Text>
            </Text>

            <Pressable
              onPress={handleFolderPress}
              className={cn(
                "h-14 flex-row items-center justify-start rounded-md border border-gray-700 p-2",
                errors.folderId && "border-red-500",
              )}
            >
              <Text className="base-paragraph">
                {value.folderName || "Select a Folder"}
              </Text>
            </Pressable>
            {errors.folderId && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.folderId}
              </Text>
            )}
          </View>
          <View className="form-group">
            <Text className="form-label">
              Tags<Text className="text-red-500"> *</Text>
            </Text>
            <TagsInput value={value.tags ?? []} onChange={handleTagsChange} />
            {errors.tags && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.tags}
              </Text>
            )}
          </View>
          <FormInput
            key={"expiryDays"}
            label="Expires in (days)"
            inputType="text"
            inputName="expiryDays"
            value={value.expiryDays}
            error={errors.expiryDays}
            onChange={handleFormInputOnChange}
            placeholder="e.g. 90"
            keyboardType="numeric"
            maxLength={3}
          />
          <FormInput
            key={"notes"}
            label="Notes"
            placeholder="Some notes..."
            inputType="text"
            inputName="notes"
            value={value.notes}
            onChange={handleFormInputOnChange}
          />
        </KeyboardAwareScrollView>
        <KeyboardStickyView
          className="py-2.5 bg-background flex-row items-center screen-x-padding"
          offset={{ closed: -insets.bottom, opened: 0 }}
          enabled={!isFolderSheetOpen}
        >
          <Button className="py-3 w-full" onPress={() => onSubmit(value)}>
            <Text className="btn-label">Save</Text>
          </Button>
        </KeyboardStickyView>
      </View>
      <FolderBottomSheet
        ref={folderBottomSheetRef}
        onFullyClosed={handleFolderSheetFullyClosed}
        onFolderSelect={onFolderSelect}
        selectedFolderId={value.folderId}
      />
    </>
  );
};

export default PasswordForm;
