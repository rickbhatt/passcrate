import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import image from "@/constants/images";
import { COLORS } from "@/constants/theme";
import { useDb } from "@/db/hooks/useDb";
import { cratesQuery } from "@/db/queries/crates.queries";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Image, Text, View } from "react-native";

const PasswordsHeader = ({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) => (
  <View className="mb-4 h-14 flex-row items-center gap-x-2 rounded-md border border-gray-700 bg-background px-3">
    <DynamicIcon
      family="Feather"
      name="search"
      size={18}
      color={COLORS.textSecondary}
    />
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder="Search crates..."
      className="flex-1 border-0 bg-transparent px-0"
    />
  </View>
);

const Passwords = () => {
  const db = useDb();
  const router = useRouter();
  const { data: crates } = useLiveQuery(cratesQuery(db));
  const [search, setSearch] = useState("");

  const filteredCrates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return crates;
    return crates?.filter((crate) => crate.name.toLowerCase().includes(query));
  }, [crates, search]);

  const gridData = useMemo(() => {
    if (!filteredCrates || filteredCrates.length % 2 === 0)
      return filteredCrates;
    return [...filteredCrates, { id: "__filler__", isFiller: true as const }];
  }, [filteredCrates]);

  return (
    <FlatList
      data={gridData}
      keyExtractor={(crate) => crate.id}
      numColumns={2}
      className="main"
      columnWrapperStyle={{ gap: 16 }}
      contentContainerClassName="gap-y-4 pb-safe-offset-32"
      ListHeaderComponent={
        <PasswordsHeader value={search} onChangeText={setSearch} />
      }
      renderItem={({ item: crate }) =>
        "isFiller" in crate ? (
          <View className="flex-1" />
        ) : (
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
        )
      }
    />
  );
};

export default Passwords;
