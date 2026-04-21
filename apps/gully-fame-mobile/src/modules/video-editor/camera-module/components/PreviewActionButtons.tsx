import React from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

interface PreviewActionButtonsProps {
    displayUri?: string;
    onFilterClick?: () => void; // Changed from passing a filter object to just a click trigger
    onOverlay?: () => void;
    onText?: () => void;
    onSticker?: () => void;
    onMusic?: () => void;
}

const ToolButton = ({
    icon,
    label,
    onPress,
}: {
    icon: string;
    label: string;
    onPress?: () => void;
}) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
        <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{icon}</Text>
        </View>
        <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
);

const PreviewActionButtons: React.FC<PreviewActionButtonsProps> = ({
    onFilterClick,
    onOverlay,
    onText,
    onSticker,
    onMusic,
}) => {
    return (
        <View style={styles.container}>
            <ToolButton icon="✨" label="Filter" onPress={onFilterClick} />
            <ToolButton icon="🖼️" label="Overlay" onPress={onOverlay} />
            <ToolButton icon="T" label="Text" onPress={onText} />
            <ToolButton icon="😃" label="Sticker" onPress={onSticker} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
        backgroundColor: "#000000",
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.05)",
    },
    button: { alignItems: "center", gap: 6 },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    iconText: { fontSize: 16 },
    label: { color: "#ffffff", fontSize: 10, fontWeight: "500" },
});

export default PreviewActionButtons;
