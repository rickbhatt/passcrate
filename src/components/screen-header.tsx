import { Text, View } from "react-native";

const ScreenHeader = ({ title }: { title: string }) => {
  return (
    <View className="bg-background pt-safe">
      <View className="h-14 justify-center px-4">
        <Text className="text-text-primary text-2xl font-sans-bold">
          {title}
        </Text>
      </View>
    </View>
  );
};

export default ScreenHeader;
