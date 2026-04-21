import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import type {
    TextOverlay,
    TextAlign,
    FontWeight,
} from "../types/textOverlay.types";
import Slider from "@react-native-community/slider";
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
];

/**
 * Modern, transparent text editor that overlays directly on the video preview.
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
    const [color, setColor] = useState(overlay?.color || "#FFFFFF");
    const [backgroundColor, setBackgroundColor] = useState(
        overlay?.backgroundColor || "",
    );
    const [textAlign, setTextAlign] = useState<TextAlign>(
        overlay?.textAlign || "center",
    );
    const [activeTab, setActiveTab] = useState<
        "style" | "color" | "background"
    >("color");
    const [fontSize, setFontSize] = useState(overlay?.fontSize || 16);
    const [fontWeight, setFontWeight] = useState(
        parseInt(overlay?.fontWeight as string) || 400,
    );
    const [fontStyle, setFontStyle] = useState<"normal" | "italic">(
        (overlay as any)?.fontStyle || "normal",
    );
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);
    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            () => setIsKeyboardVisible(true),
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => setIsKeyboardVisible(false),
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);
    // Focus input automatically when modal opens for a new text
    useEffect(() => {
        if (visible) {
            if (!overlay) {
                setText("");
                setColor("#FFFFFF");
                setBackgroundColor("");
                setTextAlign("center");
                setFontSize(16);
                setFontWeight(400);
                setFontStyle("normal");
            } else {
                setText(overlay.text);
                setColor(overlay.color);
                setBackgroundColor(overlay.backgroundColor || "");
                setTextAlign(overlay.textAlign);
                setFontSize(overlay.fontSize);
                setFontWeight(parseInt(overlay.fontWeight as string) || 400);
                setFontStyle((overlay as any).fontStyle || "normal");
            }

            // Slight delay to allow modal animation to finish before popping keyboard
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [visible, overlay]);

    const handleSave = useCallback(() => {
        if (!text.trim()) {
            onClose();
            return;
        }

        const updatedOverlay: TextOverlay = {
            ...(overlay || {}),
            id: overlay?.id || `text-${Date.now()}`,
            text: text.trim(),
            x: overlay?.x ?? 0.5,
            y: overlay?.y ?? 0.5,
            fontSize,
            fontWeight: fontWeight.toString() as FontWeight,
            color,
            textAlign,
            rotation: overlay?.rotation || 0,
            opacity: overlay?.opacity ?? 1,
            startTime: overlay?.startTime,
            endTime: overlay?.endTime,

            // If background is cleared, we explicitly remove it
            backgroundColor: backgroundColor ? backgroundColor : undefined,
            strokeColor: "#000000",
            strokeWidth: backgroundColor ? 0 : 2,
        };
        (updatedOverlay as any).fontStyle = fontStyle;

        onSave(updatedOverlay);
    }, [
        text,
        color,
        backgroundColor,
        textAlign,
        fontSize,
        fontWeight,
        fontStyle,
        overlay,
        onSave,
        onClose,
    ]);

    const handleDelete = useCallback(() => {
        if (overlay?.id && onDelete) {
            onDelete(overlay.id);
        } else {
            onClose();
        }
    }, [overlay, onDelete, onClose]);

    const toggleTextAlign = () => {
        setTextAlign((prev) =>
            prev === "center" ? "left" : prev === "left" ? "right" : "center",
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true} // 🔥 CRITICAL: Allows seeing the video underneath
            onRequestClose={handleSave} // Android back button saves and closes
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                {/* Dim the background slightly so text pops */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={Keyboard.dismiss} // Tapping outside dismisses keyboard
                >
                    <View style={styles.backdropDimmer} />
                </TouchableOpacity>

                {/* Top Action Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.iconButton}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.doneButton}
                    >
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>

                {/* Direct Text Input Area (Centered on screen) */}
                <View style={styles.inputArea} pointerEvents="box-none">
                    <View
                        style={[
                            styles.inputWrapper,
                            backgroundColor
                                ? {
                                      backgroundColor,
                                      padding: 8,
                                      borderRadius: 8,
                                  }
                                : {},
                        ]}
                    >
                        <TextInput
                            ref={inputRef}
                            style={[
                                styles.textInput,
                                {
                                    color: color,
                                    textAlign: textAlign,
                                    fontSize: fontSize,
                                    fontWeight: fontWeight.toString() as any,
                                    fontStyle: fontStyle,
                                    textShadowColor: backgroundColor
                                        ? "transparent"
                                        : "rgba(0,0,0,0.8)",
                                    textShadowOffset: { width: 1, height: 1 },
                                    textShadowRadius: 3,
                                },
                            ]}
                            value={text}
                            onChangeText={setText}
                            placeholder="Type here..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            multiline
                            autoCapitalize="sentences"
                        />
                    </View>
                </View>

                {/* Floating Toolbar (Moves with Keyboard) */}
                <View style={styles.toolbar}>
                    {/* Quick Actions Row */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            onPress={toggleTextAlign}
                            style={styles.quickButton}
                        >
                            <Svg
                                width={20}
                                height={20}
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                {textAlign === "left" && (
                                    <Path
                                        d="M3 6h18M3 12h12M3 18h18"
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                )}
                                {textAlign === "center" && (
                                    <Path
                                        d="M3 6h18M7 12h10M3 18h18"
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                )}
                                {textAlign === "right" && (
                                    <Path
                                        d="M3 6h18M9 12h12M3 18h18"
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                )}
                            </Svg>
                        </TouchableOpacity>
                        {!isKeyboardVisible && (
                            <View style={styles.tabGroup}>
                                <TouchableOpacity
                                    onPress={() => setActiveTab("color")}
                                    style={[
                                        styles.tabButton,
                                        activeTab === "color" &&
                                            styles.tabButtonActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            activeTab === "color" &&
                                                styles.tabTextActive,
                                        ]}
                                    >
                                        Text
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setActiveTab("background")}
                                    style={[
                                        styles.tabButton,
                                        activeTab === "background" &&
                                            styles.tabButtonActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            activeTab === "background" &&
                                                styles.tabTextActive,
                                        ]}
                                    >
                                        Highlight
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setActiveTab("style")}
                                    style={[
                                        styles.tabButton,
                                        activeTab === "style" &&
                                            styles.tabButtonActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.tabText,
                                            activeTab === "style" &&
                                                styles.tabTextActive,
                                        ]}
                                    >
                                        Style
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {overlay ? (
                            <TouchableOpacity
                                onPress={handleDelete}
                                style={styles.quickButton}
                            >
                                <Svg
                                    width={20}
                                    height={20}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <Path
                                        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                        stroke="#ff4444"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </Svg>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 36 }} />
                        )}
                    </View>
                    {!isKeyboardVisible && (
                        <>
                            {activeTab === "style" ? (
                                <View style={styles.styleControlsContainer}>
                                    {/* Font Size Slider */}
                                    <View style={styles.sliderRow}>
                                        <Text style={styles.sliderLabel}>
                                            Size
                                        </Text>
                                        <Slider
                                            style={styles.slider}
                                            minimumValue={12}
                                            maximumValue={72}
                                            step={1}
                                            value={fontSize}
                                            onValueChange={setFontSize}
                                            minimumTrackTintColor="#ec9a15"
                                            thumbTintColor="#ec9a15"
                                        />
                                        <Text style={styles.sliderValue}>
                                            {fontSize}
                                        </Text>
                                    </View>

                                    {/* Font Weight Slider */}
                                    <View style={styles.sliderRow}>
                                        <Text style={styles.sliderLabel}>
                                            Weight
                                        </Text>
                                        <Slider
                                            style={styles.slider}
                                            minimumValue={300}
                                            maximumValue={900}
                                            step={50}
                                            value={fontWeight}
                                            onValueChange={setFontWeight}
                                            minimumTrackTintColor="#ec9a15"
                                            thumbTintColor="#ec9a15"
                                        />
                                        <Text style={styles.sliderValue}>
                                            {fontWeight}
                                        </Text>
                                    </View>

                                    {/* Font Style Pills */}
                                    <View style={styles.pillContainer}>
                                        <TouchableOpacity
                                            style={[
                                                styles.pillBtn,
                                                fontStyle === "normal" &&
                                                    styles.pillBtnActive,
                                            ]}
                                            onPress={() =>
                                                setFontStyle("normal")
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.pillText,
                                                    fontStyle === "normal" &&
                                                        styles.pillTextActive,
                                                ]}
                                            >
                                                Regular
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.pillBtn,
                                                fontStyle === "italic" &&
                                                    styles.pillBtnActive,
                                            ]}
                                            onPress={() =>
                                                setFontStyle("italic")
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.pillText,
                                                    { fontStyle: "italic" },
                                                    fontStyle === "italic" &&
                                                        styles.pillTextActive,
                                                ]}
                                            >
                                                Italic
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.colorScroll}
                                >
                                    {activeTab === "background" && (
                                        <TouchableOpacity
                                            style={[
                                                styles.colorBubble,
                                                !backgroundColor &&
                                                    styles.colorBubbleActive,
                                            ]}
                                            onPress={() =>
                                                setBackgroundColor("")
                                            }
                                        >
                                            <Svg
                                                width={20}
                                                height={20}
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <Path
                                                    d="M18 6L6 18M6 6l12 12"
                                                    stroke="#ffffff"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                            </Svg>
                                        </TouchableOpacity>
                                    )}

                                    {COLORS.map((c) => {
                                        const isActive =
                                            activeTab === "color"
                                                ? color === c
                                                : backgroundColor === c;
                                        return (
                                            <TouchableOpacity
                                                key={c}
                                                style={[
                                                    styles.colorBubble,
                                                    { backgroundColor: c },
                                                    isActive &&
                                                        styles.colorBubbleActive,
                                                ]}
                                                onPress={() =>
                                                    activeTab === "color"
                                                        ? setColor(c)
                                                        : setBackgroundColor(c)
                                                }
                                            >
                                                {isActive && (
                                                    <View
                                                        style={
                                                            styles.colorCheck
                                                        }
                                                    >
                                                        <Svg
                                                            width={14}
                                                            height={14}
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                        >
                                                            <Path
                                                                d="M20 6L9 17l-5-5"
                                                                stroke={
                                                                    c ===
                                                                        "#FFFFFF" ||
                                                                    c ===
                                                                        "#FFFF00"
                                                                        ? "#000000"
                                                                        : "#FFFFFF"
                                                                }
                                                                strokeWidth="3"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </Svg>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "space-between",
    },
    backdropDimmer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.4)", // Dims the video slightly
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 16, // 🔥 Gives the header some thickness
        backgroundColor: "#000000", // 🔥 Completely masks the underlying Back/Next buttons!
        zIndex: 10,
    },
    sliderValue: {
        color: "#ec9a15",
        fontSize: 14,
        fontWeight: "bold",
        width: 36,
        textAlign: "right",
    },
    iconButton: {
        padding: 8,
    },
    styleControlsContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 16,
    },
    sliderRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    sliderLabel: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        width: 50,
    },
    slider: {
        flex: 1,
        height: 40,
    },
    pillContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 20,
        padding: 4,
        alignSelf: "flex-start",
    },
    pillBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 16,
    },
    pillBtnActive: {
        backgroundColor: "#ec9a15",
    },
    pillText: {
        color: "#888",
        fontWeight: "bold",
    },
    pillTextActive: {
        color: "#000",
    },
    cancelText: {
        color: "#ffffff",
        fontSize: 16,
    },
    doneButton: {
        backgroundColor: "#ec9a15",
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    doneButtonText: {
        color: "#000000",
        fontWeight: "bold",
        fontSize: 14,
    },
    inputArea: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    inputWrapper: {
        minWidth: "60%",
        maxWidth: "100%",
    },
    textInput: {
        fontSize: 36,
        fontWeight: "bold",
        maxHeight: 200,
    },
    toolbar: {
        backgroundColor: "#1a1a1a",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: Platform.OS === "ios" ? 34 : 24,
        paddingTop: 12,
    },
    quickActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    quickButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    tabGroup: {
        flexDirection: "row",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 20,
        padding: 4,
    },
    tabButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tabButtonActive: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    tabText: {
        color: "#888",
        fontSize: 12,
        fontWeight: "600",
    },
    tabTextActive: {
        color: "#fff",
    },
    colorScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },
    colorBubble: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    colorBubbleActive: {
        borderColor: "#ffffff",
        transform: [{ scale: 1.1 }],
    },
    colorCheck: {
        position: "absolute",
    },
});

export default TextEditorModal;
