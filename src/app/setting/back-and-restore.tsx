import EmptyState from "@/components/empty-state";
import { View } from "react-native";

const BackupAndRestoreScreen = () => {
  return (
    <View className="main">
      <EmptyState description="Backup & restore coming soon" isCentered />
    </View>
  );
};

export default BackupAndRestoreScreen;
