import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
export type AspectRatio = "9:16" | "16:9" | "1:1" | "2.35:1";

interface Props {
    currentRatio: AspectRatio;
    onPress: () => void;
}

export const AspectRatioSelector: React.FC<Props> = ({
    currentRatio,
    onPress,
}) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.text}>{currentRatio}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        width: 54,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.5)",
    },
    text: { color: "white", fontSize: 12, fontWeight: "bold" },
});
