import DynamicIcon from "@/components/dynamic-icon";
import ScreenHeader from "@/components/screen-header";
import { COLORS } from "@/contants";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import { GestureResponderEvent, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICON_SIZE = 28;
const TAB_BAR_CONTENT_HEIGHT = 72;

const ACTIVE_ICON_COLOR = COLORS.primary;
const INACTIVE_ICON_COLOR = COLORS.textSecondary;

const TabIconAndLabel = ({
  focused,
  icon,
  label,
}: {
  focused: boolean;
  icon: React.ReactNode;
  label?: string;
}) => (
  <View className={cn("flex-col items-center justify-center")}>
    {icon}
    {label && (
      <Text className={cn("text-xs font-sans-bold", focused && "text-primary")}>
        {label}
      </Text>
    )}
  </View>
);

const TabsLayout = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        header: ({ options }) => <ScreenHeader title={options.title ?? ""} />,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: TAB_BAR_CONTENT_HEIGHT,
          justifyContent: "center",
          alignItems: "center",
          marginTop: 5,
        },
        tabBarIconStyle: {
          width: 150,
          height: 58,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,

          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingHorizontal: 8,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.background,

          // iOS shadow
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.2,
          shadowRadius: 18,

          // Android shadow
          elevation: 24,
        },

        tabBarButton: ({
          children,
          onPress,
          onLongPress,
          accessibilityRole,
          accessibilityState,
          accessibilityLabel,
          testID,
          style,
        }) => {
          return (
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
              className="items-center justify-center"
            >
              {children}
            </Pressable>
          );
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIconAndLabel
              focused={focused}
              label="Home"
              icon={
                <DynamicIcon
                  family="MaterialIcons"
                  name="home"
                  size={TAB_ICON_SIZE}
                  color={focused ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR}
                />
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dummy-create-password"
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push("/password/add");
          },
        })}
        options={{
          title: "Add Password",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIconAndLabel
              icon={
                <DynamicIcon
                  family="MaterialIcons"
                  name="create"
                  size={TAB_ICON_SIZE}
                  color={focused ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR}
                />
              }
              label="Add"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="passwords"
        options={{
          title: "Passwords",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIconAndLabel
              focused={focused}
              label="Passwords"
              icon={
                <DynamicIcon
                  family="MaterialIcons"
                  name="lock"
                  size={TAB_ICON_SIZE}
                  color={focused ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR}
                />
              }
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
