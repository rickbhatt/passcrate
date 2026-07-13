import { Tabs, useRouter } from "expo-router";

const TabsLayout = () => {
  const router = useRouter();
  return (
    <Tabs screenOptions={{}}>
      <Tabs.Screen name="index" />
      <Tabs.Screen
        name="dummy-create-password"
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push("/password/create");
          },
        })}
      />
      <Tabs.Screen name="passwords" />
    </Tabs>
  );
};

export default TabsLayout;
