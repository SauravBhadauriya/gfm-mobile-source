import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import type { TextOverlay, TextAlign, FontWeight } from "../types/textOverlay.types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TextEditorModalProps {
  visible: boolean;
  overlay: TextOverlay | null;
  onSave: (overlay: TextOverlay) => void;
  onDelete?: (overlayId: string) => void;
  onClose: () => void;
  containerWidth: number;
  containerHeight: number;
}

const COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#FFD700",
  "#808080",
  "#FF1493",
  "#00CED1",
];

const FONT_SIZES = [12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];

/**
 * Beautiful text editor modal for creating/editing text overlays
 */
const TextEditorModal: React.FC<TextEditorModalProps> = ({
  visible,
  overlay,
  onSave,
  onDelete,
  onClose,
  containerWidth,
  containerHeight,
}) => {
  const [text, setText] = useState(overlay?.text || "");
  const [fontSize, setFontSize] = useState(overlay?.fontSize || 24);
  const [fontWeight, setFontWeight] = useState<FontWeight>(overlay?.fontWeight || "normal");
  const [color, setColor] = useState(overlay?.color || "#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState(overlay?.backgroundColor || "");
  const [textAlign, setTextAlign] = useState<TextAlign>(overlay?.textAlign || "center");
  const [rotation, setRotation] = useState(overlay?.rotation || 0);
  const [opacity, setOpacity] = useState(overlay?.opacity ?? 1);
  const [strokeColor, setStrokeColor] = useState(overlay?.strokeColor || "");
  const [strokeWidth, setStrokeWidth] = useState(overlay?.strokeWidth || 0);
  const [x, setX] = useState(overlay?.x ?? 0.5);
  const [y, setY] = useState(overlay?.y ?? 0.5);

  // Use refs to store latest values for callbacks
  const textRef = useRef(text);
  const fontSizeRef = useRef(fontSize);
  const fontWeightRef = useRef(fontWeight);
  const colorRef = useRef(color);
  const backgroundColorRef = useRef(backgroundColor);
  const textAlignRef = useRef(textAlign);
  const rotationRef = useRef(rotation);
  const opacityRef = useRef(opacity);
  const strokeColorRef = useRef(strokeColor);
  const strokeWidthRef = useRef(strokeWidth);
  const xRef = useRef(x);
  const yRef = useRef(y);
  const overlayRef = useRef(overlay);
  const onSaveRef = useRef(onSave);
  const onCloseRef = useRef(onClose);

  // Update refs whenever values change
  useEffect(() => {
    textRef.current = text;
    fontSizeRef.current = fontSize;
    fontWeightRef.current = fontWeight;
    colorRef.current = color;
    backgroundColorRef.current = backgroundColor;
    textAlignRef.current = textAlign;
    rotationRef.current = rotation;
    opacityRef.current = opacity;
    strokeColorRef.current = strokeColor;
    strokeWidthRef.current = strokeWidth;
    xRef.current = x;
    yRef.current = y;
    overlayRef.current = overlay;
    onSaveRef.current = onSave;
    onCloseRef.current = onClose;
  }, [
    text,
    fontSize,
    fontWeight,
    color,
    backgroundColor,
    textAlign,
    rotation,
    opacity,
    strokeColor,
    strokeWidth,
    x,
    y,
    overlay,
    onSave,
    onClose,
  ]);

  // Reset state when overlay changes
  React.useEffect(() => {
    if (overlay) {
      setText(overlay.text || "");
      setFontSize(overlay.fontSize || 24);
      setFontWeight(overlay.fontWeight || "normal");
      setColor(overlay.color || "#FFFFFF");
      setBackgroundColor(overlay.backgroundColor || "");
      setTextAlign(overlay.textAlign || "center");
      setRotation(overlay.rotation || 0);
      setOpacity(overlay.opacity ?? 1);
      setStrokeColor(overlay.strokeColor || "");
      setStrokeWidth(overlay.strokeWidth || 0);
      setX(overlay.x ?? 0.5);
      setY(overlay.y ?? 0.5);
    } else {
      // Reset to defaults for new overlay
      setText("");
      setFontSize(24);
      setFontWeight("normal");
      setColor("#FFFFFF");
      setBackgroundColor("");
      setTextAlign("center");
      setRotation(0);
      setOpacity(1);
      setStrokeColor("");
      setStrokeWidth(0);
      setX(0.5);
      setY(0.5);
    }
  }, [overlay]);

  const handleSave = useCallback(() => {
    console.log("=== TextEditorModal handleSave CALLED ===");
    console.log("Text value:", textRef.current);
    console.log("onSave callback exists:", !!onSaveRef.current);
    console.log("onClose callback exists:", !!onCloseRef.current);

    if (!textRef.current.trim()) {
      console.log("Text is empty, closing modal");
      onCloseRef.current();
      return;
    }

    const updatedOverlay: TextOverlay = {
      id: overlayRef.current?.id || `text-${Date.now()}`,
      text: textRef.current.trim(),
      x: xRef.current,
      y: yRef.current,
      fontSize: fontSizeRef.current,
      fontWeight: fontWeightRef.current,
      color: colorRef.current,
      textAlign: textAlignRef.current,
      rotation: rotationRef.current,
      opacity: opacityRef.current,
      startTime: overlayRef.current?.startTime,
      endTime: overlayRef.current?.endTime,
      ...(backgroundColorRef.current ? { backgroundColor: backgroundColorRef.current } : {}),
      ...(strokeColorRef.current && strokeWidthRef.current > 0
        ? { strokeColor: strokeColorRef.current, strokeWidth: strokeWidthRef.current }
        : {}),
    };

    console.log("=== Calling onSave with overlay ===", updatedOverlay);
    onSaveRef.current(updatedOverlay);
    console.log("=== onSave completed, calling onClose ===");
    onCloseRef.current();
  }, []);

  const handleDelete = useCallback(() => {
    if (overlay?.id && onDelete) {
      onDelete(overlay.id);
    }
    onClose();
  }, [overlay, onDelete, onClose]);

  const previewOverlay: TextOverlay = {
    id: "preview",
    text: text || "Enter text",
    x,
    y,
    fontSize,
    fontWeight,
    color,
    backgroundColor,
    textAlign,
    rotation,
    opacity,
    strokeColor,
    strokeWidth,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Text</Text>
          <TouchableOpacity
            onPress={() => {
              console.log("=== Done button PRESSED ===");
              console.log("Current text:", textRef.current);
              handleSave();
            }}
            style={[styles.headerButton, styles.doneButton]}
            activeOpacity={0.8}
          >
            <View style={styles.doneButtonContent}>
              <Text style={styles.doneButtonText}>✓ Done</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Preview Area */}
        <View style={styles.previewContainer}>
          <View style={[styles.previewFrame, { width: containerWidth, height: containerHeight }]}>
            <View style={styles.previewBackground}>
              <Text style={styles.previewLabel}>Preview</Text>
            </View>
            {text && (
              <View
                style={{
                  position: "absolute",
                  left: x * containerWidth,
                  top: y * containerHeight,
                  opacity,
                  transform: [{ rotate: `${rotation}deg` }],
                }}
              >
                {backgroundColor && (
                  <View style={[styles.previewBackgroundBox, { backgroundColor }]} />
                )}
                <Text
                  style={{
                    fontSize,
                    fontWeight,
                    color,
                    textAlign,
                    ...(strokeColor && strokeWidth > 0
                      ? {
                          textShadowColor: strokeColor,
                          textShadowOffset: { width: 0, height: 0 },
                          textShadowRadius: strokeWidth,
                        }
                      : {}),
                  }}
                >
                  {text}
                </Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.editor} showsVerticalScrollIndicator={false}>
          {/* Text Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Text</Text>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Enter your text"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
              autoFocus
            />
          </View>

          {/* Font Size */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsRow}>
              {FONT_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.optionButton, fontSize === size && styles.optionButtonActive]}
                  onPress={() => setFontSize(size)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      fontSize === size && styles.optionButtonTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Font Weight */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Style</Text>
            <View style={styles.optionsRow}>
              {(["normal", "bold"] as FontWeight[]).map((weight) => (
                <TouchableOpacity
                  key={weight}
                  style={[styles.styleButton, fontWeight === weight && styles.styleButtonActive]}
                  onPress={() => setFontWeight(weight)}
                >
                  <Text
                    style={[
                      styles.styleButtonText,
                      fontWeight === weight && styles.styleButtonTextActive,
                      weight === "bold" && { fontWeight: "bold" },
                    ]}
                  >
                    {weight === "normal" ? "Regular" : "Bold"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
              {COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.colorButton,
                    color === col && styles.colorButtonActive,
                    { backgroundColor: col },
                  ]}
                  onPress={() => setColor(col)}
                >
                  {color === col && (
                    <View style={styles.colorCheck}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 6L9 17l-5-5"
                          stroke={
                            col === "#FFFFFF" ||
                            col === "#FFFF00" ||
                            col === "#FFC0CB" ||
                            col === "#FFD700"
                              ? "#000000"
                              : "#FFFFFF"
                          }
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Background Color */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Background</Text>
              <TouchableOpacity onPress={() => setBackgroundColor("")} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
              <TouchableOpacity
                style={[
                  styles.colorButton,
                  !backgroundColor && styles.colorButtonActive,
                  styles.transparentButton,
                ]}
                onPress={() => setBackgroundColor("")}
              >
                {!backgroundColor && (
                  <View style={styles.colorCheck}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 6L9 17l-5-5"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                )}
                <Text style={styles.transparentLabel}>None</Text>
              </TouchableOpacity>
              {COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.colorButton,
                    backgroundColor === col && styles.colorButtonActive,
                    { backgroundColor: col },
                  ]}
                  onPress={() => setBackgroundColor(col)}
                >
                  {backgroundColor === col && (
                    <View style={styles.colorCheck}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 6L9 17l-5-5"
                          stroke={
                            col === "#FFFFFF" ||
                            col === "#FFFF00" ||
                            col === "#FFC0CB" ||
                            col === "#FFD700"
                              ? "#000000"
                              : "#FFFFFF"
                          }
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Alignment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alignment</Text>
            <View style={styles.optionsRow}>
              {(["left", "center", "right"] as TextAlign[]).map((align) => (
                <TouchableOpacity
                  key={align}
                  style={[styles.alignButton, textAlign === align && styles.alignButtonActive]}
                  onPress={() => setTextAlign(align)}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    {align === "left" && (
                      <Path
                        d="M3 6h18M3 12h12M3 18h18"
                        stroke={textAlign === align ? "#ec9a15" : "#888888"}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    )}
                    {align === "center" && (
                      <Path
                        d="M3 6h18M7 12h10M3 18h18"
                        stroke={textAlign === align ? "#ec9a15" : "#888888"}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    )}
                    {align === "right" && (
                      <Path
                        d="M3 6h18M9 12h12M3 18h18"
                        stroke={textAlign === align ? "#ec9a15" : "#888888"}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    )}
                  </Svg>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Opacity */}
          <View style={styles.section}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sectionTitle}>Opacity</Text>
              <Text style={styles.sliderValue}>{Math.round(opacity * 100)}%</Text>
            </View>
            <View style={styles.sliderContainer}>
              {[0, 0.25, 0.5, 0.75, 1].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.sliderDot, opacity >= value && styles.sliderDotActive]}
                  onPress={() => setOpacity(value)}
                />
              ))}
            </View>
          </View>

          {/* Delete Button */}
          {overlay && onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete Text</Text>
            </TouchableOpacity>
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
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerButtonTextPrimary: {
    color: "#ec9a15",
  },
  doneButton: {
    backgroundColor: "#ec9a15",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 90,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ec9a15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  doneButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  previewContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  previewFrame: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  previewBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewLabel: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 14,
  },
  previewBackgroundBox: {
    position: "absolute",
    top: -4,
    left: -8,
    right: -8,
    bottom: -4,
    borderRadius: 4,
  },
  editor: {
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
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    color: "#ffffff",
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    minWidth: 60,
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
  styleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
  },
  styleButtonActive: {
    backgroundColor: "#ec9a15",
    borderColor: "#ec9a15",
  },
  styleButtonText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "600",
  },
  styleButtonTextActive: {
    color: "#ffffff",
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 4,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  colorButtonActive: {
    borderColor: "#ec9a15",
    transform: [{ scale: 1.1 }],
  },
  transparentButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  transparentLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
  },
  colorCheck: {
    position: "absolute",
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    color: "#ec9a15",
    fontSize: 12,
    fontWeight: "600",
  },
  alignButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  alignButtonActive: {
    backgroundColor: "#ec9a15",
    borderColor: "#ec9a15",
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sliderValue: {
    color: "#ec9a15",
    fontSize: 14,
    fontWeight: "600",
  },
  sliderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  sliderDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  sliderDotActive: {
    backgroundColor: "#ec9a15",
    borderColor: "#ec9a15",
    transform: [{ scale: 1.2 }],
  },
  deleteButton: {
    marginTop: 32,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 68, 68, 0.2)",
    borderWidth: 1.5,
    borderColor: "#ff4444",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default TextEditorModal;
