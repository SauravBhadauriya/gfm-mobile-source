import React from "react";
import { Text } from "react-native";

export function AppText({ children, style, weight = "regular" }) {
  const fontMap = {
    regular: "Rubik_400Regular",
    medium: "Rubik_500Medium",
    bold: "Rubik_700Bold",
  };

  return <Text style={[{ fontFamily: fontMap[weight] }, style]}>{children}</Text>;
}
