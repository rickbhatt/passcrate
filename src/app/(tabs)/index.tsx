import ExpiringPasswords from "@/components/expiring-passwords";
import SearchInput from "@/components/search-input";
import SecurityOverview from "@/components/security-overview";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

const Home = () => {
  const router = useRouter();

  return (
    <ScrollView className="main" contentContainerClassName="gap-y-4 pb-4">
      <Button
        variant="ghost"
        onPress={() => router.push("/search")}
        className="h-14 justify-start rounded-md border border-gray-700 bg-background px-3"
      >
        <View className="flex-1" pointerEvents="none">
          <SearchInput
            value=""
            onChangeText={() => {}}
            placeholder="Search passwords..."
          />
        </View>
      </Button>

      <SecurityOverview />
      <ExpiringPasswords />
    </ScrollView>
  );
};

export default Home;
