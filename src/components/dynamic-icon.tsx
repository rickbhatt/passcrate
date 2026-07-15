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
import { DynamicIconProps } from "types";

const ICON_FAMILIES = {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome,
  AntDesign,
  Entypo,
  MaterialIcons,
  Feather,
  Foundation,
};

const DynamicIcon = ({
  family,
  name,
  size = 24,
  color = "#000000",
}: DynamicIconProps) => {
  const Icon = ICON_FAMILIES[family];

  if (!Icon) return null;
  return <Icon name={name as any} size={size} color={color} />;
};

export default DynamicIcon;
