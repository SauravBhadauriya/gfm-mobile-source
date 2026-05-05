/**
 * Export Screen Component
 *
 * Main export interface with settings, preview, and progress tracking
 * Handles video export with FFmpeg
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import Slider from "@react-native-community/slider";
import { Svg, Path } from "react-native-svg";

import {
  ExportSettings,
  QualityPreset,
  Resolution,
  VideoFormat,
  QUALITY_PRESETS,
  RESOLUTION_PRESETS,
  FORMAT_PRESETS,
  getEstimatedFileSize,
  getEstimatedEncodingTime,
  DEFAULT_EXPORT_SETTINGS,
} from "../utils/exportSettings";
import { ExportProgress } from "../utils/ffmpegExporter";
import type { CameraClip, CameraClipArray } from "../types/camera.types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

interface ExportScreenProps {
  clips: CameraClipArray;
  onBack: () => void;
  onExport: (settings: ExportSettings) => Promise<void>;
  totalDuration: number;
}

const ExportScreen: React.FC<ExportScreenProps> = ({ clips, onBack, onExport, totalDuration }) => {
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progressAnim = useSharedValue(0);

  // Update progress animation
  useEffect(() => {
    if (progress) {
      progressAnim.value = withSpring(progress.progress / 100, {
        damping: 15,
        stiffness: 150,
        mass: 0.8,
      });
    }
  }, [progress?.progress]);

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const handleQualityChange = useCallback((quality: QualityPreset) => {
    setSettings((prev) => ({ ...prev, quality }));
  }, []);

  const handleResolutionChange = useCallback((resolution: Resolution) => {
    setSettings((prev) => ({ ...prev, resolution }));
  }, []);

  const handleFormatChange = useCallback((format: VideoFormat) => {
    setSettings((prev) => ({ ...prev, format }));
  }, []);

  const handleBitrateChange = useCallback((value: number) => {
    setSettings((prev) => ({
      ...prev,
      customBitrate: `${Math.round(value)}k`,
    }));
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    setProgress(null);

    try {
      await onExport(settings);
      Alert.alert("Success", "Video exported successfully!");
      onBack();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Export failed";
      setError(errorMessage);
      Alert.alert("Export Error", errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [settings, onExport, onBack]);

  const estimatedFileSize = getEstimatedFileSize(
    totalDuration,
    settings.resolution,
    settings.quality
  );
  const estimatedTime = getEstimatedEncodingTime(totalDuration, settings.quality);
  const qualityConfig = QUALITY_PRESETS[settings.quality];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={isExporting}>
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
        <Text style={styles.headerTitle}>Export Video</Text>
        <View style={{ width: 24 }} />
      </View>

      {isExporting ? (
        // Export Progress View
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#ec9a15" />
          <Text style={styles.progressTitle}>Exporting Video...</Text>

          {progress && (
            <>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, progressAnimStyle]} />
              </View>

              <View style={styles.progressStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Progress</Text>
                  <Text style={styles.statValue}>{Math.round(progress.progress)}%</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Speed</Text>
                  <Text style={styles.statValue}>{progress.speed}</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Time Left</Text>
                  <Text style={styles.statValue}>{progress.timeRemaining}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsExporting(false);
                  setProgress(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        // Settings View
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quality Preset */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quality</Text>
            <View style={styles.presetGrid}>
              {(Object.entries(QUALITY_PRESETS) as Array<[QualityPreset, any]>).map(
                ([key, config]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.presetButton,
                      settings.quality === key && styles.presetButtonActive,
                    ]}
                    onPress={() => handleQualityChange(key)}
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        settings.quality === key && styles.presetButtonTextActive,
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Resolution */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution</Text>
            <View style={styles.presetGrid}>
              {(Object.entries(RESOLUTION_PRESETS) as Array<[Resolution, any]>).map(
                ([key, config]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.presetButton,
                      settings.resolution === key && styles.presetButtonActive,
                    ]}
                    onPress={() => handleResolutionChange(key)}
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        settings.resolution === key && styles.presetButtonTextActive,
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Format */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Format</Text>
            <View style={styles.presetGrid}>
              {(Object.entries(FORMAT_PRESETS) as Array<[VideoFormat, any]>).map(
                ([key, config]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.presetButton,
                      settings.format === key && styles.presetButtonActive,
                    ]}
                    onPress={() => handleFormatChange(key)}
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        settings.format === key && styles.presetButtonTextActive,
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Bitrate Control */}
          <View style={styles.section}>
            <View style={styles.bitrateHeader}>
              <Text style={styles.sectionTitle}>Bitrate</Text>
              <Text style={styles.bitrateValue}>
                {settings.customBitrate || qualityConfig.bitrate}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1000}
              maximumValue={30000}
              step={500}
              value={parseInt(settings.customBitrate || qualityConfig.bitrate)}
              onValueChange={handleBitrateChange}
              minimumTrackTintColor="#ec9a15"
              maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
              thumbTintColor="#ec9a15"
            />
            <View style={styles.bitrateRange}>
              <Text style={styles.bitrateRangeText}>1000k</Text>
              <Text style={styles.bitrateRangeText}>30000k</Text>
            </View>
          </View>

          {/* Estimated Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimated</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>File Size</Text>
                <Text style={styles.statBoxValue}>{estimatedFileSize}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Encoding Time</Text>
                <Text style={styles.statBoxValue}>{estimatedTime}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Video Duration</Text>
                <Text style={styles.statBoxValue}>
                  {Math.floor(totalDuration / 60)}m {Math.round(totalDuration % 60)}s
                </Text>
              </View>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Export Button */}
          <TouchableOpacity
            style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={isExporting}
          >
            <Text style={styles.exportButtonText}>Export Video</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetButton: {
    flex: 1,
    minWidth: "48%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#444444",
    alignItems: "center",
  },
  presetButtonActive: {
    backgroundColor: "#ec9a15",
    borderColor: "#ec9a15",
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#cccccc",
  },
  presetButtonTextActive: {
    color: "#000000",
  },
  bitrateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bitrateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ec9a15",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  bitrateRange: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  bitrateRangeText: {
    fontSize: 12,
    color: "#888888",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  statBoxLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ec9a15",
  },
  errorContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#4a2a2a",
    borderWidth: 1,
    borderColor: "#ff6666",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#ff9999",
  },
  exportButton: {
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#ec9a15",
    alignItems: "center",
    marginBottom: 16,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  progressContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 24,
  },
  progressBar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333333",
    overflow: "hidden",
    marginBottom: 24,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ec9a15",
    borderRadius: 4,
  },
  progressStats: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 32,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ec9a15",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: "#ff6666",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default ExportScreen;
