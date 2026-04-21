import React from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    runOnJS,
    SharedValue,
    useAnimatedReaction,
    withSpring,
} from "react-native-reanimated";

interface FocusSliderProps {
    focusDepth: SharedValue<number>;
    onDepthChange?: (depth: number) => void;
}

const SLIDER_HEIGHT = 200;
const HANDLE_SIZE = 32;
const TRACK_WIDTH = 4;

const SPRING_CONFIG = {
    mass: 0.5,
    stiffness: 400,
    damping: 25,
};

export const FocusSlider: React.FC<FocusSliderProps> = ({
    focusDepth,
    onDepthChange,
}) => {
    const translateY = useSharedValue(0);
    const isDragging = useSharedValue(false);
    const startY = useSharedValue(0);

    // Update slider position when focusDepth changes externally (and not dragging)
    useAnimatedReaction(
        () => focusDepth.value,
        (currentDepth, previousDepth) => {
            if (!isDragging.value && currentDepth !== previousDepth) {
                const newY = (1 - currentDepth) * (SLIDER_HEIGHT - HANDLE_SIZE);
                translateY.value = withSpring(newY, SPRING_CONFIG);
            }
        },
    );

    const panGesture = Gesture.Pan()
        .onStart(() => {
            isDragging.value = true;
            startY.value = translateY.value;
        })
        .onUpdate((event) => {
            let newY = startY.value + event.translationY;
            newY = Math.max(0, Math.min(SLIDER_HEIGHT - HANDLE_SIZE, newY));
            translateY.value = newY;
            const depth = 1 - newY / (SLIDER_HEIGHT - HANDLE_SIZE);
            focusDepth.value = depth;
            if (onDepthChange) runOnJS(onDepthChange)(depth);
        })
        .onEnd(() => {
            isDragging.value = false;
        });

    const handleStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <View style={styles.container}>
            <View style={styles.track} />
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.handle, handleStyle]}>
                    <View style={styles.handleInner} />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        right: 20,
        top: "50%",
        marginTop: -SLIDER_HEIGHT / 2,
        width: 44,
        height: SLIDER_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    track: {
        width: TRACK_WIDTH,
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: 2,
    },
    handle: {
        position: "absolute",
        left: 0,
        width: 44,
        top: 0,
        height: HANDLE_SIZE,
        justifyContent: "center",
        alignItems: "center",
    },
    handleInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#ec9a15",
        borderWidth: 2,
        borderColor: "white",
    },
});

export default FocusSlider;
