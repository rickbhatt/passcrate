import { createContext, useContext, useState } from "react";

type AppState = "loading" | "setup" | "unlock" | "unlocked";

interface CryptoContextType {
  appState: AppState;
  setAppState: (state: AppState) => void;
  derivedKey: string | null;
  setDerivedKey: (key: string) => void;
  clearDerivedKey: () => void;
}

export const CryptoContext = createContext<CryptoContextType | null>(null);

export const CryptoProvider = ({ children }: { children: React.ReactNode }) => {
  const [appState, setAppState] = useState<AppState>("loading");
  const [derivedKey, setDerivedKey] = useState<string | null>(null);

  const clearDerivedKey = () => {
    setDerivedKey(null);
    setAppState("unlock");
  };

  return (
    <CryptoContext.Provider
      value={{
        appState,
        setAppState,
        derivedKey,
        setDerivedKey,
        clearDerivedKey,
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
