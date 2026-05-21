import React, { useState, useCallback, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { Audio } from "expo-av";

interface VoiceRecording {
  id: string;
  name: string;
  uri: string;
  duration: number;
}

interface VoiceRecorderModalProps {
  visible: boolean;
  onSelect: (recording: VoiceRecording) => void;
  onClose: () => void;
}

/**
 * Voice Recorder Modal for recording user voice content
 * Similar to Instagram's voice recording feature
 */
const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({ visible, onSelect, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<VoiceRecording | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const animationRef = useRef(new Animated.Value(1)).current;
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup when modal closes
  React.useEffect(() => {
    if (!visible) {
      stopRecording();
      stopPlayback();
    }
  }, [visible]);

  const startRecording = useCallback(async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access microphone is required!");
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(animationRef, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animationRef, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, []);

  const pauseRecording = useCallback(async () => {
    if (recordingRef.current && isRecording && !isPaused) {
      try {
        await recordingRef.current.pauseAsync();
        setIsPaused(true);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        animationRef.stopAnimation();
      } catch (error) {
        console.error("Error pausing recording:", error);
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(async () => {
    if (recordingRef.current && isRecording && isPaused) {
      try {
        await recordingRef.current.startAsync();
        setIsPaused(false);

        // Resume duration counter
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);

        // Resume pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(animationRef, {
              toValue: 1.2,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(animationRef, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } catch (error) {
        console.error("Error resuming recording:", error);
      }
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();

        if (uri) {
          const recording: VoiceRecording = {
            id: `voice-${Date.now()}`,
            name: `Voice Recording ${new Date().toLocaleTimeString()}`,
            uri,
            duration: recordingDuration,
          };
          setCurrentRecording(recording);
        }

        recordingRef.current = null;
        setIsRecording(false);
        setIsPaused(false);

        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }

        animationRef.stopAnimation();
        animationRef.setValue(1);
      } catch (error) {
        console.error("Error stopping recording:", error);
      }
    }
  }, [recordingDuration]);

  const playRecording = useCallback(async () => {
    if (currentRecording && !isPlaying) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: currentRecording.uri },
          { shouldPlay: true, volume: 1.0 }
        );

        soundRef.current = sound;
        setIsPlaying(true);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch (error) {
        console.error("Error playing recording:", error);
      }
    }
  }, [currentRecording, isPlaying]);

  const stopPlayback = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
      } catch (error) {
        console.warn("Error stopping playback:", error);
      }
    }
  }, []);

  const handleSelectRecording = useCallback(() => {
    if (currentRecording) {
      onSelect(currentRecording);
      onClose();
    }
  }, [currentRecording, onSelect, onClose]);

  const handleClose = useCallback(async () => {
    await stopRecording();
    await stopPlayback();
    setCurrentRecording(null);
    setRecordingDuration(0);
    onClose();
  }, [stopRecording, stopPlayback, onClose]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
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
          <Text style={styles.headerTitle}>Voice Recorder</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Recording Area */}
        <View style={styles.recordingArea}>
          {/* Waveform Visualization */}
          <View style={styles.waveformContainer}>
            <Text style={styles.instructionText}>
              {!isRecording && !currentRecording && "Tap to start recording"}
              {isRecording && !isPaused && "Recording..."}
              {isRecording && isPaused && "Recording paused"}
              {currentRecording && "Recording complete"}
            </Text>
          </View>

          {/* Duration Display */}
          <Text style={styles.durationText}>{formatTime(recordingDuration)}</Text>

          {/* Recording Button */}
          <View style={styles.recordButtonContainer}>
            {!isRecording && !currentRecording && (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={[styles.recordButtonInner, { transform: [{ scale: animationRef }] }]}
                >
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="8" fill="#ff4444" />
                  </Svg>
                </Animated.View>
              </TouchableOpacity>
            )}

            {isRecording && (
              <View style={styles.recordingControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={isPaused ? resumeRecording : pauseRecording}
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    {isPaused ? (
                      <Path d="M8 5v14l11-7L8 5z" fill="#ffffff" />
                    ) : (
                      <Path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="#ffffff" />
                    )}
                  </Svg>
                </TouchableOpacity>

                <Animated.View
                  style={[styles.recordingIndicator, { transform: [{ scale: animationRef }] }]}
                >
                  <View style={styles.recordingDot} />
                </Animated.View>

                <TouchableOpacity style={styles.controlButton} onPress={stopRecording}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path d="M6 6h12v12H6z" fill="#ffffff" />
                  </Svg>
                </TouchableOpacity>
              </View>
            )}

            {currentRecording && (
              <View style={styles.playbackControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={isPlaying ? stopPlayback : playRecording}
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    {isPlaying ? (
                      <Path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="#ffffff" />
                    ) : (
                      <Path d="M8 5v14l11-7L8 5z" fill="#ffffff" />
                    )}
                  </Svg>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.newRecordingButton}
                  onPress={() => {
                    setCurrentRecording(null);
                    setRecordingDuration(0);
                  }}
                >
                  <Text style={styles.newRecordingText}>New Recording</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.useRecordingButton} onPress={handleSelectRecording}>
                  <Text style={styles.useRecordingText}>Use This</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Recording Info */}
          {currentRecording && (
            <View style={styles.recordingInfo}>
              <Text style={styles.recordingName}>{currentRecording.name}</Text>
              <Text style={styles.recordingDuration}>
                Duration: {formatTime(currentRecording.duration)}
              </Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Recording Tips:</Text>
          <Text style={styles.tipText}>• Hold phone close to your mouth</Text>
          <Text style={styles.tipText}>• Speak clearly and at normal volume</Text>
          <Text style={styles.tipText}>• Record in a quiet environment</Text>
          <Text style={styles.tipText}>• Maximum recording time: 60 seconds</Text>
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
  recordingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  waveformContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  instructionText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  durationText: {
    color: "#ec9a15",
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 48,
    fontFamily: "monospace",
  },
  recordButtonContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 68, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#ff4444",
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 68, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ff4444",
  },
  recordingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ff4444",
  },
  playbackControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ec9a15",
    justifyContent: "center",
    alignItems: "center",
  },
  newRecordingButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  newRecordingText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  useRecordingButton: {
    backgroundColor: "#ec9a15",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  useRecordingText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  recordingInfo: {
    alignItems: "center",
    marginTop: 24,
  },
  recordingName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  recordingDuration: {
    color: "#888888",
    fontSize: 14,
  },
  tipsContainer: {
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 16,
    padding: 20,
    margin: 16,
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
});

export default VoiceRecorderModal;
