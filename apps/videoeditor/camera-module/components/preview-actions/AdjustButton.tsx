import React, { useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  Slider,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import type { AdjustSettings } from "../../types/voiceOverlay.types";

interface AdjustButtonProps {
  onPress?: () => void;
  onAdjustChange?: (settings: AdjustSettings) => void;
  currentSettings?: AdjustSettings;
}

const DEFAULT_SETTINGS: AdjustSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
  blur: 0,
};

const AdjustButton: React.FC<AdjustButtonProps> = ({
  onPress,
  onAdjustChange,
  currentSettings = DEFAULT_SETTINGS,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [settings, setSettings] = useState<AdjustSettings>(currentSettings);

  const handleSettingChange = (key: keyof AdjustSettings, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onAdjustChange?.(newSettings);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    onAdjustChange?.(DEFAULT_SETTINGS);
  };

  const adjustments = [
    { key: "brightness" as const, label: "Brightness", min: -100, max: 100 },
    { key: "contrast" as const, label: "Contrast", min: -100, max: 100 },
    { key: "saturation" as const, label: "Saturation", min: -100, max: 100 },
    { key: "hue" as const, label: "Hue", min: -180, max: 180 },
    { key: "temperature" as const, label: "Temperature", min: -50, max: 50 },
    { key: "tint" as const, label: "Tint", min: -50, max: 50 },
    { key: "sharpness" as const, label: "Sharpness", min: -100, max: 100 },
    { key: "blur" as const, label: "Blur", min: 0, max: 100 },
  ];

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm0 9c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"
            fill="#ffffff"
          />
        </Svg>
        <Text style={styles.buttonText}>Adjust</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Adjust</Text>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Adjustments */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {adjustments.map((adj) => (
              <View key={adj.key} style={styles.adjustmentRow}>
                <View style={styles.adjustmentHeader}>
                  <Text style={styles.adjustmentLabel}>{adj.label}</Text>
                  <Text style={styles.adjustmentValue}>{settings[adj.key].toFixed(0)}</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={adj.min}
                  maximumValue={adj.max}
                  value={settings[adj.key]}
                  onValueChange={(value) => handleSettingChange(adj.key, value)}
                  minimumTrackTintColor="#ec9a15"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                  thumbTintColor="#ec9a15"
                />
              </View>
            ))}

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Adjust the video properties to enhance your footage. Changes are applied in
                real-time.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    gap: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 68, 68, 0.2)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.4)",
  },
  resetButtonText: {
    color: "#ff4444",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  adjustmentRow: {
    marginBottom: 24,
  },
  adjustmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  adjustmentLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  adjustmentValue: {
    color: "#ec9a15",
    fontSize: 14,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "right",
  },
  slider: {
    height: 40,
    borderRadius: 20,
  },
  infoBox: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    lineHeight: 18,
  },
});

export default AdjustButton;
