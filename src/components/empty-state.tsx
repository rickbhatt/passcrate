import { Button } from "@/components/ui/button";
import { Text, View } from "react-native";

type EmptyStateProps = {
  text: string;
  buttonText?: string;
  onButtonPress?: () => void;
};

const EmptyState = ({ text, buttonText, onButtonPress }: EmptyStateProps) => {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <Text className="text-center text-base font-sans-semibold text-text-primary">
        {text}
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
