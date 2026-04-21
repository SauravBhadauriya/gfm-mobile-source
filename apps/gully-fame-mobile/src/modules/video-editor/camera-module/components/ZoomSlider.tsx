import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    SharedValue,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface ZoomSliderProps {
    zoomSharedValue: SharedValue<number>;
    minZoom?: number;
    maxZoom?: number;
    disabled?: boolean;
}

const getZoomLabel = (zoom: number) => {
    const parts = zoom.toString().split(".");
    if (parts.length === 1) return `${parts[0]}x`;
    const truncatedZoom = Number(`${parts[0]}.${parts[1][0]}`);
    return `${truncatedZoom}x`;
};

const SLIDER_WIDTH = 200;
const HANDLE_SIZE = 32;

// The physical slider track will ALWAYS represent 1x -> 4x
const VISUAL_MIN = 1;
const VISUAL_MAX = 4;
const VISUAL_RANGE = VISUAL_MAX - VISUAL_MIN;
const AVAILABLE_WIDTH = SLIDER_WIDTH - HANDLE_SIZE;

const SPRING_CONFIG = {
    mass: 0.5,
    stiffness: 400,
    damping: 25,
};

const ZoomSlider: React.FC<ZoomSliderProps> = ({
    zoomSharedValue,
    minZoom = VISUAL_MIN,
    maxZoom = VISUAL_MAX,
    disabled = false,
}) => {
    const [displayZoom, setDisplayZoom] = useState(minZoom);

    // Maps a zoom level to a physical pixel position on the track
    const zoomToPosition = (z: number) => {
        "worklet";
        // Clamp visual movement strictly between 1x and 4x
        const clampedZ = Math.max(VISUAL_MIN, Math.min(VISUAL_MAX, z));
        return ((VISUAL_MAX - clampedZ) / VISUAL_RANGE) * AVAILABLE_WIDTH;
    };

    // Maps a physical handle position back to a zoom level
    const positionToZoom = (pos: number) => {
        "worklet";
        const clampedPos = Math.max(0, Math.min(AVAILABLE_WIDTH, pos));
        return VISUAL_MAX - (clampedPos / AVAILABLE_WIDTH) * VISUAL_RANGE;
    };

    const translateX = useSharedValue(zoomToPosition(minZoom));
    const startX = useSharedValue(0);
    const isDragging = useSharedValue(false);

    useAnimatedReaction(
        () => zoomSharedValue.value,
        (currentZoom, previousZoom) => {
            if (!isDragging.value && currentZoom !== previousZoom) {
                translateX.value = withSpring(
                    zoomToPosition(currentZoom),
                    SPRING_CONFIG,
                );
            }
        },
    );

    const panGesture = Gesture.Pan()
        .enabled(!disabled)
        .onStart(() => {
            isDragging.value = true;
            startX.value = translateX.value;
        })
        .onUpdate((event) => {
            let newX = startX.value + event.translationX;
            newX = Math.max(0, Math.min(AVAILABLE_WIDTH, newX));
            translateX.value = newX;
            const newZoom = positionToZoom(newX);
            zoomSharedValue.value = newZoom;
            runOnJS(setDisplayZoom)(newZoom);
        })
        .onEnd(() => {
            isDragging.value = false;
        });

    const handleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    useAnimatedReaction(
        () => zoomSharedValue.value,
        (currentZoom) => {
            if (!isDragging.value) {
                runOnJS(setDisplayZoom)(currentZoom);
            }
        },
    );

    // Fixed math to perfectly center the 6px dot inside the track
    const getDotPosition = (level: number) => {
        // 20 (handle left margin) + 16 (half handle) + position - 3 (half dot)
        return 20 + HANDLE_SIZE / 2 + zoomToPosition(level) - 3;
    };

    // Static markers for the UI
    const slots = [4, 3, 2, 1];

    const getActiveSlot = () => {
        // Acts like a "floor" so it doesn't jump to 2x until you hit 2.0x
        if (displayZoom >= 4) return 4;
        if (displayZoom >= 3) return 3;
        if (displayZoom >= 2) return 2;
        return 1;
    };

    const renderLabel = (slot: number, index: number) => {
        const activeSlot = getActiveSlot();
        const isActive = slot === activeSlot;

        // If active, show the dynamic decimal. If inactive, show the static slot.
        const displayText = isActive
            ? `${getZoomLabel(displayZoom)}`
            : `${slot}x`;

        return (
            <Text
                key={index}
                style={[styles.label, isActive && styles.labelActive]}
            >
                {displayText}
            </Text>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.labelsContainer}>
                {slots.map((slot, index) => renderLabel(slot, index))}
            </View>

            <GestureDetector gesture={panGesture}>
                <View style={styles.trackContainer}>
                    <View style={styles.trackLine} />
                    {slots.map((slot, index) => (
                        <View
                            key={index}
                            style={[styles.dot, { left: getDotPosition(slot) }]}
                        />
                    ))}

                    <Animated.View style={[styles.handle, handleStyle]}>
                        <View style={styles.handleInner} />
                    </Animated.View>
                </View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: SLIDER_WIDTH,
        height: 80,
        justifyContent: "center",
        alignItems: "center",
    },
    labelsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: SLIDER_WIDTH,
        marginBottom: 8,
        paddingHorizontal: HANDLE_SIZE / 2,
        pointerEvents: "none",
    },
    label: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
        minWidth: 32,
    },
    labelActive: {
        color: "#ec9a15",
        fontWeight: "700",
        fontSize: 13,
    },
    trackContainer: {
        position: "relative",
        width: SLIDER_WIDTH + 40,
        height: HANDLE_SIZE + 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    trackLine: {
        position: "absolute",
        top: (HANDLE_SIZE + 20) / 2 - 1,
        left: 20 + HANDLE_SIZE / 2,
        width: AVAILABLE_WIDTH,
        height: 2,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: 1,
    },
    dot: {
        position: "absolute",
        top: (HANDLE_SIZE + 20) / 2 - 3,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        // 🔥 The rogue transform: [{ translateX: 20 }] was DELETED from here!
    },
    handle: {
        position: "absolute",
        top: 10,
        left: 20,
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        justifyContent: "center",
        alignItems: "center",
    },
    handleInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#ffffff",
        borderWidth: 4,
        borderColor: "#ec9a15",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 6,
    },
});

export default ZoomSlider;
