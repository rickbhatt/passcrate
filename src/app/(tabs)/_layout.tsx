import DynamicIcon from "@/components/dynamic-icon";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import { GestureResponderEvent, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICON_SIZE = 28;
const TAB_BAR_CONTENT_HEIGHT = 60;

const TabsLayout = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarItemStyle: {
          height: TAB_BAR_CONTENT_HEIGHT,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopWidth: 0,
          borderTopColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
        },

        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "#8A8A8A",

        tabBarButton: ({
          children,
          onPress,
          onLongPress,
          accessibilityRole,
          accessibilityState,
          accessibilityLabel,
          testID,
          style,
        }) => (
          <Pressable
            onLongPress={onLongPress}
            accessibilityRole={accessibilityRole}
            accessibilityState={accessibilityState}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
            style={style}
            onPress={(event: GestureResponderEvent) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress?.(event);
            }}
            className="flex-col items-center justify-center"
          >
            {children}
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <DynamicIcon
              family="MaterialIcons"
              name="home"
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text className="text-xs font-sans-semibold" style={{ color }}>
              Home
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="dummy-create-password"
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push("/password/create");
          },
        })}
        options={{
          title: "Create Password",
          tabBarIcon: ({ focused, color, size }) => (
            <DynamicIcon
              family="MaterialIcons"
              name="create"
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text className="text-xs font-sans-semibold" style={{ color }}>
              Create
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="passwords"
        options={{
          title: "Passwords",
          tabBarIcon: ({ focused, color, size }) => (
            <DynamicIcon
              family="MaterialIcons"
              name="password"
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text className="text-xs font-sans-semibold" style={{ color }}>
              Passwords
            </Text>
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
