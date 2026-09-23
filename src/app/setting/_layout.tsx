import ScreenHeader from "@/components/screen-header";
import { Stack } from "expo-router";

const SettingLayout = () => {
  return (
    <Stack
      screenOptions={{
        header: ({ options }) => (
          <ScreenHeader showBackButton title={options.title ?? ""} />
        ),
      }}
    >
      <Stack.Screen name="account" options={{ title: "Account" }} />
      <Stack.Screen name="security" options={{ title: "Security" }} />
      <Stack.Screen
        name="change-master-password"
        options={{ title: "Change Master Password" }}
      />
      <Stack.Screen
        name="back-and-restore"
        options={{ title: "Backup & Restore" }}
      />
    </Stack>
  );
};

export default SettingLayout;
