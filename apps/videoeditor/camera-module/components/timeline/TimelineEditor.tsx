import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { CameraClip } from "../../types/camera.types";
import type { FilterConfig } from "../../types/filters";
import type { TextOverlay } from "../../types/textOverlay.types";
import { hasFilterChanges } from "../../utils/filterHelpers";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TimelineEditorProps {
  clips: CameraClip[];
  onClipsUpdate: (clips: CameraClip[]) => void;
  onBack?: () => void;
  onNext?: () => void;
  onAddClip?: (source: "camera" | "gallery") => void;
  onAddClipFromGallery?: (clip: CameraClip) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  selectedFilter?: import("../../types/filters").FilterConfig;
}

/**
 * Main timeline editor component with multi-clip support
 */
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
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [showAddClipOverlay, setShowAddClipOverlay] = useState(false);
  const [showTrimHandles, setShowTrimHandles] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterConfig | null>(
    selectedFilter || clips.find((c) => c.filterPreset)?.filterPreset || null
  );
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [selectedTextOverlay, setSelectedTextOverlay] = useState<TextOverlay | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.5,
  });

  // Sync with prop changes
  React.useEffect(() => {
    if (selectedFilter) {
      setCurrentFilter(selectedFilter);
    }
  }, [selectedFilter]);
  const isDraggingTimeline = useRef(false);

  const totalDuration = getTotalTimelineDuration(clips);

  // Get current clip URI for filter button thumbnail
  const currentClipUri = React.useMemo(() => {
    if (selectedClipId) {
      const clip = clips.find((c) => c.id === selectedClipId);
      return clip?.uri || (clips.length > 0 ? clips[0].uri : "");
    }
    return clips.length > 0 ? clips[0].uri : "";
  }, [selectedClipId, clips]);

  // Generate thumbnails on mount and when clips change
  useEffect(() => {
    setIsReady(false);
    generateThumbnailsForClips(clips)
      .then((thumbs) => {
        setThumbnails(thumbs);
        setIsReady(true);
      })
      .catch((error) => {
        console.warn("Error generating thumbnails:", error);
        setIsReady(true); // Still set ready even if thumbnails fail
      });
  }, [clips]);

  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentTime >= totalDuration - 0.1) {
        // Restart from beginning
        setCurrentTime(0);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, currentTime, totalDuration]);

  // Handle timeline seek - throttled for performance
  const lastSeekTimeRef = useRef(0);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  const handleTimelineSeek = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, totalDuration));

      // Update UI immediately for responsiveness
      setCurrentTime(clampedTime);
      setIsPlaying(false);

      // Mark that we're dragging
      isDraggingTimeline.current = true;

      // Clear any pending seek
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }

      // Store pending seek
      pendingSeekRef.current = clampedTime;

      // Throttle actual video seek - only update video every 150ms
      const now = Date.now();
      if (now - lastSeekTimeRef.current < 150) {
        // Queue the seek for later
        seekTimeoutRef.current = setTimeout(() => {
          if (pendingSeekRef.current !== null) {
            setCurrentTime(pendingSeekRef.current);
            pendingSeekRef.current = null;
            lastSeekTimeRef.current = Date.now();
          }
          isDraggingTimeline.current = false;
        }, 150);
        return;
      }

      lastSeekTimeRef.current = now;
      pendingSeekRef.current = null;

      // Reset dragging state after a delay
      setTimeout(() => {
        isDraggingTimeline.current = false;
      }, 200);
    },
    [totalDuration]
  );

  // Handle clip press (select)
  const handleClipPress = useCallback((clip: CameraClip) => {
    setSelectedClipId(clip.id);
  }, []);

  // Handle trim start
  const handleTrimStart = useCallback(
    (clip: CameraClip, newTrimStart: number) => {
      const updatedClips = clips.map((c) => {
        if (c.id === clip.id) {
          const updated = clampTrimPoints({
            ...c,
            trimStart: newTrimStart,
          });
          return updated;
        }
        return c;
      });

      // Recalculate timeline positions after trim
      const { calculateTimelinePositions } = require("../../utils/timelineHelpers");
      const positionedClips = calculateTimelinePositions(updatedClips);

      onClipsUpdate(positionedClips);
    },
    [clips, onClipsUpdate]
  );

  // Handle trim end
  const handleTrimEnd = useCallback(
    (clip: CameraClip, newTrimEnd: number) => {
      const updatedClips = clips.map((c) => {
        if (c.id === clip.id) {
          const updated = clampTrimPoints({
            ...c,
            trimEnd: newTrimEnd,
          });
          return updated;
        }
        return c;
      });

      // Recalculate timeline positions after trim
      const { calculateTimelinePositions } = require("../../utils/timelineHelpers");
      const positionedClips = calculateTimelinePositions(updatedClips);

      onClipsUpdate(positionedClips);
    },
    [clips, onClipsUpdate]
  );

  // Handle clip reorder
  const handleClipReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newClips = [...clips];
      const [movedClip] = newClips.splice(fromIndex, 1);
      newClips.splice(toIndex, 0, movedClip);

      // Recalculate timeline positions after reorder
      const { calculateTimelinePositions } = require("../../utils/timelineHelpers");
      const positionedClips = calculateTimelinePositions(newClips);

      onClipsUpdate(positionedClips);
    },
    [clips, onClipsUpdate]
  );

  // Handle clip delete - FIXED: Proper clip selection and deletion
  const handleDeleteClip = useCallback(() => {
    if (!selectedClipId) {
      // If no clip selected, select the first clip at current time
      const clipAtTime = getClipAtTimelineTime(clips, currentTime);
      if (clipAtTime) {
        setSelectedClipId(clipAtTime.clip.id);
        return; // User needs to press delete again
      }
      return;
    }

    // Find the clip to delete
    const clipToDelete = clips.find((c) => c.id === selectedClipId);
    if (!clipToDelete) return;

    // Remove the selected clip
    const newClips = clips.filter((c) => c.id !== selectedClipId);

    if (newClips.length === 0) {
      onBack?.();
      return;
    }

    // Recalculate timeline positions after deletion
    const { calculateTimelinePositions } = require("../../utils/timelineHelpers");
    const positionedClips = calculateTimelinePositions(newClips);

    // Adjust current time if needed
    if (currentTime > getTotalTimelineDuration(positionedClips)) {
      setCurrentTime(getTotalTimelineDuration(positionedClips));
    }

    // Clear selection
    setSelectedClipId(undefined);

    // Update clips
    onClipsUpdate(positionedClips);
  }, [selectedClipId, clips, currentTime, onClipsUpdate, onBack]);

  // Handle timeline scroll - track dragging state for performance
  const handleTimelineScroll = useCallback((scrollX: number) => {
    isDraggingTimeline.current = true;
    // Clear any existing timeout
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }
    // Reset dragging state after user stops
    seekTimeoutRef.current = setTimeout(() => {
      isDraggingTimeline.current = false;
    }, 200);
  }, []);

  // Format time
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Handle filter selection
  const handleFilter = useCallback(
    (filter: FilterConfig) => {
      setCurrentFilter(filter);

      // Apply filter to selected clip, or all clips if none selected
      const clipsToUpdate = selectedClipId ? clips.filter((c) => c.id === selectedClipId) : clips;

      const updatedClips = clips.map((clip) => {
        if (clipsToUpdate.some((c) => c.id === clip.id)) {
          if (filter.name === "Original" || !hasFilterChanges(filter)) {
            const { filterPreset, ...clipWithoutFilter } = clip;
            return { ...clipWithoutFilter };
          } else {
            return { ...clip, filterPreset: filter };
          }
        }
        return clip;
      });

      onClipsUpdate(updatedClips);
    },
    [selectedClipId, clips, onClipsUpdate]
  );

  // Handle overlay
  const handleOverlay = useCallback(() => {
    console.log("Overlay pressed");
  }, []);

  // Handle text
  const handleText = useCallback(() => {
    setSelectedTextOverlay(null);
    setSelectedOverlayId(null);
    setShowTextEditor(true);
  }, []);

  // Get current clip for text editing
  const currentClipForText = React.useMemo(() => {
    return getClipAtTimelineTime(clips, currentTime)?.clip || clips[0] || null;
  }, [clips, currentTime]);

  // Get all text overlays from current clip
  const currentTextOverlays = React.useMemo(() => {
    return currentClipForText?.textOverlays || [];
  }, [currentClipForText]);

  // Handle text overlay press
  const handleTextOverlayPress = useCallback((overlay: TextOverlay) => {
    setSelectedTextOverlay(overlay);
    setSelectedOverlayId(overlay.id);
    setShowTextEditor(true);
  }, []);

  // Handle text overlay save
  const handleTextOverlaySave = useCallback(
    (overlay: TextOverlay) => {
      if (!currentClipForText) return;

      const existingOverlays = currentClipForText.textOverlays || [];
      const existingIndex = existingOverlays.findIndex((o) => o.id === overlay.id);

      let updatedOverlays: TextOverlay[];
      if (existingIndex >= 0) {
        // Update existing
        updatedOverlays = [...existingOverlays];
        updatedOverlays[existingIndex] = overlay;
      } else {
        // Add new
        updatedOverlays = [...existingOverlays, overlay];
      }

      // Update the clip with new text overlays
      const updatedClips = clips.map((clip) => {
        if (clip.id === currentClipForText.id) {
          return { ...clip, textOverlays: updatedOverlays };
        }
        return clip;
      });

      onClipsUpdate(updatedClips);
      setSelectedOverlayId(null);
      setShowTextEditor(false);
    },
    [currentClipForText, clips, onClipsUpdate]
  );

  // Handle text overlay delete
  const handleTextOverlayDelete = useCallback(
    (overlayId: string) => {
      if (!currentClipForText) return;

      const existingOverlays = currentClipForText.textOverlays || [];
      const updatedOverlays = existingOverlays.filter((o) => o.id !== overlayId);

      const updatedClips = clips.map((clip) => {
        if (clip.id === currentClipForText.id) {
          return { ...clip, textOverlays: updatedOverlays };
        }
        return clip;
      });

      onClipsUpdate(updatedClips);
      setSelectedOverlayId(null);
      setSelectedTextOverlay(null);
      setShowTextEditor(false);
    },
    [currentClipForText, clips, onClipsUpdate]
  );

  // Handle text overlay update (for dragging)
  const handleTextOverlayUpdate = useCallback(
    (overlay: TextOverlay) => {
      if (!currentClipForText) return;

      const existingOverlays = currentClipForText.textOverlays || [];
      const existingIndex = existingOverlays.findIndex((o) => o.id === overlay.id);

      if (existingIndex >= 0) {
        const updatedOverlays = [...existingOverlays];
        updatedOverlays[existingIndex] = overlay;

        const updatedClips = clips.map((clip) => {
          if (clip.id === currentClipForText.id) {
            return { ...clip, textOverlays: updatedOverlays };
          }
          return clip;
        });

        onClipsUpdate(updatedClips);
      }
    },
    [currentClipForText, clips, onClipsUpdate]
  );

  // Handle text editor close
  const handleTextEditorClose = useCallback(() => {
    setShowTextEditor(false);
    setSelectedTextOverlay(null);
    setSelectedOverlayId(null);
  }, []);

  // Handle sticker
  const handleSticker = useCallback((sticker?: string | number) => {
    console.log("Sticker selected:", sticker);
  }, []);

  // Handle music
  const handleMusic = useCallback(() => {
    console.log("Music pressed");
  }, []);

  // Handle voice add
  const handleVoiceAdd = useCallback((voice: any) => {
    console.log("Voice added:", voice);
    // TODO: Add voice to current clip
  }, []);

  // Handle sound FX add
  const handleSoundFXAdd = useCallback((sound: any) => {
    console.log("Sound FX added:", sound);
    // TODO: Add sound effect to current clip
  }, []);

  // Handle caption add
  const handleCaptionAdd = useCallback((caption: any) => {
    console.log("Caption added:", caption);
    // TODO: Add caption to current clip
  }, []);

  // Handle adjust change
  const handleAdjustChange = useCallback((settings: any) => {
    console.log("Adjust settings changed:", settings);
    // TODO: Apply adjustments to current clip
  }, []);

  // Handle cutout add
  const handleCutoutAdd = useCallback((cutout: any) => {
    console.log("Cutout added:", cutout);
    // TODO: Add cutout effect to current clip
  }, []);

  // Handle link add
  const handleLinkAdd = useCallback((link: any) => {
    console.log("Link added:", link);
    // TODO: Add link to current clip
  }, []);

  // Handle paste
  const handlePaste = useCallback((content: string) => {
    console.log("Paste content:", content);
    // TODO: Handle paste content
  }, []);

  // Handle add clip
  const handleAddPress = useCallback(() => {
    setShowAddClipOverlay(true);
  }, []);

  const handleSelectCamera = useCallback(() => {
    setShowAddClipOverlay(false);
    onAddClip?.("camera");
  }, [onAddClip]);

  const handleSelectGallery = useCallback(
    (newClip: CameraClip) => {
      setShowAddClipOverlay(false);
      if (onAddClipFromGallery) {
        onAddClipFromGallery(newClip);
      } else {
        // Fallback: add directly to clips
        const newClips = [...clips, newClip];

        // Recalculate timeline positions after adding
        const { calculateTimelinePositions } = require("../../utils/timelineHelpers");
        const positionedClips = calculateTimelinePositions(newClips);

        onClipsUpdate(positionedClips);
      }
    },
    [onAddClipFromGallery, clips, onClipsUpdate]
  );

  // Handle trim toggle
  const handleTrim = useCallback(() => {
    setShowTrimHandles((prev) => !prev);
    if (!showTrimHandles && isPlaying) {
      setIsPlaying(false);
    }
  }, [showTrimHandles, isPlaying]);

  if (clips.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton} onPress={onBack}>
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
          <Text style={styles.emptyText}>No clips to edit</Text>
          <View style={styles.topButton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topButton} onPress={onBack}>
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
          <Text style={styles.mediaInfoText}>{formatTime(totalDuration)}</Text>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </Text>
        </View>

        <TouchableOpacity style={[styles.topButton, styles.nextButton]} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Preview Player */}
      <View
        style={styles.previewContainer}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setPreviewDimensions({ width, height });
        }}
      >
        <MultiClipPlayer
          clips={clips}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onTimeUpdate={setCurrentTime}
          onLoad={() => setIsReady(true)}
          onEnd={() => setIsPlaying(false)}
          filter={currentFilter || undefined}
          isDraggingTimeline={isDraggingTimeline.current}
        />

        {/* Text Overlays */}
        {currentClipForText && (
          <DraggableTextOverlays
            overlays={currentTextOverlays}
            containerWidth={previewDimensions.width}
            containerHeight={previewDimensions.height}
            currentTime={currentTime}
            onOverlayUpdate={handleTextOverlayUpdate}
            onOverlayPress={handleTextOverlayPress}
            selectedOverlayId={selectedOverlayId}
          />
        )}

        {/* Play Overlay */}
        {!isPlaying && (
          <View style={styles.playOverlay}>
            <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
              <View style={styles.playButtonInner}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path d="M8 5v14l11-7L8 5z" fill="#ffffff" />
                </Svg>
              </View>
              <View style={styles.playButtonRing} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Buttons - Match ModernPreviewEditor style */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDeleteClip}
          activeOpacity={0.7}
          disabled={!selectedClipId}
        >
          <View
            style={[
              styles.deleteIconContainer,
              !selectedClipId && styles.deleteIconContainerDisabled,
            ]}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                stroke={selectedClipId ? "#ff4444" : "#888888"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text
            style={[styles.deleteButtonText, !selectedClipId && styles.actionButtonTextDisabled]}
          >
            Delete
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleAddPress}>
          <View style={styles.addIcon}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5v14M5 12h14"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={styles.actionButtonTextPrimary}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleTrim}>
          <View
            style={[styles.trimIconContainer, showTrimHandles && styles.trimIconContainerActive]}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 12h18M9 6l-6 6 6 6M15 6l6 6-6 6"
                stroke={showTrimHandles ? "#ec9a15" : "#888888"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={[styles.actionButtonText, showTrimHandles && { color: "#ec9a15" }]}>
            Trim
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timeline Controls */}
      <View style={styles.timelineControls}>
        <TouchableOpacity
          style={[styles.timelineControl, !canUndo && styles.timelineControlDisabled]}
          onPress={onUndo}
          disabled={!canUndo}
          activeOpacity={canUndo ? 0.7 : 1}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 7v6h6M3 7l6-6M3 7l6 6"
              stroke={canUndo ? "#888888" : "#444444"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButtonBottom} onPress={togglePlayPause}>
          {isPlaying ? (
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M10 4H6v16h4V4zM18 4h-4v16h4V4z" fill="#ffffff" />
            </Svg>
          ) : (
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M8 5v14l11-7L8 5z" fill="#ffffff" />
            </Svg>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timelineControl, !canRedo && styles.timelineControlDisabled]}
          onPress={onRedo}
          disabled={!canRedo}
          activeOpacity={canRedo ? 0.7 : 1}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 7v6h-6M21 7l-6-6M21 7l-6 6"
              stroke={canRedo ? "#888888" : "#444444"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      {isReady && (
        <MultiClipTimeline
          clips={clips}
          currentTime={currentTime}
          selectedClipId={selectedClipId}
          thumbnails={thumbnails}
          onClipPress={handleClipPress}
          onTrimStart={showTrimHandles ? handleTrimStart : undefined}
          onTrimEnd={showTrimHandles ? handleTrimEnd : undefined}
          onClipReorder={handleClipReorder}
          onTimelineSeek={handleTimelineSeek}
          onScroll={handleTimelineScroll}
        />
      )}

      {/* Preview Action Buttons (Filter, Overlay, Text, Sticker, Music) */}
      {isReady && (
        <PreviewActionButtons
          displayUri={currentClipUri}
          onFilter={handleFilter}
          onOverlay={handleOverlay}
          onText={handleText}
          onSticker={handleSticker}
          onMusic={handleMusic}
          onVoiceAdd={handleVoiceAdd}
          onSoundFXAdd={handleSoundFXAdd}
          onCaptionAdd={handleCaptionAdd}
          onAdjustChange={handleAdjustChange}
          onCutoutAdd={handleCutoutAdd}
          onLinkAdd={handleLinkAdd}
          onPaste={handlePaste}
          startTime={currentTime}
        />
      )}

      {/* Add Clip Overlay */}
      <AddClipOverlay
        visible={showAddClipOverlay}
        onClose={() => setShowAddClipOverlay(false)}
        onSelectCamera={handleSelectCamera}
        onSelectGallery={handleSelectGallery}
      />

      {/* Text Editor Modal */}
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
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 50,
    paddingBottom: 8,
    backgroundColor: "rgba(10, 10, 10, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  nextButton: {
    backgroundColor: "#ec9a15",
    paddingHorizontal: 24,
    borderWidth: 0,
    shadowColor: "#ec9a15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
  mediaInfo: {
    alignItems: "center",
  },
  mediaInfoText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  timeText: {
    color: "#ec9a15",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  emptyText: {
    color: "#ffffff",
    fontSize: 14,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  playButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  playButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ec9a15",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ec9a15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2,
  },
  playButtonRing: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(236, 154, 21, 0.4)",
    zIndex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  deleteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
  },
  deleteIconContainerDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  deleteButtonText: {
    color: "#ff4444",
    fontSize: 10,
    fontWeight: "600",
  },
  actionButtonPrimary: {
    alignItems: "center",
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#888888",
    fontSize: 10,
    fontWeight: "500",
  },
  actionButtonTextPrimary: {
    color: "#7C3AED",
    fontSize: 10,
    fontWeight: "600",
  },
  actionButtonTextDisabled: {
    color: "#888888",
  },
  trimIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  trimIconContainerActive: {
    backgroundColor: "rgba(236, 154, 21, 0.2)",
  },
  timelineControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 50,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  timelineControl: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  timelineControlDisabled: {
    opacity: 0.4,
  },
  playButtonBottom: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ec9a15",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ec9a15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});

export default TimelineEditor;
