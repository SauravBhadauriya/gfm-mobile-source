import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
// KIRO: Uncommented Vision Camera integration
import { Camera, useCameraDevice, useCameraFormat } from "react-native-vision-camera";

import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import BackArrow from "../components/BackArrow";
import CameraSwitchButton from "../components/CameraSwitchButton";
import CaptureButton from "../components/CaptureButton";
import ClipList from "../components/ClipList";
import ClipPlayerOverlay from "../components/ClipPlayerOverlay";
import FlashToggle from "../components/FlashToggle";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import GalleryButton from "../components/GalleryButton";
import HDSelector, {
  type ColorMode,
  type FrameRate,
  type Resolution,
  type DeviceCapabilities,
} from "../components/HDSelector";
import ModeToggle from "../components/ModeToggle";
import SpeedSelector, { type SpeedMultiplier } from "../components/SpeedSelector";
import TimerSelector, { type TimerDuration } from "../components/TimerSelector";
import ZoomSlider from "../components/ZoomSlider";
import { useCamera } from "../hooks/useCamera";

import { usePermissions } from "../hooks/usePermissions";
import { cameraStyles } from "../styles/cameraStyles";
import type { CameraClip, CameraClipArray, SpeedSegment } from "../types/camera.types";
import { CameraModeEnum, FlashModeEnum } from "../utils/mediaTypes";
import FocusButton from "../components/FocusButton";
import { ExposureSlider } from "../components/ExposureSlider";
import ExposureButton from "../components/ExposureButton";
import { HorizonLevel } from "../components/HorizonLevel";
import { AspectRatio, AspectRatioSelector } from "../components/AspectRatioSelector";
// KIRO: Uncommented Vision Camera integration
const AnimatedVisionCamera = Animated.createAnimatedComponent(Camera);

interface CameraScreenProps {
  onBack: () => void;
  onNext: (clips: CameraClipArray, config: { resolution: "hd" | "2k" | "4k"; fps: number }) => void;
  initialClips?: CameraClipArray;
}
const EMPTY_CLIPS: CameraClipArray = [];

const RATIO_VALUES: Record<AspectRatio, number> = {
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  "1:1": 1,
  "2.35:1": 2.35 / 1,
};

