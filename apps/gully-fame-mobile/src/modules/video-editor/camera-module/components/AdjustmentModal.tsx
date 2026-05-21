import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Image,
} from "react-native";
import { Video } from "expo-av";
import Slider from "@react-native-community/slider";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AdjustmentSettings {
  // Basic Adjustments
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;

  // White Balance
  temperature: number;
  tint: number;

  // HSL (Hue, Saturation, Lightness)
  hue: number;

  // Advanced
  clarity: number;
  vibrance: number;
  vignette: number;
  grain: number;

  // Color Wheels (Shadows, Midtones, Highlights)
  shadowsColor: { r: number; g: number; b: number };
  midtonesColor: { r: number; g: number; b: number };
  highlightsColor: { r: number; g: number; b: number };
}

interface AdjustmentModalProps {
  visible: boolean;
  initialSettings?: Partial<AdjustmentSettings>;
  onSave: (settings: AdjustmentSettings) => void;
  onClose: () => void;
  previewUri?: string; // Add preview URI
  previewType?: "image" | "video"; // Add preview type
}

/**
 * Advanced Adjustment Modal for professional video/photo editing
 * Similar to Lightroom, VSCO, and professional editing apps
 */
const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  visible,
  initialSettings = {},
  onSave,
  onClose,
  previewUri,
  previewType = "image",
}) => {
  console.log("=== AdjustmentModal render ===");
  console.log("visible prop:", visible);
  console.log("previewUri:", previewUri);
  console.log("previewType:", previewType);
  const defaultSettings: AdjustmentSettings = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0,
    hue: 0,
    clarity: 0,
    vibrance: 0,
    vignette: 0,
    grain: 0,
    shadowsColor: { r: 0, g: 0, b: 0 },
    midtonesColor: { r: 0, g: 0, b: 0 },
    highlightsColor: { r: 0, g: 0, b: 0 },
  };

  const [settings, setSettings] = useState<AdjustmentSettings>({
    ...defaultSettings,
    ...initialSettings,
  });

  const [activeTab, setActiveTab] = useState<"basic" | "wb" | "hsl" | "advanced" | "wheels">(
    "basic"
  );

  const updateSetting = useCallback((key: keyof AdjustmentSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const handleSave = useCallback(() => {
    onSave(settings);
    onClose();
  }, [settings, onSave, onClose]);

  const tabs = [
    { key: "basic", label: "Basic", icon: "adjust" },
    { key: "wb", label: "WB", icon: "thermometer" },
    { key: "hsl", label: "HSL", icon: "palette" },
    { key: "advanced", label: "Advanced", icon: "settings" },
    { key: "wheels", label: "Wheels", icon: "circle" },
  ] as const;

  const renderSlider = (
    label: string,
    value: number,
    onValueChange: (value: number) => void,
    min: number = -100,
    max: number = 100,
    step: number = 1
  ) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value > 0 ? `+${value}` : value}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        value={value}
        onValueChange={onValueChange}
        step={step}
        minimumTrackTintColor="#ec9a15"
        maximumTrackTintColor="rgba(255,255,255,0.3)"
        thumbStyle={styles.sliderThumb}
      />
      <View style={styles.sliderMarks}>
        <Text style={styles.sliderMark}>{min}</Text>
        <Text style={styles.sliderMark}>0</Text>
        <Text style={styles.sliderMark}>{max}</Text>
      </View>
    </View>
  );

  const renderColorWheel = (
    title: string,
    color: { r: number; g: number; b: number },
    onColorChange: (color: { r: number; g: number; b: number }) => void
  ) => (
    <View style={styles.colorWheelContainer}>
      <Text style={styles.colorWheelTitle}>{title}</Text>
      <View style={styles.colorWheel}>
        {/* Simplified color wheel - in production, use a proper color picker */}
        <View style={styles.colorGrid}>
          {[-50, -25, 0, 25, 50].map((r) =>
            [-50, -25, 0, 25, 50].map((g) => {
              const b = 0; // Simplified for demo
              const isSelected = color.r === r && color.g === g && color.b === b;
              return (
                <TouchableOpacity
                  key={`${r}-${g}-${b}`}
                  style={[
                    styles.colorSwatch,
                    {
                      backgroundColor: `rgb(${128 + r}, ${128 + g}, ${128 + b})`,
                    },
                    isSelected && styles.colorSwatchSelected,
                  ]}
                  onPress={() => onColorChange({ r, g, b })}
                />
              );
            })
          )}
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        console.log("=== AdjustmentModal onRequestClose ===");
        onClose();
      }}
    >
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
          <Text style={styles.headerTitle}>Adjustments</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={resetSettings} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content - Split Screen Layout */}
        <View style={styles.splitContainer}>
          {/* Preview Section - Always show */}
          <View style={styles.previewSection}>
            {previewUri ? (
              previewType === "video" ? (
                <Video
                  source={{ uri: previewUri }}
                  style={styles.previewMedia}
                  resizeMode="contain"
                  shouldPlay={false}
                  isLooping={true}
                />
              ) : (
                <Image
                  source={{ uri: previewUri }}
                  style={styles.previewMedia}
                  resizeMode="contain"
                />
              )
            ) : (
              <View style={styles.previewPlaceholder}>
                <Text style={styles.previewPlaceholderText}>Preview</Text>
              </View>
            )}
            <View style={styles.previewOverlay}>
              <Text style={styles.previewLabel}>
                {previewType === "video" ? "Video Preview" : "Photo Preview"}
              </Text>
            </View>
          </View>

          {/* Controls Section */}
          <View style={styles.controlsSection}>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Scrollable Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {activeTab === "basic" && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionTitle}>Basic Adjustments</Text>
                  {renderSlider("Brightness", settings.brightness, (value) =>
                    updateSetting("brightness", Math.round(value))
                  )}
                  {renderSlider("Contrast", settings.contrast, (value) =>
                    updateSetting("contrast", Math.round(value))
                  )}
                  {renderSlider("Saturation", settings.saturation, (value) =>
                    updateSetting("saturation", Math.round(value))
                  )}
                  {renderSlider("Exposure", settings.exposure, (value) =>
                    updateSetting("exposure", Math.round(value))
                  )}
                  {renderSlider("Highlights", settings.highlights, (value) =>
                    updateSetting("highlights", Math.round(value))
                  )}
                  {renderSlider("Shadows", settings.shadows, (value) =>
                    updateSetting("shadows", Math.round(value))
                  )}
                </View>
              )}

              {activeTab === "wb" && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionTitle}>White Balance</Text>
                  {renderSlider(
                    "Temperature",
                    settings.temperature,
                    (value) => updateSetting("temperature", Math.round(value)),
                    -100,
                    100
                  )}
                  {renderSlider(
                    "Tint",
                    settings.tint,
                    (value) => updateSetting("tint", Math.round(value)),
                    -100,
                    100
                  )}

                  <View style={styles.wbPresets}>
                    <Text style={styles.presetsTitle}>Presets</Text>
                    <View style={styles.presetsRow}>
                      {[
                        { name: "Auto", temp: 0, tint: 0 },
                        { name: "Daylight", temp: 10, tint: 5 },
                        { name: "Cloudy", temp: 20, tint: 10 },
                        { name: "Shade", temp: 30, tint: 15 },
                        { name: "Tungsten", temp: -40, tint: -10 },
                        { name: "Fluorescent", temp: -20, tint: 20 },
                      ].map((preset) => (
                        <TouchableOpacity
                          key={preset.name}
                          style={styles.presetButton}
                          onPress={() => {
                            updateSetting("temperature", preset.temp);
                            updateSetting("tint", preset.tint);
                          }}
                        >
                          <Text style={styles.presetButtonText}>{preset.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {activeTab === "hsl" && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionTitle}>HSL Adjustments</Text>
                  {renderSlider(
                    "Hue",
                    settings.hue,
                    (value) => updateSetting("hue", Math.round(value)),
                    -180,
                    180
                  )}
                  {renderSlider("Saturation", settings.saturation, (value) =>
                    updateSetting("saturation", Math.round(value))
                  )}
                  {renderSlider("Vibrance", settings.vibrance, (value) =>
                    updateSetting("vibrance", Math.round(value))
                  )}

                  {/* HSL Color Ranges */}
                  <View style={styles.hslRanges}>
                    <Text style={styles.presetsTitle}>Color Ranges</Text>
                    <View style={styles.colorRanges}>
                      {[
                        "Reds",
                        "Oranges",
                        "Yellows",
                        "Greens",
                        "Cyans",
                        "Blues",
                        "Purples",
                        "Magentas",
                      ].map((color) => (
                        <TouchableOpacity key={color} style={styles.colorRangeButton}>
                          <Text style={styles.colorRangeText}>{color}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {activeTab === "advanced" && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionTitle}>Advanced Controls</Text>
                  {renderSlider("Clarity", settings.clarity, (value) =>
                    updateSetting("clarity", Math.round(value))
                  )}
                  {renderSlider("Vibrance", settings.vibrance, (value) =>
                    updateSetting("vibrance", Math.round(value))
                  )}
                  {renderSlider("Vignette", settings.vignette, (value) =>
                    updateSetting("vignette", Math.round(value))
                  )}
                  {renderSlider(
                    "Grain",
                    settings.grain,
                    (value) => updateSetting("grain", Math.round(value)),
                    0,
                    100
                  )}

                  <View style={styles.advancedSection}>
                    <Text style={styles.presetsTitle}>Style Presets</Text>
                    <View style={styles.stylePresets}>
                      {[
                        { name: "Natural", settings: { clarity: 10, vibrance: 15, vignette: -10 } },
                        { name: "Vivid", settings: { saturation: 25, vibrance: 30, contrast: 15 } },
                        {
                          name: "Dramatic",
                          settings: { contrast: 30, clarity: 25, vignette: -25 },
                        },
                        {
                          name: "Vintage",
                          settings: { temperature: -15, grain: 20, vignette: -20 },
                        },
                        { name: "B&W", settings: { saturation: -100, contrast: 20, clarity: 15 } },
                      ].map((preset) => (
                        <TouchableOpacity
                          key={preset.name}
                          style={styles.stylePresetButton}
                          onPress={() => {
                            Object.entries(preset.settings).forEach(([key, value]) => {
                              updateSetting(key as keyof AdjustmentSettings, value);
                            });
                          }}
                        >
                          <Text style={styles.stylePresetText}>{preset.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {activeTab === "wheels" && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionTitle}>Color Wheels</Text>
                  {renderColorWheel("Shadows", settings.shadowsColor, (color) =>
                    updateSetting("shadowsColor", color)
                  )}
                  {renderColorWheel("Midtones", settings.midtonesColor, (color) =>
                    updateSetting("midtonesColor", color)
                  )}
                  {renderColorWheel("Highlights", settings.highlightsColor, (color) =>
                    updateSetting("highlightsColor", color)
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  resetButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
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
  splitContainer: {
    flex: 1,
    flexDirection: "row",
  },
  previewSection: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    position: "relative",
  },
  previewMedia: {
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewLabel: {
    color: "#ec9a15",
    fontSize: 12,
    fontWeight: "600",
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  previewPlaceholderText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 16,
    fontWeight: "600",
  },
  controlsSection: {
    flex: 1,
    backgroundColor: "#000000",
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#ec9a15",
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#ec9a15",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
  },
  sliderContainer: {
    marginBottom: 32,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sliderLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  sliderValue: {
    color: "#ec9a15",
    fontSize: 16,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "right",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderThumb: {
    backgroundColor: "#ec9a15",
    width: 20,
    height: 20,
  },
  sliderMarks: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sliderMark: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
  },
  wbPresets: {
    marginTop: 32,
  },
  presetsTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  presetButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  hslRanges: {
    marginTop: 32,
  },
  colorRanges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorRangeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  colorRangeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  advancedSection: {
    marginTop: 32,
  },
  stylePresets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  stylePresetButton: {
    backgroundColor: "rgba(236, 154, 21, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
    minWidth: 80,
    alignItems: "center",
  },
  stylePresetText: {
    color: "#ec9a15",
    fontSize: 14,
    fontWeight: "600",
  },
  colorWheelContainer: {
    marginBottom: 32,
  },
  colorWheelTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  colorWheel: {
    alignItems: "center",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 150,
    height: 150,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: {
    borderColor: "#ec9a15",
    transform: [{ scale: 1.2 }],
  },
});

export default AdjustmentModal;
