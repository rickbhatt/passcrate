import SearchInput from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { View } from "react-native";

const Home = () => {
  const router = useRouter();

  return (
    <View className="main">
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
    </View>
  );
};

export default Home;
