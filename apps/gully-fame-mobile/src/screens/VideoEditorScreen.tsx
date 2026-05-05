// Created by Kiro - Video Editor Screen
// Handles video editing with trimming, filters, text, music, and export

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  videoEditorService,
  EditingSession,
  VideoFilter,
  VideoText,
  VideoExportOptions,
} from "../api/services/videoEditorService";

interface VideoEditorScreenProps {
  route?: any;
  navigation?: any;
}

const { width } = Dimensions.get("window");

// ✅ CREATED BY KIRO - Video Editor Screen Component
const VideoEditorScreen: React.FC<VideoEditorScreenProps> = ({ route, navigation }) => {
  const videoUri = route?.params?.videoUri || "";

  const [session, setSession] = useState<EditingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"trim" | "filter" | "text" | "music" | "export">(
    "trim"
  );

  // Trim state
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [filterValue, setFilterValue] = useState(50);

  // Text state
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");

  // Music state
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);

  // Export state
  const [exportQuality, setExportQuality] = useState<"low" | "medium" | "high">("medium");
  const [exportResolution, setExportResolution] = useState<"720p" | "1080p">("720p");

  // ✅ CREATED BY KIRO - Initialize editing session
  useEffect(() => {
    initializeSession();
  }, []);

  // ✅ CREATED BY KIRO - Create editing session
  const initializeSession = async () => {
    try {
      setLoading(true);
      const response = await videoEditorService.createEditingSession(videoUri);

      if (response.success && response.data) {
        setSession(response.data);
        setEndTime(response.data.duration);
        console.log("[VideoEditorScreen] Session created:", response.data.id);
      } else {
        Alert.alert("Error", response.message || "Failed to create editing session");
      }
    } catch (error) {
      console.error("[VideoEditorScreen] Session creation error:", error);
      Alert.alert("Error", "Failed to initialize video editor");
    } finally {
      setLoading(false);
    }
  };

  // ✅ CREATED BY KIRO - Handle trim video
  const handleTrimVideo = async () => {
    if (!session) return;

    try {
      setProcessing(true);
      const response = await videoEditorService.trimVideo(session.id, startTime, endTime);

      if (response.success) {
        Alert.alert("Success", "Video trimmed successfully");
      } else {
        Alert.alert("Error", response.message || "Failed to trim video");
      }
    } catch (error) {
      console.error("[VideoEditorScreen] Trim error:", error);
      Alert.alert("Error", "Failed to trim video");
    } finally {
      setProcessing(false);
    }
  };

  // ✅ CREATED BY KIRO - Handle apply filter
  const handleApplyFilter = async () => {
    if (!session || selectedFilter === "none") return;

    try {
      setProcessing(true);

      const filter: VideoFilter = {
        id: selectedFilter,
        name: selectedFilter,
        type: selectedFilter as any,
        value: filterValue,
      };

      const response = await videoEditorService.applyFilter(session.id, filter);

      if (response.success) {
        Alert.alert("Success", "Filter applied successfully");
      } else {
        Alert.alert("Error", response.message || "Failed to apply filter");
      }
    } catch (error) {
      console.error("[VideoEditorScreen] Filter error:", error);
      Alert.alert("Error", "Failed to apply filter");
    } finally {
      setProcessing(false);
    }
  };

  // ✅ CREATED BY KIRO - Handle add text overlay
  const handleAddText = async () => {
    if (!session || !textOverlay.trim()) {
      Alert.alert("Error", "Please enter text");
      return;
    }

    try {
      setProcessing(true);

      const text: VideoText = {
        id: `text_${Date.now()}`,
        text: textOverlay,
        fontSize: 24,
        color: textColor,
        position: "center",
        startTime: 0,
        endTime: session.duration,
      };

      const response = await videoEditorService.addTextOverlay(session.id, text);

      if (response.success) {
        Alert.alert("Success", "Text added successfully");
        setTextOverlay("");
      } else {
        Alert.alert("Error", response.message || "Failed to add text");
      }
    } catch (error) {
      console.error("[VideoEditorScreen] Text error:", error);
      Alert.alert("Error", "Failed to add text");
    } finally {
      setProcessing(false);
    }
  };

  // ✅ CREATED BY KIRO - Handle export video
  const handleExportVideo = async () => {
    if (!session) return;

    try {
      setProcessing(true);

      const options: VideoExportOptions = {
        quality: exportQuality,
        resolution: exportResolution,
        format: "mp4",
      };

      const response = await videoEditorService.exportVideo(session.id, options);

      if (response.success && response.data) {
        Alert.alert("Success", "Video exported successfully", [
          {
            text: "OK",
            onPress: () => {
              // Navigate back with exported video
              navigation?.navigate("ReelsScreen", {
                exportedVideoUri: response.data?.videoUri,
              });
            },
          },
        ]);
      } else {
        Alert.alert("Error", response.message || "Failed to export video");
      }
    } catch (error) {
      console.error("[VideoEditorScreen] Export error:", error);
      Alert.alert("Error", "Failed to export video");
    } finally {
      setProcessing(false);
    }
  };

  // ✅ CREATED BY KIRO - Render trim controls
  const renderTrimControls = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Trim Video</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Start Time: {startTime.toFixed(2)}s</Text>
        <View style={styles.slider}>
          <View style={[styles.sliderFill, { width: `${(startTime / (endTime || 1)) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>End Time: {endTime.toFixed(2)}s</Text>
        <View style={styles.slider}>
          <View
            style={[styles.sliderFill, { width: `${(endTime / (session?.duration || 1)) * 100}%` }]}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, processing && styles.buttonDisabled]}
        onPress={handleTrimVideo}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Apply Trim</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // ✅ CREATED BY KIRO - Render filter controls
  const renderFilterControls = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Apply Filters</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Select Filter</Text>
        <View style={styles.filterGrid}>
          {["none", "brightness", "contrast", "saturation", "grayscale", "sepia"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedFilter !== "none" && (
        <View style={styles.section}>
          <Text style={styles.label}>Intensity: {filterValue}%</Text>
          <View style={styles.slider}>
            <View style={[styles.sliderFill, { width: `${filterValue}%` }]} />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, processing && styles.buttonDisabled]}
        onPress={handleApplyFilter}
        disabled={processing || selectedFilter === "none"}
      >
        {processing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Apply Filter</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // ✅ CREATED BY KIRO - Render text controls
  const renderTextControls = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Add Text</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Text Content</Text>
        <View style={styles.input}>
          <Text style={styles.inputText}>{textOverlay || "Enter text..."}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Text Color</Text>
        <View style={styles.colorGrid}>
          {["#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00"].map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                textColor === color && styles.colorButtonActive,
              ]}
              onPress={() => setTextColor(color)}
            >
              {textColor === color && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, processing && styles.buttonDisabled]}
        onPress={handleAddText}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Add Text</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // ✅ CREATED BY KIRO - Render export controls
  const renderExportControls = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Export Video</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Quality</Text>
        <View style={styles.optionGrid}>
          {["low", "medium", "high"].map((quality) => (
            <TouchableOpacity
              key={quality}
              style={[styles.optionButton, exportQuality === quality && styles.optionButtonActive]}
              onPress={() => setExportQuality(quality as any)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  exportQuality === quality && styles.optionButtonTextActive,
                ]}
              >
                {quality.charAt(0).toUpperCase() + quality.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Resolution</Text>
        <View style={styles.optionGrid}>
          {["720p", "1080p"].map((resolution) => (
            <TouchableOpacity
              key={resolution}
              style={[
                styles.optionButton,
                exportResolution === resolution && styles.optionButtonActive,
              ]}
              onPress={() => setExportResolution(resolution as any)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  exportResolution === resolution && styles.optionButtonTextActive,
                ]}
              >
                {resolution}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.exportButton, processing && styles.buttonDisabled]}
        onPress={handleExportVideo}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Export Video</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // ✅ CREATED BY KIRO - Render loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing Video Editor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Video Editor</Text>
        <Text style={styles.subtitle}>Edit and enhance your video</Text>
      </View>

      {/* Video Preview */}
      {videoUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: videoUri }} style={styles.videoPreview} resizeMode="cover" />
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {["trim", "filter", "text", "music", "export"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === "trim" && renderTrimControls()}
      {activeTab === "filter" && renderFilterControls()}
      {activeTab === "text" && renderTextControls()}
      {activeTab === "music" && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Add Music</Text>
          <Text style={styles.comingSoonText}>Music feature coming soon...</Text>
        </View>
      )}
      {activeTab === "export" && renderExportControls()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  videoPreview: {
    width: "100%",
    height: "100%",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -24,
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  tabNavigation: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#007AFF",
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  slider: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#007AFF",
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  filterButton: {
    width: "48%",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#F9F9F9",
  },
  inputText: {
    fontSize: 14,
    color: "#666",
  },
  colorGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorButtonActive: {
    borderColor: "#000",
  },
  checkmark: {
    fontSize: 24,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 50,
  },
  optionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    marginHorizontal: 4,
  },
  optionButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  optionButtonTextActive: {
    color: "#FFFFFF",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  exportButton: {
    backgroundColor: "#4CAF50",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  comingSoonText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 32,
  },
});

export default VideoEditorScreen;
