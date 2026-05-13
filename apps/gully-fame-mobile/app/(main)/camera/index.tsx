import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  Alert,
  Linking,
  Image,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";
import VideoEditorModule from "@modules/video-editor";
import {
  FlashIcon,
  TimerIcon,
  SpeedIcon,
  MusicIcon,
  CloseIcon,
  GalleryIcon,
  CameraFlipIcon,
} from "@/icons";

const { width } = Dimensions.get("window");

// Types
type RecordingMode = "video" | "photo";
type CameraFacing = "front" | "back";
type FlashMode = "off" | "on" | "auto";
type SpeedOption = 0.5 | 1 | 1.5 | 2;
type TimerOption = 15 | 30 | 60 | 0;

interface VideoClip {
  id: string;
  uri: string;
  duration: number;
  thumbnail?: string;
}

interface CameraFormat {
  resolution: string;
  frameRate: number;
  color: "SDR" | "HDR";
}

// Main Camera Screen
export default function TikTokCameraScreen() {
  const params = useLocalSearchParams();
  const competitionId = params.competitionId ? String(params.competitionId) : null;
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const competitionName = params.competitionName ? String(params.competitionName) : null;
  const entryFee = params.entryFee ? String(params.entryFee) : null;
  const SLIDER_WIDTH = 200;
  const STEP_WIDTH = SLIDER_WIDTH / 3;
  const zoomThumbTranslateX = useRef(new Animated.Value(0)).current;
  // Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  // Core State
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("video");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedClips, setRecordedClips] = useState<VideoClip[]>([]);
  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(null);

  // Camera State
  const [facing, setFacing] = useState<CameraFacing>("back");
  const [flashEnabled, setFlashEnabled] = useState<FlashMode>("off");
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [showHDPopup, setShowHDPopup] = useState(false);
  const [hdPopupPos, setHDPopupPos] = useState({ x: 0, y: 0 });
  const [selectedCameraFormat, setSelectedCameraFormat] = useState<CameraFormat>({
    resolution: "HD",
    frameRate: 30,
    color: "SDR",
  });

  const [selectedSpeed, setSelectedSpeed] = useState<SpeedOption>(1);
  const [maxRecordingDuration, setMaxRecordingDuration] = useState<TimerOption>(30);
  const [showSpeedPopup, setShowSpeedPopup] = useState(false);
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [showMusicPopup, setShowMusicPopup] = useState(false);
  const [speedPopupPos, setSpeedPopupPos] = useState({ x: 0, y: 0 });
  const [timerPopupPos, setTimerPopupPos] = useState({ x: 0, y: 0 });
  const [musicPopupPos, setMusicPopupPos] = useState({ x: 0, y: 0 });

  const cameraRef = useRef<any>(null);
  const recordingRef = useRef<any>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const toolbarOpacity = useRef(new Animated.Value(1)).current;
  const clipBarTranslateY = useRef(new Animated.Value(0)).current;
  const zoomMenuScale = useRef(new Animated.Value(0)).current;
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTime = useRef<number>(0);
  const speedButtonRef = useRef<View>(null);
  const timerButtonRef = useRef<View>(null);
  const hdButtonRef = useRef<View>(null);
  const musicButtonRef = useRef<View>(null);

  // Supported formats
  const supportedResolutions = ["HD", "FHD", "2K", "4K"];
  const supportedFrameRates = [24, 30, 60];
  const supportedColors: ("SDR" | "HDR")[] = ["SDR", "HDR"];
  const supportedZoomLevels = [1, 2, 3, 4];

  // Start recording
  const startRecording = async () => {
    if (isRecording) {
      return;
    }

    if (recordingMode === "photo") {
      takePhoto();
      return;
    }

    // Check microphone permission FIRST (before setting state)
    if (!microphonePermission?.granted) {
      try {
        const micPermission = await requestMicrophonePermission();
        if (!micPermission.granted) {
          Alert.alert(
            "Microphone Permission Required",
            "We need access to your microphone to record videos with audio.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }
      } catch (error) {
        console.error("Permission error:", error);
        return;
      }
    }

    // Check camera ref before starting
    if (!cameraRef.current) {
      Alert.alert("Error", "Camera not ready. Please wait a moment and try again.");
      return;
    }

    // Set recording state immediately for instant UI feedback
    setIsRecording(true);
    recordingStartTime.current = Date.now();

    // Animate UI immediately (non-blocking)
    Animated.timing(toolbarOpacity, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.spring(clipBarTranslateY, {
      toValue: -80,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    Animated.spring(zoomMenuScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Start progress animation - use maxRecordingDuration
    const maxDuration = maxRecordingDuration > 0 ? maxRecordingDuration : 60;
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: maxDuration * 1000, // Convert to milliseconds
      useNativeDriver: false,
    }).start();

    // Start recording immediately - wrap in try-catch
    try {
      // Use maxRecordingDuration for maxDuration (or 60 if 0)
      const maxDuration = maxRecordingDuration > 0 ? maxRecordingDuration : 60;

      const recordingPromise = cameraRef.current.recordAsync({
        quality: "720p",
        maxDuration: maxDuration,
        mute: false,
      });

      if (!recordingPromise) {
        throw new Error("recordAsync returned null");
      }

      recordingRef.current = recordingPromise;

      // Start timer to track duration and auto-stop at max
      timerIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTime.current) / 1000;
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
    } catch (error: any) {
      console.error("Error starting recording:", error);
      setIsRecording(false);

      // Reset animations on error
      Animated.timing(toolbarOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.spring(clipBarTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      Animated.spring(zoomMenuScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      progressAnim.setValue(0);

      Alert.alert(
        "Recording Error",
        error?.message || "Failed to start recording. Please try again."
      );
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      const elapsed = (Date.now() - recordingStartTime.current) / 1000;

      // Don't save if recording is less than 0.5 seconds
      if (elapsed < 0.5) {
        if (cameraRef.current && recordingRef.current) {
          try {
            cameraRef.current.stopRecording();
            recordingRef.current.catch(() => {});
          } catch (e) {}
        }

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        progressAnim.stopAnimation();
        setIsRecording(false);
        recordingRef.current = null;

        Animated.timing(toolbarOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
        Animated.spring(clipBarTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
        Animated.spring(zoomMenuScale, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
        progressAnim.setValue(0);
        return;
      }

      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      progressAnim.stopAnimation();

      // Stop recording and get video
      if (cameraRef.current && recordingRef.current) {
        try {
          // Stop the recording first
          cameraRef.current.stopRecording();

          // Wait for the promise to resolve
          const video = await recordingRef.current;

          if (video && video.uri) {
            const maxDuration = maxRecordingDuration > 0 ? maxRecordingDuration : 60;
            const duration = Math.min(elapsed, maxDuration);
            const newClip: VideoClip = {
              id: Date.now().toString(),
              uri: video.uri,
              duration: duration,
            };
            setRecordedClips((prev) => [...prev, newClip]);
          }
        } catch (error: any) {
          // Only show error if it's not a short recording
          const errorMessage = String(error?.message || error || "").toLowerCase();
          const isShortRecordingError =
            errorMessage.includes("stopped before any data") ||
            errorMessage.includes("recording was stopped") ||
            errorMessage.includes("no data") ||
            elapsed < 1.5;

          if (!isShortRecordingError) {
            console.error("Error getting video:", error);
            // Don't show alert for short recordings
          }
        }
      }

      setIsRecording(false);
      recordingRef.current = null;

      // Reset animations
      Animated.timing(toolbarOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Animated.spring(clipBarTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      Animated.spring(zoomMenuScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      progressAnim.setValue(0);
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
    }
  };

  // Take photo
  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });

      if (photo && photo.uri) {
        const newClip: VideoClip = {
          id: Date.now().toString(),
          uri: photo.uri,
          duration: 0,
        };
        setRecordedClips((prev) => [...prev, newClip]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Photo Error", "Failed to take photo. Please try again.");
    }
  };

  // Handle record button tap
  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Start immediately - timer is for max recording duration, not countdown
      startRecording();
    }
  };

  // Delete clip
  const deleteClip = (clipId: string) => {
    Alert.alert("Discard this clip?", "Are you sure you want to delete this clip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          setRecordedClips((prev) => prev.filter((clip) => clip.id !== clipId));
          if (selectedClipIndex !== null) {
            setSelectedClipIndex(null);
          }
        },
      },
    ]);
  };

  // Toggle camera
  const toggleCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlashEnabled((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
  };

  // Handle zoom change
  const handleZoomChange = (zoom: number) => {
    if (supportedZoomLevels.includes(zoom)) {
      setCurrentZoom(zoom);
      const index = supportedZoomLevels.indexOf(zoom);

      Animated.spring(zoomThumbTranslateX, {
        toValue: index * STEP_WIDTH,
        tension: 150,
        friction: 12,
        useNativeDriver: true,
      }).start();
    }
  };

  // Handle speed popup
  const handleSpeedPress = () => {
    if (speedButtonRef.current) {
      speedButtonRef.current.measureInWindow((x, y, w, h) => {
        setSpeedPopupPos({
          x: x - 8, // Position to the left of button
          y: y + h + 4, // Just below the button
        });
        setShowSpeedPopup(true);
      });
    }
  };

  // Handle timer popup
  const handleTimerPress = () => {
    if (timerButtonRef.current) {
      timerButtonRef.current.measureInWindow((x, y, w, h) => {
        setTimerPopupPos({
          x: x - 8, // Position to the left of button
          y: y + h + 4, // Just below the button
        });
        setShowTimerPopup(true);
      });
    }
  };

  // Open VideoEditor instead of gallery
  const pickFromGallery = () => {
    setShowVideoEditor(true);
  };

  // Handle VideoEditor export
  const handleVideoEditorExport = (clips: any[]) => {
    setShowVideoEditor(false);
    // Convert VideoEditor CameraClipArray to VideoClip format
    const convertedClips: VideoClip[] = clips.map((clip, index) => ({
      id: clip.id || `video-editor-${Date.now()}-${index}`,
      uri: clip.uri || clip.path || "",
      duration: clip.duration || 0,
      thumbnail: clip.thumbnailUri || clip.thumbnail,
    }));
    // Replace existing clips with the new ones from VideoEditor
    setRecordedClips(convertedClips);
  };

  // Handle VideoEditor cancel
  const handleVideoEditorCancel = () => {
    console.log("[Camera] VideoEditor cancel called, hiding VideoEditor");
    setShowVideoEditor(false);
  };

  // Handle next
  const handleNext = () => {
    if (recordedClips.length === 0) {
      Alert.alert("No Clips", "Please record at least one clip before proceeding.");
      return;
    }
    // Navigate to editing screen with clips and competition params
    router.push({
      pathname: "/(main)/upload/edit",
      params: {
        clips: JSON.stringify(recordedClips),
        ...(competitionId && { competitionId }),
        ...(competitionName && { competitionName }),
        ...(entryFee && { entryFee }),
      },
    });
  };

  // Zoom pan responder
  const zoomPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (isRecording) {
          const sliderWidth = 200;
          const startX = width / 2 - sliderWidth / 2;
          const relativeX = Math.max(0, Math.min(sliderWidth, gestureState.moveX - startX));
          const zoomIndex = Math.round((relativeX / sliderWidth) * 3);
          const zoom = supportedZoomLevels[zoomIndex] || 1;
          handleZoomChange(zoom);
        }
      },
    })
  ).current;

  // Calculate zoom ratio
  const zoomRatio = (currentZoom - 1) / 3;

  // Role verification
  useEffect(() => {
    const verifyRole = async () => {
      const role = await AsyncStorage.getItem("userRole");
      const isParticipant = role === "participant" || role === "participants";

      if (!isParticipant) {
        Alert.alert(
          "Participants only",
          "Switch your account role to participant to submit entries.",
          [{ text: "OK", onPress: () => router.replace("/(main)") }]
        );
      }
    };
    verifyRole();
  }, []);

  // Check permissions
  if (!cameraPermission) {
    return <View style={styles.container} />;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>We need access to your camera to record videos.</Text>
          <TouchableOpacity onPress={requestCameraPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const bottomOffset = recordedClips.length > 0 ? 80 : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={["#000000", "#1a1a1a", "#000000"]} style={StyleSheet.absoluteFill} />

      <CameraView
        style={styles.camera}
        facing={facing}
        flash={flashEnabled}
        zoom={zoomRatio}
        ref={cameraRef}
        enableTorch={flashEnabled === "on"}
      />

      <View style={styles.overlay}>
        {/* Top - Mode Selector */}
        <View style={styles.modeSelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modeScrollContent}
          >
            <TouchableOpacity
              style={[styles.modeButton, recordingMode === "video" && styles.modeButtonActive]}
              onPress={() => setRecordingMode("video")}
            >
              <Text style={[styles.modeText, recordingMode === "video" && styles.modeTextActive]}>
                Video
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, recordingMode === "photo" && styles.modeButtonActive]}
              onPress={() => setRecordingMode("photo")}
            >
              <Text style={[styles.modeText, recordingMode === "photo" && styles.modeTextActive]}>
                Photo
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Left Vertical Toolbar */}
        <Animated.View style={[styles.leftToolbar, { opacity: toolbarOpacity }]}>
          <TouchableOpacity style={styles.toolbarButton} onPress={toggleFlash}>
            <FlashIcon filled={flashEnabled !== "off"} size={22} />
          </TouchableOpacity>

          <View ref={timerButtonRef}>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleTimerPress}>
              <TimerIcon size={22} />
              <Text style={styles.toolbarLabel}>{maxRecordingDuration}s</Text>
            </TouchableOpacity>
          </View>

          <View ref={speedButtonRef}>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleSpeedPress}>
              <SpeedIcon size={22} />
              <Text style={styles.toolbarLabel}>{selectedSpeed}x</Text>
            </TouchableOpacity>
          </View>

          <View ref={musicButtonRef}>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => {
                if (musicButtonRef.current) {
                  musicButtonRef.current.measureInWindow((x, y, w, h) => {
                    setMusicPopupPos({
                      x: x - 80,
                      y: y + h + 8,
                    });
                    setShowMusicPopup(true);
                  });
                }
              }}
            >
              <MusicIcon size={22} />
            </TouchableOpacity>
          </View>

          <View ref={hdButtonRef}>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => {
                if (hdButtonRef.current) {
                  hdButtonRef.current.measureInWindow((x, y, w, h) => {
                    setHDPopupPos({
                      x: x + w + 8,
                      y: y,
                    });
                    setShowHDPopup(true);
                  });
                }
              }}
            >
              <Text style={styles.hdText}>
                {selectedCameraFormat.resolution} {selectedCameraFormat.frameRate}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Top Right - Close */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            if (recordedClips.length > 0) {
              Alert.alert(
                "Discard Recording?",
                "You have recorded clips. Are you sure you want to go back?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Discard",
                    style: "destructive",
                    onPress: () => {
                      setRecordedClips([]);
                      router.back();
                    },
                  },
                ]
              );
            } else {
              router.replace("/(main)");
            }
          }}
        >
          <CloseIcon size={22} />
        </TouchableOpacity>

        {/* Bottom Left - Gallery */}
        <TouchableOpacity
          style={[styles.galleryButton, { bottom: 100 + bottomOffset }]}
          onPress={pickFromGallery}
        >
          <View style={styles.galleryThumbnail}>
            <GalleryIcon size={18} />
          </View>
        </TouchableOpacity>

        {/* Bottom Center - Record Button */}
        <View style={[styles.recordButtonArea, { bottom: 100 + bottomOffset }]}>
          {/* Zoom Selector (pill-shaped slider) */}
          {!isRecording && (
            <View style={styles.zoomSelectorContainer} {...zoomPanResponder.panHandlers}>
              {/* Text Labels */}
              <View
                style={{
                  flexDirection: "row",
                  width: SLIDER_WIDTH,
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                {supportedZoomLevels.map((zoom) => (
                  <Text
                    key={zoom}
                    style={[
                      {
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                        fontWeight: "600",
                        width: 20,
                        textAlign: "center",
                      },
                      currentZoom === zoom && {
                        color: "#fff",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {zoom}x
                  </Text>
                ))}
              </View>

              {/* Track & Dots */}
              <View
                style={{
                  width: SLIDER_WIDTH,
                  height: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  position: "relative",
                  justifyContent: "center",
                }}
              >
                {supportedZoomLevels.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      position: "absolute",
                      left: index * STEP_WIDTH - 2,
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "rgba(255,255,255,0.5)",
                    }}
                  />
                ))}

                {/* Animated Yellow Thumb */}
                <Animated.View
                  style={{
                    position: "absolute",
                    left: -10,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: "#EC9A15",
                    transform: [{ translateX: zoomThumbTranslateX }],
                  }}
                />
              </View>
            </View>
          )}

          {/* Record Button */}
          <TouchableOpacity
            style={styles.recordButtonContainer}
            onPress={handleRecordPress}
            activeOpacity={0.8}
          >
            {/* Progress Ring */}
            {isRecording && (
              <View style={styles.progressRing}>
                <Svg width={100} height={100} style={styles.progressSvg}>
                  <Circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="4"
                    fill="none"
                  />
                </Svg>
                <Animated.View
                  style={[
                    styles.progressRingIndicator,
                    {
                      transform: [
                        {
                          rotate: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "360deg"],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.progressRingDot} />
                </Animated.View>
              </View>
            )}

            <View style={[styles.recordButton, isRecording && styles.recordButtonRecording]}>
              {isRecording ? (
                <View style={styles.recordButtonSquare} />
              ) : (
                <View style={styles.recordButtonCircle} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Right - Camera Flip */}
        <TouchableOpacity
          style={[styles.flipButton, { bottom: 100 + bottomOffset }]}
          onPress={toggleCamera}
        >
          <CameraFlipIcon size={22} />
        </TouchableOpacity>

        {/* Clip Timeline */}
        {recordedClips.length > 0 && (
          <Animated.View
            style={[
              styles.clipTimeline,
              {
                transform: [{ translateY: clipBarTranslateY }],
                bottom: 20 + bottomOffset,
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clipTimelineContent}
            >
              {recordedClips.map((clip, index) => (
                <TouchableOpacity
                  key={clip.id}
                  style={[
                    styles.clipSegment,
                    selectedClipIndex === index && styles.clipSegmentSelected,
                  ]}
                  onPress={() => setSelectedClipIndex(index)}
                >
                  {clip.uri ? (
                    <Image
                      source={{ uri: clip.uri }}
                      style={styles.clipSegmentImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.clipSegmentInner} />
                  )}
                  <TouchableOpacity
                    style={styles.deleteClipButton}
                    onPress={() => deleteClip(clip.id)}
                  >
                    <CloseIcon size={10} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next {">"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}
      </View>

      {/* HD Popup */}
      <Modal
        visible={showHDPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHDPopup(false)}
      >
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => setShowHDPopup(false)}
        >
          <View
            style={[
              styles.hdPopup,
              {
                left: hdPopupPos.x,
                top: hdPopupPos.y,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.hdPopupArrow} />
            <View style={styles.hdPopupSection}>
              <Text style={styles.hdPopupLabel}>Resolution</Text>
              <View style={styles.hdPopupOptionsRow}>
                {supportedResolutions.map((res) => {
                  const isSupported = res === "HD" || res === "FHD";
                  return (
                    <TouchableOpacity
                      key={res}
                      style={[
                        styles.hdPopupOption,
                        selectedCameraFormat.resolution === res && styles.hdPopupOptionActive,
                        !isSupported && styles.hdPopupOptionDisabled,
                      ]}
                      onPress={() => {
                        if (isSupported) {
                          setSelectedCameraFormat((prev) => ({
                            ...prev,
                            resolution: res,
                          }));
                          setShowHDPopup(false);
                        }
                      }}
                      disabled={!isSupported}
                    >
                      <Text
                        style={[
                          styles.hdPopupOptionText,
                          selectedCameraFormat.resolution === res && styles.hdPopupOptionTextActive,
                          !isSupported && styles.hdPopupOptionTextDisabled,
                        ]}
                      >
                        {res}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.hdPopupSection}>
              <Text style={styles.hdPopupLabel}>Frame Rate</Text>
              <View style={styles.hdPopupOptionsRow}>
                {supportedFrameRates.map((fps) => {
                  const isSupported = fps === 30 || fps === 60;
                  return (
                    <TouchableOpacity
                      key={fps}
                      style={[
                        styles.hdPopupOption,
                        selectedCameraFormat.frameRate === fps && styles.hdPopupOptionActive,
                        !isSupported && styles.hdPopupOptionDisabled,
                      ]}
                      onPress={() => {
                        if (isSupported) {
                          setSelectedCameraFormat((prev) => ({
                            ...prev,
                            frameRate: fps,
                          }));
                          setShowHDPopup(false);
                        }
                      }}
                      disabled={!isSupported}
                    >
                      <Text
                        style={[
                          styles.hdPopupOptionText,
                          selectedCameraFormat.frameRate === fps && styles.hdPopupOptionTextActive,
                          !isSupported && styles.hdPopupOptionTextDisabled,
                        ]}
                      >
                        {fps}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Speed Popup */}
      {showSpeedPopup && (
        <Modal
          visible={showSpeedPopup}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSpeedPopup(false)}
        >
          <TouchableOpacity
            style={styles.popupOverlay}
            activeOpacity={1}
            onPress={() => setShowSpeedPopup(false)}
          >
            <View
              style={[
                styles.smallPopup,
                {
                  left: speedPopupPos.x,
                  top: speedPopupPos.y,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.popupArrow} />
              <View style={styles.smallPopupContent}>
                {([0.3, 0.5, 1, 1.5, 2, 3] as any[]).map((speed, index, array) => {
                  const isSupported = [0.5, 1, 1.5, 2].includes(speed);
                  const isLast = index === array.length - 1;
                  return (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.smallPopupOption,
                        selectedSpeed === speed && styles.smallPopupOptionActive,
                        !isSupported && {
                          opacity: 0.5,
                        },
                        isLast && {
                          borderBottomWidth: 0,
                        },
                      ]}
                      onPress={() => {
                        if (isSupported) {
                          setSelectedSpeed(speed as SpeedOption);
                          setShowSpeedPopup(false);
                        }
                      }}
                      disabled={!isSupported}
                    >
                      <Text
                        style={[
                          styles.smallPopupOptionText,
                          selectedSpeed === speed && styles.smallPopupOptionTextActive,
                        ]}
                      >
                        {speed}x
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Timer Popup */}
      {showTimerPopup && (
        <Modal
          visible={showTimerPopup}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimerPopup(false)}
        >
          <TouchableOpacity
            style={styles.popupOverlay}
            activeOpacity={1}
            onPress={() => setShowTimerPopup(false)}
          >
            <View
              style={[
                styles.smallPopup,
                {
                  left: timerPopupPos.x,
                  top: timerPopupPos.y,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.popupArrow} />
              <View style={styles.smallPopupContent}>
                {([15, 30, 60] as TimerOption[]).map((duration, index) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.smallPopupOption,
                      maxRecordingDuration === duration && styles.smallPopupOptionActive,
                      index === 2 && {
                        borderBottomWidth: 0,
                      }, // Remove border from last item
                    ]}
                    onPress={() => {
                      setMaxRecordingDuration(duration);
                      setShowTimerPopup(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.smallPopupOptionText,
                        maxRecordingDuration === duration && styles.smallPopupOptionTextActive,
                      ]}
                    >
                      {duration}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Music Popup */}
      {showMusicPopup && (
        <Modal
          visible={showMusicPopup}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMusicPopup(false)}
        >
          <TouchableOpacity
            style={styles.popupOverlay}
            activeOpacity={1}
            onPress={() => setShowMusicPopup(false)}
          >
            <View
              style={[
                styles.smallPopup,
                {
                  left: musicPopupPos.x,
                  top: musicPopupPos.y,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.popupArrow} />
              <View style={styles.smallPopupContent}>
                {["Track 1", "Track 2", "Track 3", "None"].map((track, index, array) => (
                  <TouchableOpacity
                    key={track}
                    style={[
                      styles.smallPopupOption,
                      index === array.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                    onPress={() => {
                      setShowMusicPopup(false);
                    }}
                  >
                    <Text style={styles.smallPopupOptionText}>{track}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* VideoEditor Modal - Opens when user clicks gallery button */}
      {showVideoEditor && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <VideoEditorModule
            onExport={handleVideoEditorExport}
            onCancel={handleVideoEditorCancel}
            initialMode="gallery"
            competitionId={competitionId}
            competitionName={competitionName}
            entryFee={entryFee}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#000",
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: "#FF0080",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  modeSelector: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  modeScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  modeButton: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modeButtonActive: {
    backgroundColor: "rgba(255, 0, 128, 0.3)",
    borderColor: "#FF0080",
  },
  modeText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 15,
    fontWeight: "600",
  },
  modeTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  leftToolbar: {
    position: "absolute",
    left: 20,
    top: Platform.OS === "ios" ? 120 : 100,
    alignItems: "center",
    gap: 20,
    zIndex: 10,
  },
  toolbarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  toolbarLabel: {
    color: "#fff",
    fontSize: 9,
    marginTop: 2,
    fontWeight: "600",
  },
  hdText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  galleryButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
  },
  galleryThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  recordButtonArea: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  zoomSelectorContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  zoomSelectorTrack: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 25,
    padding: 4,
    gap: 4,
    minWidth: 200,
  },
  zoomOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 45,
  },
  zoomOptionActive: {
    backgroundColor: "#fff",
  },
  zoomOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  zoomOptionTextActive: {
    color: "#000",
    fontWeight: "700",
  },
  recordButtonContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  progressRing: {
    position: "absolute",
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  progressSvg: {
    position: "absolute",
  },
  progressRingIndicator: {
    position: "absolute",
    width: 100,
    height: 100,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  progressRingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginTop: 2,
  },
  recordButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonRecording: {
    borderColor: "#EC9A15",
    shadowColor: "#EC9A15",
  },
  recordButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EC9A15",
  },
  recordButtonSquare: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#EC9A15",
  },
  flipButton: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  clipTimeline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 60,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 8,
  },
  clipTimelineContent: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  clipSegment: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  clipSegmentSelected: {
    borderColor: "#EC9A15",
  },
  clipSegmentInner: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  clipSegmentImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  deleteClipButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EC9A15",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#EC9A15",
    marginLeft: 12,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  hdPopup: {
    position: "absolute",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    width: 180,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1001,
  },
  hdPopupArrow: {
    position: "absolute",
    left: -6,
    top: 20,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#2a2a2a",
  },
  hdPopupSection: {
    marginBottom: 12,
  },
  hdPopupLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  hdPopupOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  hdPopupOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  hdPopupOptionActive: {
    backgroundColor: "#EC9A15",
  },
  hdPopupOptionDisabled: {
    opacity: 0.3,
  },
  hdPopupOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  hdPopupOptionTextActive: {
    fontWeight: "700",
  },
  hdPopupOptionTextDisabled: {
    opacity: 0.5,
  },
  smallPopup: {
    position: "absolute",
    zIndex: 1001,
  },
  popupArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#2a2a2a",
    alignSelf: "flex-start",
    marginLeft: 20,
    marginTop: -1,
  },
  smallPopupContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 4,
    flexDirection: "column",
    minWidth: 80,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
  },
  smallPopupOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: "transparent",
    alignItems: "center",
    minWidth: 72,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  smallPopupOptionActive: {
    backgroundColor: "rgba(236, 154, 21, 0.2)",
  },
  smallPopupOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  smallPopupOptionTextActive: {
    fontWeight: "600",
    color: "#EC9A15",
  },
});
