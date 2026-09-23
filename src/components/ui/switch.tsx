import DynamicIcon from "@/components/dynamic-icon";
import { useThemeColors } from "@/constants/theme";
import { cn } from "@/lib/utils";
import * as SwitchPrimitives from "@rn-primitives/switch";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Platform } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Track is w-18 (72) with a 2px border and 4px inner padding, thumb is 28.
// Stops 2px short of the right padding so the "on" thumb gets extra breathing room.
const RIGHT_EXTRA_GAP = 2;
const THUMB_TRAVEL = 72 - 2 * 2 - 4 * 2 - 28 - RIGHT_EXTRA_GAP;

type SwitchProps = SwitchPrimitives.RootProps &
  React.RefAttributes<SwitchPrimitives.RootRef>;

function Switch({
  className,
  checked,
  disabled,
  onCheckedChange,
  ...props
}: SwitchProps) {
  const COLORS = useThemeColors();
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, {
      duration: 180,
      reduceMotion: ReduceMotion.System,
    });
  }, [checked]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  const handleCheckedChange = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCheckedChange(value);
  };

  return (
    <SwitchPrimitives.Root
      className={cn(
        "h-10 w-18 shrink-0 flex-row items-center rounded-full border-2 p-1",
        Platform.select({
          web: "focus-visible:ring-ring/50 outline-none transition-colors focus-visible:ring-[3px] disabled:cursor-not-allowed",
        }),
        checked ? "border-primary bg-primary" : "border-border bg-elevated",
        disabled && "opacity-50",
        className,
      )}
      checked={checked}
      disabled={disabled}
      onCheckedChange={handleCheckedChange}
      hitSlop={8}
      {...props}
    >
      <Animated.View style={thumbStyle}>
        <SwitchPrimitives.Thumb
          className={cn(
            "size-7 items-center justify-center rounded-full",
            checked ? "bg-primary-foreground" : "bg-text-secondary",
          )}
        >
          <DynamicIcon
            family="Feather"
            name={checked ? "check" : "minus"}
            size={16}
            color={checked ? COLORS.primary : COLORS.elevated}
          />
        </SwitchPrimitives.Thumb>
      </Animated.View>
    </SwitchPrimitives.Root>
  );
}

export { Switch };
export type { SwitchProps };
