import DynamicIcon from "@/components/dynamic-icon";
import { useThemeColors } from "@/constants/theme";
import { useSecurityOverview } from "@/hooks/useSecurityOverview";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

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

const SecurityOverviewStats = () => {
  const COLORS = useThemeColors();
  const router = useRouter();
  const {
    weakCount,
    reusedCount,
    compromisedCount,
    safeCount,
    needsAttentionCount,
    isSecure,
  } = useSecurityOverview();

  return (
    <View className="gap-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm shadow-black/5">
      {/* header */}
      <View className="flex-row items-center gap-x-3">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <DynamicIcon
            family="MaterialCommunityIcons"
            name="shield-check-outline"
            size={26}
            color={COLORS.primary}
          />
        </View>
        <View className="flex-1 gap-y-0.5">
          <Text className="text-xl font-sans-bold text-text-primary">
            Security Overview
          </Text>
          {/* <Text className="text-sm font-sans-semibold text-text-secondary">
            Your password health at a glance
          </Text> */}
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
              color={COLORS.primaryForeground}
            />
          }
          value={compromisedCount}
          label="Compromised"
          cardClassName="bg-danger/10"
          iconWrapClassName="bg-danger"
          valueClassName="text-danger"
        />
        <StatCard
          icon={
            <DynamicIcon
              family="MaterialCommunityIcons"
              name="shield-alert-outline"
              size={20}
              color={COLORS.primaryForeground}
            />
          }
          value={weakCount}
          label="Weak"
          cardClassName="bg-primary/10"
          iconWrapClassName="bg-primary"
          valueClassName="text-primary"
        />
        <StatCard
          icon={
            <DynamicIcon
              family="Feather"
              name="refresh-cw"
              size={18}
              color={COLORS.primaryForeground}
            />
          }
          value={reusedCount}
          label="Reused"
          cardClassName="bg-elevated"
          iconWrapClassName="bg-text-secondary"
          valueClassName="text-text-secondary"
        />
        <StatCard
          icon={
            <DynamicIcon
              family="MaterialCommunityIcons"
              name="shield-check-outline"
              size={20}
              color={COLORS.primaryForeground}
            />
          }
          value={safeCount}
          label="Safe"
          cardClassName="bg-success/10"
          iconWrapClassName="bg-success"
          valueClassName="text-success"
        />
      </View>

      {/* footer */}
      <Pressable
        disabled={isSecure}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/security-overview");
        }}
        className="flex-row items-center gap-x-3 border-t border-border pt-4 btn-active"
      >
        <View
          className={cn(
            "h-11 w-11 items-center justify-center rounded-full",
            isSecure ? "bg-success" : "bg-primary",
          )}
        >
          <DynamicIcon
            family="Feather"
            name={isSecure ? "check" : "alert-circle"}
            size={18}
            color={COLORS.primaryForeground}
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

export default SecurityOverviewStats;
