import DynamicIcon from "@/components/dynamic-icon";
import EmptyState from "@/components/empty-state";
import ScreenHeader from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/constants/theme";
import {
  useSecurityOverview,
  type SecurityOverviewEntry,
} from "@/hooks/useSecurityOverview";
import { cn } from "@/lib/utils";
import { Stack, useRouter } from "expo-router";
import { SectionList, Text, View } from "react-native";

const SECTION_CONFIG = {
  compromised: {
    title: "Compromised",
    avatarBgClassName: "bg-red-100",
    avatarTextClassName: "text-red-600",
  },
  weak: {
    title: "Weak",
    avatarBgClassName: "bg-orange-100",
    avatarTextClassName: "text-orange-600",
  },
  reused: {
    title: "Reused",
    avatarBgClassName: "bg-primary-light",
    avatarTextClassName: "text-primary",
  },
} as const;

const SecurityOverviewScreen = () => {
  const router = useRouter();
  const { categories } = useSecurityOverview();

  const sections = (
    Object.keys(SECTION_CONFIG) as (keyof typeof SECTION_CONFIG)[]
  )
    .map((key) => ({ ...SECTION_CONFIG[key], data: categories[key] }))
    .filter((section) => section.data.length > 0);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <ScreenHeader showBackButton title="Security Overview" />
          ),
        }}
      />
      <SectionList
        className="main"
        sections={sections}
        keyExtractor={(item: SecurityOverviewEntry) => item.id}
        contentContainerClassName="gap-y-2 pb-safe-offset-8"
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-end justify-between bg-background pb-2 pt-4">
            <Text className="text-base font-sans-bold text-text-secondary">
              {section.title} passwords
            </Text>
            <Text className="text-sm font-sans-medium text-text-secondary">
              {section.data.length} passwords
            </Text>
          </View>
        )}
        renderItem={({ item, section }) => (
          <Button
            variant="ghost"
            onPress={() => router.push(`/password/detail/${item.id}`)}
            className="h-auto w-full flex-row items-center gap-x-3 rounded-2xl bg-surface p-3"
          >
            <View
              className={cn(
                "h-11 w-11 items-center justify-center rounded-xl",
                section.avatarBgClassName,
              )}
            >
              <Text
                className={cn(
                  "text-lg font-sans-bold",
                  section.avatarTextClassName,
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
            <DynamicIcon
              family="Feather"
              name="chevron-right"
              size={18}
              color={COLORS.textSecondary}
            />
          </Button>
        )}
        ListEmptyComponent={
          <EmptyState description="No passwords yet" isCentered />
        }
      />
    </>
  );
};

export default SecurityOverviewScreen;
