import DynamicIcon from "@/components/dynamic-icon";
import { COLORS } from "@/constants/theme";
import { useCrypto } from "@/contexts/CryptoContext";
import { useDb } from "@/db/hooks/useDb";
import { allPasswords } from "@/db/queries/passwords.queries";
import {
  scorePasswordStrength,
  WEAK_SCORE_THRESHOLD,
} from "@/hooks/usePasswordStrength";
import { decrypt } from "@/lib/crypto";
import { isPasswordPwned } from "@/lib/hibp";
import { cn } from "@/lib/utils";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

const INITIAL_STATS = {
  weakCount: 0,
  reusedCount: 0,
  compromisedCount: 0,
  safeCount: 0,
};

const StatCard = ({
  icon,
  value,
  label,
  cardClassName,
  iconWrapClassName,
  valueClassName,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  cardClassName: string;
  iconWrapClassName: string;
  valueClassName: string;
}) => (
  <View
    className={cn(
      "flex-row items-center gap-x-3 rounded-2xl p-4",
      cardClassName,
    )}
  >
    <View
      className={cn(
        "h-10 w-10 items-center justify-center rounded-full",
        iconWrapClassName,
      )}
    >
      {icon}
    </View>
    <Text
      className="flex-1 text-base font-sans-semibold text-text-primary"
      numberOfLines={1}
    >
      {label}
    </Text>
    <Text className={cn("text-2xl font-sans-bold", valueClassName)}>
      {value}
    </Text>
  </View>
);

const SecurityOverview = () => {
  const db = useDb();
  const { derivedKey } = useCrypto();

  const { data: passwords } = useLiveQuery(allPasswords({ db }));

  const [stats, setStats] = useState(INITIAL_STATS);

  useEffect(() => {
    if (!passwords || !derivedKey) {
      setStats(INITIAL_STATS);
      return;
    }

    let isCancelled = false;

    const computeStats = async () => {
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

      let weak = 0;
      let reused = 0;
      let compromised = 0;
      let safe = 0;

      decryptedPasswords.forEach((value, index) => {
        const pwnedResult = pwnedResults[index];
        if (pwnedResult.status === "rejected") {
          console.error(
            "🚀 ~ SecurityOverview ~ isPasswordPwned ~ error",
            pwnedResult.reason,
          );
        }

        const isWeak = scorePasswordStrength(value) <= WEAK_SCORE_THRESHOLD;
        const isReused = (occurrences.get(value) ?? 0) > 1;
        const isCompromised =
          pwnedResult.status === "fulfilled" && pwnedResult.value;

        if (isWeak) weak += 1;
        if (isReused) reused += 1;
        if (isCompromised) compromised += 1;
        if (!isWeak && !isReused && !isCompromised) safe += 1;
      });

      setStats({
        weakCount: weak,
        reusedCount: reused,
        compromisedCount: compromised,
        safeCount: safe,
      });
    };

    computeStats();

    return () => {
      isCancelled = true;
    };
  }, [passwords, derivedKey]);

  const { weakCount, reusedCount, compromisedCount, safeCount } = stats;
  const needsAttentionCount = (passwords?.length ?? 0) - safeCount;
  const isSecure = needsAttentionCount === 0;

  return (
    <View className="gap-y-4 rounded-3xl border border-border bg-background p-5 shadow-sm shadow-black/5">
      {/* header */}
      <View className="flex-row items-center gap-x-3">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
          <DynamicIcon
            family="MaterialCommunityIcons"
            name="shield-check-outline"
            size={26}
            color="#f97316"
          />
        </View>
        <View className="flex-1 gap-y-0.5">
          <Text className="text-xl font-sans-bold text-text-primary">
            Security Overview
          </Text>
          <Text className="text-sm font-sans-semibold text-text-secondary">
            Your password health at a glance
          </Text>
        </View>
      </View>

      {/* stats */}
      <View className="gap-y-3">
        <StatCard
          icon={
            <DynamicIcon
              family="Feather"
              name="alert-triangle"
              size={18}
              color="#ffffff"
            />
          }
          value={compromisedCount}
          label="Compromised"
          cardClassName="bg-red-50"
          iconWrapClassName="bg-red-500"
          valueClassName="text-red-600"
        />
        <StatCard
          icon={
            <DynamicIcon
              family="MaterialCommunityIcons"
              name="shield-alert-outline"
              size={20}
              color="#ffffff"
            />
          }
          value={weakCount}
          label="Weak"
          cardClassName="bg-orange-50"
          iconWrapClassName="bg-orange-500"
          valueClassName="text-orange-600"
        />
        <StatCard
          icon={
            <DynamicIcon
              family="Feather"
              name="refresh-cw"
              size={18}
              color="#ffffff"
            />
          }
          value={reusedCount}
          label="Reused"
          cardClassName="bg-primary-light"
          iconWrapClassName="bg-primary"
          valueClassName="text-primary"
        />
        <StatCard
          icon={
            <DynamicIcon
              family="MaterialCommunityIcons"
              name="shield-check-outline"
              size={20}
              color="#ffffff"
            />
          }
          value={safeCount}
          label="Safe"
          cardClassName="bg-accent-mint-light"
          iconWrapClassName="bg-green-500"
          valueClassName="text-green-600"
        />
      </View>

      {/* footer */}
      <Pressable
        disabled={isSecure}
        className={cn(
          "flex-row items-center gap-x-3 border-t border-border pt-4",
          !isSecure && "btn-active",
        )}
      >
        <View
          className={cn(
            "h-11 w-11 items-center justify-center rounded-full",
            isSecure ? "bg-green-500" : "bg-orange-500",
          )}
        >
          <DynamicIcon
            family="Feather"
            name={isSecure ? "check" : "alert-circle"}
            size={18}
            color="#ffffff"
          />
        </View>
        <View className="flex-1 gap-y-0.5">
          <Text className="text-base font-sans-semibold text-text-primary">
            {isSecure
              ? "Your passwords are secure"
              : `${needsAttentionCount} passwords need your attention`}
          </Text>
          <Text className="text-sm font-sans text-text-secondary">
            {isSecure
              ? "No action is needed right now"
              : "Keep your accounts secure"}
          </Text>
        </View>
        {isSecure ? null : (
          <DynamicIcon
            family="Feather"
            name="chevron-right"
            size={16}
            color={COLORS.textSecondary}
          />
        )}
      </Pressable>
    </View>
  );
};

export default SecurityOverview;
