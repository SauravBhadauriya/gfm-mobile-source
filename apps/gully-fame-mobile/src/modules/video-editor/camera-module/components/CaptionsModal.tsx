import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Switch,
} from "react-native";
import Svg, { Path } from "react-native-svg";

interface Caption {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style: CaptionStyle;
}

interface CaptionStyle {
  fontSize: number;
  color: string;
  backgroundColor?: string;
  fontWeight: "normal" | "bold";
  position: "top" | "center" | "bottom";
  animation?: "none" | "typewriter" | "fade" | "slide";
}

interface CaptionsModalProps {
  visible: boolean;
  onSave: (captions: Caption[]) => void;
  onClose: () => void;
  videoDuration?: number;
}

/**
 * Captions Modal for adding subtitles/captions to videos
 * Similar to Instagram and TikTok caption features
 */
const CaptionsModal: React.FC<CaptionsModalProps> = ({
  visible,
  onSave,
  onClose,
  videoDuration = 30,
}) => {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(false);

  // Default caption style
  const defaultStyle: CaptionStyle = {
    fontSize: 24,
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    fontWeight: "bold",
    position: "bottom",
    animation: "none",
  };

  const handleAddCaption = useCallback(() => {
    const newCaption: Caption = {
      id: `caption-${Date.now()}`,
      text: "",
      startTime: 0,
      endTime: 3,
      style: { ...defaultStyle },
    };
    setCurrentCaption(newCaption);
    setIsEditing(true);
  }, []);

  const handleEditCaption = useCallback((caption: Caption) => {
    setCurrentCaption(caption);
    setIsEditing(true);
  }, []);

  const handleSaveCaption = useCallback(() => {
    if (currentCaption && currentCaption.text.trim()) {
      const existingIndex = captions.findIndex((c) => c.id === currentCaption.id);

      if (existingIndex >= 0) {
        // Update existing
        const updatedCaptions = [...captions];
        updatedCaptions[existingIndex] = currentCaption;
        setCaptions(updatedCaptions);
      } else {
        // Add new
        setCaptions((prev) => [...prev, currentCaption]);
      }
    }

    setCurrentCaption(null);
    setIsEditing(false);
  }, [currentCaption, captions]);

  const handleDeleteCaption = useCallback((captionId: string) => {
    setCaptions((prev) => prev.filter((c) => c.id !== captionId));
  }, []);

  const handleAutoGenerate = useCallback(async () => {
    // TODO: Implement auto-generation using speech-to-text
    // For now, create sample captions
    const sampleCaptions: Caption[] = [
      {
        id: "auto-1",
        text: "Welcome to our video!",
        startTime: 0,
        endTime: 3,
        style: { ...defaultStyle },
      },
      {
        id: "auto-2",
        text: "This is automatically generated caption",
        startTime: 3,
        endTime: 6,
        style: { ...defaultStyle },
      },
      {
        id: "auto-3",
        text: "You can edit or delete these captions",
        startTime: 6,
        endTime: 9,
        style: { ...defaultStyle },
      },
    ];

    setCaptions(sampleCaptions);
  }, []);

  const handleSaveAll = useCallback(() => {
    onSave(captions);
    onClose();
  }, [captions, onSave, onClose]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const COLORS = [
    "#ffffff",
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#ffa500",
    "#800080",
  ];

  const POSITIONS = [
    { key: "top", label: "Top" },
    { key: "center", label: "Center" },
    { key: "bottom", label: "Bottom" },
  ] as const;

  const ANIMATIONS = [
    { key: "none", label: "None" },
    { key: "typewriter", label: "Typewriter" },
    { key: "fade", label: "Fade In" },
    { key: "slide", label: "Slide Up" },
  ] as const;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
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
          <Text style={styles.headerTitle}>Captions</Text>
          <TouchableOpacity onPress={handleSaveAll} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {!isEditing ? (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Auto Generate Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Auto Generate</Text>
                <Switch
                  value={autoGenerate}
                  onValueChange={setAutoGenerate}
                  trackColor={{ false: "#767577", true: "#ec9a15" }}
                  thumbColor={autoGenerate ? "#ffffff" : "#f4f3f4"}
                />
              </View>

              {autoGenerate && (
                <TouchableOpacity style={styles.autoGenerateButton} onPress={handleAutoGenerate}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.autoGenerateText}>Generate Captions from Audio</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Manual Captions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Manual Captions ({captions.length})</Text>
                <TouchableOpacity onPress={handleAddCaption} style={styles.addButton}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 5v14M5 12h14"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              {captions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No captions added yet</Text>
                  <Text style={styles.emptySubtext}>Tap + to add your first caption</Text>
                </View>
              ) : (
                <View style={styles.captionsList}>
                  {captions.map((caption, index) => (
                    <View key={caption.id} style={styles.captionItem}>
                      <View style={styles.captionHeader}>
                        <Text style={styles.captionIndex}>#{index + 1}</Text>
                        <Text style={styles.captionTime}>
                          {formatTime(caption.startTime)} - {formatTime(caption.endTime)}
                        </Text>
                        <View style={styles.captionActions}>
                          <TouchableOpacity
                            onPress={() => handleEditCaption(caption)}
                            style={styles.editButton}
                          >
                            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                stroke="#ec9a15"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <Path
                                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                stroke="#ec9a15"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteCaption(caption.id)}
                            style={styles.deleteButton}
                          >
                            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M18 6L6 18M6 6l12 12"
                                stroke="#ff4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.captionText} numberOfLines={2}>
                        {caption.text}
                      </Text>
                      <View style={styles.captionStyle}>
                        <View
                          style={[styles.stylePreview, { backgroundColor: caption.style.color }]}
                        />
                        <Text style={styles.styleText}>
                          {caption.style.position} • {caption.style.fontSize}px •{" "}
                          {caption.style.animation}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Caption Tips:</Text>
              <Text style={styles.tipText}>• Keep captions short and readable</Text>
              <Text style={styles.tipText}>• Use high contrast colors</Text>
              <Text style={styles.tipText}>• Time captions with speech</Text>
              <Text style={styles.tipText}>• Test readability on small screens</Text>
            </View>
          </ScrollView>
        ) : (
          /* Caption Editor */
          <ScrollView style={styles.editor} showsVerticalScrollIndicator={false}>
            <View style={styles.editorSection}>
              <Text style={styles.editorTitle}>Edit Caption</Text>

              {/* Text Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Caption Text</Text>
                <TextInput
                  style={styles.textInput}
                  value={currentCaption?.text || ""}
                  onChangeText={(text) =>
                    setCurrentCaption((prev) => (prev ? { ...prev, text } : null))
                  }
                  placeholder="Enter caption text..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  multiline
                  maxLength={100}
                />
              </View>

              {/* Timing */}
              <View style={styles.timingSection}>
                <View style={styles.timeInput}>
                  <Text style={styles.inputLabel}>Start Time (seconds)</Text>
                  <TextInput
                    style={styles.timeTextInput}
                    value={currentCaption?.startTime.toString() || "0"}
                    onChangeText={(text) => {
                      const time = Math.max(0, Math.min(parseFloat(text) || 0, videoDuration));
                      setCurrentCaption((prev) => (prev ? { ...prev, startTime: time } : null));
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.timeInput}>
                  <Text style={styles.inputLabel}>End Time (seconds)</Text>
                  <TextInput
                    style={styles.timeTextInput}
                    value={currentCaption?.endTime.toString() || "3"}
                    onChangeText={(text) => {
                      const time = Math.max(0, Math.min(parseFloat(text) || 3, videoDuration));
                      setCurrentCaption((prev) => (prev ? { ...prev, endTime: time } : null));
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Style Options */}
              <View style={styles.styleSection}>
                <Text style={styles.inputLabel}>Text Color</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.colorRow}
                >
                  {COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        currentCaption?.style.color === color && styles.colorButtonActive,
                      ]}
                      onPress={() =>
                        setCurrentCaption((prev) =>
                          prev ? { ...prev, style: { ...prev.style, color } } : null
                        )
                      }
                    />
                  ))}
                </ScrollView>
              </View>

              <View style={styles.styleSection}>
                <Text style={styles.inputLabel}>Position</Text>
                <View style={styles.optionsRow}>
                  {POSITIONS.map((position) => (
                    <TouchableOpacity
                      key={position.key}
                      style={[
                        styles.optionButton,
                        currentCaption?.style.position === position.key &&
                          styles.optionButtonActive,
                      ]}
                      onPress={() =>
                        setCurrentCaption((prev) =>
                          prev
                            ? { ...prev, style: { ...prev.style, position: position.key } }
                            : null
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          currentCaption?.style.position === position.key &&
                            styles.optionButtonTextActive,
                        ]}
                      >
                        {position.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.styleSection}>
                <Text style={styles.inputLabel}>Animation</Text>
                <View style={styles.optionsRow}>
                  {ANIMATIONS.map((animation) => (
                    <TouchableOpacity
                      key={animation.key}
                      style={[
                        styles.optionButton,
                        currentCaption?.style.animation === animation.key &&
                          styles.optionButtonActive,
                      ]}
                      onPress={() =>
                        setCurrentCaption((prev) =>
                          prev
                            ? { ...prev, style: { ...prev.style, animation: animation.key } }
                            : null
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          currentCaption?.style.animation === animation.key &&
                            styles.optionButtonTextActive,
                        ]}
                      >
                        {animation.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Preview */}
              {currentCaption?.text && (
                <View style={styles.previewSection}>
                  <Text style={styles.inputLabel}>Preview</Text>
                  <View style={styles.previewContainer}>
                    <Text
                      style={[
                        styles.previewText,
                        {
                          color: currentCaption.style.color,
                          fontSize: currentCaption.style.fontSize,
                          fontWeight: currentCaption.style.fontWeight,
                          backgroundColor: currentCaption.style.backgroundColor,
                        },
                      ]}
                    >
                      {currentCaption.text}
                    </Text>
                  </View>
                </View>
              )}

              {/* Actions */}
              <View style={styles.editorActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setCurrentCaption(null);
                    setIsEditing(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveCaption}>
                  <Text style={styles.saveButtonText}>Save Caption</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#ec9a15",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ec9a15",
    justifyContent: "center",
    alignItems: "center",
  },
  autoGenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(236, 154, 21, 0.2)",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
  },
  autoGenerateText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#888888",
    fontSize: 14,
  },
  captionsList: {
    gap: 12,
  },
  captionItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  captionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  captionIndex: {
    color: "#ec9a15",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 8,
  },
  captionTime: {
    color: "#888888",
    fontSize: 12,
    flex: 1,
  },
  captionActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  captionText: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 8,
  },
  captionStyle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stylePreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  styleText: {
    color: "#888888",
    fontSize: 12,
  },
  tipsContainer: {
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.2)",
  },
  tipsTitle: {
    color: "#ec9a15",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  tipText: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  editor: {
    flex: 1,
    paddingHorizontal: 16,
  },
  editorSection: {
    paddingVertical: 16,
  },
  editorTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    color: "#ffffff",
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  timingSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  timeInput: {
    flex: 1,
  },
  timeTextInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  styleSection: {
    marginBottom: 24,
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
    marginRight: 12,
  },
  colorButtonActive: {
    borderColor: "#ec9a15",
    transform: [{ scale: 1.1 }],
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
  },
  optionButtonActive: {
    backgroundColor: "#ec9a15",
    borderColor: "#ec9a15",
  },
  optionButtonText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "600",
  },
  optionButtonTextActive: {
    color: "#ffffff",
  },
  previewSection: {
    marginBottom: 24,
  },
  previewContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  previewText: {
    textAlign: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editorActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CaptionsModal;
