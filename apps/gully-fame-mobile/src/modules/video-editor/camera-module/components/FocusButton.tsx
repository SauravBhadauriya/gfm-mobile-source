import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import {
    SharedValue,
    useAnimatedReaction,
    runOnJS,
} from "react-native-reanimated";

interface FocusButtonProps {
    focusMode: SharedValue<"auto" | "manual">; // Keeping the prop signature so you don't have to rewrite CameraScreen
    isFocusLocked: SharedValue<boolean>;
}

export default function FocusButton({
    focusMode,
    isFocusLocked,
}: FocusButtonProps) {
    const [label, setLabel] = useState("AF");

    // Update label when lock state changes
    useAnimatedReaction(
        () => isFocusLocked.value,
        (locked) => {
            runOnJS(setLabel)(locked ? "AF-L" : "AF");
        },
    );

    const handlePress = () => {
        // Just toggle the lock state
        isFocusLocked.value = !isFocusLocked.value;
        // Ensure the mode stays auto so Vision Camera knows how to behave
        focusMode.value = "auto";
    };

    return (
        <TouchableOpacity style={styles.button} onPress={handlePress}>
            <Text style={styles.text}>{label}</Text>
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
        borderColor: "#ec9a15",
    },
    text: {
        color: "#ec9a15",
        fontSize: 14,
        fontWeight: "bold",
    },
});
