import ScreenHeader from "@/components/screen-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text as UiText } from "@/components/ui/text";
import { useDb } from "@/db/hooks/useDb";
import { crateById } from "@/db/queries/crates.queries";
import { passwordsByCrateId } from "@/db/queries/passwords.queries";
import { tagsByCrateId } from "@/db/queries/tags.queries";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

const CrateById = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const router = useRouter();
  const { data } = useLiveQuery(
    crateById({
      db,
      id,
    }),
  );
  const crate = data?.[0];

  const { data: passwords } = useLiveQuery(
    passwordsByCrateId({
      db,
      crateId: id,
    }),
    [id],
  );

  const { data: passwordTags } = useLiveQuery(
    tagsByCrateId({
      db,
      crateId: id,
    }),
    [id],
  );

  const tagsByPasswordId = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    passwordTags?.forEach((tag) => {
      const list = map.get(tag.passwordId) ?? [];
      list.push({ id: tag.id, name: tag.name });
      map.set(tag.passwordId, list);
    });
    return map;
  }, [passwordTags]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <ScreenHeader showBackButton title={crate?.name} />,
        }}
      />
      <FlatList
        data={passwords}
        extraData={tagsByPasswordId}
        keyExtractor={(password) => password.id}
        className="main"
        contentContainerClassName="gap-y-4 pb-4"
        renderItem={({ item: password }) => {
          const tags = tagsByPasswordId.get(password.id) ?? [];

          return (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
            >
              <Button
                variant="ghost"
                onPress={() => router.push(`/password/detail/${password.id}`)}
                className="h-auto w-full flex-col items-start justify-start gap-y-2 rounded-xl border border-primary-pressed bg-primary/10 p-4"
              >
                <Text
                  className="text-base font-sans-semibold text-text-primary"
                  numberOfLines={1}
                >
                  {password.title}
                </Text>
                {tags.length > 0 ? (
                  <View className="flex-row flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge key={tag.id} className="bg-card border-primary">
                        <UiText className="font-sans text-xs text-text-primary">
                          {tag.name}
                        </UiText>
                      </Badge>
                    ))}
                  </View>
                ) : null}
              </Button>
            </Animated.View>
          );
        }}
      />
    </>
  );
};

export default CrateById;
