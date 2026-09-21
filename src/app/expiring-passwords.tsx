import DynamicIcon from "@/components/dynamic-icon";
import EmptyState from "@/components/empty-state";
import ScreenHeader from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/constants/theme";
import { useDb } from "@/db/hooks/useDb";
import { allExpiringPasswords } from "@/db/queries/passwords.queries";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useRouter } from "expo-router";
import { FlatList, Text, View } from "react-native";

const URGENT_DAYS_THRESHOLD = 3;

const ExpiringPasswordsScreen = () => {
  const COLORS = useThemeColors();
  const router = useRouter();
  const db = useDb();
  const { data: passwords } = useLiveQuery(allExpiringPasswords({ db }));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <ScreenHeader showBackButton title="Expiring Soon" />,
        }}
      />
      <FlatList
        className="main"
        data={passwords}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-y-2 pb-safe-offset-8"
        renderItem={({ item }) => {
          if (!item.expiresAt) return null;

          const daysRemaining = Math.max(
            0,
            differenceInCalendarDays(item.expiresAt, new Date()),
          );
          const isUrgent = daysRemaining <= URGENT_DAYS_THRESHOLD;

          return (
            <Button
              variant="ghost"
              onPress={() => router.push(`/password/detail/${item.id}`)}
              className="h-auto w-full flex-row items-center gap-x-3 rounded-2xl bg-elevated p-3"
            >
              <View
                className={cn(
                  "h-11 w-11 items-center justify-center rounded-xl",
                  isUrgent ? "bg-danger/10" : "bg-primary/10",
                )}
              >
                <Text
                  className={cn(
                    "text-lg font-sans-bold",
                    isUrgent ? "text-danger" : "text-primary",
                  )}
                >
                  {item.title.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1 gap-y-0.5">
                <Text
                  className="text-base font-sans-semibold text-text-primary"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {item.username ? (
                  <Text
                    className="text-sm text-text-secondary"
                    numberOfLines={1}
                  >
                    {item.username}
                  </Text>
                ) : null}
              </View>
              <Text
                className={cn(
                  "text-sm font-sans-semibold",
                  isUrgent ? "text-danger" : "text-primary",
                )}
              >
                {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
              </Text>
              <DynamicIcon
                family="Feather"
                name="chevron-right"
                size={18}
                color={COLORS.textSecondary}
              />
            </Button>
          );
        }}
        ListEmptyComponent={
          <EmptyState description="No passwords expiring soon" isCentered />
        }
      />
    </>
  );
};

export default ExpiringPasswordsScreen;
