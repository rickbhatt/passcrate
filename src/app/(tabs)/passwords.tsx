import { useDb } from "@/db/hooks/useDb";
import { cratesQuery } from "@/db/queries/crates.queries";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Text, View } from "react-native";

const Passwords = () => {
  const db = useDb();
  const { data: crates } = useLiveQuery(cratesQuery(db));
  console.log("crates", crates);
  return (
    <View>
      <Text>Passwords</Text>
    </View>
  );
};

export default Passwords;
