import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from "react-native-reanimated";

/**
 * Aspect Ratio Mask Component
 *
 * Shows dark overlay on top/bottom (or left/right) to indicate
 * the active aspect ratio. Animates smoothly when ratio changes.
 *
 * Supported ratios:
 * - 9:16 (Portrait - default)
 * - 16:9 (Landscape)
 * - 1:1 (Square)
 * - 2.35:1 (Cinematic)
 */

export type AspectRatio = "9:16" | "16:9" | "1:1" | "2.35:1";

interface AspectRatioMaskProps {
  aspectRatio: AspectRatio;
  containerWidth: number;
  containerHeight: number;
  maskColor?: string;
  maskOpacity?: number;
  animationDuration?: number;
}

const RATIO_VALUES: Record<AspectRatio, number> = {
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  "1:1": 1,
  "2.35:1": 2.35 / 1,
};

export const AspectRatioMask: React.FC<AspectRatioMaskProps> = ({
  aspectRatio,
  containerWidth,
  containerHeight,
  maskColor = "#000000",
  maskOpacity = 0.4,
  animationDuration = 300,
}) => {
  const ratioValue = useMemo(() => RATIO_VALUES[aspectRatio], [aspectRatio]);

  // Animated ratio value for smooth transitions
  const animatedRatio = useDerivedValue(() => {
    return withSpring(ratioValue, {
      damping: 10,
      mass: 1,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    });
  });

  // Calculate mask heights based on aspect ratio
  const topMaskStyle = useAnimatedStyle(() => {
    const targetHeight = containerWidth / animatedRatio.value;
    const maskHeight = Math.max(0, (containerHeight - targetHeight) / 2);
    return {
      height: maskHeight,
    };
  });

  const bottomMaskStyle = useAnimatedStyle(() => {
    const targetHeight = containerWidth / animatedRatio.value;
    const maskHeight = Math.max(0, (containerHeight - targetHeight) / 2);
    return {
      height: maskHeight,
    };
  });

  return (
    <>
      {/* Top mask */}
      <Animated.View
        style={[
          styles.mask,
          styles.topMask,
          topMaskStyle,
          {
            backgroundColor: maskColor,
            opacity: maskOpacity,
          },
        ]}
        pointerEvents="none"
      />

      {/* Bottom mask */}
      <Animated.View
        style={[
          styles.mask,
          styles.bottomMask,
          bottomMaskStyle,
          {
            backgroundColor: maskColor,
            opacity: maskOpacity,
          },
        ]}
        pointerEvents="none"
      />

      {/* Safe area indicator (optional - shows the recording area) */}
      <View
        style={[
          styles.safeAreaBorder,
          {
            top: (containerHeight - containerWidth / ratioValue) / 2,
            height: containerWidth / ratioValue,
          },
        ]}
        pointerEvents="none"
      />
    </>
  );
};

const styles = StyleSheet.create({
  mask: {
    position: "absolute",
    width: "100%",
    backgroundColor: "#000000",
  },
  topMask: {
    top: 0,
  },
  bottomMask: {
    bottom: 0,
  },
  safeAreaBorder: {
    position: "absolute",
    width: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    pointerEvents: "none",
  },
});

export default AspectRatioMask;
