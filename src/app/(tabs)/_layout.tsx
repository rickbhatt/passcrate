import { Tabs } from "expo-router";

const TabsLayout = () => {
  return (
    <Tabs screenOptions={{}}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="dummy-create-password" />
      <Tabs.Screen name="passwords" />
    </Tabs>
  );
};

export default TabsLayout;
