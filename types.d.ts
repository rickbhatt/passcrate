import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import type { ColorValue } from "react-native";

type IconFamily =
  | "MaterialCommunityIcons"
  | "Ionicons"
  | "FontAwesome"
  | "AntDesign"
  | "Entypo"
  | "MaterialIcons"
  | "Feather"
  | "Foundation";

type DynamicIconProps =
  | {
      family: Extract<IconFamily, "MaterialCommunityIcons">;
      name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
      size?: number;
      color?: ColorValue | string;
    }
  | {
      family: Extract<IconFamily, "Ionicons">;
      name: React.ComponentProps<typeof Ionicons>["name"];
      size?: number;
      color?: ColorValue | string;
    }
  | {
      family: Extract<IconFamily, "AntDesign">;
      name: React.ComponentProps<typeof AntDesign>["name"];
      size?: number;
      color?: ColorValue | string;
    }
  | {
      family: Extract<IconFamily, "FontAwesome">;
      name: React.ComponentProps<typeof FontAwesome>["name"];
      size?: number;
      color?: ColorValue | string;
    }
  | {
      family: Extract<IconFamily, "Entypo">;
      name: React.ComponentProps<typeof Entypo>["name"];
      size?: number;
      color?: ColorValue | string;
    }
  | {
      family: Extract<IconFamily, "MaterialIcons">;
      name: React.ComponentProps<typeof MaterialIcons>["name"];
      size?: number;
      color?: ColorValue | string;
    }
  | {
      family: Extract<IconFamily, "Feather">;
      name: React.ComponentProps<typeof Feather>["name"];
      size?: number;
      color?: ColorValue | string;
    }
  | {
      family: Extract<IconFamily, "Foundation">;
      name: React.ComponentProps<typeof Foundation>["name"];
      size?: number;
      color?: ColorValue | string;
    };

interface TabBarIconProps {
  focused: boolean;
  label?: string;
  icon: React.ReactNode;
}
