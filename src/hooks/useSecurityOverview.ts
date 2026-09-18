import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import { allPasswords } from "@/db/queries/passwords.queries";
import {
  scorePasswordStrength,
  WEAK_SCORE_THRESHOLD,
} from "@/hooks/usePasswordStrength";
import { decrypt } from "@/lib/crypto";
import { isPasswordPwned } from "@/lib/hibp";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect, useState } from "react";

export type SecurityOverviewEntry = {
  id: string;
  title: string;
  username: string | null;
};

type SecurityOverviewCategories = {
  compromised: SecurityOverviewEntry[];
  weak: SecurityOverviewEntry[];
  reused: SecurityOverviewEntry[];
};

const EMPTY_CATEGORIES: SecurityOverviewCategories = {
  compromised: [],
  weak: [],
  reused: [],
};

// Shared by the home-screen summary card and the full security-overview list
// screen, so both stay in sync on a single categorization pass (decrypt +
// zxcvbn + HIBP) instead of running it twice.
export const useSecurityOverview = () => {
  const db = useDb();
  const { derivedKey } = useCrypto();

  const { data: passwords } = useLiveQuery(allPasswords({ db }));

  // `needsAttentionCount` and `total` are captured from the same snapshot
  // as `categories` on every update, so they never mix a live password
  // count with a categorization that's still catching up to it (the HIBP
  // check is an async network round-trip, so that lag is real).
  const [{ categories, needsAttentionCount, total }, setResult] = useState<{
    categories: SecurityOverviewCategories;
    needsAttentionCount: number;
    total: number;
  }>({ categories: EMPTY_CATEGORIES, needsAttentionCount: 0, total: 0 });

  useEffect(() => {
    if (!passwords || !derivedKey) {
      setResult({ categories: EMPTY_CATEGORIES, needsAttentionCount: 0, total: 0 });
      return;
    }

    let isCancelled = false;

    const computeCategories = async () => {
      const decryptedPasswords = passwords.map((password) =>
        decrypt(password.encryptedPassword, derivedKey),
      );

      const occurrences = decryptedPasswords.reduce<Map<string, number>>(
        (map, value) => map.set(value, (map.get(value) ?? 0) + 1),
        new Map(),
      );

      const pwnedResults = await Promise.allSettled(
        decryptedPasswords.map((value) => isPasswordPwned(value)),
      );

      if (isCancelled) return;

      const next: SecurityOverviewCategories = {
        compromised: [],
        weak: [],
        reused: [],
      };
      // A password can trip more than one flag at once, so track unique
      // ids here instead of summing the category array lengths.
      const attentionIds = new Set<string>();

      passwords.forEach((password, index) => {
        const value = decryptedPasswords[index];
        const pwnedResult = pwnedResults[index];

        if (pwnedResult.status === "rejected") {
          console.error(
            "🚀 ~ useSecurityOverview ~ isPasswordPwned ~ error",
            pwnedResult.reason,
          );
        }

        const isWeak = scorePasswordStrength(value) <= WEAK_SCORE_THRESHOLD;
        const isReused = (occurrences.get(value) ?? 0) > 1;
        const isCompromised =
          pwnedResult.status === "fulfilled" && pwnedResult.value;

        const entry: SecurityOverviewEntry = {
          id: password.id,
          title: password.title,
          username: password.username,
        };

        if (isCompromised) {
          next.compromised.push(entry);
          attentionIds.add(password.id);
        }
        if (isWeak) {
          next.weak.push(entry);
          attentionIds.add(password.id);
        }
        if (isReused) {
          next.reused.push(entry);
          attentionIds.add(password.id);
        }
      });

      setResult({
        categories: next,
        needsAttentionCount: attentionIds.size,
        total: passwords.length,
      });
    };

    computeCategories();

    return () => {
      isCancelled = true;
    };
  }, [passwords, derivedKey]);

  return {
    categories,
    compromisedCount: categories.compromised.length,
    weakCount: categories.weak.length,
    reusedCount: categories.reused.length,
    safeCount: total - needsAttentionCount,
    needsAttentionCount,
    isSecure: needsAttentionCount === 0,
  };
};
