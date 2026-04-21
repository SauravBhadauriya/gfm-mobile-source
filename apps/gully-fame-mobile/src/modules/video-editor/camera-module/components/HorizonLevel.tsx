import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Haptics from "expo-haptics";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    runOnJS,
    useAnimatedReaction,
    interpolate,
} from "react-native-reanimated";

const SENSOR_SMOOTHING = 0.1; // Smooth cinema-feel

export const HorizonLevel = () => {
    const rotation = useSharedValue(0);
    const visibility = useSharedValue(0);
    const [isLevel, setIsLevel] = useState(false);
    useEffect(() => {
        visibility.value = withTiming(isLevel ? 0 : 1, { duration: 500 });
    }, [isLevel]);
    useEffect(() => {
        Accelerometer.setUpdateInterval(16);

        const subscription = Accelerometer.addListener(({ x, y }) => {
            const angle = Math.atan2(y, x) * (180 / Math.PI);
            const rawRotation = angle + 90;
            const smoothed =
                rotation.value * (1 - SENSOR_SMOOTHING) +
                rawRotation * SENSOR_SMOOTHING;
            rotation.value = smoothed;

            const levelThreshold = 1.0;
            const isNowLevel =
                Math.abs(smoothed) < levelThreshold ||
                Math.abs(Math.abs(smoothed) - 180) < levelThreshold;

            if (isNowLevel !== isLevel) {
                if (isNowLevel) {
                    runOnJS(Haptics.selectionAsync)();
                }
                runOnJS(setIsLevel)(isNowLevel);
            }
        });

        return () => subscription.remove();
    }, [isLevel]);
    const containerStyle = useAnimatedStyle(() => ({
        opacity: visibility.value,
        transform: [
            { translateY: interpolate(visibility.value, [0, 1], [20, 0]) },
        ], // Subtle slide up
    }));
    const needleStyle = useAnimatedStyle(() => {
        const activeColor = isLevel ? "#4ade80" : "rgba(255,255,255,0.8)";
        return {
            transform: [{ rotate: `${-rotation.value}deg` }],
            backgroundColor: withTiming(activeColor, { duration: 150 }),
            shadowColor: isLevel ? "#4ade80" : "transparent",
            shadowOpacity: isLevel ? 0.5 : 0,
            shadowRadius: 4,
        };
    });

    return (
        <Animated.View
            style={[styles.container, containerStyle]}
            pointerEvents="none"
        >
            <Animated.View style={[styles.needle, needleStyle]} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 20, // Tucked into the bottom right
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(0,0,0,0.4)", // Subtle dark backing
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    needle: {
        width: 40,
        height: 2,
        borderRadius: 1,
        // The needle rotates to stay level with the earth
    },
    fixedNotch: {
        position: "absolute",
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "white",
        // These stay fixed so you can align the needle to them
    },
});
