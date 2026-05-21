import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import Svg, { Path } from "react-native-svg";

interface AdjustButtonProps {
  onPress?: () => void;
}

/**
 * Adjustment controls button component
 */
const AdjustButton: React.FC<AdjustButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => {
        console.log("=== AdjustButton PRESSED ===");
        Alert.alert("Debug", "Adjust button pressed!"); // Temporary alert for debugging
        onPress?.();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M3 12h6m4-9v6m5 5v6"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text style={styles.label}>Adjust</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    gap: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "500",
  },
});

export default AdjustButton;
