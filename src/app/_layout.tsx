import { COLORS } from "@/constants/theme";
import { CryptoProvider, useCrypto } from "@/contexts/CryptoContext";
import { getDrizzleInstance, initialiseDb } from "@/db/client";
import { useDrizzleStudioDev } from "@/db/hooks/useDrizzleStudioDev";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Toaster } from "sonner-native";
import "../global.css";

SplashScreen.preventAutoHideAsync();

// A string literal — the ONLY kind of prop safe to pass to SQLiteProvider.
// Any function prop (`onInit`, `onError`) defined in this file gets a new
// identity every time Fast Refresh re-evaluates the module; SQLiteProvider keys
// its setup effect on `onInit`, and that effect's cleanup calls `closeAsync()`.
// The result: every edit closes the live DB (-> "Access to closed resource")
// and remounts the whole navigator. Static props => the handle is untouched.
const DB_NAME = process.env.EXPO_PUBLIC_DB_NAME ?? "passcrate.db";

const Layout = () => {
  useDrizzleStudioDev();
  const db = useSQLiteContext();
  const { appState, setAppState } = useCrypto();

  // Run migrations and resolve the initial app state here, in a child of
  // SQLiteProvider. Screens stay unmounted while `appState === "loading"`, so
  // nothing queries the DB until this finishes.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initialiseDb(db);
        if (cancelled) return;

        const config = await getDrizzleInstance().query.appConfig.findFirst();
        if (cancelled) return;

        setAppState((current) => {
          if (current !== "loading") return current;
          return config ? "unlock" : "setup";
        });
      } catch (error) {
        console.error("bootstrap: FAILED", error);
      } finally {
        if (!cancelled) await SplashScreen.hideAsync();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [db, setAppState]);

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

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <CryptoProvider>
          <BottomSheetModalProvider>
            <SQLiteProvider databaseName={DB_NAME}>
              <Layout />
            </SQLiteProvider>
          </BottomSheetModalProvider>
        </CryptoProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
}
