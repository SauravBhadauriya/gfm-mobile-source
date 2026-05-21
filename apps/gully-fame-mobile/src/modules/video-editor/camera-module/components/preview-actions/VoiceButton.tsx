import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface VoiceButtonProps {
  onPress?: () => void;
}

/**
 * Voice recording button component
 */
const VoiceButton: React.FC<VoiceButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M19 10v2a7 7 0 0 1-14 0v-2"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12 19v4M8 23h8"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text style={styles.label}>Voice</Text>
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

export default VoiceButton;
