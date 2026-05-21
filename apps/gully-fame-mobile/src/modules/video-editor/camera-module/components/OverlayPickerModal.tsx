import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";

interface OverlayItem {
  id: string;
  type: "image" | "video";
  uri: string;
  name?: string;
}

interface OverlayPickerModalProps {
  visible: boolean;
  onSelect: (overlay: OverlayItem) => void;
  onClose: () => void;
}

// Predefined overlay shapes and effects
const OVERLAY_SHAPES = [
  { id: "circle", name: "Circle", emoji: "⭕" },
  { id: "square", name: "Square", emoji: "⬜" },
  { id: "heart", name: "Heart", emoji: "❤️" },
  { id: "star", name: "Star", emoji: "⭐" },
  { id: "arrow", name: "Arrow", emoji: "➡️" },
  { id: "check", name: "Check", emoji: "✅" },
];

const OVERLAY_EFFECTS = [
  { id: "blur", name: "Blur", emoji: "🌫️" },
  { id: "vignette", name: "Vignette", emoji: "🎭" },
  { id: "light-leak", name: "Light Leak", emoji: "✨" },
  { id: "grain", name: "Film Grain", emoji: "📽️" },
];

/**
 * Overlay Picker Modal for adding overlays to videos
 * Supports images, shapes, and effects
 */
const OverlayPickerModal: React.FC<OverlayPickerModalProps> = ({ visible, onSelect, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<"shapes" | "effects" | "custom">("shapes");

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const overlay: OverlayItem = {
          id: `overlay-${Date.now()}`,
          type: "image",
          uri: asset.uri,
          name: "Custom Image",
        };
        console.log("Selected custom overlay:", overlay);
        onSelect(overlay);
        onClose();
      }
    } catch (error) {
      console.error("Error picking overlay image:", error);
    }
  }, [onSelect, onClose]);

  const handleShapeSelect = useCallback(
    (shape: { id: string; name: string; emoji: string }) => {
      const overlay: OverlayItem = {
        id: `shape-${shape.id}-${Date.now()}`,
        type: "image",
        uri: shape.emoji, // Using emoji as placeholder
        name: shape.name,
      };
      console.log("Selected shape overlay:", overlay);
      onSelect(overlay);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleEffectSelect = useCallback(
    (effect: { id: string; name: string; emoji: string }) => {
      const overlay: OverlayItem = {
        id: `effect-${effect.id}-${Date.now()}`,
        type: "image",
        uri: effect.emoji, // Use emoji instead of effect.id
        name: effect.name,
      };
      console.log("Selected effect overlay:", overlay);
      onSelect(overlay);
      onClose();
    },
    [onSelect, onClose]
  );

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
          <Text style={styles.headerTitle}>Add Overlay</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "shapes" && styles.tabActive]}
            onPress={() => setSelectedTab("shapes")}
          >
            <Text style={[styles.tabText, selectedTab === "shapes" && styles.tabTextActive]}>
              Shapes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "effects" && styles.tabActive]}
            onPress={() => setSelectedTab("effects")}
          >
            <Text style={[styles.tabText, selectedTab === "effects" && styles.tabTextActive]}>
              Effects
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "custom" && styles.tabActive]}
            onPress={() => setSelectedTab("custom")}
          >
            <Text style={[styles.tabText, selectedTab === "custom" && styles.tabTextActive]}>
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Shapes Tab */}
          {selectedTab === "shapes" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose a Shape</Text>
              <View style={styles.grid}>
                {OVERLAY_SHAPES.map((shape) => (
                  <TouchableOpacity
                    key={shape.id}
                    style={styles.gridItem}
                    onPress={() => handleShapeSelect(shape)}
                  >
                    <View style={styles.gridItemIcon}>
                      <Text style={styles.gridItemEmoji}>{shape.emoji}</Text>
                    </View>
                    <Text style={styles.gridItemName}>{shape.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Effects Tab */}
          {selectedTab === "effects" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose an Effect</Text>
              <View style={styles.grid}>
                {OVERLAY_EFFECTS.map((effect) => (
                  <TouchableOpacity
                    key={effect.id}
                    style={styles.gridItem}
                    onPress={() => handleEffectSelect(effect)}
                  >
                    <View style={styles.gridItemIcon}>
                      <Text style={styles.gridItemEmoji}>{effect.emoji}</Text>
                    </View>
                    <Text style={styles.gridItemName}>{effect.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Custom Tab */}
          {selectedTab === "custom" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Custom Overlay</Text>
              <TouchableOpacity style={styles.customButton} onPress={handlePickImage}>
                <View style={styles.customIconContainer}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                      stroke="#ec9a15"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={styles.customButtonTitle}>Upload Image</Text>
                <Text style={styles.customButtonSubtitle}>Choose an image from your gallery</Text>
              </TouchableOpacity>

              <View style={styles.infoContainer}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                    stroke="#ec9a15"
                    strokeWidth="2"
                  />
                  <Path
                    d="M12 16v-4M12 8h.01"
                    stroke="#ec9a15"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </Svg>
                <Text style={styles.infoText}>
                  Tip: Use PNG images with transparency for best results
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
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
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#ec9a15",
  },
  tabText: {
    color: "#888888",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  gridItem: {
    width: "30%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gridItemIcon: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gridItemEmoji: {
    fontSize: 40,
  },
  gridItemName: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  customButton: {
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(236, 154, 21, 0.3)",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  customIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(236, 154, 21, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  customButtonTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  customButtonSubtitle: {
    color: "#888888",
    fontSize: 14,
    textAlign: "center",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.2)",
  },
  infoText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
});

export default OverlayPickerModal;
