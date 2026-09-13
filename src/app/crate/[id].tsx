import ScreenHeader from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { useDb } from "@/db/hooks/useDb";
import { crateById } from "@/db/queries/crates.queries";
import { passwordsByCrateId } from "@/db/queries/passwords.queries";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Text } from "react-native";

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
        keyExtractor={(password) => password.id}
        className="main"
        contentContainerClassName="gap-y-4 pb-4"
        renderItem={({ item: password }) => (
          <Button
            variant="ghost"
            onPress={() => router.push(`/password/detail/${password.id}`)}
            className="h-auto flex-1 flex-row items-start justify-start rounded-xl border border-primary-dark bg-primary-light p-4"
          >
            <Text
              className="text-base font-sans-semibold text-text-primary"
              numberOfLines={1}
            >
              {password.title}
            </Text>
          </Button>
        )}
      />
    </>
  );
};

export default CrateById;
