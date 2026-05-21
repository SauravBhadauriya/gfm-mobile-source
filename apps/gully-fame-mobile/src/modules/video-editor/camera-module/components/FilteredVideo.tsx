import { ResizeMode, Video } from "expo-av";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import type { FilterConfig } from "../types/filters";
import { getFilterOverlayFromProperties } from "../utils/filterOverlays";

interface FilteredVideoProps {
  source: { uri: string };
  style?: ViewStyle;
  resizeMode?: ResizeMode;
  shouldPlay?: boolean;
  isLooping?: boolean;
  rate?: number;
  onLoad?: (status: any) => void;
  onPlaybackStatusUpdate?: (status: any) => void;
  progressUpdateIntervalMillis?: number;
  filter?: FilterConfig;
  videoRef?: React.RefObject<Video | null>;
}

/**
 * Video component with filter preview overlay
 *
 * NOTE: expo-av Video doesn't support native visual filters.
 * This component uses View overlays with blend modes and opacity to simulate
 * filter effects for real-time preview. Filters are still applied properly
 * at export time using FFmpeg.
 */
const FilteredVideo: React.FC<FilteredVideoProps> = ({
  source,
  style,
  resizeMode = ResizeMode.CONTAIN,
  shouldPlay = false,
  isLooping = false,
  rate = 1,
  onLoad,
  onPlaybackStatusUpdate,
  progressUpdateIntervalMillis,
  filter,
  videoRef,
}) => {
  console.log("=== FilteredVideo render ===");
  console.log("Filter applied:", filter?.name || "None");
  console.log("Filter properties:", filter);

  const filterOverlayStyle = getFilterOverlayFromProperties(filter || { name: "Original" });
  console.log("Filter overlay style:", filterOverlayStyle);

  // Apply brightness/contrast adjustments using opacity overlay
  const getBrightnessOverlay = (): ViewStyle | null => {
    if (!filter) return null;

    const brightness = filter.brightness || 0;

    // Brightness adjustment
    if (brightness !== 0) {
      const brightnessOverlay: ViewStyle = {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: "none",
      };

      if (brightness > 0) {
        // Brighter - white overlay with low opacity
        brightnessOverlay.backgroundColor = "rgba(255, 255, 255, 0.1)";
        brightnessOverlay.opacity = Math.abs(brightness) * 0.5;
      } else {
        // Darker - black overlay with low opacity
        brightnessOverlay.backgroundColor = "rgba(0, 0, 0, 0.1)";
        brightnessOverlay.opacity = Math.abs(brightness) * 0.5;
      }

      return brightnessOverlay;
    }

    return null;
  };

  // Get contrast overlay - MISSING IN ORIGINAL
  const getContrastOverlay = (): ViewStyle | null => {
    if (!filter) return null;

    const contrast = filter.contrast || 1.0;

    if (contrast > 1.0 && filter.name !== "Grayscale") {
      // High contrast - dark overlay
      const contrastOverlay: ViewStyle = {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: "none",
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        opacity: (contrast - 1.0) * 0.2,
      };
      return contrastOverlay;
    } else if (contrast < 1.0 && filter.name !== "Grayscale") {
      // Low contrast - light overlay
      const contrastOverlay: ViewStyle = {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: "none",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        opacity: (1.0 - contrast) * 0.15,
      };
      return contrastOverlay;
    }

    return null;
  };

  const brightnessOverlayStyle = getBrightnessOverlay();
  const contrastOverlayStyle = getContrastOverlay();

  return (
    <View style={style}>
      <Video
        ref={videoRef as React.RefObject<Video>}
        style={StyleSheet.absoluteFill}
        source={source}
        useNativeControls={false}
        resizeMode={resizeMode}
        shouldPlay={shouldPlay}
        isLooping={isLooping}
        rate={rate}
        onLoad={onLoad}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        progressUpdateIntervalMillis={progressUpdateIntervalMillis || 100}
        // Performance optimizations
        usePoster={false}
        posterSource={undefined}
        // Reduce memory usage
        positionMillis={undefined}
        // Enable hardware acceleration
        allowsExternalPlayback={false}
        staysActiveInBackground={false}
      />

      {/* Filter color overlay - simulates filter effect */}
      {filterOverlayStyle && <View style={filterOverlayStyle} />}

      {/* Contrast overlay - NOW ADDED FOR VIDEO */}
      {contrastOverlayStyle && <View style={contrastOverlayStyle} />}

      {/* Brightness overlay */}
      {brightnessOverlayStyle && <View style={brightnessOverlayStyle} />}
    </View>
  );
};

export default FilteredVideo;
