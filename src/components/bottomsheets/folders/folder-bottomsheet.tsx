/**
 * KEYBOARD / FOCUS COORDINATION - read before touching this file.
 *
 * @gorhom/bottom-sheet and react-native-keyboard-controller each manage
 * native keyboard/focus state independently and don't coordinate with
 * each other or with the parent screen. Left to their defaults, this
 * causes: keyboard staying visible after the sheet closes, focus silently
 * jumping to the parent's last-focused input, and layout jerks in the
 * parent while this sheet is open. These are known, open issues upstream
 * (e.g. kirillzyusko/react-native-keyboard-controller discussion #309 -
 * the maintainer recommends manual focus/blur control specifically for
 * this combination; gorhom/react-native-bottom-sheet #2661 re: autoFocus).
 *
 * So focus/keyboard here is handled manually instead of automatically:
 *
 * - onAnimate (fires at the START of any transition - button dismiss,
 *   backdrop tap, swipe-down gesture, uniformly) blurs the input and
 *   calls Keyboard.dismiss() the instant a close begins, so the keyboard
 *   has the earliest possible head start closing alongside the sheet.
 *
 * - onChange (fires once the sheet has SETTLED at its target index)
 *   only focuses the input after the sheet is fully open - NOT via
 *   autoFocus, which races the open animation (see #2661 above).
 *
 * - onDismiss waits for the native keyboardDidHide event before calling
 *   onFullyClosed(), so the parent doesn't hand keyboard control back
 *   until there's genuinely no keyboard height left to misread.
 *
 * keyboardBehavior="extend" + keyboardBlurBehavior="restore" +
 * android_keyboardInputMode="adjustResize" are required together so the
 * sheet respects its snapPoint (75%) instead of expanding to 100% when
 * the keyboard appears.
 */

import FormInput from "@/components/form-input";
import { Button } from "@/components/ui/button";
import { useDb } from "@/db/hooks/useDb";
import { useBottomSheetBackHandler } from "@/hooks/useBottomSheetBackHandler";
import { addFolder } from "@/db/mutations/folders.mutations";
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
  onFullyClosed,
  onFolderCreated,
}: {
  ref: RefObject<BottomSheetModal | null>;
  onFullyClosed?: () => void;
  onFolderCreated: (folder: { id: string; name: string }) => void;
}) => {
  const insets = useSafeAreaInsets();
  const nameInputRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState<Partial<FolderInserType>>({
    name: "",
  });

  const [sheetType, setSheetType] = useState<"list" | "create">("list");
  const [isOpen, setIsOpen] = useState(false);

  useBottomSheetBackHandler(isOpen, ref);

  const db = useDb();

  const handleOnChange = (fieldName: string, rawValue: string) => {
    setFormData((prev: Partial<FolderInserType>) => ({
      ...prev,
      [fieldName]: rawValue,
    }));
  };

  const handleOnDismiss = () => {
    setFormData({ name: "" });

    if (Keyboard.isVisible?.()) {
      const sub = Keyboard.addListener("keyboardDidHide", () => {
        sub.remove();
        onFullyClosed?.();
      });
    } else {
      onFullyClosed?.();
    }
  };

  const handleOnSubmit = async () => {
    const folderName = formData.name?.trim() ?? "";

    if (folderName.length < 2) {
      toast.info("Folder name must be at least 2 characters long.");
      return;
    }

    try {
      const resp = await addFolder({ db, name: folderName });
      onFolderCreated?.({ id: resp.id, name: resp.name });
      nameInputRef.current?.blur();
      Keyboard.dismiss();
      ref.current?.dismiss();
    } catch (error) {
      toast.error("Could not create folder. Please try again");
    }
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
      onAnimate={(fromIndex, toIndex) => {
        if (toIndex === -1) {
          nameInputRef.current?.blur();
          Keyboard.dismiss();
        }
      }}
      onChange={(index) => {
        setIsOpen(index >= 0);
        if (index === 0) {
          nameInputRef.current?.focus();
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
            <Button disabled={!formData.name?.trim()} onPress={handleOnSubmit}>
              <Text className="btn-label">Create</Text>
            </Button>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default FolderBottomSheet;
