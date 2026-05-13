import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BackArrow from '../components/BackArrow';
import CameraSwitchButton from '../components/CameraSwitchButton';
import CaptureButton from '../components/CaptureButton';
import ClipList from '../components/ClipList';
import ClipPlayerOverlay from '../components/ClipPlayerOverlay';
import FlashToggle from '../components/FlashToggle';
import GalleryButton from '../components/GalleryButton';
import HDSelector, { type ColorMode, type FrameRate, type Resolution } from '../components/HDSelector';
import ModeToggle from '../components/ModeToggle';
import SpeedSelector, { type SpeedMultiplier } from '../components/SpeedSelector';
import TimerSelector, { type TimerDuration } from '../components/TimerSelector';
import ZoomSlider from '../components/ZoomSlider';
import { useCamera } from '../hooks/useCamera';
import { usePermissions } from '../hooks/usePermissions';
import { cameraStyles } from '../styles/cameraStyles';
import type { CameraClip, CameraClipArray, SpeedSegment } from '../types/camera.types';
import { CameraModeEnum, FlashModeEnum } from '../utils/mediaTypes';

interface CameraScreenProps {
  onBack: () => void;
  onNext: (clips: CameraClipArray) => void;
  initialClips?: CameraClipArray;
}

/**
 * Full-screen camera view with:
 * - Top bar: back button, Photo/Video toggle, flash toggle
 * - Middle: live camera preview
 * - Bottom: circular capture / record button
 */
