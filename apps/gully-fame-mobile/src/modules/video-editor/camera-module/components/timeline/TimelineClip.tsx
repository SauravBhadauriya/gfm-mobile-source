import React, { memo, useRef } from "react";
import { Image, PanResponder, StyleSheet, Text, View } from "react-native";
import type { CameraClip } from "../../types/camera.types";
import { getClipEffectiveDuration } from "../../utils/timelineHelpers";

interface TimelineClipProps {
    clip: CameraClip;
    width: number;
    thumbnailUri?: string;
    isSelected?: boolean;
    onPress?: (clip: CameraClip) => void;
    onTrimStart?: (clip: CameraClip, newTrimStart: number) => void;
    onTrimEnd?: (clip: CameraClip, newTrimEnd: number) => void;
    onDragStart?: (clip: CameraClip, pageX: number) => void;
    onDrag?: (clip: CameraClip, deltaX: number) => void;
    onDragEnd?: (clip: CameraClip) => void;
    pixelsPerSecond: number;
}

const TimelineClip: React.FC<TimelineClipProps> = ({
    clip,
    width,
    thumbnailUri,
    isSelected = false,
    onPress,
    onTrimStart,
    onTrimEnd,
    onDragStart,
    onDrag,
    onDragEnd,
    pixelsPerSecond,
}) => {
    const isDraggingTrim = useRef<"start" | "end" | null>(null);
    const dragStartX = useRef(0);
    const initialTrimValue = useRef(0);

    const effectiveDuration = getClipEffectiveDuration(clip);
    const trimStart = clip.trimStart ?? 0;
    const trimEnd = clip.trimEnd ?? clip.duration;

    const leftGhostWidth = trimStart * pixelsPerSecond;
    const rightGhostWidth = (clip.duration - trimEnd) * pixelsPerSecond;

    // --- TRIM HANDLERS ---
    const createTrimPanResponder = (side: "start" | "end") => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            // 🔥 This stops the ScrollView from stealing your trim swipe!
            onPanResponderTerminationRequest: () => false,
            onPanResponderGrant: (evt) => {
                isDraggingTrim.current = side;
                dragStartX.current = evt.nativeEvent.pageX;
                initialTrimValue.current =
                    side === "start" ? trimStart : trimEnd;
                onDragStart?.(clip, evt.nativeEvent.pageX);
            },
            onPanResponderMove: (evt) => {
                if (isDraggingTrim.current !== side) return;

                const deltaX = evt.nativeEvent.pageX - dragStartX.current;
                const deltaTime = deltaX / pixelsPerSecond;

                if (side === "start") {
                    const newTrimStart = Math.max(
                        0,
                        Math.min(
                            initialTrimValue.current + deltaTime,
                            trimEnd - 0.1,
                        ),
                    );
                    onTrimStart?.(clip, newTrimStart);
                } else {
                    const newTrimEnd = Math.min(
                        clip.duration,
                        Math.max(
                            initialTrimValue.current + deltaTime,
                            trimStart + 0.1,
                        ),
                    );
                    onTrimEnd?.(clip, newTrimEnd);
                }
            },
            onPanResponderRelease: () => {
                isDraggingTrim.current = null;
                onDragEnd?.(clip);
            },
        });
    };

    const startTrimPanResponder = createTrimPanResponder("start");
    const endTrimPanResponder = createTrimPanResponder("end");

    // --- REORDER DRAG HANDLER (LONG PRESS) ---
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isDragReady = useRef(false);
    const handleTouchStart = (evt: any) => {
        const startX = evt.nativeEvent.pageX;
        longPressTimer.current = setTimeout(() => {
            isDragReady.current = true;
            onDragStart?.(clip, startX);
        }, 300);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        // If the timer never finished, it was just a quick tap!
        if (!isDragReady.current) {
            onPress?.(clip);
        }
    };

    const handleTouchCancel = () => {
        // If the ScrollView steals the touch to scroll, cancel the timer
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        isDragReady.current = false;
    };
    const clipDragPanResponder = useRef(
        PanResponder.create({
            // 🔥 NEVER claim the touch initially. Let the ScrollView have it!
            onStartShouldSetPanResponder: () => false,
            onStartShouldSetPanResponderCapture: () => false,
            // 🔥 ONLY claim the touch if our 300ms timer finished
            onMoveShouldSetPanResponder: () => isDragReady.current,
            onMoveShouldSetPanResponderCapture: () => false,
            onPanResponderMove: (evt) => {
                if (isDragReady.current) {
                    onDrag?.(clip, evt.nativeEvent.pageX);
                }
            },
            onPanResponderRelease: () => {
                if (isDragReady.current) {
                    onDragEnd?.(clip);
                    isDragReady.current = false;
                }
            },
            onPanResponderTerminate: () => {
                if (isDragReady.current) {
                    onDragEnd?.(clip);
                    isDragReady.current = false;
                }
            },
        }),
    ).current;

    const safeWidth = Math.max(width, 24);

    return (
        <View
            style={[
                styles.container,
                { width: safeWidth },
                isSelected && styles.containerSelected,
            ]}
        >
            {/* GHOST FRAMES */}
            {isSelected && leftGhostWidth > 0 && (
                <View
                    style={[
                        styles.ghostFrame,
                        {
                            left: -leftGhostWidth,
                            width: leftGhostWidth,
                            borderRightWidth: 0,
                        },
                    ]}
                >
                    <View style={styles.ghostPattern} />
                </View>
            )}

            {isSelected && rightGhostWidth > 0 && (
                <View
                    style={[
                        styles.ghostFrame,
                        {
                            right: -rightGhostWidth,
                            width: rightGhostWidth,
                            borderLeftWidth: 0,
                        },
                    ]}
                >
                    <View style={styles.ghostPattern} />
                </View>
            )}

            {/* 🔥 REPLACED TOUCHABLE WITH CUSTOM PAN RESPONDER VIEW */}
            <View
                style={styles.clipBody}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                {...clipDragPanResponder.panHandlers}
            >
                {thumbnailUri ? (
                    <Image
                        source={{ uri: thumbnailUri }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.thumbnailPlaceholder}>
                        <Text style={styles.placeholderText}>
                            {clip.type === "video" ? "🎥" : "📷"}
                        </Text>
                    </View>
                )}

                <View style={styles.infoOverlay}>
                    <Text style={styles.durationText}>
                        {formatTime(effectiveDuration)}
                    </Text>
                    {clip.type === "video" && safeWidth > 40 && (
                        <View style={styles.videoIndicator}>
                            <Text style={styles.videoIndicatorText}>VID</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Trim Start Handle */}
            {isSelected && (
                <View
                    style={[
                        styles.trimHandleHitbox,
                        styles.trimHandleHitboxStart,
                    ]}
                    {...startTrimPanResponder.panHandlers}
                >
                    <View
                        style={[
                            styles.trimHandleVisual,
                            styles.trimHandleVisualStart,
                        ]}
                    >
                        <View style={styles.trimHandleBar} />
                    </View>
                </View>
            )}

            {/* Trim End Handle */}
            {isSelected && (
                <View
                    style={[
                        styles.trimHandleHitbox,
                        styles.trimHandleHitboxEnd,
                    ]}
                    {...endTrimPanResponder.panHandlers}
                >
                    <View
                        style={[
                            styles.trimHandleVisual,
                            styles.trimHandleVisualEnd,
                        ]}
                    >
                        <View style={styles.trimHandleBar} />
                    </View>
                </View>
            )}
        </View>
    );
};

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
    container: {
        height: 56,
        marginRight: 2,
        position: "relative",
        borderRadius: 6,
    },
    containerSelected: { borderWidth: 2, borderColor: "#ec9a15", zIndex: 10 },
    clipBody: {
        flex: 1,
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
    },
    thumbnail: { width: "100%", height: "100%", opacity: 0.8 },
    thumbnailPlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#2a2a2a",
    },
    placeholderText: { fontSize: 20 },
    infoOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        paddingHorizontal: 4,
        paddingVertical: 2,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    durationText: { color: "#ffffff", fontSize: 9, fontWeight: "700" },
    videoIndicator: {
        backgroundColor: "rgba(236, 154, 21, 0.9)",
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 2,
    },
    videoIndicatorText: { color: "#000000", fontSize: 7, fontWeight: "800" },
    ghostFrame: {
        position: "absolute",
        top: -2,
        bottom: -2,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 2,
        borderColor: "rgba(236, 154, 21, 0.3)",
        borderStyle: "dashed",
        borderRadius: 6,
        zIndex: -1,
        overflow: "hidden",
    },
    ghostPattern: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    trimHandleHitbox: {
        position: "absolute",
        top: -10,
        bottom: -10,
        width: 40,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 20,
    },
    trimHandleHitboxStart: { left: -20 },
    trimHandleHitboxEnd: { right: -20 },
    trimHandleVisual: {
        width: 14,
        height: 58,
        backgroundColor: "#ec9a15",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 5,
    },
    trimHandleVisualStart: {
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
    },
    trimHandleVisualEnd: {
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
    },
    trimHandleBar: {
        width: 2,
        height: 20,
        backgroundColor: "#000000",
        borderRadius: 1,
    },
});

export default memo(TimelineClip);
