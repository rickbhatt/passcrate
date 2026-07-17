import ScreenHeader from "@/components/screen-header";
import { Stack } from "expo-router";

const PasswordLayout = () => {
  return (
    <Stack
      screenOptions={{
        header: ({ options }) => <ScreenHeader title={options.title ?? ""} />,
      }}
    >
      <Stack.Screen
        name="add"
        options={{
          title: "Add Password",
        }}
      />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="detail/[id]" />
    </Stack>
  );
};

export default PasswordLayout;
