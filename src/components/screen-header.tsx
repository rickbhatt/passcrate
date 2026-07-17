import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

const ScreenHeader = ({
  title,
  showBackButton = false,
}: {
  title: string;
  showBackButton?: boolean;
}) => {
  const router = useRouter();

  return (
    <View className="h-28 bg-background pt-safe pb-3 screen-x-padding">
      <View className="flex-1 flex-row items-center">
        {showBackButton && router.canGoBack() && (
          <Button
            onPress={() => router.back()}
            className="h-16 w-16 mr-4 rounded-full border border-border bg-transparent"
          >
            <DynamicIcon family="FontAwesome" name="angle-left" />
          </Button>
        )}
        <Text className="text-text-primary text-2xl font-sans-extrabold">
          {title}
        </Text>
      </View>
    </View>
  );
};

export default ScreenHeader;
