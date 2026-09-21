import ExpiringPasswords from "@/components/expiring-passwords";
import FavouritePasswords from "@/components/favourite-passwords";
import SearchInput from "@/components/search-input";
import SecurityOverviewStats from "@/components/security-overview-stats";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

const Home = () => {
  const router = useRouter();

  return (
    <ScrollView
      className="main"
      contentContainerClassName="gap-y-4 pb-safe-offset-32"
    >
      <Button
        variant="ghost"
        onPress={() => router.push("/search")}
        className="h-14 justify-start rounded-md border border-border bg-card px-3"
      >
        <View className="flex-1" pointerEvents="none">
          <SearchInput
            value=""
            onChangeText={() => {}}
            placeholder="Search passwords..."
          />
        </View>
      </Button>

      <SecurityOverviewStats />
      <ExpiringPasswords />
      <FavouritePasswords />
    </ScrollView>
  );
};

export default Home;
