import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "expo-router";
import { RefObject, useCallback } from "react";
import { BackHandler, Platform } from "react-native";

/**
 * @gorhom/bottom-sheet v5 has no Android hardware-back handling, so a back press
 * while a sheet is open falls through to expo-router and pops the screen. This
 * hook swallows that press and dismisses the sheet instead, but only while
 * `isOpen` is true - when the sheet is closed, back navigates as normal.
 */
export function useBottomSheetBackHandler(
  isOpen: boolean,
  ref: RefObject<BottomSheetModal | null>,
) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      const onBackPress = () => {
        if (isOpen && ref.current) {
          ref.current.dismiss();
          return true;
        }
        return false;
      };

      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [isOpen, ref]),
  );
}
