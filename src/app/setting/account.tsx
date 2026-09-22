import EmptyState from "@/components/empty-state";
import { View } from "react-native";

const AccountScreen = () => {
  return (
    <View className="main">
      <EmptyState description="Account settings coming soon" isCentered />
    </View>
  );
};

export default AccountScreen;
