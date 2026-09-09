import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { AppState as RNAppState, type AppStateStatus } from "react-native";

type AppState = "loading" | "setup" | "unlock" | "unlocked";

interface CryptoContextType {
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
  derivedKey: string | null;
  setDerivedKey: (key: string) => void;
  clearDerivedKey: () => void;
  pendingMasterPassword: string | null;
  setPendingMasterPassword: (p: string | null) => void;
  setBiometricAuthInProgress: (inProgress: boolean) => void;
}

export const CryptoContext = createContext<CryptoContextType | null>(null);

export const CryptoProvider = ({ children }: { children: React.ReactNode }) => {
  const [appState, setAppState] = useState<AppState>("loading");
  const [derivedKey, setDerivedKey] = useState<string | null>(null);
  const [pendingMasterPassword, setPendingMasterPassword] = useState<
    string | null
  >(null);
  const clearDerivedKey = () => {
    setDerivedKey(null);
    setAppState("unlock");
  };

  // The OS biometric prompt can itself cause a transient "background" ->
  // "active" blip on some devices (its dismissal pauses/resumes the host
  // activity). Without this guard, that blip is indistinguishable from the
  // user actually leaving the app, so it wipes the key right after a
  // successful unlock and forces a redundant second auth attempt.
  const biometricAuthInProgress = useRef(false);
  const setBiometricAuthInProgress = (inProgress: boolean) => {
    biometricAuthInProgress.current = inProgress;
  };

  useEffect(() => {
    const subscription = RNAppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "background" && !biometricAuthInProgress.current) {
          setAppState((current) => {
            if (current === "unlocked") {
              setDerivedKey(null);
              return "unlock";
            }
            return current; // don't touch "loading" / "setup" / "unlock"
          });
        }
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <CryptoContext.Provider
      value={{
        appState,
        setAppState,
        derivedKey,
        setDerivedKey,
        clearDerivedKey,
        pendingMasterPassword,
        setPendingMasterPassword,
        setBiometricAuthInProgress,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => {
  const ctx = useContext(CryptoContext);
  if (!ctx) {
    throw new Error("useCrypto must be used within a CryptoProvider");
  }
  return ctx;
};
