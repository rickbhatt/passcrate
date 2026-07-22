import { COLORS } from "@/constants/theme";
import { CryptoProvider, useCrypto } from "@/contexts/CryptoContext";
import { getDrizzleInstance, initialiseDb } from "@/db/client";
import { useDrizzleStudioDev } from "@/db/hooks/useDrizzleStudioDev";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import "../global.css";
SplashScreen.preventAutoHideAsync();

const Layout = () => {
  useDrizzleStudioDev();
  const { appState } = useCrypto();

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "ios_from_right",
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        {/* setup screen — only accessible when no appConfig exists */}
        <Stack.Protected guard={appState === "setup"}>
          <Stack.Screen name="setup" />
        </Stack.Protected>

        {/* unlock screen — only accessible when appConfig exists but not unlocked */}
        <Stack.Protected guard={appState === "unlock"}>
          <Stack.Screen name="unlock" />
        </Stack.Protected>
        {/* main app — only accessible when derivedKey is in memory */}
        <Stack.Protected guard={appState === "unlocked"}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="password" />
        </Stack.Protected>
      </Stack>
      <Toaster position="top-center" richColors />
      <PortalHost />
    </>
  );
};

const DatabaseProvider = () => {
  const { setAppState } = useCrypto();

  const handleInit = async (db: SQLiteDatabase) => {
    await initialiseDb(db);
    const drizzle = getDrizzleInstance();
    const config = await drizzle.query.appConfig.findFirst();

    setAppState(config ? "unlock" : "setup");
    await SplashScreen.hideAsync();
  };

  return (
    <SQLiteProvider
      databaseName={process.env.EXPO_PUBLIC_DB_NAME ?? "passcrate.db"}
      onInit={handleInit}
      onError={(error) => console.error("SQLiteProvider: FAILED", error?.cause)}
    >
      <Layout />
    </SQLiteProvider>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CryptoProvider>
        <DatabaseProvider />
      </CryptoProvider>
    </GestureHandlerRootView>
  );
}
