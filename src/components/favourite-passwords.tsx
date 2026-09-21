import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/constants/theme";
import { useDb } from "@/db/hooks/useDb";
import { favouritePasswords } from "@/db/queries/passwords.queries";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

const FAVOURITE_DISPLAY_LIMIT = 4;

const FavouritePasswordRow = ({
  id,
  title,
  username,
}: {
  id: string;
  title: string;
  username: string | null;
}) => {
  const COLORS = useThemeColors();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onPress={() => router.push(`/password/detail/${id}`)}
      className="h-auto w-full flex-row items-center gap-x-3 rounded-2xl bg-primary/10 p-3"
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
        <Text className="text-lg font-sans-bold text-primary">
          {title.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1 gap-y-0.5">
        <Text
          className="text-base font-sans-semibold text-text-primary"
          numberOfLines={1}
        >
          {title}
        </Text>
        {username ? (
          <Text className="text-sm text-primary" numberOfLines={1}>
            {username}
          </Text>
        ) : null}
      </View>
      <DynamicIcon
        family="Feather"
        name="chevron-right"
        size={18}
        color={COLORS.primary}
      />
    </Button>
  );
};

const FavouritePasswords = () => {
  const COLORS = useThemeColors();
  const router = useRouter();
  const db = useDb();
  const { data: passwords } = useLiveQuery(favouritePasswords({ db }));

  if (!passwords || passwords.length === 0) return null;

  const hasMore = passwords.length > FAVOURITE_DISPLAY_LIMIT;
  const visiblePasswords = passwords.slice(0, FAVOURITE_DISPLAY_LIMIT);

  return (
    <View className="gap-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm shadow-black/5">
      {/* header */}
      <View className="flex-row items-center gap-x-3">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <DynamicIcon
            family="MaterialCommunityIcons"
            name="star"
            size={24}
            color={COLORS.primary}
          />
        </View>
        <View className="flex-1 gap-y-0.5">
          <Text className="text-xl font-sans-bold text-text-primary">
            Favourites
          </Text>
        </View>
        {hasMore ? (
          <Button
            variant="ghost"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/favourite-passwords");
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
        ) : null}
      </View>

      {/* favourites list */}
      <View className="gap-y-2">
        {visiblePasswords.map((password) => (
          <FavouritePasswordRow
            key={password.id}
            id={password.id}
            title={password.title}
            username={password.username}
          />
        ))}
      </View>
    </View>
  );
};

export default FavouritePasswords;
