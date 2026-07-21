import { Stack } from "expo-router";

const SetupLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="master-password" />
      <Stack.Screen name="biometric" />
    </Stack>
  );
};

export default SetupLayout;
