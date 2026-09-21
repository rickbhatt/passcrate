import DynamicIcon from "@/components/dynamic-icon";
import { Input } from "@/components/ui/input";
import { useThemeColors } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
} & (
  | { mode?: "immediate"; debounceMs?: never; minQueryLength?: never }
  | { mode: "debounced"; debounceMs?: number; minQueryLength?: number }
);

const SearchInput = ({
  value,
  onChangeText,
  mode = "immediate",
  debounceMs = 300,
  minQueryLength = 3,
  placeholder = "Search...",
  className,
  autoFocus = false,
}: SearchInputProps) => {
  const COLORS = useThemeColors();
  const [text, setText] = useState(value);

  // Keep local text in sync when the parent resets/changes the value externally.
  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (mode !== "debounced") return;

    // Below the minimum, treat it the same as an empty query.
    const nextValue = text.length >= minQueryLength ? text : "";
    if (nextValue === value) return;

    const timeout = setTimeout(() => onChangeText(nextValue), debounceMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, mode, debounceMs, minQueryLength]);

  const handleChangeText = (next: string) => {
    setText(next);
    if (mode === "immediate") onChangeText(next);
  };

  const handleClear = () => {
    setText("");
    onChangeText("");
  };

  return (
    <View className={cn("flex-row items-center gap-x-2", className)}>
      <DynamicIcon
        family="Feather"
        name="search"
        size={18}
        color={COLORS.textSecondary}
      />
      <Input
        value={text}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 border-0 bg-transparent px-0"
      />
      {text.length > 0 ? (
        <Pressable onPress={handleClear} hitSlop={8}>
          <DynamicIcon
            family="Feather"
            name="x"
            size={18}
            color={COLORS.textSecondary}
          />
        </Pressable>
      ) : null}
    </View>
  );
};

export default SearchInput;