const CameraScreen: React.FC<CameraScreenProps> = ({ onBack, onNext, initialClips = [] }) => {
  const [mode, setMode] = useState<CameraModeEnum>(CameraModeEnum.Photo);
  const [flash, setFlash] = useState<FlashModeEnum>(FlashModeEnum.Off);
  const [clips, setClips] = useState<CameraClipArray>(initialClips);

  // Update clips when initialClips prop changes (when navigating back from preview)
  // This ensures deleted clips from preview screen are reflected in camera screen
  React.useEffect(() => {
    if (initialClips) {
      setClips(initialClips);
    }
  }, [initialClips]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeClip, setActiveClip] = useState<CameraClip | null>(null);
  const [timerDuration, setTimerDuration] = useState<TimerDuration>(15);
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);
  
  // Track speed changes during recording
  const recordingStartTimeRef = useRef<number | null>(null);
  const speedChangesRef = useRef<Array<{ time: number; speed: number }>>([]);
  const currentSpeedRef = useRef<SpeedMultiplier>(speed);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [isHoldingCapture, setIsHoldingCapture] = useState(false);
  const [zoom, setZoom] = useState(1); // Zoom level: 1x to 4x
  const [gridEnabled, setGridEnabled] = useState(false); // Grid overlay toggle
  const [resolution, setResolution] = useState<Resolution>('hd');
  const [frameRate, setFrameRate] = useState<FrameRate>(30);
  const [colorMode, setColorMode] = useState<ColorMode>('sdr');

  const { hasPermission, isRequesting, requestPermissions } = usePermissions();
  const { cameraRef, isRecording, takePhoto, startRecording, stopRecording } = useCamera(
    mode,
    flash,
  );
  
  // Keep currentSpeedRef in sync with speed state (when not recording)
  useEffect(() => {
    if (!isRecording) {
      currentSpeedRef.current = speed;
    }
  }, [speed, isRecording]);

  const handleChangeMode = useCallback((nextMode: CameraModeEnum) => {
    // IMPORTANT: switching mode does NOT clear existing clips.
    setMode(nextMode);
  }, []);

  const handleSwitchCamera = useCallback(() => {
    setCameraFacing(prev => (prev === 'front' ? 'back' : 'front'));
    setZoom(1); // Reset zoom when switching camera
  }, []);

  // Convert zoom level (1-4x) to normalized zoom (0-1) for expo-camera
  // expo-camera uses normalized zoom: 0 = no zoom, 1 = max zoom
  // We map: 1x = 0, 2x = 0.33, 3x = 0.67, 4x = 1.0
  const normalizedZoom = React.useMemo(() => {
    return Math.min(Math.max((zoom - 1) / 3, 0), 1);
  }, [zoom]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleToggleGrid = useCallback(() => {
    setGridEnabled(prev => !prev);
  }, []);

  const handleAddClip = useCallback((clip: CameraClip | null) => {
    if (!clip) {
      // Reset tracking even if clip is null
      recordingStartTimeRef.current = null;
      speedChangesRef.current = [];
      return;
    }
    
    // Build speed segments if we have speed changes recorded
    if (clip.type === 'video' && recordingStartTimeRef.current !== null) {
      // Calculate recording duration from start time to now
      const recordingDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
      // Use clip.duration if available and valid, otherwise use recording duration
      let videoDuration = clip.duration > 0 ? clip.duration : recordingDuration;
      
      // Update clip duration if it was 0 (video metadata not available yet)
      if (clip.duration === 0 && recordingDuration > 0) {
        clip.duration = recordingDuration;
      }
      const changes = [...speedChangesRef.current]; // Copy array before processing
      
      console.log('Building speed segments:', {
        clipDuration: clip.duration,
        recordingDuration,
        videoDuration,
        speedChangesCount: changes.length,
        speedChanges: changes,
        currentSpeed: currentSpeedRef.current,
      });
      
      // Build segments from speed changes
      if (changes.length > 0 && videoDuration > 0) {
        const segments: SpeedSegment[] = [];
        
        // Process each speed change to create segments
        for (let i = 0; i < changes.length; i++) {
          const change = changes[i];
          const startTime = Math.min(Math.max(change.time, 0), videoDuration);
          const speed = change.speed;
          
          // Determine end time: next change time or video duration
          let endTime: number;
          if (i < changes.length - 1) {
            endTime = Math.min(Math.max(changes[i + 1].time, startTime), videoDuration);
          } else {
            endTime = videoDuration;
          }
          
          // Only add segment if it has valid duration
          if (endTime > startTime) {
            segments.push({
              startTime,
              endTime,
              speed,
            });
          }
        }
        
        console.log('Created segments:', segments);
        
        // If we have segments and they're not all at 1x or if there are multiple segments
        const hasNonDefaultSpeed = segments.some(seg => seg.speed !== 1);
        if (segments.length > 0 && (segments.length > 1 || hasNonDefaultSpeed)) {
          clip.speedSegments = segments;
          console.log('Applied speedSegments to clip:', clip.speedSegments);
        } else {
          console.log('Segments not applied - all 1x or empty');
        }
      } else if (currentSpeedRef.current !== 1 && videoDuration > 0) {
        // Single speed that's not 1x - create single segment
        clip.speedSegments = [{
          startTime: 0,
          endTime: videoDuration,
          speed: currentSpeedRef.current,
        }];
        console.log('Applied single speed segment:', clip.speedSegments);
      }
    } else if (clip.type === 'video') {
      console.log('Video clip but no recording tracking data');
    }
    
    // Reset recording tracking AFTER building segments
    const wasTracking = recordingStartTimeRef.current !== null;
    const trackingStartTime = recordingStartTimeRef.current;
    recordingStartTimeRef.current = null;
    speedChangesRef.current = [];
    
    console.log('Final clip data:', {
      id: clip.id,
      duration: clip.duration,
      speedSegments: clip.speedSegments,
      speed: clip.speed,
      hadTracking: wasTracking,
      trackingStartTime,
    });
    
    setClips(prev => [...prev, clip]);
  }, []);

  const handleCapturePressIn = useCallback(() => {
    setIsHoldingCapture(true);
  }, []);

  const handleCapturePressOut = useCallback(async () => {
    const wasHolding = isHoldingCapture;
    setIsHoldingCapture(false);

    // For photo mode: capture when released (only if it was a hold, not a tap)
    if (mode === CameraModeEnum.Photo && wasHolding) {
      const clip = await takePhoto();
      handleAddClip(clip);
    }
  }, [mode, isHoldingCapture, takePhoto, handleAddClip]);

  const handleToggleFlash = useCallback(() => {
    setFlash(current =>
      current === FlashModeEnum.On ? FlashModeEnum.Off : FlashModeEnum.On,
    );
  }, []);

  const handleDeleteClip = useCallback((id: string) => {
    setClips(prev => prev.filter(clip => clip.id !== id));
  }, []);

  const handleOpenClip = useCallback((clip: CameraClip) => {
    setActiveClip(clip);
  }, []);

  const handleCloseClip = useCallback(() => {
    setActiveClip(null);
  }, []);

  const handleOpenGallery = useCallback(async () => {
    // Step 1: ask for media library permission if needed
    let permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permission.status !== 'granted') {
      // Permission denied: just return silently (UI remains on camera)
      console.warn('Media library permission not granted');
      return;
    }

    // Step 2: open gallery picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      // User cancelled: nothing to do
      return;
    }

    const asset = result.assets[0];
    if (!asset.uri) {
      return;
    }

    const makeId = () =>
      `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const isVideo = asset.type === 'video';
    const duration = isVideo ? asset.duration ?? 0 : 0;

    const newClip: CameraClip = {
      id: makeId(),
      uri: asset.uri,
      duration,
      type: isVideo ? 'video' : 'photo',
      source: 'gallery',
      speed: isVideo ? speed : undefined, // Store speed for video clips from gallery
    };

    // Step 3: append to local clips array (stay on CameraScreen)
    setClips(prev => [...prev, newClip]);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: SpeedMultiplier) => {
    setSpeed(newSpeed);
    
    // Track speed change if recording
    if (isRecording && recordingStartTimeRef.current !== null) {
      const currentTime = (Date.now() - recordingStartTimeRef.current) / 1000; // Time since recording started
      speedChangesRef.current.push({
        time: currentTime,
        speed: newSpeed,
      });
      currentSpeedRef.current = newSpeed;
      console.log('Speed change tracked:', { time: currentTime, speed: newSpeed, totalChanges: speedChangesRef.current.length });
    } else if (isRecording) {
      console.warn('Speed change during recording but recordingStartTimeRef is null');
    }
  }, [isRecording]);

  const handleCapturePress = useCallback(async () => {
    // Only handle tap (not drag) - drag is handled separately
    if (mode === CameraModeEnum.Video) {
        // Video mode: tap to start/stop
        if (isRecording) {
          await stopRecording();
        } else {
        // Reset speed tracking for new recording
        recordingStartTimeRef.current = Date.now();
        speedChangesRef.current = [];
        currentSpeedRef.current = speed;
        // Record initial speed
        speedChangesRef.current.push({
          time: 0,
          speed: speed,
        });
        console.log('Recording started with initial speed:', speed, 'at time 0');
        
        // Pass timer duration as maxDuration (in seconds) and speed
        await startRecording(handleAddClip, timerDuration, speed);
      }
    }
    // Photo mode tap is handled in handleCapturePressOut
  }, [handleAddClip, isRecording, mode, startRecording, stopRecording, timerDuration, speed]);

  const handleNextPress = useCallback(() => {
    if (clips.length === 0) {
      return;
    }
    onNext(clips);
  }, [clips, onNext]);

  // Recording timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRecording) {
      // Use recordingStartTimeRef if available, otherwise set it now
      if (recordingStartTimeRef.current === null) {
        recordingStartTimeRef.current = Date.now();
        speedChangesRef.current = [{
          time: 0,
          speed: currentSpeedRef.current,
        }];
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
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
            {isRequesting ? 'Requesting…' : 'Grant permission'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={cameraStyles.cameraContainer}>
      <View style={cameraStyles.cameraPreview}>
        <CameraView
          ref={cameraRef}
          style={cameraStyles.cameraPreview}
          facing={cameraFacing}
          flash={flash === FlashModeEnum.On ? 'on' : 'off'}
          enableTorch={flash === FlashModeEnum.On}
          // Switch camera mode so the native layer is configured for the current capture type.
          mode={mode === CameraModeEnum.Video ? 'video' : 'picture'}
          zoom={normalizedZoom}
        />

        {/* Grid overlay (3x3 rule of thirds grid) */}
        {gridEnabled && (
          <View style={cameraStyles.gridOverlay} pointerEvents="none">
            {/* Vertical lines */}
            <View style={[cameraStyles.gridLineVertical, { left: '33.33%' }]} />
            <View style={[cameraStyles.gridLineVertical, { left: '66.66%' }]} />
            {/* Horizontal lines */}
            <View style={[cameraStyles.gridLineHorizontal, { top: '33.33%' }]} />
            <View style={[cameraStyles.gridLineHorizontal, { top: '66.66%' }]} />
          </View>
        )}

        {isRecording && (
          <View style={cameraStyles.recordingTimerContainer}>
            <View style={cameraStyles.recordingDot} />
            <Text style={cameraStyles.recordingTimerText}>
              {formatTimer(recordingSeconds)}
            </Text>
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

        {/* Flash toggle vertically centered on the left side */}
        <View style={cameraStyles.flashOverlay}>
          <FlashToggle flash={flash} onToggle={handleToggleFlash} />
        </View>

        {/* Timer selector - always visible, disabled in photo mode */}
        <View style={cameraStyles.timerSelectorOverlay}>
          <TimerSelector
            duration={timerDuration}
            onDurationChange={setTimerDuration}
            disabled={mode === CameraModeEnum.Photo}
          />
        </View>

        {/* Speed selector - always visible, disabled in photo mode */}
        <View style={cameraStyles.speedSelectorOverlay}>
          <SpeedSelector
            speed={speed}
            onSpeedChange={handleSpeedChange}
            disabled={mode === CameraModeEnum.Photo}
          />
        </View>

        {/* HD selector - always visible and enabled */}
        <View style={cameraStyles.hdSelectorOverlay}>
          <HDSelector
            resolution={resolution}
            frameRate={frameRate}
            colorMode={colorMode}
            onResolutionChange={setResolution}
            onFrameRateChange={setFrameRate}
            onColorModeChange={setColorMode}
            cameraFacing={cameraFacing}
          />
        </View>

      </View>

      {/* Controls row + clip list below capture */}
      <View style={cameraStyles.bottomBar}>
        <View style={cameraStyles.bottomControlsRow}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <GalleryButton onPress={handleOpenGallery} />
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            {/* Zoom slider just before capture button */}
            <ZoomSlider zoom={zoom} onZoomChange={handleZoomChange} />
            <CaptureButton
              mode={mode}
              isRecording={isRecording}
              onPress={handleCapturePress}
              onPressIn={handleCapturePressIn}
              onPressOut={handleCapturePressOut}
              disabled={!hasPermission}
            />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
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

        <ClipList
          clips={clips}
          onDeleteClip={handleDeleteClip}
          onPressClip={handleOpenClip}
        />
      </View>

      {activeClip && (
        <ClipPlayerOverlay clip={activeClip} onClose={handleCloseClip} />
      )}
    </SafeAreaView>
  );
};

export default CameraScreen;


