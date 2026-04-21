import React, { useCallback, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import TimelineEditor from "../components/timeline/TimelineEditor";
import { useUndoRedo } from "../hooks/useUndoRedo";
import { cameraStyles } from "../styles/cameraStyles";
import type { CameraClip, CameraClipArray } from "../types/camera.types";

interface PreviewScreenProps {
    clips: CameraClipArray;
    globalTracks?: { text: any[]; stickers: any[]; pips: any[] };
    onBack?: (tracks: { text: any[]; stickers: any[]; pips: any[] }) => void;
    onClipUpdate?: (clips: CameraClipArray) => void;
    onAddClip?: (
        source: "camera" | "gallery",
        tracks: { text: any[]; stickers: any[]; pips: any[] },
    ) => void;
    onExport?: (
        clips: any,
        text: any[],
        stickers: any[],
        pips: any[],
        previewDimensions: { width: number; height: number },
    ) => void;
}

const PreviewScreen: React.FC<PreviewScreenProps> = ({
    clips,
    onBack,
    globalTracks,
    onClipUpdate,
    onAddClip,
    onExport,
}) => {
    const [currentClipIndex, setCurrentClipIndex] = useState(0);
    const [updatedClips, setUpdatedClips] = useState<CameraClipArray>(clips);

    // Undo/Redo functionality
    const undoRedo = useUndoRedo(clips);

    // Update clips when prop changes
    React.useEffect(() => {
        setUpdatedClips(clips);
        undoRedo.reset(clips);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clips]);

    const handleAddClip = useCallback(
        (source: "camera" | "gallery") => {
            onAddClip?.(
                source,
                globalTracks ?? { pips: [], stickers: [], text: [] },
            );
        },
        [onAddClip, globalTracks],
    );

    const handleAddClipFromGallery = useCallback(
        (newClip: CameraClip) => {
            // Add to history before adding
            undoRedo.addToHistory({ clips: updatedClips });

            const newClips = [...updatedClips, newClip];

            // Recalculate timeline positions after adding
            const {
                calculateTimelinePositions,
            } = require("../utils/timelineHelpers");
            const positionedClips = calculateTimelinePositions(newClips);

            setUpdatedClips(positionedClips);
            setCurrentClipIndex(positionedClips.length - 1);
            onClipUpdate?.(positionedClips);
        },
        [updatedClips, onClipUpdate, undoRedo],
    );

    const handleUndo = useCallback(() => {
        const previousState = undoRedo.undo();
        if (previousState) {
            // Recalculate timeline positions after undo
            const {
                calculateTimelinePositions,
            } = require("../utils/timelineHelpers");
            const positionedClips = calculateTimelinePositions(
                previousState.clips,
            );

            setUpdatedClips(positionedClips);
            onClipUpdate?.(positionedClips);
            // Adjust current clip index if needed
            if (currentClipIndex >= positionedClips.length) {
                setCurrentClipIndex(Math.max(0, positionedClips.length - 1));
            }
        }
    }, [undoRedo, onClipUpdate, currentClipIndex]);

    const handleRedo = useCallback(() => {
        const nextState = undoRedo.redo();
        if (nextState) {
            // Recalculate timeline positions after redo
            const {
                calculateTimelinePositions,
            } = require("../utils/timelineHelpers");
            const positionedClips = calculateTimelinePositions(nextState.clips);

            setUpdatedClips(positionedClips);
            onClipUpdate?.(positionedClips);
            // Adjust current clip index if needed
            if (currentClipIndex >= positionedClips.length) {
                setCurrentClipIndex(Math.max(0, positionedClips.length - 1));
            }
        }
    }, [undoRedo, onClipUpdate, currentClipIndex]);

    const handleNext = useCallback(
        (
            finalClips: any,
            text: any[] = [],
            stickers: any[] = [],
            pips: any[] = [],
            previewDimensions: { width: number; height: number } = {
                width: 0,
                height: 0,
            },
        ) => {
            if (!onExport) return;
            onExport(finalClips, text, stickers, pips, previewDimensions);
        },
        [onExport],
    );

    // Early returns AFTER all hooks
    if (!clips || clips.length === 0) {
        return (
            <SafeAreaView
                style={[cameraStyles.previewContainer, styles.emptyContainer]}
            >
                <View style={styles.emptyMessage}>
                    {/* Empty state can be customized */}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TimelineEditor
                clips={updatedClips}
                onClipsUpdate={(newClips) => {
                    // Add to history before updating
                    undoRedo.addToHistory({ clips: updatedClips });
                    setUpdatedClips(newClips);
                    onClipUpdate?.(newClips);
                }}
                initialTextOverlays={globalTracks?.text}
                initialStickerOverlays={globalTracks?.stickers}
                initialPipOverlays={globalTracks?.pips}
                onBack={onBack}
                onNext={handleNext}
                onAddClip={handleAddClip}
                onAddClipFromGallery={handleAddClipFromGallery}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={undoRedo.canUndo}
                canRedo={undoRedo.canRedo}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
    },
    emptyContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    emptyMessage: {
        // Empty state styling can be added here
    },
});

export default PreviewScreen;
