import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Text, View } from "react-native";

type EmptyStateProps = {
  description: string;
  buttonText?: string;
  onButtonPress?: () => void;
  isCentered?: boolean;
  className?: string;
};

const EmptyState = ({
  description,
  buttonText,
  onButtonPress,
  isCentered = false,
  className,
}: EmptyStateProps) => {
  return (
    <View
      className={cn(
        "items-center gap-4 px-8",
        isCentered ? "flex-1 justify-center" : "justify-start",
        className,
      )}
    >
      <Text className="text-center text-base font-sans-semibold text-text-primary">
        {description}
      </Text>
      {buttonText && onButtonPress && (
        <Button onPress={onButtonPress}>
          <Text className="btn-label-white">{buttonText}</Text>
        </Button>
      )}
    </View>
  );
};

export default EmptyState;
