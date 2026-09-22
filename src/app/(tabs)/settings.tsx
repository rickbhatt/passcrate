import DynamicIcon from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { PRIVACY_POLICY_URL } from "@/constants/links";
import { useThemeColors } from "@/constants/theme";
import Constants from "expo-constants";
import { useRouter, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { ColorValue } from "react-native";
import { FlatList, Text, View } from "react-native";

type SettingItem = {
  title: string;
  renderIcon: (color: ColorValue) => React.ReactNode;
  href: Href;
};

const SETTING_ITEMS: SettingItem[] = [
  {
    title: "Account",
    renderIcon: (color) => (
      <DynamicIcon family="Feather" name="user" size={20} color={color} />
    ),
    href: "/setting/account",
  },
  {
    title: "Security",
    renderIcon: (color) => (
      <DynamicIcon
        family="MaterialCommunityIcons"
        name="cellphone-lock"
        size={20}
        color={color}
      />
    ),
    href: "/setting/security",
  },
  {
    title: "Backup & Restore",
    renderIcon: (color) => (
      <DynamicIcon family="Feather" name="refresh-cw" size={20} color={color} />
    ),
    href: "/setting/back-and-restore",
  },
];

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const APP_NAME = Constants.expoConfig?.name ?? "PassCrate";
const COPYRIGHT_YEAR = new Date().getFullYear();

const Settings = () => {
  const COLORS = useThemeColors();
  const router = useRouter();

  return (
    <View className="main gap-y-2">
      <FlatList
        className="flex-1"
        data={SETTING_ITEMS}
        keyExtractor={(item) => item.href.toString()}
        contentContainerClassName="pb-4"
        ItemSeparatorComponent={() => <View className="h-px bg-border" />}
        renderItem={({ item }) => (
          <Button
            variant="ghost"
            onPress={() => router.push(item.href)}
            className="h-auto w-full flex-row items-center gap-x-3 rounded-none px-1 py-3"
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              {item.renderIcon(COLORS.primary)}
            </View>
            <Text className="flex-1 text-base font-sans-semibold text-text-primary">
              {item.title}
            </Text>
            <DynamicIcon
              family="Feather"
              name="chevron-right"
              size={18}
              color={COLORS.textSecondary}
            />
          </Button>
        )}
      />

      <View className="items-center gap-y-1 border-t border-border pb-safe-offset-28 pt-2">
        <Button
          variant="ghost"
          onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          className="h-auto px-2 py-1"
        >
          <Text className="text-sm font-sans-semibold text-primary">
            Privacy Policy
          </Text>
        </Button>
        <Text className="text-sm font-sans-semibold text-text-secondary">
          {APP_NAME} v{APP_VERSION}
        </Text>
        <Text className="text-xs font-sans text-text-secondary">
          © {COPYRIGHT_YEAR} {APP_NAME}. All rights reserved.
        </Text>
      </View>
    </View>
  );
};

export default Settings;
