import EmptyState from "@/components/empty-state";
import { View } from "react-native";

const SecurityScreen = () => {
  return (
    <View className="main">
      <EmptyState description="Security settings coming soon" isCentered />
    </View>
  );
};

export default SecurityScreen;
