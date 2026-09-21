import DynamicIcon from "@/components/dynamic-icon";
import EmptyState from "@/components/empty-state";
import ScreenHeader from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/constants/theme";
import { useDb } from "@/db/hooks/useDb";
import { allFavouritePasswords } from "@/db/queries/passwords.queries";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useRouter } from "expo-router";
import { FlatList, Text, View } from "react-native";

const FavouritePasswordsScreen = () => {
  const router = useRouter();
  const db = useDb();
  const { data: passwords } = useLiveQuery(allFavouritePasswords({ db }));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <ScreenHeader showBackButton title="Favourites" />,
        }}
      />
      <FlatList
        className="main"
        data={passwords}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-y-2 pb-safe-offset-8"
        renderItem={({ item }) => (
          <Button
            variant="ghost"
            onPress={() => router.push(`/password/detail/${item.id}`)}
            className="h-auto w-full flex-row items-center gap-x-3 rounded-2xl bg-surface p-3"
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
              <Text className="text-lg font-sans-bold text-amber-600">
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
          <EmptyState description="No favourites yet" isCentered />
        }
      />
    </>
  );
};

export default FavouritePasswordsScreen;
