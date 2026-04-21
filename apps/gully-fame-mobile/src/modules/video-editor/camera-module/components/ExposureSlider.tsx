import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import Animated, {
    runOnJS,
    SharedValue,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

interface ExposureSliderProps {
    exposureSharedValue: SharedValue<number>;
    minExposure: number;
    maxExposure: number;
    isActive: boolean;
    disabled?: boolean;
}

const SLIDER_HEIGHT = 200;
const HANDLE_SIZE = 32;
const HALF_HEIGHT = SLIDER_HEIGHT / 2;

export const ExposureSlider: React.FC<ExposureSliderProps> = ({
    exposureSharedValue,
    minExposure,
    isActive,
    maxExposure,
    disabled = false,
}) => {
    const [displayVal, setDisplayVal] = useState(0);

    const translateY = useSharedValue(0);
    const startY = useSharedValue(0);
    const isDragging = useSharedValue(false);
    const sliderOffset = useDerivedValue(() => {
        return isActive ? withSpring(0) : withSpring(100);
    });
    const sliderAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: sliderOffset.value }],
        opacity: withTiming(isActive ? 1 : 0),
    }));
    const resetExposure = () => {
        "worklet";
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        translateY.value = withSpring(0); // Snap handle back to center
        exposureSharedValue.value = 0;
        runOnJS(setDisplayVal)(0);
    };
    const panGesture = Gesture.Pan()
        .enabled(!disabled)
        .onStart(() => {
            isDragging.value = true;
            startY.value = translateY.value;
        })
        .onUpdate((event) => {
            // Clamp the movement to the top and bottom of the slider track
            let newY = startY.value + event.translationY;
            newY = Math.max(-HALF_HEIGHT, Math.min(HALF_HEIGHT, newY));
            translateY.value = newY;

            // Map the physical Y position to the exposure range
            // Top (-HALF_HEIGHT) = maxExposure, Bottom (+HALF_HEIGHT) = minExposure
            const progress = (newY + HALF_HEIGHT) / SLIDER_HEIGHT;
            const newExposure =
                maxExposure - progress * (maxExposure - minExposure);
            if (
                Math.abs(newExposure) < 0.1 &&
                Math.abs(exposureSharedValue.value) >= 0.1
            ) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            }
            exposureSharedValue.value = newExposure;
            runOnJS(setDisplayVal)(newExposure);
        })
        .onEnd(() => {
            isDragging.value = false;
        });
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            resetExposure();
        });
    const composedGesture = Gesture.Exclusive(panGesture, doubleTapGesture);
    const handleStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // Format the number to always show a sign (+1.2, -0.5, 0.0)
    const formattedExposure =
        displayVal > 0 ? `+${displayVal.toFixed(1)}` : displayVal.toFixed(1);

    return (
        <Animated.View style={[styles.container, sliderAnimatedStyle]}>
            <GestureDetector gesture={composedGesture}>
                <View style={styles.trackContainer}>
                    <View style={styles.trackLine} />

                    {/* Center detent marker */}
                    <View style={styles.centerMark} />

                    <Animated.View style={[styles.handle, handleStyle]}>
                        <View style={styles.handleInner}>
                            {/* Sun Icon approximation using text for now! */}
                            <Text style={styles.sunIcon}>☀</Text>
                        </View>
                    </Animated.View>
                </View>
            </GestureDetector>

            <Text style={styles.valueText}>{formattedExposure} EV</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        right: 20, // Positioned on the left side of the screen
        top: "50%",
        marginTop: -SLIDER_HEIGHT / 2,
        alignItems: "center",
        zIndex: 10,
    },
    trackContainer: {
        width: 44,
        height: SLIDER_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
    },
    trackLine: {
        position: "absolute",
        width: 2,
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: 1,
    },
    centerMark: {
        position: "absolute",
        width: 12,
        height: 2,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
    handle: {
        position: "absolute",
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        justifyContent: "center",
        alignItems: "center",
    },
    handleInner: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderWidth: 1.5,
        borderColor: "#ec9a15",
        justifyContent: "center",
        alignItems: "center",
    },
    sunIcon: {
        color: "#ec9a15",
        fontSize: 16,
        lineHeight: 18,
    },
    valueText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
        marginTop: 12,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
