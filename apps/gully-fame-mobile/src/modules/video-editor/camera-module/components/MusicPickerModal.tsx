import React, { useState, useCallback, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import Svg, { Path } from "react-native-svg";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";

interface MusicTrack {
  id: string;
  name: string;
  uri: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
}

interface MusicPickerModalProps {
  visible: boolean;
  onSelect: (track: MusicTrack) => void;
  onClose: () => void;
}

// Popular royalty-free music categories
const MUSIC_CATEGORIES = [
  { id: "upbeat", name: "Upbeat", icon: "🎵" },
  { id: "chill", name: "Chill", icon: "😌" },
  { id: "energetic", name: "Energetic", icon: "⚡" },
  { id: "romantic", name: "Romantic", icon: "❤️" },
  { id: "dramatic", name: "Dramatic", icon: "🎭" },
  { id: "happy", name: "Happy", icon: "😊" },
];

/**
 * Music Picker Modal for selecting background music
 * Allows users to pick music from device or browse categories
 */
const MusicPickerModal: React.FC<MusicPickerModalProps> = ({ visible, onSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(30); // Default 30 seconds
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup audio when modal closes
  React.useEffect(() => {
    if (!visible) {
      stopAudio();
    }
  }, [visible]);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
        setCurrentTrack(null);
      } catch (error) {
        console.warn("Error stopping audio:", error);
      }
    }
  }, []);

  const playAudio = useCallback(
    async (track: MusicTrack, startTime = 0) => {
      try {
        // Stop current audio if playing
        await stopAudio();

        // Configure audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Create and play new sound
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: track.uri },
          { shouldPlay: true, volume: 0.7, positionMillis: startTime * 1000 }
        );

        if (status.isLoaded && status.durationMillis) {
          setDuration(status.durationMillis / 1000);
          setTrimEnd(Math.min(30, status.durationMillis / 1000));
        }

        soundRef.current = sound;
        setCurrentTrack(track);
        setIsPlaying(true);

        // Handle playback status
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setCurrentPosition(status.positionMillis ? status.positionMillis / 1000 : 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        });
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    },
    [stopAudio]
  );

  const handlePickFromDevice = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const track: MusicTrack = {
          id: `music-${Date.now()}`,
          name: asset.name,
          uri: asset.uri,
        };
        console.log("Selected music from device:", track);

        // Play preview
        await playAudio(track);

        // Show track with play/select options
        setCurrentTrack(track);
      }
    } catch (error) {
      console.error("Error picking music:", error);
    }
  }, [playAudio]);

  const handleSelectTrack = useCallback(
    async (track: MusicTrack) => {
      await stopAudio();
      const trimmedTrack = {
        ...track,
        startTime: trimStart,
        endTime: trimEnd,
        duration: trimEnd - trimStart,
      };
      onSelect(trimmedTrack);
      onClose();
    },
    [stopAudio, onSelect, onClose, trimStart, trimEnd]
  );

  const handleTrimAudio = useCallback(() => {
    setShowTrimmer(true);
  }, []);

  const handleSeekTo = useCallback(async (position: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(position * 1000);
        setCurrentPosition(position);
      } catch (error) {
        console.warn("Error seeking audio:", error);
      }
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = useCallback(async () => {
    await stopAudio();
    onClose();
  }, [stopAudio, onClose]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    console.log("Selected category:", categoryId);
    // TODO: Load music tracks for this category from backend
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
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
          <Text style={styles.headerTitle}>Add Music</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
            <Path
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              stroke="#888888"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search music..."
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Track Player */}
          {currentTrack && (
            <View style={styles.currentTrackContainer}>
              <View style={styles.trackInfo}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"
                    stroke="#ec9a15"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.trackName}>{currentTrack.name}</Text>
              </View>

              {/* Audio Progress Bar */}
              {duration > 0 && (
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${(currentPosition / duration) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              )}

              {/* Trim Controls */}
              {showTrimmer && duration > 0 && (
                <View style={styles.trimContainer}>
                  <Text style={styles.trimTitle}>Trim Audio (Instagram Style)</Text>

                  <View style={styles.trimSliderContainer}>
                    <Text style={styles.trimLabel}>Start: {formatTime(trimStart)}</Text>
                    <Slider
                      style={styles.trimSlider}
                      minimumValue={0}
                      maximumValue={duration}
                      value={trimStart}
                      onValueChange={setTrimStart}
                      minimumTrackTintColor="#ec9a15"
                      maximumTrackTintColor="rgba(255,255,255,0.3)"
                      thumbStyle={styles.sliderThumb}
                    />
                  </View>

                  <View style={styles.trimSliderContainer}>
                    <Text style={styles.trimLabel}>End: {formatTime(trimEnd)}</Text>
                    <Slider
                      style={styles.trimSlider}
                      minimumValue={trimStart + 1}
                      maximumValue={duration}
                      value={trimEnd}
                      onValueChange={setTrimEnd}
                      minimumTrackTintColor="#ec9a15"
                      maximumTrackTintColor="rgba(255,255,255,0.3)"
                      thumbStyle={styles.sliderThumb}
                    />
                  </View>

                  <Text style={styles.trimDuration}>
                    Selected: {formatTime(trimEnd - trimStart)}
                  </Text>

                  <View style={styles.trimActions}>
                    <TouchableOpacity
                      onPress={() => handleSeekTo(trimStart)}
                      style={styles.trimButton}
                    >
                      <Text style={styles.trimButtonText}>Preview Start</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSeekTo(trimEnd - 5)}
                      style={styles.trimButton}
                    >
                      <Text style={styles.trimButtonText}>Preview End</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.trackControls}>
                <TouchableOpacity
                  onPress={() => (isPlaying ? stopAudio() : playAudio(currentTrack, trimStart))}
                  style={styles.playButton}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    {isPlaying ? (
                      <Path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="#ffffff" />
                    ) : (
                      <Path d="M8 5v14l11-7L8 5z" fill="#ffffff" />
                    )}
                  </Svg>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTrimAudio}
                  style={[styles.trimToggleButton, showTrimmer && styles.trimToggleButtonActive]}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.trimToggleText}>Trim</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectTrack(currentTrack)}
                  style={styles.selectButton}
                >
                  <Text style={styles.selectButtonText}>Use This</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Pick from Device */}
          <TouchableOpacity style={styles.deviceButton} onPress={handlePickFromDevice}>
            <View style={styles.deviceIconContainer}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 2v6h6V2M21 8.94a1.31 1.31 0 0 0-.06-.27v-.09a1.07 1.07 0 0 0-.19-.28l-6-6a1.07 1.07 0 0 0-.28-.19h-.09a.88.88 0 0 0-.33-.11H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V9v-.06zM9 18H7v-2h2v2zm0-4H7v-2h2v2zm8 4h-6v-2h6v2zm0-4h-6v-2h6v2z"
                  fill="#ec9a15"
                />
              </Svg>
            </View>
            <View style={styles.deviceTextContainer}>
              <Text style={styles.deviceButtonTitle}>Pick from Device</Text>
              <Text style={styles.deviceButtonSubtitle}>Choose audio from your files</Text>
            </View>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-6-6-6"
                stroke="#888888"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by Mood</Text>
            <View style={styles.categoriesGrid}>
              {MUSIC_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardActive,
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Message */}
          <View style={styles.infoContainer}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                stroke="#ec9a15"
                strokeWidth="2"
              />
              <Path d="M12 16v-4M12 8h.01" stroke="#ec9a15" strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={styles.infoText}>
              Music library integration coming soon! For now, you can add music from your device.
            </Text>
          </View>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  currentTrackContainer: {
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
  },
  trackInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  trackName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
  trackControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ec9a15",
    justifyContent: "center",
    alignItems: "center",
  },
  selectButton: {
    flex: 1,
    backgroundColor: "#ec9a15",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  selectButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 8,
  },
  timeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
    minWidth: 35,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ec9a15",
    borderRadius: 2,
  },
  trimContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
  },
  trimTitle: {
    color: "#ec9a15",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  trimSliderContainer: {
    marginBottom: 12,
  },
  trimLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  trimSlider: {
    width: "100%",
    height: 40,
  },
  sliderThumb: {
    backgroundColor: "#ec9a15",
    width: 20,
    height: 20,
  },
  trimDuration: {
    color: "#ec9a15",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 8,
  },
  trimActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  trimButton: {
    flex: 1,
    backgroundColor: "rgba(236, 154, 21, 0.2)",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.5)",
  },
  trimButtonText: {
    color: "#ec9a15",
    fontSize: 12,
    fontWeight: "600",
  },
  trimToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  trimToggleButtonActive: {
    backgroundColor: "#ec9a15",
  },
  trimToggleText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  deviceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.3)",
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(236, 154, 21, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  deviceTextContainer: {
    flex: 1,
  },
  deviceButtonTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  deviceButtonSubtitle: {
    color: "#888888",
    fontSize: 14,
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
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryCardActive: {
    backgroundColor: "rgba(236, 154, 21, 0.2)",
    borderColor: "#ec9a15",
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(236, 154, 21, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
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

export default MusicPickerModal;
