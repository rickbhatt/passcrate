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

import { useThemeColors } from "@/constants/theme";
import EmptyState from "@/components/empty-state";
import FormInput from "@/components/form-input";
import { Button } from "@/components/ui/button";
import { useDb } from "@/db/hooks/useDb";
import { addCrate } from "@/db/mutations/crates.mutations";
import { cratesQuery } from "@/db/queries/crates.queries";
import { useBottomSheetBackHandler } from "@/hooks/useBottomSheetBackHandler";
import { cn } from "@/lib/utils";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { RefObject, useRef, useState } from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { CrateInsertType } from "types";

const renderBackdrop = (props: any) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.6}
  />
);

const CrateBottomSheet = ({
  ref,
  onFullyClosed,
  onCrateSelect,
  selectedCrateId,
}: {
  ref: RefObject<BottomSheetModal | null>;
  onFullyClosed?: () => void;
  onCrateSelect: (crate: { id: string; name: string }) => void;
  selectedCrateId?: string | null;
}) => {
  const TABS = [
    { type: "list", label: "Crates" },
    { type: "create", label: "Create" },
  ] as const;

  const handleTabPress = (type: "list" | "create") => {
    if (type === "list") {
      nameInputRef.current?.blur();
      setFormData({ name: "" });
      Keyboard.dismiss();
    }
    setSheetType(type);
  };

  const insets = useSafeAreaInsets();
  const COLORS = useThemeColors();
  const nameInputRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState<Partial<CrateInsertType>>({
    name: "",
  });

  const [sheetType, setSheetType] = useState<"list" | "create">("list");
  const [isOpen, setIsOpen] = useState(false);

  useBottomSheetBackHandler(isOpen, ref);

  const db = useDb();

  const { data: crates } = useLiveQuery(cratesQuery(db));

  const handleOnChange = (fieldName: string, rawValue: string) => {
    setFormData((prev: Partial<CrateInsertType>) => ({
      ...prev,
      [fieldName]: rawValue,
    }));
  };

  const handleOnDismiss = () => {
    setFormData({ name: "" });
    setSheetType("list");
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
    const crateName = formData.name?.trim() ?? "";

    if (crateName.length < 2) {
      toast.info("Crate name must be at least 2 characters long.");
      return;
    }

    try {
      const resp = await addCrate({ db, name: crateName });
      onCrateSelect?.({ id: resp.id, name: resp.name });
      setFormData({ name: "" });
      nameInputRef.current?.blur();
      Keyboard.dismiss();
      ref.current?.dismiss();
    } catch (error) {
      toast.error("Could not create crate. Please try again");
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["75%"]}
      backgroundStyle={{ backgroundColor: COLORS.background }}
      handleIndicatorStyle={{ backgroundColor: COLORS.border }}
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
      <BottomSheetView className="main" style={{ bottom: 0 }}>
        <View className="flex-1 flex-col gap-y-5">
          <View className="-mx-4 flex-row border-b border-border px-4">
            {TABS.map(({ type, label }) => {
              const isActive = sheetType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => handleTabPress(type)}
                  className="flex-1 items-center pb-3 pt-1"
                >
                  <Text
                    className={cn(
                      "text-base",
                      isActive
                        ? "font-sans-semibold text-text-primary"
                        : "font-sans text-text-secondary",
                    )}
                  >
                    {label}
                  </Text>
                  {isActive && (
                    <View className="absolute -bottom-px h-0.5 w-full rounded-full bg-primary" />
                  )}
                </Pressable>
              );
            })}
          </View>

          {sheetType === "list" ? (
            crates?.length < 1 ? (
              <EmptyState
                description="No crates found"
                buttonText="Create a crate"
                className="mt-5"
                onButtonPress={() => handleTabPress("create")}
              />
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {crates.map((crate) => {
                  const isSelected = crate.id === selectedCrateId;
                  return (
                    <Pressable
                      key={crate.id}
                      onPress={() => {
                        onCrateSelect({ id: crate.id, name: crate.name });
                        ref.current?.dismiss();
                      }}
                      className={cn(
                        "rounded-full border px-4 py-2",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-elevated",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-sm text-text-primary",
                          isSelected ? "font-sans-semibold" : "font-sans",
                        )}
                      >
                        {crate.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )
          ) : (
            <View className="form-group">
              <FormInput
                ref={nameInputRef}
                label="Crate Name"
                value={formData.name}
                onChange={handleOnChange}
                inputName="name"
                inputType="text"
                placeholder="Work, Office,..."
                autoCapitalize="words"
                insideBottomSheet
              />
              <Button
                disabled={!formData.name?.trim()}
                onPress={handleOnSubmit}
              >
                <Text className="btn-label-white">Create</Text>
              </Button>
            </View>
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default CrateBottomSheet;
