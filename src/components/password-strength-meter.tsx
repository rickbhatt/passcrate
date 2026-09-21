import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import { cn } from "@/lib/utils";
import { Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

interface PasswordStrengthMeterProps {
  password: string;
  hintText?: string;
  className?: string;
}

const PasswordStrengthMeter = ({
  password,
  hintText,
  className,
}: PasswordStrengthMeterProps) => {
  const { label, color, animatedStyle } = usePasswordStrength(password);

  if (password.length === 0) return null;

  return (
    <Animated.View
      className={cn("flex-col gap-y-3", className)}
      entering={FadeInDown.duration(250)}
      exiting={FadeOutUp.duration(150)}
    >
      <View className="h-3 rounded-full bg-elevated w-full">
        <Animated.View
          className={cn("h-3 rounded-full", color)}
          style={animatedStyle}
        />
      </View>
      <Text className="font-sans-semibold text-sm">{label}</Text>
      {hintText && (
        <Text className="font-sans-semibold text-sm">{hintText}</Text>
      )}
    </Animated.View>
  );
};

export default PasswordStrengthMeter;
