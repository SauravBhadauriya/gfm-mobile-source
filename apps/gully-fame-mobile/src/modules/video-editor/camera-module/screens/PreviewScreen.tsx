import React, { useCallback, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import ExportScreen from "../components/ExportScreen";
import ModernPreviewEditor from "../components/ModernPreviewEditor";
import TimelineEditor from "../components/timeline/TimelineEditor";
import { useUndoRedo } from "../hooks/useUndoRedo";
import { cameraStyles } from "../styles/cameraStyles";
import type { CameraClip, CameraClipArray } from "../types/camera.types";

interface PreviewScreenProps {
  clips: CameraClipArray;
  onBack?: () => void;
  onClipUpdate?: (clips: CameraClipArray) => void;
  onAddClip?: (source: "camera" | "gallery") => void;
}

/**
 * PreviewScreen
 *
 * Displays an enhanced media preview with editing tools, timeline, and speed controls.
 * - Full-width video/photo preview with play/pause
 * - Editing tools: Delete, Add, Preset
 * - Timeline with thumbnails and playhead
 * - Speed timeline showing speed segments
 */
const PreviewScreen: React.FC<PreviewScreenProps> = ({
  clips,
  onBack,
  onClipUpdate,
  onAddClip,
}) => {
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [updatedClips, setUpdatedClips] = useState<CameraClipArray>(clips);
  const [showExport, setShowExport] = useState(false);

  // Undo/Redo functionality
  const undoRedo = useUndoRedo(clips);

  // Use TimelineEditor when there are multiple clips for proper sequence display
  const useTimelineEditor = updatedClips.length > 1;

  // Update clips when prop changes
  React.useEffect(() => {
    setUpdatedClips(clips);
    undoRedo.reset(clips);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips]);

  // All hooks must be called before any early returns
  const handleDelete = useCallback(() => {
    if (updatedClips.length === 0) return;

    // Add to history before deleting
    undoRedo.addToHistory({ clips: updatedClips });

    const newClips = updatedClips.filter((_, index) => index !== currentClipIndex);

    // Recalculate timeline positions after deletion
    const { calculateTimelinePositions } = require("../utils/timelineHelpers");
    const positionedClips = calculateTimelinePositions(newClips);

    setUpdatedClips(positionedClips);

    // IMPORTANT: Update clips in parent component immediately for proper sync
    onClipUpdate?.(positionedClips);

    if (positionedClips.length === 0) {
      // No clips left, go back
      onBack?.();
      return;
    }

    // Move to previous clip if available, otherwise stay at 0
    const newIndex = currentClipIndex > 0 ? currentClipIndex - 1 : 0;
    setCurrentClipIndex(newIndex);
  }, [currentClipIndex, updatedClips, onBack, onClipUpdate, undoRedo]);

  const handleAddClip = useCallback(
    (source: "camera" | "gallery") => {
      onAddClip?.(source);
    },
    [onAddClip]
  );

  const handleAddClipFromGallery = useCallback(
    (newClip: CameraClip) => {
      // Add to history before adding
      undoRedo.addToHistory({ clips: updatedClips });

      const newClips = [...updatedClips, newClip];

      // Recalculate timeline positions after adding
      const { calculateTimelinePositions } = require("../utils/timelineHelpers");
      const positionedClips = calculateTimelinePositions(newClips);

      setUpdatedClips(positionedClips);
      setCurrentClipIndex(positionedClips.length - 1);
      onClipUpdate?.(positionedClips);
    },
    [updatedClips, onClipUpdate, undoRedo]
  );

  const handlePreset = useCallback(() => {
    // Preset functionality - can be extended to apply presets
    console.log("Preset button pressed");
  }, []);

  const handleSpeedChange = useCallback(
    (speed: number) => {
      // Add to history before changing speed
      undoRedo.addToHistory({ clips: updatedClips });

      const newClips = updatedClips.map((clip, index) =>
        index === currentClipIndex ? { ...clip, speed } : clip
      );
      setUpdatedClips(newClips);
      onClipUpdate?.(newClips);
    },
    [currentClipIndex, updatedClips, onClipUpdate, undoRedo]
  );

  const handleUndo = useCallback(() => {
    const previousState = undoRedo.undo();
    if (previousState) {
      // Recalculate timeline positions after undo
      const { calculateTimelinePositions } = require("../utils/timelineHelpers");
      const positionedClips = calculateTimelinePositions(previousState.clips);

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
      const { calculateTimelinePositions } = require("../utils/timelineHelpers");
      const positionedClips = calculateTimelinePositions(nextState.clips);

      setUpdatedClips(positionedClips);
      onClipUpdate?.(positionedClips);
      // Adjust current clip index if needed
      if (currentClipIndex >= positionedClips.length) {
        setCurrentClipIndex(Math.max(0, positionedClips.length - 1));
      }
    }
  }, [undoRedo, onClipUpdate, currentClipIndex]);

  const handleNext = useCallback(() => {
    console.log("=== handleNext CALLED (Preview to Export) ===");
    console.log("Updated clips count:", updatedClips.length);
    try {
      // Navigate to export screen
      setShowExport(true);
      console.log("✅ Successfully opened export screen");
    } catch (error) {
      console.error("❌ Error opening export screen:", error);
    }
  }, [updatedClips.length]);

  const handleExportComplete = useCallback(() => {
    console.log("=== handleExportComplete CALLED ===");
    try {
      setShowExport(false);
      onBack?.();
      console.log("✅ Successfully completed export and navigated back");
    } catch (error) {
      console.error("❌ Error in export complete handler:", error);
    }
  }, [onBack]);

  // Early returns AFTER all hooks
  if (!clips || clips.length === 0) {
    return (
      <SafeAreaView style={[cameraStyles.previewContainer, styles.emptyContainer]}>
        <View style={styles.emptyMessage}>{/* Empty state can be customized */}</View>
      </SafeAreaView>
    );
  }

  const currentClip = updatedClips[currentClipIndex];

  if (!currentClip) {
    return (
      <SafeAreaView style={[cameraStyles.previewContainer, styles.emptyContainer]}>
        <View style={styles.emptyMessage}>{/* Empty state */}</View>
      </SafeAreaView>
    );
  }

  // Show ExportScreen if export is triggered
  if (showExport) {
    return (
      <ExportScreen
        clips={updatedClips}
        onBack={() => setShowExport(false)}
        onComplete={handleExportComplete}
      />
    );
  }

  // Use TimelineEditor for multiple clips (shows sequence properly)
  // Use ModernPreviewEditor for single clip
  if (useTimelineEditor) {
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
  }

  // Use ModernPreviewEditor for single clip
  return (
    <SafeAreaView style={styles.container}>
      <ModernPreviewEditor
        clip={currentClip}
        onBack={onBack}
        onNext={handleNext}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDelete}
        onPreset={handlePreset}
        onSpeedChange={handleSpeedChange}
        onAddClip={handleAddClip}
        onAddClipFromGallery={handleAddClipFromGallery}
        canUndo={undoRedo.canUndo}
        canRedo={undoRedo.canRedo}
        onClipUpdate={(updatedClip) => {
          // Add to history before updating
          undoRedo.addToHistory({ clips: updatedClips });
          const newClips = updatedClips.map((clip, index) =>
            index === currentClipIndex ? updatedClip : clip
          );
          setUpdatedClips(newClips);
          onClipUpdate?.(newClips);
        }}
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
