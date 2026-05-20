import { ResizeMode, Video } from "expo-av";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import type { CameraClip } from "../types/camera.types";
import { FilterConfig } from "../types/filters";
import type { TextOverlay } from "../types/textOverlay.types";
import { hasFilterChanges } from "../utils/filterHelpers";
import AddClipOverlay from "./AddClipOverlay";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import DraggableTextOverlays from "./DraggableTextOverlays";
import FilteredImage from "./FilteredImage";
import FilteredVideo from "./FilteredVideo";
import PreviewActionButtons from "./PreviewActionButtons";
import TextEditorModal from "./TextEditorModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FRAME_WIDTH = 40;
const FRAME_HEIGHT = 50;

interface ModernPreviewEditorProps {
  clip: CameraClip;
  onBack?: () => void;
  onNext?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onPreset?: () => void;
  onSpeedChange?: (speed: number) => void;
  onAddClip?: (source: "camera" | "gallery") => void;
  onAddClipFromGallery?: (clip: CameraClip) => void;
  onClipUpdate?: (updatedClip: CameraClip) => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const ModernPreviewEditor: React.FC<ModernPreviewEditorProps> = ({
  clip,
  onBack,
  onNext,
  onUndo,
  onRedo,
  onDelete,
  onPreset,
  onSpeedChange,
  onAddClip,
  onAddClipFromGallery,
  onClipUpdate,
  canUndo = false,
  canRedo = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSpeed, setSelectedSpeed] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterConfig | null>(
    clip.filterPreset || null
  );

  React.useEffect(() => {
    setSelectedFilter(clip.filterPreset || null);
  }, [clip.filterPreset]);

  const videoRef = useRef<Video>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isDragging = useRef(false);
  const wasPlaying = useRef(false);
  const lastUpdateTime = useRef(0);
  const currentPlaybackRateRef = useRef(1);
  const isChangingRateRef = useRef(false);
  const [showAddClipOverlay, setShowAddClipOverlay] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [selectedTextOverlay, setSelectedTextOverlay] = useState<TextOverlay | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.5,
  });
  const [showTrimHandles, setShowTrimHandles] = useState(false);

  const playButtonScale = useRef(new Animated.Value(1)).current;
  const timelineOpacity = useRef(new Animated.Value(1)).current;

  const isVideo = clip.type === "video";

  const handleDeletePress = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteModal(false);
    onDelete?.();
  }, [onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const speedSegments = React.useMemo(() => {
    return clip.speedSegments && clip.speedSegments.length > 0 ? clip.speedSegments : null;
  }, [clip.speedSegments]);

  const getSpeedAtTime = React.useCallback(
    (time: number): number => {
      if (!speedSegments) return selectedSpeed;

      for (const seg of speedSegments) {
        if (time >= seg.startTime && time < seg.endTime) {
          return seg.speed;
        }
      }
      return speedSegments[speedSegments.length - 1]?.speed ?? selectedSpeed;
    },
    [speedSegments, selectedSpeed]
  );

  const speedLabels: Record<number, string> = {
    0.5: "0.5x",
    1: "1x",
    2: "2x",
    3: "3x",
    5: "5x",
  };

  const frames = React.useMemo(() => {
    if (!isVideo) {
      return [];
    }
    if (duration === 0) return [];
    const frameCount = Math.max(10, Math.ceil(duration * 3)); // 3 frames per second
    return Array.from({ length: frameCount }, (_, i) => ({
      id: `frame-${i}`,
      time: (i / frameCount) * duration,
    }));
  }, [duration, isVideo]);

  const totalWidth = frames.length > 0 ? frames.length * FRAME_WIDTH : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLoad = useCallback(
    (status: any) => {
      if (status.isLoaded && status.durationMillis) {
        const dur = status.durationMillis / 1000;
        setDuration(dur);
        setIsReady(true);

        // Initialize playback rate if using speed segments
        if (speedSegments && videoRef.current) {
          const initialSpeed = getSpeedAtTime(0);
          currentPlaybackRateRef.current = initialSpeed;
          videoRef.current.setRateAsync(initialSpeed, true).catch(console.warn);
        }
      }
    },
    [speedSegments, getSpeedAtTime]
  );

  React.useEffect(() => {
    if (!isVideo) {
      setIsReady(true);
    }
  }, [isVideo]);

  const handlePlaybackStatus = useCallback(
    (status: any) => {
      if (!status.isLoaded || isDragging.current) return;

      if (status.durationMillis && status.positionMillis !== undefined) {
        const time = status.positionMillis / 1000;
        const dur = status.durationMillis / 1000;

        setCurrentTime(time);

        // If video stopped but should be playing (after rate change), resume it
        if (isPlaying && !status.isPlaying && !isChangingRateRef.current && videoRef.current) {
          videoRef.current.playAsync().catch(console.warn);
        }

        // Update playback rate if using speed segments
        if (speedSegments && videoRef.current && isPlaying && !isChangingRateRef.current) {
          const targetSpeed = getSpeedAtTime(time);
          if (Math.abs(targetSpeed - currentPlaybackRateRef.current) > 0.01) {
            isChangingRateRef.current = true;
            currentPlaybackRateRef.current = targetSpeed;

            // Change rate while maintaining playback
            // The second parameter (true) should keep it playing
            videoRef.current
              .setRateAsync(targetSpeed, true)
              .then(() => {
                // Immediately check and resume if needed
                setTimeout(() => {
                  if (isPlaying && videoRef.current && !isDragging.current) {
                    videoRef.current
                      .getStatusAsync()
                      .then((s: any) => {
                        if (s.isLoaded && !s.isPlaying) {
                          videoRef.current?.playAsync().catch(console.warn);
                        }
                      })
                      .catch(console.warn);
                  }
                  isChangingRateRef.current = false;
                }, 100);
              })
              .catch((err) => {
                console.warn("Error changing playback rate:", err);
                isChangingRateRef.current = false;
              });
          }
        }

        // Auto-scroll timeline
        if (isPlaying && scrollViewRef.current && totalWidth > 0) {
          const progress = time / dur;
          const scrollX = Math.max(0, progress * totalWidth - SCREEN_WIDTH / 2);
          scrollViewRef.current.scrollTo({ x: scrollX, animated: false });
        }

        // Handle end - auto-loop with 1 second pause
        if (time >= dur - 0.1 && status.isPlaying && videoRef.current) {
          // Pause video
          setIsPlaying(false);
          videoRef.current.pauseAsync();

          // Wait 1 second, then restart
          setTimeout(async () => {
            if (videoRef.current) {
              await videoRef.current.setPositionAsync(0);
              setCurrentTime(0);
              scrollViewRef.current?.scrollTo({ x: 0, animated: true });

              // Reset speed
              if (speedSegments) {
                const initialSpeed = getSpeedAtTime(0);
                currentPlaybackRateRef.current = initialSpeed;
                await videoRef.current.setRateAsync(initialSpeed, true);
              } else {
                await videoRef.current.setRateAsync(selectedSpeed, true);
              }

              // Start playing again
              await videoRef.current.playAsync();
              setIsPlaying(true);
            }
          }, 1000); // 1 second pause
        }
      }
    },
    [isPlaying, totalWidth, speedSegments, getSpeedAtTime, selectedSpeed]
  );

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current || !isReady) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        if (currentTime >= duration - 0.1) {
          await videoRef.current.setPositionAsync(0);
          setCurrentTime(0);
          scrollViewRef.current?.scrollTo({ x: 0, animated: false });
          if (speedSegments) {
            const initialSpeed = getSpeedAtTime(0);
            currentPlaybackRateRef.current = initialSpeed;
            await videoRef.current.setRateAsync(initialSpeed, true);
          }
        } else {
          // Set correct speed when resuming
          if (speedSegments) {
            const targetSpeed = getSpeedAtTime(currentTime);
            currentPlaybackRateRef.current = targetSpeed;
            await videoRef.current.setRateAsync(targetSpeed, true);
          }
        }
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.warn("Play/Pause error:", error);
    }
  }, [isPlaying, isReady, currentTime, duration, speedSegments, getSpeedAtTime]);

  const seekTo = useCallback(
    async (time: number) => {
      if (!videoRef.current || !isReady) return;

      const clampedTime = Math.max(0, Math.min(time, duration));

      try {
        await videoRef.current.setPositionAsync(clampedTime * 1000);
        setCurrentTime(clampedTime);

        // Update playback rate for the new position if using speed segments
        if (speedSegments) {
          const targetSpeed = getSpeedAtTime(clampedTime);
          currentPlaybackRateRef.current = targetSpeed;
          await videoRef.current.setRateAsync(targetSpeed, true);
        }
      } catch (error) {
        console.warn("Seek error:", error);
      }
    },
    [isReady, duration, speedSegments, getSpeedAtTime]
  );

  const handleScroll = useCallback(
    (event: any) => {
      if (!isDragging.current || !isReady || duration === 0) return;

      const scrollX = event.nativeEvent.contentOffset.x;
      const progress = (scrollX + SCREEN_WIDTH / 2) / totalWidth;
      const time = Math.max(0, Math.min(progress * duration, duration));

      const now = Date.now();
      if (now - lastUpdateTime.current > 50) {
        lastUpdateTime.current = now;
        seekTo(time);
      } else {
        setCurrentTime(time);
      }
    },
    [isReady, duration, totalWidth, seekTo]
  );

  const handleScrollBegin = useCallback(() => {
    isDragging.current = true;
    wasPlaying.current = isPlaying;

    if (isPlaying && videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const handleScrollEnd = useCallback(
    (event: any) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      const progress = (scrollX + SCREEN_WIDTH / 2) / totalWidth;
      const time = Math.max(0, Math.min(progress * duration, duration));

      seekTo(time);

      setTimeout(() => {
        isDragging.current = false;

        if (wasPlaying.current && videoRef.current) {
          videoRef.current.playAsync();
          setIsPlaying(true);
        }
      }, 100);
    },
    [duration, totalWidth, seekTo]
  );

  const handleSpeedChange = useCallback(
    (speed: number) => {
      setSelectedSpeed(speed);
      onSpeedChange?.(speed);

      if (!speedSegments && videoRef.current && isReady) {
        videoRef.current.setRateAsync(speed, true);
        currentPlaybackRateRef.current = speed;
      }
    },
    [isReady, onSpeedChange, speedSegments]
  );

  const handleAddPress = useCallback(() => {
    setShowAddClipOverlay(true);
  }, []);

  const handleSelectCamera = useCallback(() => {
    setShowAddClipOverlay(false);
    onAddClip?.("camera");
  }, [onAddClip]);

  const handleSelectGallery = useCallback(
    (newClip: CameraClip) => {
      onAddClipFromGallery?.(newClip);
    },
    [onAddClipFromGallery]
  );

  const handleFilter = useCallback(
    (filter: FilterConfig) => {
      console.log("Filter selected:", filter.name, filter);
      if (filter.name === "Original" || !hasFilterChanges(filter)) {
        console.log("Setting filter to null (Original)");
        setSelectedFilter(null);
        if (onClipUpdate) {
          const { filterPreset, ...clipWithoutFilter } = clip;
          onClipUpdate({ ...clipWithoutFilter });
        }
      } else {
        console.log("Setting filter:", filter);
        setSelectedFilter(filter);
        if (onClipUpdate) {
          onClipUpdate({ ...clip, filterPreset: filter });
        }
      }
    },
    [clip, onClipUpdate]
  );

  const handleOverlay = useCallback(() => {
    console.log("Overlay pressed");
  }, []);

  const handleText = useCallback(() => {
    setSelectedTextOverlay(null);
    setShowTextEditor(true);
  }, []);

  const handleTextOverlayPress = useCallback((overlay: TextOverlay) => {
    setSelectedTextOverlay(overlay);
    setSelectedOverlayId(overlay.id);
    setShowTextEditor(true);
  }, []);

  const handleTextOverlaySave = useCallback(
    (overlay: TextOverlay) => {
      const existingOverlays = clip.textOverlays || [];
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

      const updatedClip = { ...clip, textOverlays: updatedOverlays };
      onClipUpdate?.(updatedClip);
      setSelectedOverlayId(null);
    },
    [clip, onClipUpdate]
  );

  const handleTextOverlayDelete = useCallback(
    (overlayId: string) => {
      const existingOverlays = clip.textOverlays || [];
      const updatedOverlays = existingOverlays.filter((o) => o.id !== overlayId);
      const updatedClip = { ...clip, textOverlays: updatedOverlays };
      onClipUpdate?.(updatedClip);
      setSelectedOverlayId(null);
      setSelectedTextOverlay(null);
    },
    [clip, onClipUpdate]
  );

  const handleTextOverlayUpdate = useCallback(
    (overlay: TextOverlay) => {
      const existingOverlays = clip.textOverlays || [];
      const existingIndex = existingOverlays.findIndex((o) => o.id === overlay.id);

      if (existingIndex >= 0) {
        const updatedOverlays = [...existingOverlays];
        updatedOverlays[existingIndex] = overlay;
        const updatedClip = { ...clip, textOverlays: updatedOverlays };
        onClipUpdate?.(updatedClip);
      }
    },
    [clip, onClipUpdate]
  );

  const handleTextEditorClose = useCallback(() => {
    setShowTextEditor(false);
    setSelectedTextOverlay(null);
    setSelectedOverlayId(null);
  }, []);

  const handleTrim = useCallback(() => {
    setShowTrimHandles(!showTrimHandles);
    if (!showTrimHandles && isVideo && videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, [showTrimHandles, isVideo]);

  const handleSticker = useCallback((sticker?: string | number) => {
    if (sticker !== undefined) {
      console.log("Sticker selected:", sticker);
    }
  }, []);

  const handleMusic = useCallback(() => {
    console.log("Music pressed");
  }, []);

  const playheadLeft = duration > 0 ? (currentTime / duration) * totalWidth : 0;

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

        <View style={styles.mediaInfo}>
          <Text style={styles.mediaInfoText}>{isVideo ? formatTime(duration) : "Photo"}</Text>
          {isVideo && <Text style={styles.speedInfoText}>{speedLabels[selectedSpeed]}</Text>}
        </View>

        <TouchableOpacity style={[styles.topButton, styles.nextButton]} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.previewContainer}
        activeOpacity={1}
        onPress={isVideo ? togglePlayPause : undefined}
        disabled={!isVideo}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setPreviewDimensions({ width, height });
        }}
      >
        {isVideo ? (
          <FilteredVideo
            videoRef={videoRef}
            source={{ uri: clip.uri }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
            rate={speedSegments ? currentPlaybackRateRef.current : selectedSpeed}
            onLoad={handleLoad}
            onPlaybackStatusUpdate={handlePlaybackStatus}
            progressUpdateIntervalMillis={33}
            filter={selectedFilter || undefined}
          />
        ) : (
          <FilteredImage
            source={{ uri: clip.uri }}
            style={styles.media}
            resizeMode="contain"
            filter={selectedFilter || undefined}
          />
        )}

        {!isPlaying && isVideo && (
          <View style={styles.playOverlay}>
            <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
                onPressIn={() => {
                  Animated.spring(playButtonScale, {
                    toValue: 0.9,
                    useNativeDriver: true,
                  }).start();
                }}
                onPressOut={() => {
                  Animated.spring(playButtonScale, {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start();
                }}
              >
                <View style={styles.playButtonInner}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path d="M8 5v14l11-7L8 5z" fill="#ffffff" />
                  </Svg>
                </View>
                <View style={styles.playButtonRing} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {isPlaying && isVideo && duration > 0 && (
          <View style={styles.progressBarOverlay}>
            <View style={styles.progressBarTrack}>
              <View
                style={[styles.progressBarFill, { width: `${(currentTime / duration) * 100}%` }]}
              />
            </View>
          </View>
        )}

        {isVideo && isReady && (
          <View style={styles.timeDisplay}>
            <View style={styles.timeDisplayInner}>
              <Text style={styles.timeTextCurrent}>{formatTime(currentTime)}</Text>
              <View style={styles.timeSeparator} />
              <Text style={styles.timeTextTotal}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}

        {isReady && clip.textOverlays && clip.textOverlays.length > 0 && (
          <DraggableTextOverlays
            overlays={clip.textOverlays}
            containerWidth={previewDimensions.width}
            containerHeight={previewDimensions.height}
            currentTime={isVideo ? currentTime : undefined}
            onOverlayUpdate={handleTextOverlayUpdate}
            onOverlayPress={handleTextOverlayPress}
            selectedOverlayId={selectedOverlayId}
          />
        )}
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDeletePress}
          activeOpacity={0.7}
        >
          <View style={styles.deleteIconContainer}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                stroke="#ff4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={styles.deleteButtonText}>Delete</Text>
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

      {isReady && (
        <View style={styles.timelineSection}>
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

            {isVideo ? (
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
            ) : (
              <View style={styles.playButtonBottom} />
            )}

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

          {isVideo && duration > 0 && (
            <Animated.View style={[styles.timelineWrapper, { opacity: timelineOpacity }]}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                onScrollBeginDrag={handleScrollBegin}
                onScrollEndDrag={handleScrollEnd}
                onMomentumScrollEnd={handleScrollEnd}
                contentContainerStyle={[
                  styles.timelineContent,
                  { width: totalWidth + SCREEN_WIDTH },
                ]}
              >
                <View style={styles.timelineTrack}>
                  <View style={{ width: SCREEN_WIDTH / 2 }} />

                  {frames.map((frame, index) => {
                    const isActive =
                      currentTime >= frame.time &&
                      currentTime < frame.time + duration / frames.length;
                    return (
                      <View key={frame.id} style={styles.frame}>
                        <View style={[styles.frameContent, isActive && styles.frameContentActive]}>
                          {index % 3 === 0 && <View style={styles.frameThumbnail} />}
                          {index % 10 === 0 && (
                            <Text style={styles.frameTime}>{formatTime(frame.time)}</Text>
                          )}
                        </View>
                        {isActive && <View style={styles.frameActiveIndicator} />}
                      </View>
                    );
                  })}

                  <View style={{ width: SCREEN_WIDTH / 2 }} />
                </View>
              </ScrollView>

              <View style={styles.centerIndicator}>
                <View style={styles.centerIndicatorGlow} />
                <View style={styles.centerLine} />
                <View style={styles.centerTriangle} />
              </View>
            </Animated.View>
          )}

          {isVideo && (
            <View style={styles.speedControls}>
              {[0.5, 1, 2, 3, 5].map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[styles.speedButton, selectedSpeed === speed && styles.speedButtonActive]}
                  onPress={() => handleSpeedChange(speed)}
                >
                  <Text
                    style={[
                      styles.speedButtonText,
                      selectedSpeed === speed && styles.speedButtonTextActive,
                    ]}
                  >
                    {speedLabels[speed]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {isReady && (
        <PreviewActionButtons
          displayUri={clip.uri}
          onFilter={handleFilter}
          onOverlay={handleOverlay}
          onText={handleText}
          onSticker={handleSticker}
          onMusic={handleMusic}
          onVoiceAdd={(voice) => {
            const updatedClip = {
              ...clip,
              voiceOverlays: [...(clip.voiceOverlays || []), voice],
            };
            onClipUpdate?.(updatedClip);
          }}
          onSoundFXAdd={(sound) => {
            const updatedClip = {
              ...clip,
              soundEffects: [...(clip.soundEffects || []), sound],
            };
            onClipUpdate?.(updatedClip);
          }}
          onCaptionAdd={(caption) => {
            const updatedClip = {
              ...clip,
              captions: [...(clip.captions || []), caption],
            };
            onClipUpdate?.(updatedClip);
          }}
          onAdjustChange={(settings) => {
            const updatedClip = {
              ...clip,
              adjustSettings: settings,
            };
            onClipUpdate?.(updatedClip);
          }}
          onCutoutAdd={(cutout) => {
            const updatedClip = {
              ...clip,
              cutouts: [...(clip.cutouts || []), cutout],
            };
            onClipUpdate?.(updatedClip);
          }}
          onLinkAdd={(link) => {
            const updatedClip = {
              ...clip,
              links: [...(clip.links || []), link],
            };
            onClipUpdate?.(updatedClip);
          }}
          onPaste={(content) => {
            // Paste can add as text overlay
            const textOverlay = {
              id: `text-${Date.now()}`,
              text: content,
              x: 0.5,
              y: 0.5,
              fontSize: 24,
              fontWeight: "600",
              color: "#ffffff",
              textAlign: "center" as const,
              opacity: 1,
            };
            const updatedClip = {
              ...clip,
              textOverlays: [...(clip.textOverlays || []), textOverlay],
            };
            onClipUpdate?.(updatedClip);
          }}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        clipType={clip.type}
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
  speedInfoText: {
    color: "#ec9a15",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  previewContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginVertical: 0,
  },
  media: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
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
  progressBarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 100,
  },
  progressBarTrack: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    height: 3,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: "#ec9a15",
    shadowColor: "#ec9a15",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  timeDisplay: {
    position: "absolute",
    bottom: 24,
    left: 24,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timeDisplayInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  timeTextCurrent: {
    color: "#ec9a15",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  timeSeparator: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 10,
  },
  timeTextTotal: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 0.5,
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
  timelineSection: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
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
  timelineWrapper: {
    height: 60,
    marginBottom: 8,
    marginHorizontal: 0,
    position: "relative",
    backgroundColor: "transparent",
    paddingTop: 0,
    paddingBottom: 0,
    borderWidth: 0,
  },
  timelineContent: {
    paddingVertical: 10,
  },
  timelineTrack: {
    flexDirection: "row",
    height: FRAME_HEIGHT,
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    marginRight: 2,
    position: "relative",
  },
  frameContent: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  frameContentActive: {
    borderColor: "#ffffff",
    borderWidth: 2,
    backgroundColor: "#2a2a2a",
  },
  frameThumbnail: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#2a2a2a",
    opacity: 0.3,
  },
  frameActiveIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#ec9a15",
    shadowColor: "#ec9a15",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  frameTime: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "monospace",
    zIndex: 1,
  },
  centerIndicator: {
    position: "absolute",
    left: SCREEN_WIDTH / 2,
    top: 0,
    width: 2,
    height: FRAME_HEIGHT,
    alignItems: "center",
    zIndex: 20,
  },
  centerIndicatorGlow: {
    display: "none",
  },
  centerLine: {
    width: 2,
    height: FRAME_HEIGHT,
    backgroundColor: "#ec9a15",
  },
  centerTriangle: {
    display: "none",
  },
  speedControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 4,
  },
  speedButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    minWidth: 60,
    alignItems: "center",
  },
  speedButtonActive: {
    backgroundColor: "#ec9a15",
    borderColor: "#ec9a15",
    shadowColor: "#ec9a15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  speedButtonText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  speedButtonTextActive: {
    color: "#ffffff",
  },
});

export default ModernPreviewEditor;
