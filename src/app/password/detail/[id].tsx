import { useDb } from "@/db/hooks/useDb";
import { passwordById } from "@/db/queries/passwords.queries";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

const PasswordDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const { data } = useLiveQuery(passwordById({ db, id }));

  const password = data?.[0];
  console.log("🚀 ~ PasswordDetail ~ password:", password);
  return (
    <View>
      <Text>PasswordDetail</Text>
    </View>
  );
};

export default PasswordDetail;
