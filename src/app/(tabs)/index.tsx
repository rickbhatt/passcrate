import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { View } from "react-native";

const Home = () => {
  return (
    <View>
      <Button onPress={() => console.log("button clicked")}>
        <Text variant={"p"}>Home</Text>
      </Button>
    </View>
  );
};

export default Home;