const CameraScreen: React.FC<CameraScreenProps> = ({
  onBack,
  onNext,
  initialClips = EMPTY_CLIPS,
}) => {
  const [mode, setMode] = useState<CameraModeEnum>(CameraModeEnum.Photo);
  const [flash, setFlash] = useState<FlashModeEnum>(FlashModeEnum.Off);
  const [clips, setClips] = useState<CameraClipArray>(initialClips);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const maskProgress = useDerivedValue(() => withSpring(RATIO_VALUES[aspectRatio]));

  const [showExposureSlider, setShowExposureSlider] = useState(false);
  const zoom = useSharedValue(1);
  const exposure = useSharedValue(0);
  const startPinchZoom = useSharedValue(1);
  const focusMode = useSharedValue<"auto" | "manual">("auto");
  const isFocusLocked = useSharedValue(false);
  const reticlePosition = useSharedValue({ x: 0, y: 0 });
  const reticleOpacity = useSharedValue(0);
  const [cameraAutoFocus, setCameraAutoFocus] = useState<"on" | "off">("on");
  const isPinching = useSharedValue(false);
  const previewLayoutSV = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
  const previewContainerRef = useRef<View>(null);
  const onPreviewContainerLayout = () => {
    previewContainerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      previewLayoutSV.value = { x: pageX, y: pageY, width, height };
    });
  };

  React.useEffect(() => {
    if (initialClips && initialClips.length !== clips.length) {
      setClips(initialClips);
    }
  }, [initialClips]);

  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeClip, setActiveClip] = useState<CameraClip | null>(null);
  const [timerDuration, setTimerDuration] = useState<TimerDuration>(15);
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);

  const recordingStartTimeRef = useRef<number | null>(null);
  const speedChangesRef = useRef<{ time: number; speed: number }[]>([]);
  const currentSpeedRef = useRef<SpeedMultiplier>(speed);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
  const [isHoldingCapture, setIsHoldingCapture] = useState(false);

  // KIRO: Uncommented Vision Camera integration
  const device = useCameraDevice(cameraFacing);

  const capabilities = useMemo<DeviceCapabilities>(() => {
    const caps = {
      supportsHD: true,
      supports2K: false,
      supports4K: false,
      supports24fps: true,
      supports30fps: true,
      supports60fps: false,
      supportsHDR: false,
    };
    if (!device?.formats) return caps;
    device.formats.forEach((format) => {
      const longEdge = Math.max(format.videoWidth, format.videoHeight);
      if (longEdge >= 1920) caps.supportsHD = true;
      if (longEdge >= 2560) caps.supports2K = true;
      if (longEdge >= 3840) caps.supports4K = true;
      if (format.maxFps >= 60) caps.supports60fps = true;
      if (format.supportsVideoHdr) caps.supportsHDR = true;
    });
    return caps;
  }, [device]);

  const [gridEnabled, setGridEnabled] = useState(false);
  const [resolution, setResolution] = useState<Resolution>("hd");
  const [frameRate, setFrameRate] = useState<FrameRate>(30);
  const [colorMode, setColorMode] = useState<ColorMode>("sdr");

  const targetResolution = useMemo(() => {
    switch (resolution) {
      case "2k":
        return { width: 2560, height: 1440 };
      case "hd":
        return { width: 1920, height: 1080 };
      case "4k":
        return { width: 3840, height: 2160 };
    }
  }, [resolution]);

  // KIRO: Uncommented Vision Camera integration
  const format = useCameraFormat(device, [
    { videoResolution: targetResolution },
    { fps: frameRate },
    { videoHdr: colorMode === "hdr" },
  ]);

  const { hasPermission, isRequesting, requestPermissions } = usePermissions();
  const { cameraRef, isRecording, takePhoto, startRecording, stopRecording } = useCamera(
    mode,
    flash
  );

  useEffect(() => {
    if (!isRecording) {
      currentSpeedRef.current = speed;
    }
  }, [speed, isRecording]);

  const handleChangeMode = useCallback((nextMode: CameraModeEnum) => {
    setMode(nextMode);
  }, []);

  const handleSwitchCamera = useCallback(() => {
    setCameraFacing((prev) => (prev === "front" ? "back" : "front"));
    zoom.value = 1;
  }, []);

  const handleAddClip = useCallback((clip: CameraClip | null) => {
    if (!clip) {
      recordingStartTimeRef.current = null;
      speedChangesRef.current = [];
      return;
    }

    if (clip.type === "video" && recordingStartTimeRef.current !== null) {
      const recordingDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
      let videoDuration = clip.duration > 0 ? clip.duration : recordingDuration;

      if (clip.duration === 0 && recordingDuration > 0) {
        clip.duration = recordingDuration;
      }
      const changes = [...speedChangesRef.current];

      if (changes.length > 0 && videoDuration > 0) {
        const segments: SpeedSegment[] = [];

        for (let i = 0; i < changes.length; i++) {
          const change = changes[i];
          const startTime = Math.min(Math.max(change.time, 0), videoDuration);
          const speed = change.speed;

          let endTime: number;
          if (i < changes.length - 1) {
            endTime = Math.min(Math.max(changes[i + 1].time, startTime), videoDuration);
          } else {
            endTime = videoDuration;
          }

          if (endTime > startTime) {
            segments.push({
              startTime,
              endTime,
              speed,
            });
          }
        }

        const hasNonDefaultSpeed = segments.some((seg) => seg.speed !== 1);
        if (segments.length > 0 && (segments.length > 1 || hasNonDefaultSpeed)) {
          clip.speedSegments = segments;
        }
      } else if (currentSpeedRef.current !== 1 && videoDuration > 0) {
        clip.speedSegments = [
          {
            startTime: 0,
            endTime: videoDuration,
            speed: currentSpeedRef.current,
          },
        ];
      }
    }

    recordingStartTimeRef.current = null;
    speedChangesRef.current = [];

    setClips((prev) => [...prev, clip]);
  }, []);

  const handleCapturePressIn = useCallback(() => {
    setIsHoldingCapture(true);
  }, []);

  const handleCapturePressOut = useCallback(async () => {
    const wasHolding = isHoldingCapture;
    setIsHoldingCapture(false);

    if (mode === CameraModeEnum.Photo && wasHolding) {
      const clip = await takePhoto(aspectRatio);
      handleAddClip(clip);
    }
  }, [mode, isHoldingCapture, takePhoto, handleAddClip, aspectRatio]);

  const handleToggleFlash = useCallback(() => {
    setFlash((current) => (current === FlashModeEnum.On ? FlashModeEnum.Off : FlashModeEnum.On));
  }, []);

  const topMaskStyle = useAnimatedStyle(() => {
    const containerHeight = previewLayoutSV.value.height;
    const targetHeight = previewLayoutSV.value.width / maskProgress.value;
    const maskHeight = Math.max(0, (containerHeight - targetHeight) / 2);
    return { height: maskHeight };
  });

  const bottomMaskStyle = useAnimatedStyle(() => {
    const containerHeight = previewLayoutSV.value.height;
    const targetHeight = previewLayoutSV.value.width / maskProgress.value;
    const maskHeight = Math.max(0, (containerHeight - targetHeight) / 2);
    return { height: maskHeight };
  });

  const focusCamera = useCallback(async (x: number, y: number) => {
    if (cameraRef.current) {
      try {
        await cameraRef.current.focus({ x, y });
      } catch (error) {
        console.warn("Focus failed: ", error);
      }
    }
  }, []);

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd((event) => {
      if (focusMode.value !== "auto" || isFocusLocked.value) return;
      const { absoluteX, absoluteY } = event;
      const { x, y, width, height } = previewLayoutSV.value;
      if (width === 0 || height === 0) return;
      const tapX = absoluteX - x;
      const tapY = absoluteY - y;
      if (tapX < 0 || tapX > width || tapY < 0 || tapY > height) return;

      runOnJS(focusCamera)(tapX, tapY);
      reticlePosition.value = { x: tapX, y: tapY };
      reticleOpacity.value = 1;
      setTimeout(() => {
        reticleOpacity.value = withTiming(0, { duration: 500 });
      }, 1500);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      if (focusMode.value === "auto") {
        isFocusLocked.value = !isFocusLocked.value;
      }
    });

  const minZ = device?.minZoom ?? 1;
  const maxZ = device?.maxZoom ?? 4;

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          isPinching.value = true;
          startPinchZoom.value = zoom.value;
        })
        .onUpdate((event) => {
          let nextZoom = startPinchZoom.value * event.scale;
          nextZoom = Math.max(minZ, Math.min(maxZ, nextZoom));
          zoom.value = nextZoom;
        })
        .onEnd(() => {
          isPinching.value = false;
        }),
    [minZ, maxZ]
  );

  const combinedGesture = useMemo(
    () => Gesture.Race(pinchGesture, tapGesture, longPressGesture),
    [pinchGesture, tapGesture, longPressGesture]
  );

  const activeFps = format ? Math.min(frameRate, format.maxFps) : frameRate;

  const handleDeleteClip = useCallback((id: string) => {
    setClips((prev) => prev.filter((clip) => clip.id !== id));
  }, []);

  const handleOpenClip = useCallback((clip: CameraClip) => {
    setActiveClip(clip);
  }, []);

  const handleCloseClip = useCallback(() => {
    setActiveClip(null);
  }, []);

  const handleOpenGallery = useCallback(async () => {
    let permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permission.status !== "granted") {
      console.warn("Media library permission not granted");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.uri) {
      return;
    }

    const makeId = () =>
      `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const isVideo = asset.type === "video";
    const duration = isVideo ? (asset.duration ?? 0) : 0;

    const newClip: CameraClip = {
      id: makeId(),
      uri: asset.uri,
      duration,
      type: isVideo ? "video" : "photo",
      source: "gallery",
      speed: isVideo ? speed : undefined,
      aspectRatio: "9:16",
    };

    setClips((prev) => [...prev, newClip]);
  }, []);

  const handleSpeedChange = useCallback(
    (newSpeed: SpeedMultiplier) => {
      setSpeed(newSpeed);

      if (isRecording && recordingStartTimeRef.current !== null) {
        const currentTime = (Date.now() - recordingStartTimeRef.current) / 1000;
        speedChangesRef.current.push({
          time: currentTime,
          speed: newSpeed,
        });
        currentSpeedRef.current = newSpeed;
      }
    },
    [isRecording]
  );

  const handleCapturePress = useCallback(async () => {
    if (mode === CameraModeEnum.Video) {
      if (isRecording) {
        await stopRecording();
      } else {
        recordingStartTimeRef.current = Date.now();
        speedChangesRef.current = [];
        currentSpeedRef.current = speed;
        speedChangesRef.current.push({
          time: 0,
          speed: speed,
        });

        await startRecording(handleAddClip, timerDuration, speed, aspectRatio);
      }
    }
  }, [
    handleAddClip,
    isRecording,
    mode,
    startRecording,
    stopRecording,
    timerDuration,
    speed,
    aspectRatio,
  ]);

  const handleNextPress = useCallback(() => {
    if (clips.length === 0) {
      return;
    }
    onNext(clips, { resolution, fps: frameRate });
  }, [clips, onNext, resolution, frameRate]);

  const reticleAnimatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: reticlePosition.value.x - 30,
    top: reticlePosition.value.y - 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#ec9a15",
    backgroundColor: "transparent",
    opacity: reticleOpacity.value,
    pointerEvents: "none",
  }));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRecording) {
      if (recordingStartTimeRef.current === null) {
        recordingStartTimeRef.current = Date.now();
        speedChangesRef.current = [
          {
            time: 0,
            speed: currentSpeedRef.current,
          },
        ];
      }

      const start = recordingStartTimeRef.current;
      interval = setInterval(() => {
        const elapsedMs = Date.now() - start;
        setRecordingSeconds(Math.floor(elapsedMs / 1000));
      }, 500);
    } else {
      setRecordingSeconds(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useAnimatedReaction(
    () => ({ mode: focusMode.value, locked: isFocusLocked.value }),
    ({ mode, locked }) => {
      let autoFocus: "on" | "off" = "on";
      if (mode === "manual" || (mode === "auto" && locked)) {
        autoFocus = "off";
      }
      runOnJS(setCameraAutoFocus)(autoFocus);
    },
    []
  );

  const cameraAnimatedProps = useAnimatedProps(() => {
    if (maxZ === minZ) return { zoom: minZ, exposure: exposure.value };
    const progress = (zoom.value - minZ) / (maxZ - minZ);
    const perceptualZoom = minZ * Math.pow(maxZ / minZ, progress);
    return {
      zoom: perceptualZoom,
      exposure: exposure.value,
    };
  }, [minZ, maxZ]);

  if (hasPermission === null) {
    return (
      <SafeAreaView style={cameraStyles.permissionContainer}>
        <ActivityIndicator color="#ffffff" />
        <Text style={cameraStyles.permissionText}>Checking camera permissions…</Text>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={cameraStyles.permissionContainer}>
        <Text style={cameraStyles.permissionText}>
          We need access to your camera and microphone to capture photos and videos.
        </Text>
        <TouchableOpacity
          style={cameraStyles.permissionButton}
          onPress={requestPermissions}
          disabled={isRequesting}
        >
          <Text style={cameraStyles.permissionButtonText}>
            {isRequesting ? "Requesting…" : "Grant permission"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // KIRO: Uncommented Vision Camera integration
  if (device == null) {
    return (
      <SafeAreaView style={cameraStyles.permissionContainer}>
        <ActivityIndicator color="#ec9a15" />
        <Text style={cameraStyles.permissionText}>Loading camera hardware...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={cameraStyles.cameraContainer}>
      <View
        style={cameraStyles.cameraPreview}
        onLayout={onPreviewContainerLayout}
        ref={previewContainerRef}
      >
        <GestureDetector gesture={combinedGesture}>
          {/* KIRO: Uncommented Vision Camera integration */}
          <AnimatedVisionCamera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            format={format}
            fps={activeFps}
            isActive
            photo={mode === CameraModeEnum.Photo}
            video={mode === CameraModeEnum.Video}
            audio={mode === CameraModeEnum.Video ? hasPermission : false}
            torch={flash === FlashModeEnum.On ? "on" : "off"}
            animatedProps={cameraAnimatedProps}
          />
        </GestureDetector>
        <Animated.View
          style={[styles.mask, styles.topMask, topMaskStyle]}
          pointerEvents="none"
        ></Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[styles.mask, styles.bottomMask, bottomMaskStyle]}
        />
        <HorizonLevel></HorizonLevel>
        <Animated.View style={reticleAnimatedStyle}>
          <View style={styles.reticleInner}></View>
        </Animated.View>
        {gridEnabled && (
          <View style={cameraStyles.gridOverlay} pointerEvents="none">
            <View style={[cameraStyles.gridLineVertical, { left: "33.33%" }]} />
            <View style={[cameraStyles.gridLineVertical, { left: "66.66%" }]} />
            <View style={[cameraStyles.gridLineHorizontal, { top: "33.33%" }]} />
            <View style={[cameraStyles.gridLineHorizontal, { top: "66.66%" }]} />
          </View>
        )}

        {isRecording && (
          <View style={cameraStyles.recordingTimerContainer}>
            <View style={cameraStyles.recordingDot} />
            <Text style={cameraStyles.recordingTimerText}>{formatTimer(recordingSeconds)}</Text>
          </View>
        )}

        <View style={cameraStyles.topBar}>
          <TouchableOpacity style={cameraStyles.backButton} onPress={onBack}>
            <BackArrow />
          </TouchableOpacity>

          <View style={cameraStyles.modeToggleContainer}>
            <ModeToggle mode={mode} onChangeMode={handleChangeMode} />
          </View>
        </View>

        <View style={cameraStyles.flashOverlay}>
          <FlashToggle flash={flash} onToggle={handleToggleFlash} />
        </View>

        <View style={cameraStyles.timerSelectorOverlay}>
          <TimerSelector
            duration={timerDuration}
            onDurationChange={setTimerDuration}
            disabled={mode === CameraModeEnum.Photo}
          />
        </View>

        <View style={cameraStyles.speedSelectorOverlay}>
          <SpeedSelector
            speed={speed}
            onSpeedChange={handleSpeedChange}
            disabled={mode === CameraModeEnum.Photo}
          />
        </View>

        <View
          style={
            cameraStyles.exposureSelectorOverlay || {
              position: "absolute",
              left: 20,
              top: 280,
            }
          }
        >
          <ExposureButton
            isActive={showExposureSlider}
            onPress={() => setShowExposureSlider(!showExposureSlider)}
          />
        </View>

        <View style={cameraStyles.focusSelectorOverlay}>
          <FocusButton focusMode={focusMode} isFocusLocked={isFocusLocked} />
        </View>

        <View style={cameraStyles.aspectRatioOverlay}>
          <AspectRatioSelector
            currentRatio={aspectRatio}
            onPress={() => {
              const ratios: AspectRatio[] = ["9:16", "16:9", "1:1", "2.35:1"];
              const nextIndex = (ratios.indexOf(aspectRatio) + 1) % ratios.length;
              setAspectRatio(ratios[nextIndex]);
              runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            }}
          ></AspectRatioSelector>
        </View>

        <ExposureSlider
          exposureSharedValue={exposure}
          minExposure={device?.minExposure ?? -2}
          maxExposure={device?.maxExposure ?? 2}
          isActive={showExposureSlider}
        ></ExposureSlider>

        <View style={cameraStyles.hdSelectorOverlay}>
          <HDSelector
            resolution={resolution}
            frameRate={frameRate}
            colorMode={colorMode}
            onResolutionChange={setResolution}
            onFrameRateChange={setFrameRate}
            onColorModeChange={setColorMode}
            cameraFacing={cameraFacing}
            capabilities={capabilities}
          />
        </View>
      </View>

      <View style={cameraStyles.bottomBar}>
        <View style={cameraStyles.bottomControlsRow}>
          <View style={{ flex: 1, alignItems: "flex-start" }}>
            <GalleryButton onPress={handleOpenGallery} />
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <ZoomSlider zoomSharedValue={zoom} minZoom={device.minZoom} maxZoom={device.maxZoom} />
            <CaptureButton
              mode={mode}
              isRecording={isRecording}
              onPress={handleCapturePress}
              onPressIn={handleCapturePressIn}
              onPressOut={handleCapturePressOut}
              disabled={!hasPermission}
            />
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <CameraSwitchButton onPress={handleSwitchCamera} />
            {clips.length > 0 && (
              <TouchableOpacity
                style={cameraStyles.nextButton}
                onPress={handleNextPress}
                activeOpacity={0.8}
              >
                <Text style={cameraStyles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ClipList clips={clips} onDeleteClip={handleDeleteClip} onPressClip={handleOpenClip} />
      </View>

      {activeClip && <ClipPlayerOverlay clip={activeClip} onClose={handleCloseClip} />}
    </SafeAreaView>
  );
};

export default CameraScreen;

const styles = StyleSheet.create({
  reticleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ec9a15",
    position: "absolute",
    top: 26,
    left: 26,
    zIndex: 100,
  },
  mask: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "black",
    zIndex: 5,
  },
  topMask: {
    top: 0,
  },
  bottomMask: {
    bottom: 0,
  },
});
