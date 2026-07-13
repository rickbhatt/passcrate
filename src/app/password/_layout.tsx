import { Stack } from "expo-router";

const PasswordLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="create" />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="detail/[id]" />
    </Stack>
  );
};

export default PasswordLayout;
