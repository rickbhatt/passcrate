import ConfirmDialog from "@/components/confirm-dialog";
import DynamicIcon from "@/components/dynamic-icon";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import image from "@/constants/images";
import { COLORS } from "@/constants/theme";
import { useDb } from "@/db/hooks/useDb";
import { deleteCrates } from "@/db/mutations/crates.mutations";
import { cratesQuery } from "@/db/queries/crates.queries";
import { cn } from "@/lib/utils";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Image, Text, View } from "react-native";
import { toast } from "sonner-native";

const PasswordsHeader = ({
  value,
  onChangeText,
  isSelectionMode,
  selectedCount,
  onCancelSelection,
  onDeletePress,
}: {
  value: string;
  onChangeText: (text: string) => void;
  isSelectionMode: boolean;
  selectedCount: number;
  onCancelSelection: () => void;
  onDeletePress: () => void;
}) => (
  <View
    className={cn(
      "mb-4 h-14 flex-row items-center gap-x-2 rounded-md bg-background px-3",
      !isSelectionMode && "border border-gray-700",
    )}
  >
    {isSelectionMode ? (
      <>
        <Button
          variant="ghost"
          size="icon"
          onPress={onCancelSelection}
          className="h-10 w-10 min-h-0"
        >
          <DynamicIcon
            family="Feather"
            name="x"
            size={20}
            color={COLORS.textSecondary}
          />
        </Button>
        <Text className="flex-1 font-sans-semibold text-base text-text-primary">
          {selectedCount} selected
        </Text>
        <Button
          variant="destructive"
          size="icon"
          onPress={onDeletePress}
          className="h-10 w-10 min-h-0 rounded-full"
        >
          <DynamicIcon
            family="FontAwesome6"
            name="trash"
            size={16}
            color="white"
          />
        </Button>
      </>
    ) : (
      <>
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
      </>
    )}
  </View>
);

const Passwords = () => {
  const db = useDb();
  const router = useRouter();
  const { data: crates } = useLiveQuery(cratesQuery(db));
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isSelectionMode = selectedIds.length > 0;

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

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const handleCratePress = (id: string) => {
    if (isSelectionMode) {
      toggleSelected(id);
      return;
    }
    router.push(`/crate/${id}`);
  };

  const handleCrateLongPress = (id: string) => {
    if (!isSelectionMode) {
      setSelectedIds([id]);
      return;
    }
    toggleSelected(id);
  };

  const handleCancelSelection = () => setSelectedIds([]);

  const handleDelete = async () => {
    try {
      await deleteCrates({ db, ids: selectedIds });
      toast.success(
        selectedIds.length > 1
          ? "Crates deleted successfully"
          : "Crate deleted successfully",
      );
      setSelectedIds([]);
    } catch (error) {
      console.error("🚀 ~ handleDelete ~ error", error);
      toast.error("Failed to delete crate(s)");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <FlatList
        data={gridData}
        keyExtractor={(crate) => crate.id}
        numColumns={2}
        className="main"
        columnWrapperStyle={{ gap: 16 }}
        contentContainerClassName="flex-grow gap-y-4 pb-safe-offset-32"
        ListHeaderComponent={
          <PasswordsHeader
            value={search}
            onChangeText={setSearch}
            isSelectionMode={isSelectionMode}
            selectedCount={selectedIds.length}
            onCancelSelection={handleCancelSelection}
            onDeletePress={() => setIsDeleteDialogOpen(true)}
          />
        }
        ListEmptyComponent={
          crates?.length === 0 ? (
            <EmptyState
              description="No passwords yet"
              buttonText="Add Password"
              isCentered
              onButtonPress={() => router.push("/password/add")}
            />
          ) : (
            <EmptyState description="No crates found" />
          )
        }
        renderItem={({ item: crate }) => {
          if ("isFiller" in crate) return <View className="flex-1" />;

          const isSelected = selectedIds.includes(crate.id);

          return (
            <Button
              variant="ghost"
              onPress={() => handleCratePress(crate.id)}
              onLongPress={() => handleCrateLongPress(crate.id)}
              className={cn(
                "h-auto flex-1 flex-col items-center gap-y-2 rounded-md",
                isSelected && "bg-primary-light",
              )}
            >
              <View className="relative">
                <Image
                  source={image.crate}
                  className={cn("size-32", isSelected && "opacity-60")}
                />
                {isSelectionMode ? (
                  <View
                    className={cn(
                      "absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white",
                      isSelected ? "bg-primary" : "bg-black/30",
                    )}
                  >
                    {isSelected ? (
                      <DynamicIcon
                        family="Feather"
                        name="check"
                        size={14}
                        color="white"
                      />
                    ) : null}
                  </View>
                ) : null}
              </View>
              <Text
                className="text-center text-base font-sans-semibold text-text-primary"
                numberOfLines={1}
              >
                {crate.name}
              </Text>
            </Button>
          );
        }}
      />
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={selectedIds.length > 1 ? "Delete Crates" : "Delete Crate"}
        description={`Deleting ${
          selectedIds.length > 1 ? "these crates" : "this crate"
        } will also delete all passwords inside ${
          selectedIds.length > 1 ? "them" : "it"
        }. This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
};

export default Passwords;
