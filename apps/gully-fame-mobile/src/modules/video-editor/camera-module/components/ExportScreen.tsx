import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    Alert,
} from "react-native";
import { File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import Svg, { Path } from "react-native-svg";
import { FFmpegKit, ReturnCode } from "ffmpeg-kit-react-native-community";
import type { CameraClip, CameraClipArray } from "../types/camera.types";

// 🔥 Ensure this path matches where you saved the generator!
import { buildExportCommandArgs } from "../utils/ffmpegGenerator";

interface ExportScreenProps {
    clips: CameraClipArray;
    onBack: () => void;
    onComplete?: () => void;
    globalTextOverlays: any[];
    globalPipOverlays: any[];
    globalStickerOverlays: any[];
    previewDimensions: { width: number; height: number };
    projectConfig: { resolution: "hd" | "2k" | "4k"; fps: number };
}

/**
 * Export screen with progress indicator and save to gallery
 */
const ExportScreen: React.FC<ExportScreenProps> = ({
    clips,
    onBack,
    onComplete,
    globalPipOverlays,
    globalStickerOverlays,
    globalTextOverlays,
    previewDimensions,
    projectConfig,
}) => {
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("Preparing export...");
    const [exportedUri, setExportedUri] = useState<string | null>(null);
    const progressAnim = React.useRef(new Animated.Value(0)).current;

    // Request media library permission
    useEffect(() => {
        const requestPermission = async () => {
            try {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert(
                        "Permission Required",
                        "We need permission to save videos to your gallery.",
                        [{ text: "OK", onPress: onBack }],
                    );
                }
            } catch (error) {
                console.warn("Permission error:", error);
            }
        };
        requestPermission();
    }, [onBack]);

    // Animate progress bar
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [progress, progressAnim]);

    const handleExport = useCallback(async () => {
        if (exporting || clips.length === 0) return;

        setExporting(true);
        setProgress(0);
        setStatus("Initializing engine...");
        setExportedUri(null);

        try {
            const totalDuration = clips.reduce((acc, clip) => {
                const start = clip.trimStart || 0;
                const end = clip.trimEnd || clip.duration || 3;
                return acc + (end - start);
            }, 0);

            const outputFile = new File(
                Paths.cache,
                `gullyfame_export_${Date.now()}.mp4`,
            );
            const outputPath = outputFile.uri;

            setStatus("Building timeline...");
            const commandArgs = buildExportCommandArgs(
                clips,
                globalTextOverlays,
                globalStickerOverlays,
                globalPipOverlays,
                outputPath,
                previewDimensions.width,
                previewDimensions.height,
                projectConfig.resolution,
                projectConfig.fps,
            );
            const filterGraphArg =
                commandArgs[commandArgs.indexOf("-filter_complex") + 1];
            Alert.alert("FFmpeg Graph", filterGraphArg);
            setStatus("Rendering video...");

            const outputUri = await new Promise<string>((resolve, reject) => {
                FFmpegKit.executeWithArgumentsAsync(
                    commandArgs,
                    async (session) => {
                        const returnCode = await session.getReturnCode();
                        if (ReturnCode.isSuccess(returnCode)) {
                            resolve(outputPath);
                        } else {
                            const logs = await session.getLogsAsString();

                            // 🔥 THE LOG FIX: Print ONLY the last 1500 chars to bypass Metro's limit!
                            console.error(
                                "\n=== 🔥 ACTUAL FFMPEG ERROR ===\n",
                                logs.slice(-1500),
                            );

                            reject(
                                new Error(
                                    `FFmpeg failed. Check the terminal for the exact error.`,
                                ),
                            );
                        }
                    },
                    (log) => {
                        // Optional: console.log(log.getMessage());
                    },
                    (statistics) => {
                        // 🔥 Calculate accurate percentage based on time!
                        const timeInMs = statistics.getTime();
                        if (timeInMs > 0 && totalDuration > 0) {
                            // Cap at 95% until it actually saves to the gallery
                            const prog = Math.min(
                                timeInMs / (totalDuration * 1000),
                                0.95,
                            );
                            setProgress(prog);
                            setStatus(
                                `Rendering... ${Math.round(prog * 100)}%`,
                            );
                        }
                    },
                );
            });

            setProgress(0.98);
            setStatus("Saving to GullyFame album...");

            // 5. Save to gallery in a specific album
            if (outputUri) {
                const asset = await MediaLibrary.createAssetAsync(outputUri);
                // 🔥 THE FIX: Changed from "Video Editor" to "GullyFame"
                await MediaLibrary.createAlbumAsync("GullyFame", asset, false);

                setProgress(1);
                setStatus("Export complete!");
                setExportedUri(outputUri);

                Alert.alert(
                    "Success!",
                    "Video saved to your GullyFame album successfully!",
                    [
                        {
                            text: "Done",
                            onPress: () => {
                                onComplete?.();
                                onBack();
                            },
                        },
                    ],
                );
            }
        } catch (error: any) {
            console.error("Export error:", error);
            Alert.alert(
                "Export Failed",
                error?.message ||
                    "An error occurred while exporting. Please try again.",
                [
                    { text: "Cancel", style: "cancel", onPress: onBack },
                    { text: "Retry", onPress: handleExport },
                ],
            );
            setStatus("Export failed");
        } finally {
            setExporting(false);
        }
    }, [
        clips,
        exporting,
        onBack,
        onComplete,
        globalPipOverlays,
        globalStickerOverlays,
        globalTextOverlays,
    ]);

    // Auto-start export when screen loads
    useEffect(() => {
        if (clips.length > 0 && !exporting && !exportedUri) {
            handleExport();
        }
    }, []);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100], // Actually, since we use 0 to 1, this should be [0, 1]
        outputRange: ["0%", "100%"],
    });

    // 🔥 TINY FIX: progressWidth was interpolating [0, 100], but state uses [0, 1]!
    // If you used 0 to 100 previously, make sure to change the interpolation!
    const correctProgressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={onBack}
                    style={styles.backButton}
                    disabled={exporting}
                >
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
                <Text style={styles.headerTitle}>Exporting</Text>
                <View style={styles.backButton} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {exporting ? (
                    <>
                        {/* Progress Indicator */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarBackground}>
                                <Animated.View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            width: correctProgressWidth,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {Math.round(progress * 100)}%
                            </Text>
                        </View>

                        {/* Status Text */}
                        <Text style={styles.statusText}>{status}</Text>

                        {/* Spinner */}
                        <ActivityIndicator
                            size="large"
                            color="#ec9a15"
                            style={styles.spinner}
                        />
                    </>
                ) : exportedUri ? (
                    <>
                        <View style={styles.successContainer}>
                            <Svg
                                width={80}
                                height={80}
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <Path
                                    d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                    stroke="#4CAF50"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <Path
                                    d="M22 4L12 14.01l-3-3"
                                    stroke="#4CAF50"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </Svg>
                            <Text style={styles.successTitle}>
                                Video Saved!
                            </Text>
                            <Text style={styles.successSubtitle}>
                                Your video has been saved to the GullyFame album
                            </Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.readyContainer}>
                        <Text style={styles.readyText}>Ready to export</Text>
                        <TouchableOpacity
                            style={styles.exportButton}
                            onPress={handleExport}
                        >
                            <Text style={styles.exportButtonText}>
                                Start Export
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
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
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: "rgba(10, 10, 10, 0.95)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.05)",
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "700",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    progressContainer: {
        width: "100%",
        marginBottom: 24,
    },
    progressBarBackground: {
        width: "100%",
        height: 8,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 12,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#ec9a15",
        borderRadius: 4,
    },
    progressText: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
    },
    statusText: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 32,
    },
    spinner: {
        marginTop: 24,
    },
    successContainer: {
        alignItems: "center",
    },
    successTitle: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "700",
        marginTop: 24,
        marginBottom: 8,
    },
    successSubtitle: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 16,
        textAlign: "center",
    },
    readyContainer: {
        alignItems: "center",
    },
    readyText: {
        color: "#ffffff",
        fontSize: 18,
        marginBottom: 24,
    },
    exportButton: {
        backgroundColor: "#ec9a15",
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 24,
        shadowColor: "#ec9a15",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    exportButtonText: {
        color: "#000000",
        fontSize: 16,
        fontWeight: "700",
    },
});

export default ExportScreen;
