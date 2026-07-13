import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";

const Layout = () => {
  return (
    <>
      <StatusBar style="inverted" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "ios_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="password" />
      </Stack>
    </>
  );
};

export default function RootLayout() {
  return <Layout />;
}
