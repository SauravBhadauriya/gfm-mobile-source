import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface ExposureButtonProps {
    isActive: boolean;
    onPress: () => void;
}

export default function ExposureButton({
    isActive,
    onPress,
}: ExposureButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.button, isActive && styles.buttonActive]}
            onPress={onPress}
        >
            <Text style={[styles.text, isActive && styles.textActive]}>±</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.5)",
    },
    buttonActive: {
        borderColor: "#ec9a15",
    },
    text: {
        color: "white",
        fontSize: 20,
        fontWeight: "400",
    },
    textActive: {
        color: "#ec9a15",
        fontWeight: "bold",
    },
});
