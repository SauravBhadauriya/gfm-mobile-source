import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    Text,
} from "react-native";
import type { CameraClip } from "../../types/camera.types";
import { calculateTimelinePositions } from "../../utils/timelineHelpers";
import TimelineClip from "./TimelineClip";
import OverlayTrackBar from "../OverlayTrackBar";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TIMELINE_HEIGHT = 100;
const PIXELS_PER_SECOND = 60;
const AUTO_SCROLL_THRESHOLD = SCREEN_WIDTH * 0.3;
const AUTO_SCROLL_SPEED = 8;
const AUTO_SCROLL_DELAY = 150;

interface MultiClipTimelineProps {
    clips: CameraClip[];
    currentTime: number;
    isPlaying: boolean;
    selectedClipId?: string;
    showTextTrack?: boolean;
    showStickerTrack?: boolean;
    showPipTrack?: boolean;
    selectedOverlayId?: string | null;
    globalTextOverlays?: any[];
    globalStickerOverlays?: any[];
    globalPipOverlays?: any[];
    totalDuration: number;
    selectedStickerId?: string | null;
    selectedPipId?: string | null;
    onTimelineDragStart?: () => void;
    onTimelineDragEnd?: () => void;
    onTextTrim?: (
        clipId: string,
        overlayId: string,
        newStart: number,
        newEnd: number,
    ) => void;
    onStickerTrim?: (
        clipId: string,
        overlayId: string,
        newStart: number,
        newEnd: number,
    ) => void;
    onPipTrim?: (
        clipId: string,
        overlayId: string,
        newStart: number,
        newEnd: number,
    ) => void;
    onTextPress?: (overlayId: string) => void;
    onStickerPress?: (overlayId: string) => void;
    onPipPress?: (overlayId: string) => void;
    thumbnails?: Map<string, string>;
    onClipPress?: (clip: CameraClip) => void;
    onTrimStart?: (clip: CameraClip, newTrimStart: number) => void;
    onTrimEnd?: (clip: CameraClip, newTrimEnd: number) => void;
    onClipReorder?: (fromIndex: number, toIndex: number) => void;
    onTimelineSeek?: (time: number) => void;
    onScroll?: (scrollX: number) => void;
}
const calculateLanes = (overlays: any[]) => {
    if (!overlays || overlays.length === 0) return [];

    // Sort by start time first for cleaner packing
    const sorted = [...overlays].sort(
        (a, b) => (a.startTime || 0) - (b.startTime || 0),
    );
    const lanes: any[][] = [];

    return sorted.map((overlay) => {
        let placedLane = -1;
        for (let i = 0; i < lanes.length; i++) {
            const hasCollision = lanes[i].some((existing) => {
                const start1 = overlay.startTime || 0;
                const end1 = overlay.endTime || 3;
                const start2 = existing.startTime || 0;
                const end2 = existing.endTime || 3;
                // If they overlap in time, it's a collision
                return start1 < end2 && end1 > start2;
            });

            if (!hasCollision) {
                lanes[i].push(overlay);
                placedLane = i;
                break;
            }
        }

        // If it collided with every existing lane, create a new one below!
        if (placedLane === -1) {
            lanes.push([overlay]);
            placedLane = lanes.length - 1;
        }
        return { ...overlay, lane: placedLane };
    });
};
const MultiClipTimeline: React.FC<MultiClipTimelineProps> = ({
    clips,
    currentTime,
    selectedClipId,
    isPlaying,
    onClipPress,
    onTrimStart,
    onTrimEnd,
    onClipReorder,
    onTimelineSeek,
    onScroll,
    thumbnails = new Map(),
    showTextTrack,
    onTextTrim,
    selectedOverlayId,
    onTextPress,
    selectedPipId,
    selectedStickerId,
    showPipTrack,
    showStickerTrack,
    onPipPress,
    onPipTrim,
    onStickerPress,
    onStickerTrim,
    onTimelineDragEnd,
    onTimelineDragStart,
    totalDuration,
    globalPipOverlays,
    globalStickerOverlays,
    globalTextOverlays,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const isDraggingClip = useRef(false);
    const draggedClipIndex = useRef<number | null>(null);

    // Track visual drag translation
    const dragStartScreenX = useRef(0);
    const dragStartScrollX = useRef(0);
    const [dragDeltaX, setDragDeltaX] = useState(0);
    const dragPreviewX = useRef<number | null>(null);
    const [currentScrollX, setCurrentScrollX] = useState(0);
    const [isTrackDragging, setIsTrackDragging] = useState(false);
    // Edge Scrolling Refs
    const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
    const overlayAutoScrollFrame = useRef<number | null>(null);
    const overlayAutoScrollTimeout = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);
    const overlayFingerXRef = useRef(0);
    const overlayDraggingRef = useRef(false);
    const isDraggingOverlayRef = useRef(false);

    const totalWidth = totalDuration * PIXELS_PER_SECOND;

    const startOverlayAutoScroll = useCallback(() => {
        // Clear any existing timeout and frame
        if (overlayAutoScrollTimeout.current)
            clearTimeout(overlayAutoScrollTimeout.current);
        if (overlayAutoScrollFrame.current)
            cancelAnimationFrame(overlayAutoScrollFrame.current);

        overlayAutoScrollTimeout.current = setTimeout(() => {
            const loop = () => {
                if (!overlayDraggingRef.current) return;
                const fingerX = overlayFingerXRef.current;
                let newScrollX = scrollXRef.current;
                let didScroll = false;

                if (fingerX < AUTO_SCROLL_THRESHOLD) {
                    newScrollX = Math.max(
                        0,
                        scrollXRef.current - AUTO_SCROLL_SPEED,
                    );
                    didScroll = true;
                } else if (fingerX > SCREEN_WIDTH - AUTO_SCROLL_THRESHOLD) {
                    newScrollX = Math.min(
                        totalWidth,
                        scrollXRef.current + AUTO_SCROLL_SPEED,
                    );
                    didScroll = true;
                }

                if (didScroll && newScrollX !== scrollXRef.current) {
                    scrollViewRef.current?.scrollTo({
                        x: newScrollX,
                        animated: false,
                    });
                    scrollXRef.current = newScrollX;
                    // setCurrentScrollX(newScrollX);
                }

                // Continue scrolling only if still dragging
                if (overlayDraggingRef.current) {
                    overlayAutoScrollFrame.current =
                        requestAnimationFrame(loop);
                }
            };
            overlayAutoScrollFrame.current = requestAnimationFrame(loop);
        }, AUTO_SCROLL_DELAY);
    }, [totalWidth]);

    const stopOverlayAutoScroll = useCallback(() => {
        if (overlayAutoScrollTimeout.current) {
            clearTimeout(overlayAutoScrollTimeout.current);
            overlayAutoScrollTimeout.current = null;
        }
        if (overlayAutoScrollFrame.current) {
            cancelAnimationFrame(overlayAutoScrollFrame.current);
            overlayAutoScrollFrame.current = null;
        }
    }, []);
    const handleOverlayDragStart = useCallback(
        (startX: number) => {
            setIsTrackDragging(true);
            overlayDraggingRef.current = true;
            overlayFingerXRef.current = startX;
            startOverlayAutoScroll();
        },
        [startOverlayAutoScroll],
    );

    const handleOverlayDrag = useCallback((moveX: number) => {
        overlayFingerXRef.current = moveX;
    }, []);

    const handleOverlayDragEnd = useCallback(() => {
        setIsTrackDragging(false);
        overlayDraggingRef.current = false;
        stopOverlayAutoScroll();
    }, [stopOverlayAutoScroll]);

    const currentFingerX = useRef<number>(0);
    const scrollXRef = useRef<number>(0); // Fast-access ref for the interval loop
    const isPlayingRef = useRef(isPlaying);
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);
    const positionedClips = React.useMemo(
        () => calculateTimelinePositions(clips),
        [clips],
    );

    const lastScrollTimeRef = useRef(0);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
        };
    }, []);

    // Auto-scroll to playhead
    useEffect(() => {
        if (
            isPlaying &&
            !isDraggingClip.current &&
            scrollViewRef.current &&
            !isTrackDragging
        ) {
            const targetScrollX = currentTime * PIXELS_PER_SECOND;

            scrollViewRef.current.scrollTo({
                x: targetScrollX,
                animated: true,
            });
        }
    }, [currentTime, isPlaying, isTrackDragging]);

    // 🔥 THE CONVEYOR BELT: Auto-scrolls the timeline when dragging near edges
    const startAutoScrollLoop = useCallback(() => {
        if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);

        autoScrollTimer.current = setInterval(() => {
            if (!isDraggingClip.current) return;

            const fingerX = currentFingerX.current;
            let newScrollX = scrollXRef.current;

            // Near left edge
            if (fingerX < AUTO_SCROLL_THRESHOLD) {
                newScrollX = Math.max(
                    0,
                    scrollXRef.current - AUTO_SCROLL_SPEED,
                );
            }
            // Near right edge
            else if (fingerX > SCREEN_WIDTH - AUTO_SCROLL_THRESHOLD) {
                const maxScroll = Math.max(0, totalWidth);
                newScrollX = Math.min(
                    maxScroll,
                    scrollXRef.current + AUTO_SCROLL_SPEED,
                );
            }

            // If we actually need to scroll
            if (newScrollX !== scrollXRef.current) {
                scrollViewRef.current?.scrollTo({
                    x: newScrollX,
                    animated: false,
                });

                scrollXRef.current = newScrollX;
                // setCurrentScrollX(newScrollX);

                // Re-calculate the visual position of the floating clip so it stays under your finger!
                const deltaX =
                    fingerX -
                    dragStartScreenX.current +
                    (newScrollX - dragStartScrollX.current);
                setDragDeltaX(deltaX);
            }
        }, 16); // ~60 FPS
    }, [totalWidth]);
    const dragLeftEdgeOffset = useRef(0);
    const handleClipDragStart = useCallback(
        (clip: CameraClip, pageX: number) => {
            const index = clips.findIndex((c) => c.id === clip.id);
            if (index === -1) return;

            isDraggingClip.current = true;
            draggedClipIndex.current = index;

            // 1. Calculate where the clip's left edge is in Screen Space right now
            const clipTimelineStartPx =
                (positionedClips[index].timelineStart ?? 0) * PIXELS_PER_SECOND;
            const clipScreenX =
                clipTimelineStartPx - scrollXRef.current + SCREEN_WIDTH / 2;

            // 2. Calculate the offset: How far from the left edge did the user tap?
            dragLeftEdgeOffset.current = pageX - clipScreenX;

            // 3. Capture geometry for the visual translation
            dragStartScreenX.current = pageX;
            dragStartScrollX.current = scrollXRef.current;
            currentFingerX.current = pageX;
            dragPreviewX.current = pageX;

            setDragDeltaX(0);
            startAutoScrollLoop();
        },
        [clips, positionedClips, startAutoScrollLoop],
    );

    const handleClipDrag = useCallback((clip: CameraClip, pageX: number) => {
        if (draggedClipIndex.current === null) return;

        currentFingerX.current = pageX;
        dragPreviewX.current = pageX; // 🔥 Update the Ref directly

        const deltaX =
            pageX -
            dragStartScreenX.current +
            (scrollXRef.current - dragStartScrollX.current);
        setDragDeltaX(deltaX);
    }, []);

    const handleClipDragEnd = useCallback(
        (clip: CameraClip) => {
            if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);

            if (draggedClipIndex.current === null) return;
            const fromIndex = draggedClipIndex.current;

            if (dragPreviewX.current !== null && scrollViewRef.current) {
                // 1. Calculate the center of the dragged clip
                const dragWidthPx =
                    (positionedClips[fromIndex].timelineEnd! -
                        positionedClips[fromIndex].timelineStart!) *
                    PIXELS_PER_SECOND;
                const leftEdgeX =
                    dragPreviewX.current - dragLeftEdgeOffset.current;
                const centerPreviewX = leftEdgeX + dragWidthPx / 2;
                const centerTimelineX =
                    centerPreviewX + scrollXRef.current - SCREEN_WIDTH / 2;
                const centerTime = centerTimelineX / PIXELS_PER_SECOND;

                // 2. 🔥 MIDPOINT GRAVITY LOGIC:
                // We start with the assumption it goes to index 0.
                // We then check how many clip midpoints we have moved past.
                let targetIndex = 0;
                for (let i = 0; i < positionedClips.length; i++) {
                    const c = positionedClips[i];
                    const midpoint =
                        ((c.timelineStart ?? 0) + (c.timelineEnd ?? 0)) / 2;

                    if (centerTime > midpoint) {
                        targetIndex = i;
                    }
                }

                // 3. Trigger reorder only if the slot actually changed
                if (targetIndex !== fromIndex) {
                    onClipReorder?.(fromIndex, targetIndex);
                }
            }

            // Cleanup
            isDraggingClip.current = false;
            draggedClipIndex.current = null;
            dragPreviewX.current = null;
            setDragDeltaX(0);
        },
        [positionedClips, onClipReorder, totalDuration, clips.length],
    );

    const handleScroll = useCallback(
        (event: any) => {
            const scrollX = (event.nativeEvent as any).contentOffset?.x || 0;
            setCurrentScrollX(scrollX);
            scrollXRef.current = scrollX; // Keep ref updated for the interval loop
            onScroll?.(scrollX);
            if (
                !isPlayingRef.current &&
                !isDraggingClip.current &&
                !overlayDraggingRef.current
            ) {
                setCurrentScrollX(scrollX);
            }
        },
        [onScroll],
    );

    const handleTimelinePress = useCallback(
        (event: any) => {
            if (isDraggingClip.current) return;
            const { locationX } = event.nativeEvent;
            const time = Math.max(
                0,
                (locationX - SCREEN_WIDTH / 2) / PIXELS_PER_SECOND,
            );
            onTimelineSeek?.(Math.max(0, Math.min(time, totalDuration)));
        },
        [totalDuration, onTimelineSeek],
    );
    const hasMultipleTracks =
        showTextTrack ||
        showStickerTrack ||
        showPipTrack ||
        clips.some(
            (c) =>
                (c.textOverlays?.length || 0) > 0 ||
                (c.stickerOverlays?.length || 0) > 0 ||
                (c.pipOverlays?.length || 0) > 0,
        );
    return (
        <View style={styles.container}>
            {/* 🔥 1. OUTER SCROLL: Horizontal (Moves the Ruler and Tracks together left/right) */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                onScrollBeginDrag={onTimelineDragStart}
                onScrollEndDrag={onTimelineDragEnd}
                onMomentumScrollEnd={onTimelineDragEnd}
                contentContainerStyle={[
                    styles.timelineContent,
                    {
                        width: Math.max(
                            totalWidth + SCREEN_WIDTH,
                            SCREEN_WIDTH,
                        ),
                    },
                ]}
                scrollEnabled={!isTrackDragging}
            >
                <View style={{ flexDirection: "column", flex: 1 }}>
                    {/* 🔥 2. PINNED RULER: Stays at the top, but scrubs left/right! */}
                    <TouchableWithoutFeedback onPress={handleTimelinePress}>
                        <View style={styles.rulerContainer}>
                            <View style={{ width: SCREEN_WIDTH / 2 }} />
                            {Array.from({
                                length: Math.ceil(totalDuration) + 1,
                            }).map((_, i) => (
                                <View
                                    key={`tick-${i}`}
                                    style={[
                                        styles.rulerTick,
                                        {
                                            left:
                                                SCREEN_WIDTH / 2 +
                                                i * PIXELS_PER_SECOND,
                                        },
                                    ]}
                                >
                                    <Text style={styles.rulerText}>
                                        0:{i.toString().padStart(2, "0")}
                                    </Text>
                                    <View style={styles.rulerTickMark} />
                                </View>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>

                    {/* 🔥 3. INNER SCROLL: Vertical (Only the tracks scroll up/down!) */}
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        persistentScrollbar={true}
                        indicatorStyle="white"
                        style={{ flex: 1 }}
                        bounces={true}
                        contentContainerStyle={{ paddingBottom: 60 }} // Space for shadow fade
                    >
                        <TouchableWithoutFeedback onPress={handleTimelinePress}>
                            <View style={{ minHeight: "100%" }}>
                                {/* 🎬 Main Video Track */}
                                <View
                                    style={{ flexDirection: "row", height: 56 }}
                                >
                                    <View style={{ width: SCREEN_WIDTH / 2 }} />
                                    {positionedClips.map((clip, index) => {
                                        const start = clip.timelineStart ?? 0;
                                        const end = clip.timelineEnd ?? 0;
                                        const clipWidth =
                                            (end - start) * PIXELS_PER_SECOND;
                                        const isBeingDragged =
                                            draggedClipIndex.current === index;

                                        return (
                                            <View
                                                key={clip.id}
                                                style={{
                                                    zIndex: isBeingDragged
                                                        ? 50
                                                        : 1,
                                                    opacity: isBeingDragged
                                                        ? 0.7
                                                        : 1,
                                                    transform: [
                                                        {
                                                            translateX:
                                                                isBeingDragged
                                                                    ? dragDeltaX
                                                                    : 0,
                                                        },
                                                    ],
                                                    width: clipWidth,
                                                    borderRightWidth: 2,
                                                    borderColor: "#000000",
                                                }}
                                            >
                                                <TimelineClip
                                                    clip={clip}
                                                    width={clipWidth}
                                                    thumbnailUri={
                                                        thumbnails.get(
                                                            clip.id,
                                                        ) || clip.uri
                                                    }
                                                    isSelected={
                                                        clip.id ===
                                                        selectedClipId
                                                    }
                                                    pixelsPerSecond={
                                                        PIXELS_PER_SECOND
                                                    }
                                                    onPress={onClipPress}
                                                    onTrimStart={onTrimStart}
                                                    onTrimEnd={onTrimEnd}
                                                    onDragStart={
                                                        handleClipDragStart
                                                    }
                                                    onDrag={handleClipDrag}
                                                    onDragEnd={
                                                        handleClipDragEnd
                                                    }
                                                />
                                            </View>
                                        );
                                    })}
                                    <View style={{ width: SCREEN_WIDTH / 2 }} />
                                </View>

                                {/* 📝 Text Lanes */}
                                {(showTextTrack ||
                                    (globalTextOverlays &&
                                        globalTextOverlays.length > 0)) &&
                                    (() => {
                                        const lanedTextOverlays =
                                            calculateLanes(
                                                globalTextOverlays || [],
                                            );
                                        const maxLane =
                                            lanedTextOverlays.length > 0
                                                ? Math.max(
                                                      ...lanedTextOverlays.map(
                                                          (s) => s.lane,
                                                      ),
                                                  )
                                                : 0;
                                        const containerHeight =
                                            (maxLane + 1) * 48;

                                        return (
                                            <View
                                                style={{
                                                    height: containerHeight,
                                                    width: "100%",
                                                    marginTop: 4,
                                                    position: "relative",
                                                }}
                                            >
                                                {lanedTextOverlays.map(
                                                    (txt) => (
                                                        <OverlayTrackBar
                                                            key={txt.id}
                                                            type="text"
                                                            overlay={txt}
                                                            topOffset={
                                                                txt.lane * 48
                                                            }
                                                            totalDuration={
                                                                totalDuration
                                                            }
                                                            scrollXRef={
                                                                scrollXRef
                                                            }
                                                            leftOffset={
                                                                SCREEN_WIDTH / 2
                                                            }
                                                            currentScrollX={
                                                                currentScrollX
                                                            }
                                                            pixelsPerSecond={
                                                                PIXELS_PER_SECOND
                                                            }
                                                            isSelected={
                                                                selectedOverlayId ===
                                                                txt.id
                                                            }
                                                            onPress={() =>
                                                                onTextPress?.(
                                                                    txt.id,
                                                                )
                                                            }
                                                            onTrim={
                                                                onTextTrim as any
                                                            }
                                                            onDrag={
                                                                handleOverlayDrag
                                                            }
                                                            onDragStart={
                                                                handleOverlayDragStart
                                                            }
                                                            onDragEnd={
                                                                handleOverlayDragEnd
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </View>
                                        );
                                    })()}

                                {/* ☺ Sticker Lanes */}
                                {(showStickerTrack ||
                                    (globalStickerOverlays &&
                                        globalStickerOverlays.length > 0)) &&
                                    (() => {
                                        const lanedStickers = calculateLanes(
                                            globalStickerOverlays || [],
                                        );
                                        const maxLane =
                                            lanedStickers.length > 0
                                                ? Math.max(
                                                      ...lanedStickers.map(
                                                          (s) => s.lane,
                                                      ),
                                                  )
                                                : 0;
                                        const containerHeight =
                                            (maxLane + 1) * 48;

                                        return (
                                            <View
                                                style={{
                                                    height: containerHeight,
                                                    width: "100%",
                                                    marginTop: 4,
                                                    position: "relative",
                                                }}
                                            >
                                                {lanedStickers.map((stk) => (
                                                    <OverlayTrackBar
                                                        key={stk.id}
                                                        type="sticker"
                                                        overlay={stk}
                                                        topOffset={
                                                            stk.lane * 48
                                                        }
                                                        totalDuration={
                                                            totalDuration
                                                        }
                                                        scrollXRef={scrollXRef}
                                                        currentScrollX={
                                                            currentScrollX
                                                        }
                                                        onDrag={
                                                            handleOverlayDrag
                                                        }
                                                        onDragStart={
                                                            handleOverlayDragStart
                                                        }
                                                        onDragEnd={
                                                            handleOverlayDragEnd
                                                        }
                                                        leftOffset={
                                                            SCREEN_WIDTH / 2
                                                        }
                                                        pixelsPerSecond={
                                                            PIXELS_PER_SECOND
                                                        }
                                                        isSelected={
                                                            selectedStickerId ===
                                                            stk.id
                                                        }
                                                        onPress={() =>
                                                            onStickerPress?.(
                                                                stk.id,
                                                            )
                                                        }
                                                        onTrim={
                                                            onStickerTrim as any
                                                        }
                                                    />
                                                ))}
                                            </View>
                                        );
                                    })()}

                                {/* 🖼️ PIP Lanes */}
                                {(showPipTrack ||
                                    (globalPipOverlays &&
                                        globalPipOverlays.length > 0)) &&
                                    (() => {
                                        const lanedPIPOverlays = calculateLanes(
                                            globalPipOverlays || [],
                                        );
                                        const maxLane =
                                            lanedPIPOverlays.length > 0
                                                ? Math.max(
                                                      ...lanedPIPOverlays.map(
                                                          (s) => s.lane,
                                                      ),
                                                  )
                                                : 0;
                                        const containerHeight =
                                            (maxLane + 1) * 48;

                                        return (
                                            <View
                                                style={{
                                                    height: containerHeight,
                                                    width: "100%",
                                                    marginTop: 4,
                                                    position: "relative",
                                                }}
                                            >
                                                {lanedPIPOverlays.map((pip) => (
                                                    <OverlayTrackBar
                                                        key={pip.id}
                                                        type="pip"
                                                        overlay={pip}
                                                        topOffset={
                                                            pip.lane * 48
                                                        }
                                                        scrollXRef={scrollXRef}
                                                        totalDuration={
                                                            totalDuration
                                                        }
                                                        leftOffset={
                                                            SCREEN_WIDTH / 2
                                                        }
                                                        pixelsPerSecond={
                                                            PIXELS_PER_SECOND
                                                        }
                                                        currentScrollX={
                                                            currentScrollX
                                                        }
                                                        onDrag={
                                                            handleOverlayDrag
                                                        }
                                                        onDragStart={
                                                            handleOverlayDragStart
                                                        }
                                                        onDragEnd={
                                                            handleOverlayDragEnd
                                                        }
                                                        isSelected={
                                                            selectedPipId ===
                                                            pip.id
                                                        }
                                                        onPress={() =>
                                                            onPipPress?.(pip.id)
                                                        }
                                                        onTrim={
                                                            onPipTrim as any
                                                        }
                                                    />
                                                ))}
                                            </View>
                                        );
                                    })()}
                            </View>
                        </TouchableWithoutFeedback>
                    </ScrollView>
                </View>
            </ScrollView>

            <View
                style={[
                    styles.playhead,
                    {
                        left: isPlaying
                            ? SCREEN_WIDTH / 2
                            : SCREEN_WIDTH / 2 +
                              currentTime * PIXELS_PER_SECOND -
                              currentScrollX,
                        transform: [{ translateX: -1 }],
                    },
                ]}
                pointerEvents="none"
            />
            {hasMultipleTracks && (
                <View style={styles.bottomFade} pointerEvents="none">
                    <Svg width="100%" height="100%">
                        <Defs>
                            <LinearGradient
                                id="fade"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <Stop
                                    offset="0"
                                    stopColor="#000000"
                                    stopOpacity="0"
                                />
                                <Stop
                                    offset="1"
                                    stopColor="#000000"
                                    stopOpacity="0.95"
                                />
                            </LinearGradient>
                        </Defs>
                        <Rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill="url(#fade)"
                        />
                    </Svg>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: TIMELINE_HEIGHT,
        backgroundColor: "#000000",
        position: "relative",
        overflow: "hidden",
    },
    bottomFade: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 48, // 48px of buttery smooth shadow
        zIndex: 90, // Keeps it below the playhead (100) but above the tracks (50)
    },
    timelineContent: { paddingVertical: 4 },
    playhead: {
        position: "absolute",
        top: 0,
        width: 2,
        height: TIMELINE_HEIGHT,
        backgroundColor: "#ec9a15",
        zIndex: 100,
    },
    rulerContainer: {
        height: 24,
        flexDirection: "row",
        alignItems: "flex-end",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.1)",
        paddingBottom: 2,
        marginBottom: 8,
    },
    rulerTick: {
        position: "absolute",
        alignItems: "center",
        transform: [{ translateX: -15 }], // Centers the 30px wide text exactly over the tick
        width: 30,
    },
    rulerText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 10,
        fontWeight: "500",
        marginBottom: 2,
    },
    rulerTickMark: {
        width: 1,
        height: 6,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
});

export default MultiClipTimeline;
