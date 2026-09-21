import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/constants/theme";
import { useDb } from "@/db/hooks/useDb";
import { expiringPasswords } from "@/db/queries/passwords.queries";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

const URGENT_DAYS_THRESHOLD = 3;

const ExpiringPasswordCard = ({
  id,
  title,
  daysRemaining,
}: {
  id: string;
  title: string;
  daysRemaining: number;
}) => {
  const COLORS = useThemeColors();
  const router = useRouter();
  const isUrgent = daysRemaining <= URGENT_DAYS_THRESHOLD;

  return (
    <Button
      variant="ghost"
      onPress={() => router.push(`/password/detail/${id}`)}
      className={cn(
        "h-auto w-28 flex-col items-start justify-start gap-y-2 rounded-2xl p-3",
        isUrgent ? "bg-danger/10" : "bg-primary/10",
      )}
    >
      <View className="w-full flex-row items-center justify-between gap-x-1">
        <Text
          className="flex-1 text-sm font-sans-semibold text-text-primary"
          numberOfLines={1}
        >
          {title}
        </Text>
        <DynamicIcon
          family="Feather"
          name="chevron-right"
          size={14}
          color={isUrgent ? COLORS.danger : COLORS.primary}
        />
      </View>
      <View className="flex-row items-center gap-x-1">
        <DynamicIcon
          family="Feather"
          name="clock"
          size={12}
          color={isUrgent ? COLORS.danger : COLORS.primary}
        />
        <Text
          className={cn(
            "text-xs font-sans-semibold",
            isUrgent ? "text-danger" : "text-primary",
          )}
        >
          {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
        </Text>
      </View>
    </Button>
  );
};

const ExpiringPasswords = () => {
  const COLORS = useThemeColors();
  const router = useRouter();
  const db = useDb();
  const { data: passwords } = useLiveQuery(expiringPasswords({ db }));

  if (!passwords || passwords.length === 0) return null;

  return (
    <View className="gap-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm shadow-black/5">
      {/* header */}
      <View className="flex-row items-center gap-x-3">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <DynamicIcon
            family="MaterialCommunityIcons"
            name="calendar-clock"
            size={24}
            color={COLORS.primary}
          />
        </View>
        <View className="flex-1 gap-y-0.5">
          <Text className="text-xl font-sans-bold text-text-primary">
            Expiring Soon
          </Text>
          {/* <Text className="text-sm font-sans-semibold text-text-secondary">
            Passwords that need to be updated
          </Text> */}
        </View>
        <Button
          variant="ghost"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/expiring-passwords");
          }}
          className="h-auto min-h-0 flex-row items-center gap-x-1 rounded-md p-0"
        >
          <Text className="text-sm font-sans-semibold text-primary">
            View all
          </Text>
          <DynamicIcon
            family="Feather"
            name="chevron-right"
            size={16}
            color={COLORS.primary}
          />
        </Button>
      </View>

      {/* expiring list */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-x-3"
      >
        {passwords.map((password) => {
          if (!password.expiresAt) return null;

          return (
            <ExpiringPasswordCard
              key={password.id}
              id={password.id}
              title={password.title}
              daysRemaining={Math.max(
                0,
                differenceInCalendarDays(password.expiresAt, new Date()),
              )}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ExpiringPasswords;
