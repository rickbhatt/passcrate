/**
 * isCrateSheetOpen + enabled={!isCrateSheetOpen} on KeyboardStickyView:
 *
 * KeyboardStickyView reacts to the GLOBAL native keyboard state, not
 * "is MY input focused." So while CrateBottomSheet's own input has the
 * keyboard, this screen's sticky Save button would otherwise still raise/
 * lower in sync with it, causing visible jerks. Disabling it while the
 * sheet is open freezes it at rest; onFullyClosed (passed to the sheet)
 * re-enables it only once the sheet's keyboard has actually finished
 * closing.
 *
 * triggerCrateBottomSheet also waits for this screen's own keyboard to
 * finish hiding (keyboardDidHide) before presenting the sheet, so the two
 * keyboards never overlap/race when opening from a focused parent input.
 */

import CrateBottomSheet from "@/components/bottomsheets/crates/crate-bottomsheet";
import DynamicIcon from "@/components/dynamic-icon";
import FormInput from "@/components/form-input";
import PasswordStrengthMeter from "@/components/password-strength-meter";
import TagsInput from "@/components/tags-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLORS } from "@/constants/theme";
import { generatePassword } from "@/lib/password-generator";
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

  const crateBottomSheetRef = useRef<BottomSheetModal | null>(null);
  const [isCrateSheetOpen, setIsCrateSheetOpen] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleFormInputOnChange = (field: FieldName, rawValue: string) => {
    onChange((prev: PasswordFormValue) => ({
      ...prev,
      [field]: rawValue,
    }));
  };
  const triggerCrateBottomSheet = () => {
    setIsCrateSheetOpen(true);
    if (Keyboard.isVisible?.()) {
      const sub = Keyboard.addListener("keyboardDidHide", () => {
        sub.remove();
        crateBottomSheetRef.current?.present();
      });
      Keyboard.dismiss();
    } else {
      crateBottomSheetRef.current?.present();
    }
  };
  const handleCrateSheetFullyClosed = () => {
    setIsCrateSheetOpen(false);
  };
  const onCrateSelect = (crate: { id: string; name: string }) => {
    onChange((prev: PasswordFormValue) => ({
      ...prev,
      crateId: crate.id,
      crateName: crate.name.trim(),
    }));
  };

  const handleTagsChange = (tags: TagType[]) => {
    onChange((prev: PasswordFormValue) => ({
      ...prev,
      tags,
    }));
  };

  const handleCratePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerCrateBottomSheet();
  };

  const toggleSecureText = () => {
    setSecureTextEntry((prev) => !prev);
  };

  const handleGeneratePassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleFormInputOnChange("password", generatePassword());
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
          <View className="form-group">
            <Text className="form-label">
              Password<Text className="text-red-500"> *</Text>
            </Text>

            <View
              className={cn(
                "flex-row items-center rounded-md border border-gray-700 bg-background overflow-hidden",
                errors.password && "border-red-500",
              )}
            >
              <Input
                value={value.password ?? ""}
                onChangeText={(text) =>
                  handleFormInputOnChange("password", text)
                }
                secureTextEntry={secureTextEntry}
                placeholder="**********"
                className="flex-1 h-14 rounded-none border-0 text-base bg-background"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                textContentType="newPassword"
              />
              <Button
                className="bg-background border-0 rounded-none h-14"
                variant="ghost"
                onPress={toggleSecureText}
              >
                <DynamicIcon
                  family="Entypo"
                  name={secureTextEntry ? "eye" : "eye-with-line"}
                  size={22}
                  color={COLORS.textPrimary}
                />
              </Button>
              <Button
                className="bg-background border-0 rounded-none h-14"
                variant="ghost"
                onPress={handleGeneratePassword}
              >
                <DynamicIcon
                  family="Feather"
                  name="refresh-cw"
                  size={22}
                  color={COLORS.textPrimary}
                />
              </Button>
            </View>

            {errors.password && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.password}
              </Text>
            )}

            <PasswordStrengthMeter
              password={value.password ?? ""}
              hintText="Recommended strength: Good or higher."
            />
          </View>
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
              Crate<Text className="text-red-500"> *</Text>
            </Text>

            <Pressable
              onPress={handleCratePress}
              className={cn(
                "h-14 flex-row items-center justify-start rounded-md border border-gray-700 p-2",
                errors.crateId && "border-red-500",
              )}
            >
              <Text className="base-paragraph">
                {value.crateName || "Select a Crate"}
              </Text>
            </Pressable>
            {errors.crateId && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.crateId}
              </Text>
            )}
          </View>
          <View className="form-group">
            <Text className="form-label">
              Tags<Text className="text-red-500"> *</Text>
            </Text>
            <TagsInput value={value.tags ?? []} onChange={handleTagsChange} />
            {errors.tags && (
              <Text className="text-red-500 text-sm mt-1">{errors.tags}</Text>
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
          enabled={!isCrateSheetOpen}
        >
          <Button className="py-3 w-full" onPress={() => onSubmit(value)}>
            <Text className="btn-label-white">Save</Text>
          </Button>
        </KeyboardStickyView>
      </View>
      <CrateBottomSheet
        ref={crateBottomSheetRef}
        onFullyClosed={handleCrateSheetFullyClosed}
        onCrateSelect={onCrateSelect}
        selectedCrateId={value.crateId}
      />
    </>
  );
};

export default PasswordForm;
