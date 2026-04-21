import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    PanResponder,
    TouchableOpacity,
    Image,
    Animated,
} from "react-native";
import Svg, {
    Defs,
    LinearGradient,
    Stop,
    Rect,
    Pattern,
    Path,
} from "react-native-svg";

interface OverlayTrackBarProps {
    overlay: any;
    type: "text" | "sticker" | "pip";
    totalDuration: number;
    currentScrollX: number;
    scrollXRef: React.MutableRefObject<number>;
    onDrag: (moveX: number) => void;
    leftOffset: number;
    topOffset?: number;
    pixelsPerSecond: number;
    isSelected: boolean;
    onPress: () => void;
    onTrim: (overlayId: string, newStart: number, newEnd: number) => void;
    onDragStart?: (x: number) => void;
    onDragEnd?: () => void;
}

const OverlayTrackBar: React.FC<OverlayTrackBarProps> = ({
    overlay,
    leftOffset,
    topOffset = 0,
    totalDuration,
    type,
    pixelsPerSecond,
    isSelected,
    onPress,
    onTrim,
    onDragStart,
    scrollXRef,
    onDrag,
    onDragEnd,
}) => {
    const activeStart = overlay.startTime || 0;
    const activeEnd = overlay.endTime || 3;
    const [isMovingBody, setIsMovingBody] = useState(false);

    const initialLeftPx = leftOffset + activeStart * pixelsPerSecond;
    const initialWidthPx = (activeEnd - activeStart) * pixelsPerSecond;

    const envRef = useRef({
        leftOffset,
        totalDuration,
        pixelsPerSecond,
        overlay,
        onTrim,
        isSelected,
    });
    envRef.current = {
        leftOffset,
        totalDuration,
        pixelsPerSecond,
        overlay,
        onTrim,
        isSelected,
    };

    const leftAnim = useRef(new Animated.Value(initialLeftPx)).current;
    const widthAnim = useRef(new Animated.Value(initialWidthPx)).current;

    // Pure visual fade anims
    const fadeInAnim = useRef(new Animated.Value(0)).current;
    const fadeOutAnim = useRef(new Animated.Value(0)).current;

    const currentLeftRef = useRef(initialLeftPx);
    const currentWidthRef = useRef(initialWidthPx);

    const isDragging = useRef(false);
    const dragType = useRef<"center" | "left" | "right">("center");
    const dragStartLeft = useRef(0);
    const dragStartWidth = useRef(0);
    const dragStartScrollX = useRef(0);
    const latestDx = useRef(0);
    const frameRef = useRef<number | null>(null);

    // Synchronize widths and safe fade caps
    useEffect(() => {
        if (!isDragging.current) {
            leftAnim.setValue(initialLeftPx);
            widthAnim.setValue(initialWidthPx);
            currentLeftRef.current = initialLeftPx;
            currentWidthRef.current = initialWidthPx;

            // Cap the visual fade to half the clip width
            const targetInPx = (overlay.fadeIn || 0) * pixelsPerSecond;
            const targetOutPx = (overlay.fadeOut || 0) * pixelsPerSecond;
            fadeInAnim.setValue(Math.min(targetInPx, initialWidthPx / 2));
            fadeOutAnim.setValue(Math.min(targetOutPx, initialWidthPx / 2));
        }
    }, [
        initialLeftPx,
        initialWidthPx,
        overlay.fadeIn,
        overlay.fadeOut,
        pixelsPerSecond,
        leftAnim,
        widthAnim,
        fadeInAnim,
        fadeOutAnim,
    ]);

    const startDragLoop = () => {
        const loop = () => {
            if (!isDragging.current) return;

            const {
                leftOffset: envLeft,
                totalDuration: envDuration,
                pixelsPerSecond: envPPS,
                overlay: envOverlay,
            } = envRef.current;
            const scrollDelta = scrollXRef.current - dragStartScrollX.current;
            const totalMovement = latestDx.current + scrollDelta;

            let newLeft = dragStartLeft.current;
            let newWidth = dragStartWidth.current;
            const minWidthPx = 0.5 * envPPS;
            const maxRightBoundary = envLeft + envDuration * envPPS;

            if (dragType.current === "center") {
                newLeft = dragStartLeft.current + totalMovement;
                newLeft = Math.max(
                    envLeft,
                    Math.min(
                        newLeft,
                        maxRightBoundary - dragStartWidth.current,
                    ),
                );
            } else if (dragType.current === "left") {
                newLeft = dragStartLeft.current + totalMovement;
                newLeft = Math.max(
                    envLeft,
                    Math.min(
                        newLeft,
                        dragStartLeft.current +
                            dragStartWidth.current -
                            minWidthPx,
                    ),
                );
                newWidth =
                    dragStartLeft.current + dragStartWidth.current - newLeft;
            } else if (dragType.current === "right") {
                newWidth = dragStartWidth.current + totalMovement;
                newWidth = Math.max(
                    minWidthPx,
                    Math.min(
                        newWidth,
                        maxRightBoundary - dragStartLeft.current,
                    ),
                );
            }

            leftAnim.setValue(newLeft);
            widthAnim.setValue(newWidth);
            currentLeftRef.current = newLeft;
            currentWidthRef.current = newWidth;

            // Dynamically squish the fades if the user trims the clip super small!
            const targetInPx = (envOverlay.fadeIn || 0) * envPPS;
            const targetOutPx = (envOverlay.fadeOut || 0) * envPPS;
            fadeInAnim.setValue(Math.min(targetInPx, newWidth / 2));
            fadeOutAnim.setValue(Math.min(targetOutPx, newWidth / 2));

            frameRef.current = requestAnimationFrame(loop);
        };
        frameRef.current = requestAnimationFrame(loop);
    };

    const setupDrag = (
        gestureState: any,
        type: "center" | "left" | "right",
    ) => {
        isDragging.current = true;
        dragType.current = type;
        latestDx.current = 0;

        if (type === "center") setIsMovingBody(true);

        dragStartLeft.current = currentLeftRef.current;
        dragStartWidth.current = currentWidthRef.current;
        dragStartScrollX.current = scrollXRef.current;

        onDragStart?.(gestureState.x0);
        startDragLoop();
    };

    const handleRelease = (gestureState: any) => {
        isDragging.current = false;
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        onDragEnd?.();
        setIsMovingBody(false);

        const {
            leftOffset: envLeft,
            pixelsPerSecond: envPPS,
            onTrim: envTrim,
            overlay: envOverlay,
        } = envRef.current;

        const finalStart = (currentLeftRef.current - envLeft) / envPPS;
        const finalEnd =
            (currentLeftRef.current - envLeft + currentWidthRef.current) /
            envPPS;
        envTrim(envOverlay.id, finalStart, finalEnd);

        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5)
            onPress();
    };

    const createPanResponder = (type: "center" | "left" | "right") =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => envRef.current.isSelected,
            onMoveShouldSetPanResponder: () => envRef.current.isSelected,
            onPanResponderGrant: (_, gestureState) =>
                setupDrag(gestureState, type),
            onPanResponderMove: (_, gestureState) => {
                latestDx.current = gestureState.dx;
                onDrag(gestureState.moveX);
            },
            onPanResponderRelease: (_, gestureState) =>
                handleRelease(gestureState),
        });

    const centerResponder = useRef(createPanResponder("center")).current;
    const leftResponder = useRef(createPanResponder("left")).current;
    const rightResponder = useRef(createPanResponder("right")).current;

    const theme = {
        text: {
            bg: "rgba(236, 154, 21, 0.7)",
            activeBg: "rgba(236, 154, 21, 1)",
            fadeLine: "rgba(236, 154, 21, 0.95)",
            fadeBg: "rgba(0, 0, 0, 0.65)",
        },
        sticker: {
            bg: "rgba(233, 30, 99, 0.7)",
            activeBg: "rgba(233, 30, 99, 1)",
            fadeLine: "rgba(255, 80, 130, 0.95)",
            fadeBg: "rgba(0, 0, 0, 0.65)",
        },
        pip: {
            bg: "rgba(63, 81, 181, 0.7)",
            activeBg: "rgba(63, 81, 181, 1)",
            fadeLine: "rgba(100, 130, 255, 0.95)",
            fadeBg: "rgba(0, 0, 0, 0.65)",
        },
    }[type];

    const currentDuration = (currentWidthRef.current / pixelsPerSecond).toFixed(
        1,
    );

    return (
        <Animated.View
            style={[
                styles.container,
                { left: leftAnim, width: widthAnim, top: topOffset },
            ]}
        >
            <TouchableOpacity
                activeOpacity={isSelected ? 1 : 0.8}
                style={[
                    styles.bar,
                    { backgroundColor: isSelected ? theme.activeBg : theme.bg },
                ]}
                onPress={onPress}
            >
                {overlay.fadeIn > 0 && (
                    <Animated.View
                        style={[
                            styles.fadeZone,
                            { left: 0, width: fadeInAnim },
                        ]}
                        pointerEvents="none"
                    >
                        {/* 1. Put the dark background behind the SVG */}
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                { backgroundColor: theme.fadeBg },
                            ]}
                        />

                        {/* 2. Static 1000px SVG that gets masked by the Animated.View */}
                        <Svg
                            width="1000"
                            height="100%"
                            style={{ position: "absolute", left: 0 }}
                        >
                            <Defs>
                                <Pattern
                                    id={`zebraIn-${overlay.id}`}
                                    width="8"
                                    height="8"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <Path
                                        d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4"
                                        stroke={theme.fadeLine}
                                        strokeWidth="3"
                                    />
                                </Pattern>
                            </Defs>
                            <Rect
                                width="1000"
                                height="100%"
                                fill={`url(#zebraIn-${overlay.id})`}
                            />
                        </Svg>
                    </Animated.View>
                )}

                {/* 🔥 THEMED FADE OUT ZEBRA HASH */}
                {overlay.fadeOut > 0 && (
                    <Animated.View
                        style={[
                            styles.fadeZone,
                            { right: 0, width: fadeOutAnim },
                        ]}
                        pointerEvents="none"
                    >
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                { backgroundColor: theme.fadeBg },
                            ]}
                        />

                        {/* Anchored to the right side so the stripes don't slide weirdly */}
                        <Svg
                            width="1000"
                            height="100%"
                            style={{ position: "absolute", right: 0 }}
                        >
                            <Defs>
                                <Pattern
                                    id={`zebraOut-${overlay.id}`}
                                    width="8"
                                    height="8"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <Path
                                        d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4"
                                        stroke={theme.fadeLine}
                                        strokeWidth="3"
                                    />
                                </Pattern>
                            </Defs>
                            <Rect
                                width="1000"
                                height="100%"
                                fill={`url(#zebraOut-${overlay.id})`}
                            />
                        </Svg>
                    </Animated.View>
                )}

                {/* Content */}
                <View style={styles.contentRow}>
                    {type === "text" ? (
                        <Text style={styles.text} numberOfLines={1}>
                            {overlay.text}
                        </Text>
                    ) : (
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <Image
                                source={{
                                    uri:
                                        type === "sticker"
                                            ? overlay.source
                                            : overlay.uri,
                                }}
                                style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: 3,
                                }}
                                resizeMode="cover"
                            />
                            <Text style={styles.text}>
                                {type === "sticker" ? "Sticker" : "PIP"}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Duration Strip */}
                <View style={styles.durationStrip}>
                    <Text style={styles.durationText}>{currentDuration}s</Text>
                </View>

                {isSelected && !isMovingBody && (
                    <View
                        style={styles.activeBorderOverlay}
                        pointerEvents="none"
                    />
                )}
            </TouchableOpacity>

            {isSelected && (
                <>
                    <View
                        style={StyleSheet.absoluteFill}
                        {...centerResponder.panHandlers}
                    />

                    {!isMovingBody && (
                        <>
                            {/* Trim Handles ONLY */}
                            <View
                                hitSlop={{
                                    top: 10,
                                    bottom: 10,
                                    left: 15,
                                    right: 15,
                                }}
                                style={[styles.handle, styles.leftHandle]}
                                {...leftResponder.panHandlers}
                            />
                            <View
                                hitSlop={{
                                    top: 10,
                                    bottom: 10,
                                    left: 15,
                                    right: 15,
                                }}
                                style={[styles.handle, styles.rightHandle]}
                                {...rightResponder.panHandlers}
                            />
                        </>
                    )}
                </>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { position: "absolute", height: 44 },
    bar: {
        flex: 1,
        borderRadius: 6,
        justifyContent: "flex-start",
        overflow: "hidden",
    },
    contentRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 8,
        paddingTop: 6,
        zIndex: 20,
    },
    text: { color: "#fff", fontSize: 11, fontWeight: "bold" },

    fadeZone: {
        position: "absolute",
        top: 0,
        bottom: 14,
        zIndex: 5,
        overflow: "hidden",
    },
    fadeInZone: {
        left: 0,
        borderRightWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.3)", // Subtle bright edge to define the cut
        borderBottomRightRadius: 4,
    },
    fadeOutZone: {
        right: 0,
        borderLeftWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.3)",
        borderBottomLeftRadius: 4,
    },
    fadeWatermark: {
        color: "rgba(255, 255, 255, 0.25)",
        fontSize: 22,
        fontWeight: "900",
        position: "absolute",
    },

    durationStrip: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 14,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        paddingHorizontal: 8,
        zIndex: 5,
    },
    durationText: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 9,
        fontWeight: "600",
    },
    activeBorderOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: "#ffffff",
        zIndex: 10,
    },
    handle: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 16,
        backgroundColor: "#fff",
        borderRadius: 4,
        zIndex: 20,
    },
    leftHandle: { left: -8 },
    rightHandle: { right: -8 },
});

export default OverlayTrackBar;
