import DynamicIcon from "@/components/dynamic-icon";
import { Badge } from "@/components/ui/badge";
import { Text as UiText } from "@/components/ui/text";
import { useDb } from "@/db/hooks/useDb";
import { tagsQuery } from "@/db/queries/tags.queries";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { TagType } from "types";

const CHIP_ICON_COLOR = "#16151c";

const TagsInput = ({
  value,
  onChange,
}: {
  value: TagType[];
  onChange: (tags: TagType[]) => void;
}) => {
  const db = useDb();
  const { data: allTags } = useLiveQuery(tagsQuery(db));

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const commitTag = (rawName: string) => {
    const name = rawName.trim();
    if (!name) return;

    const alreadyAdded = value.some(
      (tag) => tag.name.toLowerCase() === name.toLowerCase(),
    );
    if (alreadyAdded) return;

    const match = allTags?.find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase(),
    );

    const newTag: TagType = match
      ? { id: match.id, name: match.name }
      : { id: null, name };

    onChange([...value, newTag]);
  };

  const handleChangeText = (text: string) => {
    // check if the last character is a space and commits the text as a tag
    if (text.endsWith(" ")) {
      commitTag(text);
      setQuery("");
      return;
    }
    setQuery(text);
  };

  const handleSuggestionPress = (tag: { id: string; name: string }) => {
    commitTag(tag.name);
    setQuery("");
    inputRef.current?.focus();
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return (allTags ?? []).filter(
      (tag) =>
        !value.some((v) => v.name.toLowerCase() === tag.name.toLowerCase()) &&
        tag.name.toLowerCase().includes(normalizedQuery),
    );
  }, [allTags, value, query]);

  const showSuggestions =
    isFocused && query.trim().length > 0 && filteredSuggestions.length > 0;

  return (
    <View className="relative">
      {showSuggestions && (
        <View
          className="absolute bottom-full left-0 right-0 z-50 mb-1 rounded-md border border-gray-700 bg-background"
          style={{ elevation: 8 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 200 }}
          >
            {filteredSuggestions.map((tag) => (
              <Pressable
                key={tag.id}
                onPress={() => handleSuggestionPress(tag)}
                className="px-3 py-2 active:bg-secondary-light"
              >
                <Text className="font-sans text-text-primary text-sm">
                  {tag.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View className="min-h-14 flex-row flex-wrap content-center items-center gap-2 rounded-md border border-gray-700 bg-background p-2">
        {value.map((tag, index) => (
          <Badge
            key={`${tag.id ?? "local"}-${tag.name}`}
            variant="secondary"
            className="gap-1.5 px-3 py-1.5"
          >
            <UiText className="text-base">{tag.name}</UiText>
            <Pressable
              onPress={() => removeTag(index)}
              hitSlop={8}
              className="p-0.5"
            >
              <DynamicIcon
                family="Feather"
                name="x"
                size={16}
                color={CHIP_ICON_COLOR}
              />
            </Pressable>
          </Badge>
        ))}
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={value.length === 0 ? "Add a tag..." : ""}
          placeholderTextColor="#8c8c9c"
          className="min-w-20 flex-1 p-0 font-sans text-base text-text-primary"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
};

export default TagsInput;
