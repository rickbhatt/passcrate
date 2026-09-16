import DynamicIcon from "@/components/dynamic-icon";
import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/constants/theme";
import { useDb } from "@/db/hooks/useDb";
import { passwordsBySearch } from "@/db/queries/passwords.queries";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";

const SearchHeader = ({
  value,
  onChangeText,
  onBackPress,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onBackPress: () => void;
}) => (
  <View className="mb-2 flex-row items-center gap-x-2 pt-safe-offset-3">
    <Button
      variant="ghost"
      size="icon"
      onPress={onBackPress}
      className="h-10 w-10 min-h-0"
    >
      <DynamicIcon
        family="Feather"
        name="chevron-left"
        size={24}
        color={COLORS.textPrimary}
      />
    </Button>
    <SearchInput
      mode="debounced"
      minQueryLength={2}
      value={value}
      onChangeText={onChangeText}
      placeholder="Search by title, tags, username......"
      autoFocus
      className="h-14 flex-1 rounded-md border border-gray-700 bg-background px-3"
    />
  </View>
);

const Search = () => {
  const db = useDb();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim();

  const { data: results } = useLiveQuery(
    passwordsBySearch({ db, query: trimmedQuery }),
    [trimmedQuery],
  );

  return (
    <FlatList
      data={trimmedQuery ? results : []}
      keyExtractor={(password) => password.id}
      className="main"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-y-1"
      ListHeaderComponent={
        <SearchHeader
          value={query}
          onChangeText={setQuery}
          onBackPress={() => router.back()}
        />
      }
      renderItem={({ item: password }) => (
        <Button
          variant="ghost"
          onPress={() => router.push(`/password/detail/${password.id}`)}
          className="h-auto flex-row items-center justify-start gap-x-3 rounded-none px-1 py-3"
        >
          <DynamicIcon
            family="Feather"
            name="search"
            size={18}
            color={COLORS.textSecondary}
          />
          <View className="flex-1 gap-y-0.5">
            <Text
              className="text-base font-sans-semibold text-text-primary"
              numberOfLines={1}
            >
              {password.title}
            </Text>
            {password.username ? (
              <Text className="text-sm text-text-secondary" numberOfLines={1}>
                {password.username}
              </Text>
            ) : null}
          </View>
        </Button>
      )}
      ListEmptyComponent={
        trimmedQuery ? (
          <Text className="mt-4 text-center text-sm text-text-secondary">
            No results found
          </Text>
        ) : null
      }
    />
  );
};

export default Search;
