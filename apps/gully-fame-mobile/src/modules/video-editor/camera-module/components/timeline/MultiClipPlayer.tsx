import { ResizeMode, Video } from "expo-av";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { CameraClip } from "../../types/camera.types";
import { getClipAtTimelineTime } from "../../utils/timelineHelpers";
import FilteredImage from "../FilteredImage";
import FilteredVideo from "../FilteredVideo";

interface MultiClipPlayerProps {
    clips: CameraClip[];
    currentTime: number;
    isPlaying: boolean;
    onTimeUpdate?: (time: number) => void;
    onLoad?: () => void;
    onEnd?: () => void;
    filter?: import("../../types/filters").FilterConfig;
    isDraggingTimeline?: boolean;
}

const MultiClipPlayer: React.FC<MultiClipPlayerProps> = ({
    clips,
    currentTime,
    isPlaying,
    onTimeUpdate,
    onLoad,
    onEnd,
    filter,
    isDraggingTimeline = false,
}) => {
    const videoRef0 = useRef<Video>(null);
    const videoRef1 = useRef<Video>(null);

    const [activeLayer, setActiveLayer] = useState<0 | 1>(0);
    const [layer0Clip, setLayer0Clip] = useState<CameraClip | null>(null);
    const [layer1Clip, setLayer1Clip] = useState<CameraClip | null>(null);

    const isSeekingRef = useRef(false);
    const lastReportedTimeRef = useRef(-1);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const currentClipData = useMemo(
        () => getClipAtTimelineTime(clips, currentTime),
        [clips, currentTime],
    );

    // ==========================================
    // 1. THE FLIP-FLOP ENGINE (Clip Assignment)
    // ==========================================
    useEffect(() => {
        if (!currentClipData) return;
        const currentClip = currentClipData.clip;
        const currentIndex = clips.findIndex((c) => c.id === currentClip.id);
        const nextClip =
            currentIndex !== -1 && currentIndex < clips.length - 1
                ? clips[currentIndex + 1]
                : null;

        // Has the timeline crossed into the pre-loaded next clip?
        if (activeLayer === 0 && layer1Clip?.id === currentClip.id) {
            setActiveLayer(1);
            setLayer0Clip(nextClip);
        } else if (activeLayer === 1 && layer0Clip?.id === currentClip.id) {
            setActiveLayer(0);
            setLayer1Clip(nextClip);
        }
        // Forced jump or initial load
        else if (
            layer0Clip?.id !== currentClip.id &&
            layer1Clip?.id !== currentClip.id
        ) {
            setActiveLayer(0);
            setLayer0Clip(currentClip);
            setLayer1Clip(nextClip);
        } else {
            // Keep preloads up to date if they were null
            if (activeLayer === 0 && layer1Clip?.id !== nextClip?.id)
                setLayer1Clip(nextClip);
            if (activeLayer === 1 && layer0Clip?.id !== nextClip?.id)
                setLayer0Clip(nextClip);
        }
    }, [currentClipData?.clip.id, clips]);

    // ==========================================
    // 2. PRE-SEEKING (Prepare the background player)
    // ==========================================
    useEffect(() => {
        if (
            activeLayer !== 0 &&
            layer0Clip &&
            videoRef0.current &&
            layer0Clip.type === "video"
        ) {
            videoRef0.current
                .setPositionAsync((layer0Clip.trimStart ?? 0) * 1000)
                .catch(() => {});
        }
    }, [layer0Clip, activeLayer]);

    useEffect(() => {
        if (
            activeLayer !== 1 &&
            layer1Clip &&
            videoRef1.current &&
            layer1Clip.type === "video"
        ) {
            videoRef1.current
                .setPositionAsync((layer1Clip.trimStart ?? 0) * 1000)
                .catch(() => {});
        }
    }, [layer1Clip, activeLayer]);

    // ==========================================
    // 3. PLAY / PAUSE ROUTER
    // ==========================================
    useEffect(() => {
        const activeRef = activeLayer === 0 ? videoRef0 : videoRef1;
        const inactiveRef = activeLayer === 0 ? videoRef1 : videoRef0;

        // Always pause the background player instantly
        inactiveRef.current?.pauseAsync().catch(() => {});

        if (currentClipData?.clip.type === "video" && activeRef.current) {
            if (isPlaying && !isDraggingTimeline) {
                activeRef.current.playAsync().catch(() => {});
            } else {
                activeRef.current.pauseAsync().catch(() => {});
            }
        }
    }, [isPlaying, activeLayer, isDraggingTimeline, currentClipData?.clip.id]);

    // ==========================================
    // 4. SEEKING (Only when paused or dragging)
    // ==========================================
    useEffect(() => {
        if (!currentClipData || isSeekingRef.current) return;

        // 🔥 CRITICAL FIX: DO NOT SEEK IF PLAYING! This prevents the rubber-banding.
        if (isPlaying && !isDraggingTimeline) return;

        const activeRef = activeLayer === 0 ? videoRef0 : videoRef1;
        const { clip, localTime } = currentClipData;

        if (clip.type === "video" && activeRef.current) {
            isSeekingRef.current = true;
            activeRef.current.setPositionAsync(localTime * 1000).finally(() => {
                isSeekingRef.current = false;
            });
        }
    }, [currentTime, isDraggingTimeline, activeLayer, isPlaying]);

    // ==========================================
    // 5. THE TIME KEEPER (Polling active layer)
    // ==========================================
    useEffect(() => {
        if (pollingIntervalRef.current)
            clearInterval(pollingIntervalRef.current);

        if (!isPlaying || isDraggingTimeline || !currentClipData) return;

        pollingIntervalRef.current = setInterval(async () => {
            if (isSeekingRef.current) return;

            const { clip } = currentClipData;

            // Handle Photo Duration
            if (clip.type === "photo") {
                const newTime = currentTime + 0.1;
                const clipEnd = clip.timelineEnd ?? 0;

                if (newTime >= clipEnd) {
                    const currentIndex = clips.findIndex(
                        (c) => c.id === clip.id,
                    );
                    if (currentIndex < clips.length - 1)
                        onTimeUpdate?.(
                            clips[currentIndex + 1].timelineStart ?? 0,
                        );
                    else onEnd?.();
                } else {
                    onTimeUpdate?.(newTime);
                }
                return;
            }

            // Handle Video Duration
            const activeRef = activeLayer === 0 ? videoRef0 : videoRef1;
            if (!activeRef.current) return;

            try {
                const status: any = await activeRef.current.getStatusAsync();
                if (status.isLoaded && status.positionMillis !== undefined) {
                    const localTime = status.positionMillis / 1000;
                    const timelineStart = clip.timelineStart ?? 0;
                    const trimStart = clip.trimStart ?? 0;
                    const calculatedGlobalTime =
                        timelineStart + (localTime - trimStart);

                    // Prevent backwards jitter
                    if (
                        calculatedGlobalTime > lastReportedTimeRef.current ||
                        Math.abs(
                            calculatedGlobalTime - lastReportedTimeRef.current,
                        ) > 1
                    ) {
                        lastReportedTimeRef.current = calculatedGlobalTime;
                        onTimeUpdate?.(calculatedGlobalTime);
                    }

                    if (
                        status.didJustFinish ||
                        localTime >= (clip.trimEnd ?? clip.duration) - 0.05
                    ) {
                        const currentIndex = clips.findIndex(
                            (c) => c.id === clip.id,
                        );
                        if (currentIndex < clips.length - 1) {
                            const nextStart =
                                clips[currentIndex + 1].timelineStart ?? 0;

                            if (lastReportedTimeRef.current < nextStart) {
                                const jumpTime = nextStart + 0.05;
                                lastReportedTimeRef.current = jumpTime;
                                onTimeUpdate?.(jumpTime);
                            }
                        } else {
                            onEnd?.();
                        }
                    }
                }
            } catch (error) {}
        }, 150);

        return () => clearInterval(pollingIntervalRef.current!);
    }, [
        isPlaying,
        isDraggingTimeline,
        currentClipData,
        activeLayer,
        currentTime,
    ]);

    // ==========================================
    // RENDER HELPERS
    // ==========================================
    const renderLayer = (
        clip: CameraClip | null,
        isLayerActive: boolean,
        videoRef: React.RefObject<Video>,
    ) => {
        if (!clip) return null;
        const activeFilter = clip.filterPreset || filter;

        return (
            <View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        zIndex: isLayerActive ? 10 : 1,
                        opacity: isLayerActive ? 1 : 0,
                    },
                ]}
                pointerEvents="none"
            >
                {clip.type === "video" ? (
                    <FilteredVideo
                        key={clip.id} // Prevents Expo-AV from caching stale frames
                        videoRef={videoRef}
                        source={{ uri: clip.uri }}
                        style={styles.media}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isLooping={false}
                        rate={1}
                        filter={activeFilter}
                        onLoad={() => {
                            if (isLayerActive) onLoad?.();
                        }}
                    />
                ) : (
                    <FilteredImage
                        key={clip.id}
                        source={{ uri: clip.uri }}
                        style={styles.media}
                        resizeMode="contain"
                        filter={filter}
                    />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderLayer(layer0Clip, activeLayer === 0, videoRef0)}
            {renderLayer(layer1Clip, activeLayer === 1, videoRef1)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000000", position: "relative" },
    media: { width: "100%", height: "100%" },
});

export default memo(MultiClipPlayer);
