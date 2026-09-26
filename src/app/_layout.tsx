import { useThemeColors } from "@/constants/theme";
import { CryptoProvider, useCrypto } from "@/contexts/CryptoContext";
import { getDrizzleInstance, initialiseDb } from "@/db/client";
import { useDrizzleStudioDev } from "@/db/hooks/useDrizzleStudioDev";
import {
  checkAndAutoBackup,
  syncPendingRestoreState,
  type RestoreSummary,
} from "@/lib/backup/backup";
import { setupBackupNotifications } from "@/lib/backup/notifications";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { toast, Toaster } from "sonner-native";
import "../global.css";

SplashScreen.preventAutoHideAsync();

// A string literal — the ONLY kind of prop safe to pass to SQLiteProvider.
// Any function prop (`onInit`, `onError`) defined in this file gets a new
// identity every time Fast Refresh re-evaluates the module; SQLiteProvider keys
// its setup effect on `onInit`, and that effect's cleanup calls `closeAsync()`.
// The result: every edit closes the live DB (-> "Access to closed resource")
// and remounts the whole navigator. Static props => the handle is untouched.
const DB_NAME = process.env.EXPO_PUBLIC_DB_NAME ?? "passcrate.db";

// Let the unlock transition finish before the auto-backup check starts work.
const AUTO_BACKUP_DELAY_MS = 1500;

const Layout = () => {
  const COLORS = useThemeColors();
  useDrizzleStudioDev();
  const db = useSQLiteContext();
  const { appState, setAppState, derivedKey, setBiometricAuthInProgress } =
    useCrypto();
  // Set at boot after a restore; announced once the vault is unlocked.
  const restoreSummary = useRef<RestoreSummary | null>(null);

  // Run migrations and resolve the initial app state here, in a child of
  // SQLiteProvider. Screens stay unmounted while `appState === "loading"`, so
  // nothing queries the DB until this finishes.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initialiseDb(db);
        if (cancelled) return;

        // Must run before the auto-backup check, so a just-restored vault
        // isn't treated as never backed up.
        try {
          restoreSummary.current = await syncPendingRestoreState(
            getDrizzleInstance(),
          );
        } catch (error) {
          console.error("syncPendingRestoreState: FAILED", error);
        }

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

  // On app open, once unlocked (the vault key only exists then): ask for
  // notification permission first, so it's settled before any backup runs,
  // then run the auto-backup check.
  useEffect(() => {
    if (appState !== "unlocked" || !derivedKey) return;

    if (restoreSummary.current) {
      const { keptPasswords } = restoreSummary.current;
      restoreSummary.current = null;
      toast.success("Backup restored", {
        description:
          keptPasswords > 0
            ? `${keptPasswords} password${keptPasswords === 1 ? "" : "s"} from this phone ${keptPasswords === 1 ? "was" : "were"} kept.`
            : undefined,
      });
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      // The Android permission dialog pauses the activity; don't lock.
      setBiometricAuthInProgress(true);
      try {
        await setupBackupNotifications();
      } finally {
        setBiometricAuthInProgress(false);
      }
      if (cancelled) return;

      checkAndAutoBackup({ db: getDrizzleInstance(), key: derivedKey }).catch(
        (error) => console.error("checkAndAutoBackup: FAILED", error),
      );
    }, AUTO_BACKUP_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // setBiometricAuthInProgress only writes a ref; its identity changes
    // every render, so it must not re-trigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, derivedKey]);

  return (
    <>
      <StatusBar style="auto" />
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
          <Stack.Screen name="crate/[id]" />
          <Stack.Screen name="search" />
          <Stack.Screen name="security-overview" />
          <Stack.Screen name="expiring-passwords" />
          <Stack.Screen name="favourite-passwords" />
          <Stack.Screen name="setting" />
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
            <SQLiteProvider
              databaseName={DB_NAME}
              options={{ enableChangeListener: true }}
            >
              <Layout />
            </SQLiteProvider>
          </BottomSheetModalProvider>
        </CryptoProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
}
