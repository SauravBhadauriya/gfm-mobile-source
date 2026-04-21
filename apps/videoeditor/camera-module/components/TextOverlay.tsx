import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import type { TextOverlay } from '../types/textOverlay.types';

interface TextOverlayProps {
  overlay: TextOverlay;
  containerWidth: number;
  containerHeight: number;
  currentTime?: number; // For video: current playback time
  isEditing?: boolean;
  onPress?: () => void;
}

/**
 * Renders a single text overlay on the preview
 */
const TextOverlayComponent: React.FC<TextOverlayProps> = ({
  overlay,
  containerWidth,
  containerHeight,
  currentTime = 0,
  isEditing = false,
  onPress,
}) => {
  // Check if text should be visible (for video timing)
  const isVisible =
    overlay.startTime === undefined ||
    overlay.endTime === undefined ||
    (currentTime >= overlay.startTime && currentTime <= overlay.endTime);

  if (!isVisible) {
    return null;
  }

  // Calculate absolute position from relative (0-1) coordinates
  const absoluteX = overlay.x * containerWidth;
  const absoluteY = overlay.y * containerHeight;

  // Build text style
  const textStyle: ViewStyle = {
    position: 'absolute',
    left: absoluteX,
    top: absoluteY,
    opacity: overlay.opacity,
    transform: [{ rotate: `${overlay.rotation || 0}deg` }],
  };

  const textContentStyle = {
    fontSize: overlay.fontSize,
    fontWeight: overlay.fontWeight,
    color: overlay.color,
    textAlign: overlay.textAlign,
    ...(overlay.strokeColor && overlay.strokeWidth
      ? {
          textShadowColor: overlay.strokeColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: overlay.strokeWidth,
        }
      : {}),
  };

  return (
    <TouchableOpacity
      style={[styles.container, textStyle, isEditing && styles.editing]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {overlay.backgroundColor && (
        <View
          style={[
            styles.background,
            { backgroundColor: overlay.backgroundColor },
          ]}
        />
      )}
      <Text
        style={[styles.text, textContentStyle]}
        numberOfLines={0}
      >
        {overlay.text}
      </Text>
      {isEditing && (
        <View style={styles.editIndicator}>
          <View style={styles.editDot} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 40,
    minHeight: 30,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  text: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  editing: {
    borderWidth: 1.5,
    borderColor: '#ec9a15',
    borderRadius: 4,
    borderStyle: 'dashed',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  editIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ec9a15',
    borderWidth: 2,
    borderColor: '#000000',
  },
  editDot: {
    flex: 1,
    borderRadius: 4,
  },
});

export default TextOverlayComponent;

