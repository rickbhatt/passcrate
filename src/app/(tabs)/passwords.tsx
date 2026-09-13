import { Button } from "@/components/ui/button";
import image from "@/constants/images";
import { useDb } from "@/db/hooks/useDb";
import { cratesQuery } from "@/db/queries/crates.queries";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { FlatList, Image, Text } from "react-native";

const Passwords = () => {
  const db = useDb();
  const router = useRouter();
  const { data: crates } = useLiveQuery(cratesQuery(db));

  return (
    <FlatList
      data={crates}
      keyExtractor={(crate) => crate.id}
      numColumns={2}
      className="main"
      columnWrapperStyle={{ gap: 16 }}
      contentContainerClassName="gap-y-4 pb-4"
      renderItem={({ item: crate }) => (
        <Button
          variant="ghost"
          onPress={() => router.push(`/crate/${crate.id}`)}
          className="h-auto flex-1 flex-col items-center gap-y-2"
        >
          <Image source={image.crate} className="size-32" />
          <Text
            className="text-center text-base font-sans-semibold text-text-primary"
            numberOfLines={1}
          >
            {crate.name}
          </Text>
        </Button>
      )}
    />
  );
};

export default Passwords;
