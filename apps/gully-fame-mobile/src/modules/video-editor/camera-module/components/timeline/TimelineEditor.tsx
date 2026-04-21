import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ScrollView,
    Image,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { Asset } from "expo-asset";
import Slider from "@react-native-community/slider";
import { FILTERS } from "../../types/filters";
import FilterThumbnail from "../preview-actions/FilterThumbnail";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import type { CameraClip } from "../../types/camera.types";
import type { FilterConfig } from "../../types/filters";
import type { TextOverlay } from "../../types/textOverlay.types";
import {
    clampTrimPoints,
    getTotalTimelineDuration,
    getClipAtTimelineTime,
} from "../../utils/timelineHelpers";
import { generateThumbnailsForClips } from "../../utils/thumbnailGenerator";
import AddClipOverlay from "../AddClipOverlay";
import DraggableTextOverlays from "../DraggableTextOverlays";
import PreviewActionButtons from "../PreviewActionButtons";
import TextEditorModal from "../TextEditorModal";
import MultiClipPlayer from "./MultiClipPlayer";
import MultiClipTimeline from "./MultiClipTimeline";
import DraggableStickerOverlays from "../DraggableStickerOverlays";
import * as ImagePicker from "expo-image-picker";
import DraggablePipOverlays from "../DraggablePipOverlays"; // Adjust path as needed
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { Paths, File } from "expo-file-system";
import { downloadAsync } from "expo-file-system/legacy";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const getRatioMath = (ratio?: string) => {
    if (ratio === "16:9") return 16 / 9;
    if (ratio === "1:1") return 1;
    if (ratio === "2.35:1") return 2.35;
    return 9 / 16; // Default fallback
};
interface TimelineEditorProps {
    clips: CameraClip[];
    onClipsUpdate: (clips: CameraClip[]) => void;
    initialTextOverlays?: any[];
    initialStickerOverlays?: any[];
    initialPipOverlays?: any[];
    onBack?: (tracks: { text: any[]; stickers: any[]; pips: any[] }) => void;
    onNext?: (
        clips: any,
        text: any[],
        stickers: any[],
        pips: any[],
        previewDimensions: { width: number; height: number },
    ) => void;
    onAddClip?: (
        source: "camera" | "gallery",
        tracks: { text: any[]; stickers: any[]; pips: any[] },
    ) => void;
    onAddClipFromGallery?: (clip: CameraClip) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    selectedFilter?: import("../../types/filters").FilterConfig;
}
const TimelineEditor: React.FC<TimelineEditorProps> = ({
    clips,
    onClipsUpdate,
    onBack,
    onNext,
    onAddClip,
    onAddClipFromGallery,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    selectedFilter,
    initialPipOverlays = [],
    initialStickerOverlays = [],
    initialTextOverlays = [],
}) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
    const [selectedPipId, setSelectedPipId] = useState<string | null>(null);
    const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
        null,
    );
    const [globalTextOverlays, setGlobalTextOverlays] =
        useState<any[]>(initialTextOverlays);
    const [globalStickerOverlays, setGlobalStickerOverlays] = useState<any[]>(
        initialStickerOverlays,
    );
    const [globalPipOverlays, setGlobalPipOverlays] =
        useState<any[]>(initialPipOverlays);
    const getCurrentTracks = useCallback(
        () => ({
            text: globalTextOverlays,
            stickers: globalStickerOverlays,
            pips: globalPipOverlays,
        }),
        [globalTextOverlays, globalStickerOverlays, globalPipOverlays],
    );

    // 2. Updated Trim Handlers (Notice they no longer need clipId!)
    const handleTextTrim = useCallback(
        (overlayId: string, newStart: number, newEnd: number) => {
            setGlobalTextOverlays((prev) =>
                prev.map((txt) =>
                    txt.id === overlayId
                        ? { ...txt, startTime: newStart, endTime: newEnd }
                        : txt,
                ),
            );
        },
        [],
    );
    const handlePipTrim = useCallback(
        (overlayId: string, newStart: number, newEnd: number) => {
            setGlobalPipOverlays((prev) =>
                prev.map((pip) =>
                    pip.id === overlayId
                        ? { ...pip, startTime: newStart, endTime: newEnd }
                        : pip,
                ),
            );
        },
        [],
    );
    const handleStickerTrim = useCallback(
        (overlayId: string, newStart: number, newEnd: number) => {
            setGlobalStickerOverlays((prev) =>
                prev.map((stk) =>
                    stk.id === overlayId
                        ? { ...stk, startTime: newStart, endTime: newEnd }
                        : stk,
                ),
            );
        },
        [],
    );
    const [activeScale, setActiveScale] = useState(1);
    const [isSliderVisible, setIsSliderVisible] = useState(false);
    const STICKER_PACK: { id: string; source: any }[] = [
        {
            id: "apple",
            source: "https://i.postimg.cc/Xqcg2cZs/apple.png",
        },
        {
            id: "controller",
            source: "https://i.postimg.cc/sx9Jn9BN/controller.png",
        },
        {
            id: "grapes",
            source: "https://i.postimg.cc/wMckWctC/grapes.png",
        },
        {
            id: "mushroom",
            source: "https://i.postimg.cc/FzgxPgdt/mushroom.png",
        },
        {
            id: "popcorn",
            source: "https://i.postimg.cc/C5H4vHBT/popcorn.png",
        },
        {
            id: "Praying",
            source: "https://i.postimg.cc/ZnFLfFBZ/praying-japanese.png",
        },
        {
            id: "tomato",
            source: "https://i.postimg.cc/L4zv6Ry5/tomato.png",
        },
        {
            id: "trophy",
            source: "https://i.postimg.cc/rySgFchd/trophy.png",
        },
        {
            id: "watermelon",
            source: "https://i.postimg.cc/RCcGV9PH/watermelon.png",
        },
        {
            id: "white santa",
            source: "https://i.postimg.cc/mZQV2RdC/whitesanta.png",
        },
    ];
    const sliderAnim = useSharedValue(0);
    const trayAnim = useSharedValue(0);
    // 🔥 Sub-Tray Navigation State
    const [activeTrayMode, setActiveTrayMode] = useState<
        "main" | "filters" | "text" | "stickers" | "overlay" | "transitions"
    >("main");

    const [thumbnails, setThumbnails] = useState<Map<string, string>>(
        new Map(),
    );
    const [isReady, setIsReady] = useState(false);
    const [showAddClipOverlay, setShowAddClipOverlay] = useState(false);
    const [showTrimHandles, setShowTrimHandles] = useState(false);
    const [currentFilter, setCurrentFilter] = useState<FilterConfig | null>(
        selectedFilter ||
            clips.find((c) => c.filterPreset)?.filterPreset ||
            null,
    );

    const [showTextEditor, setShowTextEditor] = useState(false);
    const [selectedTextOverlay, setSelectedTextOverlay] =
        useState<TextOverlay | null>(null);
    const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(
        null,
    );
    const [previewDimensions, setPreviewDimensions] = useState({
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 1.5,
    });
    const [parentLayout, setParentLayout] = useState({ width: 0, height: 0 });
    const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);

    const totalDuration = getTotalTimelineDuration(clips);

    React.useEffect(() => {
        if (selectedFilter) setCurrentFilter(selectedFilter);
    }, [selectedFilter]);
    useEffect(() => {
        trayAnim.value = withSpring(activeTrayMode !== "main" ? 1 : 0, {
            damping: 20,
            stiffness: 150,
            mass: 0.8,
        });
    }, [activeTrayMode, trayAnim]);
    useEffect(() => {
        const hasSelection = !!(
            selectedPipId ||
            selectedStickerId ||
            selectedOverlayId
        );
        setIsSliderVisible(hasSelection);
        sliderAnim.value = withSpring(hasSelection ? 1 : 0, {
            damping: 15,
            stiffness: 150,
            mass: 0.8,
        });
    }, [selectedPipId, selectedStickerId, selectedOverlayId, sliderAnim]);
    const sliderAnimatedStyle = useAnimatedStyle(() => ({
        opacity: sliderAnim.value,
        transform: [{ translateY: 50 * (1 - sliderAnim.value) }],
    }));
    const layerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: sliderAnim.value,
        transform: [{ translateY: -50 * (1 - sliderAnim.value) }], // Slides down from the top!
    }));
    const trayAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: 300 * (1 - trayAnim.value) }], // Drops 300px off screen
        opacity: trayAnim.value === 0 ? 0 : 1, // Instantly hides shadow when fully closed
    }));
    const currentClipUri = React.useMemo(() => {
        if (selectedClipId) {
            const clip = clips.find((c) => c.id === selectedClipId);
            return clip?.uri || (clips.length > 0 ? clips[0].uri : "");
        }
        return clips.length > 0 ? clips[0].uri : "";
    }, [selectedClipId, clips]);

    const clipMediaSignature = clips.map((c) => `${c.id}-${c.uri}`).join("|");

    useEffect(() => {
        if (thumbnails.size === 0) setIsReady(false);
        generateThumbnailsForClips(clips)
            .then((thumbs) => {
                setThumbnails(thumbs);
                setIsReady(true);
            })
            .catch((error) => {
                console.warn("Error generating thumbnails:", error);
                setIsReady(true);
            });
    }, [clipMediaSignature]);

    const togglePlayPause = useCallback(() => {
        if (isPlaying) {
            setIsPlaying(false);
        } else {
            if (currentTime >= totalDuration - 0.1) setCurrentTime(0);
            setIsPlaying(true);
        }
    }, [isPlaying, currentTime, totalDuration]);
    const handlePreviewTap = useCallback(() => {
        if (selectedStickerId || selectedPipId || selectedOverlayId) {
            setSelectedStickerId(null);
            setSelectedPipId(null);
            setSelectedOverlayId(null);
            setSelectedTextOverlay(null);
            setActiveScale(1);
            setActiveTrayMode("main");
            return;
        }
        togglePlayPause();
    }, [selectedStickerId, togglePlayPause, selectedPipId, selectedOverlayId]);
    const handleTimelineSeek = useCallback(
        (time: number) => {
            setIsDraggingTimeline(true);
            const clampedTime = Math.max(0, Math.min(time, totalDuration));
            setCurrentTime(clampedTime);
            setIsPlaying(false);
            setTimeout(() => setIsDraggingTimeline(false), 200);
            setSelectedClipId(undefined);
            setSelectedTextOverlay(null);
            setSelectedOverlayId(null);
            setSelectedStickerId(null);
            setSelectedPipId(null);
            setShowTrimHandles(false);
            setActiveScale(1);
            setActiveTrayMode("main");
        },
        [totalDuration],
    );
    const getSelectedOverlay = useCallback(() => {
        if (selectedPipId)
            return globalPipOverlays.find((p) => p.id === selectedPipId);
        if (selectedStickerId)
            return globalStickerOverlays.find(
                (s) => s.id === selectedStickerId,
            );
        if (selectedOverlayId)
            return globalTextOverlays.find((t) => t.id === selectedOverlayId);
        return null;
    }, [
        selectedPipId,
        selectedStickerId,
        selectedOverlayId,
        globalPipOverlays,
        globalStickerOverlays,
        globalTextOverlays,
    ]);
    const handleFadeUpdate = useCallback(
        (type: "in" | "out", value: number) => {
            const updated = (prev: any[]) =>
                prev.map((o) => {
                    if (
                        o.id === selectedPipId ||
                        o.id === selectedStickerId ||
                        o.id === selectedOverlayId
                    ) {
                        return {
                            ...o,
                            [type === "in" ? "fadeIn" : "fadeOut"]: value,
                        };
                    }
                    return o;
                });
            if (selectedPipId) setGlobalPipOverlays(updated);
            if (selectedStickerId) setGlobalStickerOverlays(updated);
            if (selectedOverlayId) setGlobalTextOverlays(updated);
        },
        [selectedPipId, selectedStickerId, selectedOverlayId],
    );

    const TransitionsButton = () => (
        <TouchableOpacity
            style={styles.subToolBtn}
            onPress={() => setActiveTrayMode("transitions")}
        >
            <View style={styles.subToolIcon}>
                <Text style={{ fontSize: 18 }}>⏳</Text>
            </View>
            <Text style={styles.subToolText}>Fades</Text>
        </TouchableOpacity>
    );
    const handleClipPress = useCallback((clip: CameraClip) => {
        setSelectedClipId(clip.id);
        setShowTrimHandles(true);
        setSelectedTextOverlay(null);
        setSelectedOverlayId(null);
        setSelectedStickerId(null);
        setSelectedPipId(null);
        setActiveScale(1);
    }, []);

    const handleTrimStart = useCallback(
        (clip: CameraClip, newTrimStart: number) => {
            const updatedClips = clips.map((c) =>
                c.id === clip.id
                    ? clampTrimPoints({ ...c, trimStart: newTrimStart })
                    : c,
            );
            const {
                calculateTimelinePositions,
            } = require("../../utils/timelineHelpers");
            const positionedClips = calculateTimelinePositions(updatedClips);
            onClipsUpdate(positionedClips);

            const activeClip = positionedClips.find(
                (c: any) => c.id === clip.id,
            );
            if (activeClip && activeClip.timelineStart !== undefined) {
                setCurrentTime(activeClip.timelineStart);
                setIsPlaying(false);
            }
        },
        [clips, onClipsUpdate],
    );

    const handleTrimEnd = useCallback(
        (clip: CameraClip, newTrimEnd: number) => {
            const updatedClips = clips.map((c) =>
                c.id === clip.id
                    ? clampTrimPoints({ ...c, trimEnd: newTrimEnd })
                    : c,
            );
            const {
                calculateTimelinePositions,
            } = require("../../utils/timelineHelpers");
            const positionedClips = calculateTimelinePositions(updatedClips);
            onClipsUpdate(positionedClips);

            const activeClip = positionedClips.find(
                (c: any) => c.id === clip.id,
            );
            if (activeClip && activeClip.timelineEnd !== undefined) {
                setCurrentTime(activeClip.timelineEnd);
                setIsPlaying(false);
            }
        },
        [clips, onClipsUpdate],
    );

    const handleClipReorder = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (fromIndex === toIndex) return;
            const newClips = [...clips];
            const [movedClip] = newClips.splice(fromIndex, 1);
            newClips.splice(toIndex, 0, movedClip);
            const {
                calculateTimelinePositions,
            } = require("../../utils/timelineHelpers");
            onClipsUpdate(calculateTimelinePositions(newClips));
            setSelectedClipId(movedClip.id);
        },
        [clips, onClipsUpdate],
    );

    const handleDeleteClip = useCallback(() => {
        if (!selectedClipId) return;
        const newClips = clips.filter((c) => c.id !== selectedClipId);
        if (newClips.length === 0) {
            onBack?.();
            return;
        }
        const {
            calculateTimelinePositions,
        } = require("../../utils/timelineHelpers");
        const positionedClips = calculateTimelinePositions(newClips);
        if (currentTime > getTotalTimelineDuration(positionedClips))
            setCurrentTime(getTotalTimelineDuration(positionedClips));
        setSelectedClipId(undefined);
        onClipsUpdate(positionedClips);
    }, [selectedClipId, clips, currentTime, onClipsUpdate, onBack]);

    const handleTimelineDragStart = useCallback(() => {
        setIsDraggingTimeline(true);
        setIsPlaying(false);
    }, []);

    const handleTimelineDragEnd = useCallback(() => {
        setIsDraggingTimeline(false);
    }, []);

    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }, []);

    // 🔥 FULLY IMPLEMENTED TRAY HANDLERS
    const handleFilter = useCallback(
        (filter: FilterConfig) => {
            setCurrentFilter(filter);
            // Apply filter to selected clip, or all if none selected
            const updatedClips = clips.map((c) => {
                if (!selectedClipId || c.id === selectedClipId) {
                    return { ...c, filterPreset: filter };
                }
                return c;
            });
            onClipsUpdate(updatedClips);
        },
        [selectedClipId, clips, onClipsUpdate],
    );

    const handleOverlay = useCallback(() => {
        setActiveTrayMode("overlay");
        // Typically, this would open Expo ImagePicker to select an image/video to float on top.
    }, []);

    const handleText = useCallback(() => {
        setActiveTrayMode("text");
    }, []);
    const handleAddText = useCallback(() => {
        setSelectedTextOverlay(null); // Clear out any old text
        setSelectedOverlayId(null);
        setShowTextEditor(true); // Open the Modal
    }, []);
    const handleSticker = useCallback(() => {
        setActiveTrayMode("stickers");
    }, []);

    const getHighestZIndex = useCallback(() => {
        const allOverlays = [
            ...globalTextOverlays,
            ...globalStickerOverlays,
            ...globalPipOverlays,
        ];
        if (allOverlays.length === 0) return 1;
        return Math.max(...allOverlays.map((o) => o.zIndex || 1));
    }, [globalTextOverlays, globalStickerOverlays, globalPipOverlays]);
    const handleTextOverlayPress = useCallback(
        (overlay: TextOverlay, fromTimeline = false) => {
            setSelectedTextOverlay(overlay);
            setSelectedOverlayId(overlay.id);
            setSelectedPipId(null);
            setSelectedStickerId(null);
            setActiveScale(overlay.scale ?? 1);
            setSelectedClipId(undefined);
            setShowTrimHandles(false);
            if (!fromTimeline) {
                setActiveTrayMode("text");
            }
        },
        [],
    );

    const handleTextOverlaySave = useCallback(
        (overlay: TextOverlay) => {
            setGlobalTextOverlays((prev) => {
                const exists = prev.find((o) => o.id === overlay.id);
                if (exists)
                    return prev.map((o) => (o.id === overlay.id ? overlay : o));

                return [
                    ...prev,
                    {
                        ...overlay,
                        startTime: currentTime,
                        endTime: Math.min(currentTime + 3, totalDuration),
                        zIndex: getHighestZIndex() + 1,
                    },
                ];
            });
            setSelectedOverlayId(null);
            setShowTextEditor(false);
        },
        [currentTime, totalDuration, getHighestZIndex],
    );
    const handleTextOverlayUpdate = useCallback(
        (overlay: TextOverlay) =>
            setGlobalTextOverlays((prev) =>
                prev.map((o) => (o.id === overlay.id ? overlay : o)),
            ),
        [],
    );
    const handleTextOverlayDelete = useCallback((id: string) => {
        setGlobalTextOverlays((prev) => prev.filter((o) => o.id !== id));
        setSelectedOverlayId(null);
        setShowTextEditor(false);
    }, []);

    const handleTextEditorClose = useCallback(() => {
        setShowTextEditor(false);
        setSelectedTextOverlay(null);
        setSelectedOverlayId(null);
        setSelectedPipId(null);
        setActiveTrayMode("main"); // Reset tray when text modal closes
    }, []);

    const activeClipData = React.useMemo(
        () => getClipAtTimelineTime(clips, currentTime),
        [clips, currentTime],
    );

    const currentClipForText = activeClipData?.clip || clips[0] || null;
    const currentClipLocalTime = activeClipData?.localTime || 0; // <-- There it is!

    const handleAddPip = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: false,
                quality: 1,
            });
            if (!result.canceled && result.assets.length > 0) {
                const asset = result.assets[0];
                const defaultWidth = previewDimensions.width * 0.4;
                const aspectRatio = asset.height / asset.width;
                const newPip = {
                    id: `pip-${Date.now()}`,
                    uri: asset.uri,
                    type: asset.type === "video" ? "video" : "image",
                    x: 0.5,
                    y: 0.5,
                    width: defaultWidth,
                    height: defaultWidth * aspectRatio,
                    rotation: 0,
                    startTime: currentTime, // 🔥 Drops exactly at the playhead
                    endTime: Math.min(currentTime + 3, totalDuration), // 🔥 Defaults to 3 seconds long
                    zIndex: getHighestZIndex() + 1,
                };
                setGlobalPipOverlays((prev) => [...prev, newPip]);
                setSelectedPipId(newPip.id);
            }
        } catch (error) {
            console.warn(error);
        }
    };
    const handlePipUpdate = useCallback(
        (pip: any) =>
            setGlobalPipOverlays((prev) =>
                prev.map((p) => (p.id === pip.id ? pip : p)),
            ),
        [],
    );
    const handlePipDelete = useCallback((id: string) => {
        setGlobalPipOverlays((prev) => prev.filter((p) => p.id !== id));
        setSelectedPipId(null);
    }, []);
    const handleLayerUpdate = useCallback(
        (type: "pip" | "sticker" | "text", direction: "up" | "down") => {
            const targetId =
                type === "pip"
                    ? selectedPipId
                    : type === "sticker"
                      ? selectedStickerId
                      : selectedOverlayId;
            if (!targetId) return;

            const maxZ = getHighestZIndex();
            const updater = (prev: any[]) =>
                prev.map((o) => {
                    if (o.id === targetId)
                        return {
                            ...o,
                            zIndex: direction === "up" ? maxZ + 1 : 1,
                        };
                    return direction === "down"
                        ? { ...o, zIndex: Math.max(2, o.zIndex || 2) }
                        : o;
                });

            if (type === "pip") setGlobalPipOverlays(updater);
            else if (type === "sticker") setGlobalStickerOverlays(updater);
            else setGlobalTextOverlays(updater);
        },
        [selectedPipId, selectedStickerId, selectedOverlayId, getHighestZIndex],
    );

    const handleAddPress = useCallback(() => setShowAddClipOverlay(true), []);
    const handleAddSticker = async (remoteUrl: string) => {
        try {
            // 🔥 THE BYPASS: Let the OS download it and convert it to a local cached file
            const result = await ImageManipulator.manipulateAsync(
                remoteUrl,
                [], // No visual edits, just process it
                { format: ImageManipulator.SaveFormat.PNG },
            );

            // result.uri is now a clean file:///data/user/0/... cache path!
            const localFileUri = result.uri;

            const newSticker = {
                id: `sticker-${Date.now()}`,
                source: localFileUri, // FFmpeg gets the local file, UI gets the local file!
                x: 0.5,
                y: 0.5,
                size: 100,
                scale: 1,
                zIndex: getHighestZIndex() + 1,
                startTime: currentTime,
                endTime: Math.min(currentTime + 3, totalDuration),
            };

            setSelectedStickerId(newSticker.id);
            setGlobalStickerOverlays((prev) => [...prev, newSticker]);
        } catch (error) {
            console.error("Failed to process sticker via Manipulator:", error);
        }
    };
    const handleStickerUpdate = useCallback(
        (sticker: any) =>
            setGlobalStickerOverlays((prev) =>
                prev.map((s) => (s.id === sticker.id ? sticker : s)),
            ),
        [],
    );
    const handleStickerDelete = useCallback((id: string) => {
        setGlobalStickerOverlays((prev) => prev.filter((s) => s.id !== id));
        setSelectedStickerId(null);
    }, []);

    const handleSelectCamera = useCallback(() => {
        setShowAddClipOverlay(false);
        onAddClip?.("camera", getCurrentTracks());
    }, [onAddClip, getCurrentTracks]);
    const handleSelectGallery = useCallback(
        (newClip: CameraClip) => {
            setShowAddClipOverlay(false);
            if (onAddClipFromGallery) onAddClipFromGallery(newClip);
            else {
                const {
                    calculateTimelinePositions,
                } = require("../../utils/timelineHelpers");
                onClipsUpdate(calculateTimelinePositions([...clips, newClip]));
            }
        },
        [onAddClipFromGallery, clips, onClipsUpdate],
    );

    const handleTrim = useCallback(
        () => setShowTrimHandles((prev) => !prev),
        [],
    );
    const handleScaleCommit = useCallback(
        (finalScale: number) => {
            if (selectedPipId)
                setGlobalPipOverlays((prev) =>
                    prev.map((p) =>
                        p.id === selectedPipId
                            ? { ...p, scale: finalScale }
                            : p,
                    ),
                );
            else if (selectedStickerId)
                setGlobalStickerOverlays((prev) =>
                    prev.map((s) =>
                        s.id === selectedStickerId
                            ? { ...s, scale: finalScale }
                            : s,
                    ),
                );
            else if (selectedOverlayId)
                setGlobalTextOverlays((prev) =>
                    prev.map((t) =>
                        t.id === selectedOverlayId
                            ? { ...t, scale: finalScale }
                            : t,
                    ),
                );
        },
        [selectedPipId, selectedStickerId, selectedOverlayId],
    );
    const hasOverlaySelected = !!(
        selectedPipId ||
        selectedStickerId ||
        selectedOverlayId
    );

    const handleDeselectOverlays = useCallback(() => {
        setSelectedPipId(null);
        setSelectedStickerId(null);
        setSelectedOverlayId(null);
        setSelectedTextOverlay(null);
        setActiveScale(1);
        setActiveTrayMode("main");
    }, []);

    const handleDeleteSelectedOverlay = useCallback(() => {
        if (selectedPipId) handlePipDelete(selectedPipId);
        else if (selectedStickerId) handleStickerDelete(selectedStickerId);
        else if (selectedOverlayId) handleTextOverlayDelete(selectedOverlayId);
    }, [
        selectedPipId,
        selectedStickerId,
        selectedOverlayId,
        handlePipDelete,
        handleStickerDelete,
        handleTextOverlayDelete,
    ]);
    useEffect(() => {
        if (selectedPipId) {
            // 🔥 Use globalPipOverlays instead of currentPips
            const pip = globalPipOverlays.find(
                (pip) => pip.id === selectedPipId,
            );
            setActiveScale(pip?.scale ?? 1);
        } else if (selectedStickerId) {
            // 🔥 Use globalStickerOverlays instead of currentStickers
            const sticker = globalStickerOverlays.find(
                (sticker) => sticker.id === selectedStickerId,
            );
            setActiveScale(sticker?.scale ?? 1);
        } else if (selectedOverlayId) {
            // 🔥 Use globalTextOverlays instead of currentTextOverlays
            const txt = globalTextOverlays.find(
                (t) => t.id === selectedOverlayId,
            );
            setActiveScale(txt?.scale ?? 1);
        } else {
            setActiveScale(1);
        }
    }, [
        // 🔥 Make sure the dependency array watches the global arrays!
        selectedPipId,
        selectedStickerId,
        selectedOverlayId,
        globalPipOverlays,
        globalStickerOverlays,
        globalTextOverlays,
    ]);
    let currentActiveZIndex = 1;
    if (selectedPipId) {
        currentActiveZIndex =
            globalPipOverlays.find((p) => p.id === selectedPipId)?.zIndex || 1;
    } else if (selectedStickerId) {
        currentActiveZIndex =
            globalStickerOverlays.find((s) => s.id === selectedStickerId)
                ?.zIndex || 1;
    } else if (selectedOverlayId) {
        currentActiveZIndex =
            globalTextOverlays.find((t) => t.id === selectedOverlayId)
                ?.zIndex || 1;
    }
    const isAtBack = currentActiveZIndex <= 1;
    if (clips.length === 0) return <View style={styles.container}></View>;

    return (
        <View style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.topButton}
                    onPress={() => onBack?.(getCurrentTracks())}
                >
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path
                            d="M19 12H5M5 12L12 19M5 12L12 5"
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </TouchableOpacity>

                <View style={styles.mediaInfo}>
                    <Text style={styles.mediaInfoText}>
                        {formatTime(totalDuration)}
                    </Text>
                    <Text style={styles.timeText}>
                        {formatTime(currentTime)} / {formatTime(totalDuration)}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.topButton, styles.nextButton]}
                    onPress={() => {
                        onNext?.(
                            clips,
                            globalTextOverlays,
                            globalStickerOverlays,
                            globalPipOverlays,
                            previewDimensions,
                        );
                    }}
                >
                    <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.previewContainer}>
                <TouchableWithoutFeedback onPress={handlePreviewTap}>
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        onLayout={(e) =>
                            setParentLayout({
                                width: e.nativeEvent.layout.width,
                                height: e.nativeEvent.layout.height,
                            })
                        }
                    >
                        {parentLayout.width > 0 && (
                            <View
                                style={{
                                    width: Math.min(
                                        parentLayout.width,
                                        parentLayout.height *
                                            getRatioMath(
                                                currentClipForText?.aspectRatio,
                                            ),
                                    ),
                                    height: Math.min(
                                        parentLayout.height,
                                        parentLayout.width /
                                            getRatioMath(
                                                currentClipForText?.aspectRatio,
                                            ),
                                    ),
                                    overflow: "hidden",
                                    backgroundColor: "#000",
                                }}
                                onLayout={(e) =>
                                    setPreviewDimensions({
                                        width: e.nativeEvent.layout.width,
                                        height: e.nativeEvent.layout.height,
                                    })
                                }
                            >
                                <View style={{ flex: 1 }}>
                                    <MultiClipPlayer
                                        clips={clips}
                                        currentTime={currentTime}
                                        isPlaying={isPlaying}
                                        onTimeUpdate={(time) => {
                                            if (isPlaying) setCurrentTime(time);
                                        }}
                                        onLoad={() => setIsReady(true)}
                                        onEnd={() => setIsPlaying(false)}
                                        filter={currentFilter || undefined}
                                        isDraggingTimeline={isDraggingTimeline}
                                    />
                                </View>

                                {currentClipForText && (
                                    <View
                                        style={[
                                            StyleSheet.absoluteFill,
                                            { zIndex: 100, elevation: 100 },
                                        ]}
                                        pointerEvents="box-none"
                                    >
                                        <DraggableTextOverlays
                                            overlays={globalTextOverlays}
                                            containerWidth={
                                                previewDimensions.width
                                            }
                                            containerHeight={
                                                previewDimensions.height
                                            }
                                            currentTime={currentTime}
                                            onOverlayUpdate={
                                                handleTextOverlayUpdate
                                            }
                                            onOverlayPress={
                                                handleTextOverlayPress
                                            }
                                            selectedOverlayId={
                                                selectedOverlayId
                                            }
                                            activeScale={activeScale}
                                        />
                                        <DraggableStickerOverlays
                                            stickers={globalStickerOverlays}
                                            containerWidth={
                                                previewDimensions.width
                                            }
                                            containerHeight={
                                                previewDimensions.height
                                            }
                                            currentTime={currentTime}
                                            onStickerUpdate={
                                                handleStickerUpdate
                                            }
                                            onStickerPress={(s: any) => {
                                                setSelectedStickerId(s.id);
                                                setSelectedPipId(null);
                                                setSelectedOverlayId(null);
                                                setActiveScale(s.scale ?? 1);
                                                setSelectedClipId(undefined);
                                                setShowTrimHandles(false);
                                            }}
                                            onStickerDelete={
                                                handleStickerDelete
                                            }
                                            selectedStickerId={
                                                selectedStickerId
                                            }
                                            activeScale={activeScale}
                                        />
                                        <DraggablePipOverlays
                                            pips={globalPipOverlays}
                                            containerWidth={
                                                previewDimensions.width
                                            }
                                            containerHeight={
                                                previewDimensions.height
                                            }
                                            currentTime={currentTime}
                                            onPipUpdate={handlePipUpdate}
                                            onPipPress={(p: any) => {
                                                setSelectedPipId(p.id);
                                                setSelectedStickerId(null);
                                                setSelectedOverlayId(null);
                                                setActiveScale(p.scale ?? 1);
                                                setSelectedClipId(undefined);
                                                setShowTrimHandles(false);
                                            }}
                                            onPipDelete={handlePipDelete}
                                            selectedPipId={selectedPipId}
                                            // 🔥 3. Add activeScale to PIPs!
                                            activeScale={activeScale}
                                        />
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </TouchableWithoutFeedback>
                <Animated.View
                    style={[styles.floatingLayerContainer, layerAnimatedStyle]}
                    pointerEvents={isSliderVisible ? "auto" : "none"}
                >
                    <TouchableOpacity
                        style={styles.layerBtn}
                        onPress={() =>
                            handleLayerUpdate(
                                selectedPipId
                                    ? "pip"
                                    : selectedStickerId
                                      ? "sticker"
                                      : "text",
                                "up",
                            )
                        }
                    >
                        <Text style={styles.layerBtnIcon}>⏫</Text>
                        <Text style={styles.layerBtnText}>To Front</Text>
                    </TouchableOpacity>
                    <View style={styles.layerDivider} />
                    <TouchableOpacity
                        style={[
                            styles.layerBtn,
                            isAtBack && styles.layerDisabled,
                        ]}
                        onPress={() =>
                            handleLayerUpdate(
                                selectedPipId ? "pip" : "sticker",
                                "down",
                            )
                        }
                        disabled={isAtBack}
                    >
                        <Text style={styles.layerBtnIcon}>⏬</Text>
                        <Text style={styles.layerBtnText}>To Back</Text>
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View
                    style={[
                        styles.floatingSliderContainer,
                        sliderAnimatedStyle,
                    ]}
                    pointerEvents={isSliderVisible ? "auto" : "none"}
                >
                    <Text style={styles.sliderIcon}>🔍</Text>
                    <Slider
                        style={{ flex: 1, height: 40 }}
                        minimumValue={0.2}
                        maximumValue={5.0}
                        value={activeScale}
                        onValueChange={setActiveScale}
                        onSlidingComplete={handleScaleCommit}
                        minimumTrackTintColor="#ec9a15"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor="#ec9a15"
                    />
                    <Text style={styles.sliderValueText}>
                        {activeScale.toFixed(1)}x
                    </Text>
                </Animated.View>
            </View>

            {/* Editing Tools Bar */}
            <View style={styles.toolsBar}>
                {selectedClipId ? (
                    <View style={styles.selectedTools}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleDeleteClip}
                        >
                            <Svg
                                width={20}
                                height={20}
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <Path
                                    d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                    stroke="#ff4444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </Svg>
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleTrim}
                        >
                            <Svg
                                width={20}
                                height={20}
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <Path
                                    d="M3 12h18M9 6l-6 6 6 6M15 6l6 6-6 6"
                                    stroke={
                                        showTrimHandles ? "#ec9a15" : "#ffffff"
                                    }
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </Svg>
                            <Text
                                style={[
                                    styles.actionButtonText,
                                    showTrimHandles && { color: "#ec9a15" },
                                ]}
                            >
                                Trim
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setSelectedClipId(undefined)}
                        >
                            <Text style={styles.actionButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                ) : hasOverlaySelected ? (
                    // 🔥 NEW: The Overlay Toolbar!
                    <View style={styles.selectedTools}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleDeleteSelectedOverlay}
                        >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>

                        {/* Only show 'Edit Text' if the selected overlay is actually text */}
                        {selectedOverlayId && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setShowTextEditor(true)}
                            >
                                <Text style={styles.actionButtonText}>
                                    Edit Text
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Fades Button - highlights orange when the tray is open */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() =>
                                setActiveTrayMode(
                                    activeTrayMode === "transitions"
                                        ? "main"
                                        : "transitions",
                                )
                            }
                        >
                            <Text
                                style={[
                                    styles.actionButtonText,
                                    activeTrayMode === "transitions" && {
                                        color: "#ec9a15",
                                    },
                                ]}
                            >
                                ⏳ Fades
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleDeselectOverlays}
                        >
                            <Text style={styles.actionButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.unselectedTools}>
                        <Text style={styles.helperText}>
                            Tap a clip to edit
                        </Text>
                        <TouchableOpacity
                            style={styles.addButtonMini}
                            onPress={handleAddPress}
                        >
                            <Svg
                                width={16}
                                height={16}
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <Path
                                    d="M12 5v14M5 12h14"
                                    stroke="#000000"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </Svg>
                            <Text style={styles.addButtonMiniText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Timeline Controls (Play/Pause, Undo/Redo) */}
            <View style={styles.timelineControls}>
                <TouchableOpacity
                    style={[
                        styles.timelineControl,
                        !canUndo && styles.timelineControlDisabled,
                    ]}
                    onPress={onUndo}
                    disabled={!canUndo}
                >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                            d="M3 7v6h6M3 7l6-6M3 7l6 6"
                            stroke={canUndo ? "#ffffff" : "#444444"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.playPauseToggle}
                    onPress={togglePlayPause}
                >
                    {isPlaying ? (
                        <Svg
                            width={24}
                            height={24}
                            viewBox="0 0 24 24"
                            fill="#000000"
                        >
                            <Rect x="6" y="4" width="4" height="16" rx="1" />
                            <Rect x="14" y="4" width="4" height="16" rx="1" />
                        </Svg>
                    ) : (
                        <Svg
                            width={24}
                            height={24}
                            viewBox="0 0 24 24"
                            fill="#000000"
                        >
                            <Path d="M6 4l14 8-14 8V4z" />
                        </Svg>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.timelineControl,
                        !canRedo && styles.timelineControlDisabled,
                    ]}
                    onPress={onRedo}
                    disabled={!canRedo}
                >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                            d="M21 7v6h-6M21 7l-6-6M21 7l-6 6"
                            stroke={canRedo ? "#ffffff" : "#444444"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </TouchableOpacity>
            </View>

            {/* Timeline */}
            {isReady && (
                <View style={styles.timelineWrapper}>
                    <MultiClipTimeline
                        clips={clips}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        selectedClipId={selectedClipId}
                        thumbnails={thumbnails}
                        onClipPress={handleClipPress}
                        onTrimStart={
                            showTrimHandles ? handleTrimStart : undefined
                        }
                        onTrimEnd={showTrimHandles ? handleTrimEnd : undefined}
                        onClipReorder={handleClipReorder}
                        onTimelineSeek={handleTimelineSeek}
                        onTimelineDragStart={handleTimelineDragStart}
                        onTimelineDragEnd={handleTimelineDragEnd}
                        showTextTrack={activeTrayMode === "text"}
                        showStickerTrack={activeTrayMode === "stickers"}
                        showPipTrack={activeTrayMode === "overlay"}
                        selectedOverlayId={selectedOverlayId}
                        selectedStickerId={selectedStickerId}
                        selectedPipId={selectedPipId}
                        onTextTrim={handleTextTrim}
                        onStickerTrim={handleStickerTrim}
                        totalDuration={totalDuration}
                        globalPipOverlays={globalPipOverlays}
                        globalStickerOverlays={globalStickerOverlays}
                        globalTextOverlays={globalTextOverlays}
                        onPipTrim={handlePipTrim}
                        onTextPress={(id) => {
                            const overlay = globalTextOverlays.find(
                                (t) => t.id === id,
                            );
                            if (overlay) handleTextOverlayPress(overlay, true);
                        }}
                        onStickerPress={(id) => {
                            setSelectedStickerId(id);
                            setSelectedPipId(null);
                            setSelectedOverlayId(null);
                        }}
                        onPipPress={(id) => {
                            setSelectedPipId(id);
                            setSelectedStickerId(null);
                            setSelectedOverlayId(null);
                        }}
                    />
                </View>
            )}
            {isReady && (
                <View style={styles.dynamicTrayContainer}>
                    {activeTrayMode === "main" ? (
                        <PreviewActionButtons
                            displayUri={currentClipUri}
                            onFilterClick={() => setActiveTrayMode("filters")}
                            onOverlay={handleOverlay}
                            onText={handleText}
                            onSticker={handleSticker}
                        />
                    ) : (
                        <View style={{ height: 80 }} />
                    )}
                </View>
            )}
            <Animated.View
                style={[styles.subTray, trayAnimatedStyle]}
                pointerEvents={activeTrayMode !== "main" ? "auto" : "none"}
            >
                <View style={styles.subTrayHeader}>
                    <TouchableOpacity
                        onPress={() => {
                            setActiveTrayMode("main");
                            setSelectedStickerId(null);
                        }}
                        style={styles.subTrayBackButton}
                    >
                        <Svg
                            width={24}
                            height={24}
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <Path
                                d="M15 19l-7-7 7-7"
                                stroke="#ffffff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </Svg>
                    </TouchableOpacity>
                    <Text style={styles.subTrayTitle}>
                        {activeTrayMode.charAt(0).toUpperCase() +
                            activeTrayMode.slice(1)}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>
                {activeTrayMode === "transitions" ? (
                    <View style={styles.subTrayContent}>
                        {(() => {
                            const overlay = getSelectedOverlay();
                            if (!overlay) return null;

                            // Safety fallback
                            const duration =
                                (overlay.endTime || 3) -
                                (overlay.startTime || 0);
                            const maxFade = Math.max(0.1, duration / 2);

                            return (
                                <View
                                    style={{
                                        flex: 1,
                                        width: SCREEN_WIDTH - 32,
                                        gap: 16,
                                    }}
                                >
                                    <View>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                marginBottom: 4,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: "#fff",
                                                    fontSize: 12,
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Fade In
                                            </Text>
                                            <Text
                                                style={{
                                                    color: "#ec9a15",
                                                    fontSize: 12,
                                                }}
                                            >
                                                {(overlay.fadeIn || 0).toFixed(
                                                    1,
                                                )}
                                                s
                                            </Text>
                                        </View>
                                        <Slider
                                            style={{
                                                width: "100%",
                                                height: 40,
                                            }}
                                            minimumValue={0}
                                            maximumValue={maxFade}
                                            value={overlay.fadeIn || 0}
                                            onValueChange={(val) =>
                                                handleFadeUpdate("in", val)
                                            }
                                            minimumTrackTintColor="#ec9a15"
                                            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                            thumbTintColor="#ec9a15"
                                        />
                                    </View>

                                    <View>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                marginBottom: 4,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: "#fff",
                                                    fontSize: 12,
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Fade Out
                                            </Text>
                                            <Text
                                                style={{
                                                    color: "#ec9a15",
                                                    fontSize: 12,
                                                }}
                                            >
                                                {(overlay.fadeOut || 0).toFixed(
                                                    1,
                                                )}
                                                s
                                            </Text>
                                        </View>
                                        <Slider
                                            style={{
                                                width: "100%",
                                                height: 40,
                                            }}
                                            minimumValue={0}
                                            maximumValue={maxFade}
                                            value={overlay.fadeOut || 0}
                                            onValueChange={(val) =>
                                                handleFadeUpdate("out", val)
                                            }
                                            minimumTrackTintColor="#ec9a15"
                                            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                            thumbTintColor="#ec9a15"
                                        />
                                    </View>
                                </View>
                            );
                        })()}
                    </View>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.subTrayContent}
                    >
                        {activeTrayMode === "filters" &&
                            FILTERS.map((f) => {
                                const isSelected =
                                    currentFilter?.name === f.name;
                                return (
                                    <TouchableOpacity
                                        key={f.name}
                                        style={styles.subToolBtn}
                                        onPress={() => handleFilter(f)}
                                    >
                                        <View
                                            style={[
                                                styles.filterThumbContainer,
                                                isSelected &&
                                                    styles.filterThumbSelected,
                                            ]}
                                        >
                                            {currentClipUri ? (
                                                <FilterThumbnail
                                                    source={{
                                                        uri: currentClipUri,
                                                    }}
                                                    filter={f}
                                                    style={{
                                                        width: 44,
                                                        height: 44,
                                                        borderRadius: 6,
                                                    }}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View
                                                    style={{
                                                        width: 44,
                                                        height: 44,
                                                        borderRadius: 6,
                                                        backgroundColor:
                                                            "#2a2a2a",
                                                    }}
                                                />
                                            )}
                                        </View>
                                        <Text
                                            style={[
                                                styles.subToolText,
                                                isSelected && {
                                                    color: "#ec9a15",
                                                    fontWeight: "bold",
                                                },
                                            ]}
                                        >
                                            {f.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        {activeTrayMode === "text" &&
                            (selectedOverlayId ? (
                                <TouchableOpacity
                                    style={styles.subToolBtn}
                                    onPress={() => setShowTextEditor(true)} // 🔥 Opens your awesome new Modal!
                                >
                                    <View style={styles.subToolIcon}>
                                        <Text style={{ fontSize: 18 }}>✏️</Text>
                                    </View>
                                    <Text style={styles.subToolText}>
                                        Edit Text
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={styles.subToolBtn}
                                        onPress={handleAddText}
                                    >
                                        <View style={styles.subToolIcon}>
                                            <Text
                                                style={{
                                                    fontSize: 18,
                                                    color: "#fff",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                T
                                            </Text>
                                        </View>
                                        <Text style={styles.subToolText}>
                                            Add Text
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.subToolBtn}>
                                        <View style={styles.subToolIcon}>
                                            <Text style={{ fontSize: 16 }}>
                                                💬
                                            </Text>
                                        </View>
                                        <Text style={styles.subToolText}>
                                            Captions
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.subToolBtn}>
                                        <View style={styles.subToolIcon}>
                                            <Text style={{ fontSize: 16 }}>
                                                ✨
                                            </Text>
                                        </View>
                                        <Text style={styles.subToolText}>
                                            Templates
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ))}
                        {activeTrayMode === "stickers" &&
                            STICKER_PACK.map((sticker, index) => (
                                <TouchableOpacity
                                    key={`sticker-${index}`}
                                    style={styles.subToolBtn}
                                    onPress={() =>
                                        handleAddSticker(sticker.source)
                                    }
                                >
                                    <View
                                        style={[
                                            styles.subToolIcon,
                                            {
                                                backgroundColor: "transparent",
                                            },
                                        ]}
                                    >
                                        <Image
                                            source={{
                                                uri: `${sticker.source}#.png`,
                                            }}
                                            style={{ width: 32, height: 32 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                </TouchableOpacity>
                            ))}

                        {activeTrayMode === "overlay" && (
                            <TouchableOpacity
                                style={styles.subToolBtn}
                                onPress={handleAddPip}
                            >
                                <View style={styles.subToolIcon}>
                                    <Text>🖼️</Text>
                                </View>
                                <Text style={styles.subToolText}>Add PIP</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                )}
            </Animated.View>

            {/* Modals */}
            <AddClipOverlay
                visible={showAddClipOverlay}
                onClose={() => setShowAddClipOverlay(false)}
                onSelectCamera={handleSelectCamera}
                onSelectGallery={handleSelectGallery}
            />
            <TextEditorModal
                visible={showTextEditor}
                overlay={selectedTextOverlay}
                onSave={handleTextOverlaySave}
                onDelete={handleTextOverlayDelete}
                onClose={handleTextEditorClose}
                containerWidth={previewDimensions.width}
                containerHeight={previewDimensions.height}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000000" },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingTop: 50,
        paddingBottom: 8,
        backgroundColor: "#000000",
    },
    topButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    nextButton: {
        backgroundColor: "#ec9a15",
        width: "auto",
        paddingHorizontal: 20,
        borderRadius: 22,
    },
    nextButtonText: { color: "#000", fontSize: 14, fontWeight: "700" },
    mediaInfo: { alignItems: "center" },
    mediaInfoText: { color: "#fff", fontSize: 14, fontWeight: "600" },
    timeText: { color: "#ec9a15", fontSize: 12, marginTop: 2 },
    previewContainer: {
        flex: 1,
        backgroundColor: "#111",
        borderRadius: 12,
        overflow: "hidden",
        marginHorizontal: 8,
        marginBottom: 8,
    },
    floatingSliderContainer: {
        position: "absolute",
        left: 20,
        right: 20,
        bottom: 10,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        marginHorizontal: 16,
        marginBottom: 16, // Hovers just above the toolbar
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    layerDisabled: {
        opacity: 0.4,
    },
    sliderIcon: { fontSize: 16, marginRight: 12 },
    sliderValueText: {
        color: "#ec9a15",
        fontWeight: "bold",
        width: 40,
        textAlign: "right",
        marginLeft: 8,
    },
    toolsBar: {
        height: 50,
        justifyContent: "center",
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    unselectedTools: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    floatingLayerContainer: {
        position: "absolute",
        top: 20, // Sits beautifully at the top of the video preview
        alignSelf: "center", // Perfectly centers the pill
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        zIndex: 100,
        overflow: "hidden",
    },
    layerBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 6,
    },
    layerDivider: {
        width: 1,
        height: 24,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    layerBtnIcon: { fontSize: 16 },
    layerBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
    selectedTools: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    helperText: { color: "#888", fontSize: 13, fontStyle: "italic" },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        padding: 8,
    },
    filterThumbContainer: { borderRadius: 8, padding: 2 },
    filterThumbSelected: { borderWidth: 2, borderColor: "#ec9a15", padding: 0 },
    actionButtonText: { color: "#fff", fontSize: 14, fontWeight: "500" },
    deleteButtonText: { color: "#ff4444", fontSize: 14, fontWeight: "600" },
    addButtonMini: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#ec9a15",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    addButtonMiniText: { color: "#000", fontWeight: "bold", fontSize: 12 },

    timelineControls: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingVertical: 12,
    },
    timelineControl: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    timelineControlDisabled: { opacity: 0.3 },
    playPauseToggle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#ec9a15",
        justifyContent: "center",
        alignItems: "center",
    },

    timelineWrapper: { paddingVertical: 8, backgroundColor: "#0a0a0a" },

    dynamicTrayContainer: {
        height: 80,
        paddingBottom: 24,
        justifyContent: "center",
        backgroundColor: "#000000",
        zIndex: 50,
    },

    subTray: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(10, 10, 10, 0.98)",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
        paddingBottom: 20,
        zIndex: 200,
    },
    subTrayHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    subTrayBackButton: {
        padding: 4,
    },
    subTrayTitle: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
    },
    subTrayContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 24,
    },
    subToolBtn: {
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    subToolIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    subToolText: {
        color: "#ffffff",
        fontSize: 11,
    },
});

export default TimelineEditor;
