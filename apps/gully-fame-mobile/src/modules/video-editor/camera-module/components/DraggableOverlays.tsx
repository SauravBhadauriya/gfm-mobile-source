import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { PanGestureHandler, GestureHandlerRootView } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";

interface Overlay {
  id: string;
  uri: string;
  name?: string;
  type: string;
  x?: number;
  y?: number;
}

interface DraggableOverlaysProps {
  overlays: Overlay[];
  containerWidth: number;
  containerHeight: number;
  onDelete: (overlayId: string) => void;
  onUpdate?: (overlay: Overlay) => void;
}

/**
 * Individual draggable overlay component
 */
const DraggableOverlay: React.FC<{
  overlay: Overlay;
  containerWidth: number;
  containerHeight: number;
  onDelete: (overlayId: string) => void;
  onUpdate?: (overlay: Overlay) => void;
}> = ({ overlay, containerWidth, containerHeight, onDelete, onUpdate }) => {
  const translateX = useRef(new Animated.Value((overlay.x || 0.5) * containerWidth - 40)).current;
  const translateY = useRef(new Animated.Value((overlay.y || 0.5) * containerHeight - 40)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === 5) {
      // END state
      // Update overlay position
      const newX = Math.max(0, Math.min(1, (event.nativeEvent.translationX + 40) / containerWidth));
      const newY = Math.max(
        0,
        Math.min(1, (event.nativeEvent.translationY + 40) / containerHeight)
      );

      if (onUpdate) {
        onUpdate({ ...overlay, x: newX, y: newY });
      }

      // Reset animation values
      translateX.setValue(newX * containerWidth - 40);
      translateY.setValue(newY * containerHeight - 40);
    }
  };

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <Animated.View
        style={[
          styles.overlayContainer,
          {
            transform: [{ translateX }, { translateY }, { scale }],
          },
        ]}
      >
        {/* Overlay Content */}
        <Text style={styles.overlayEmoji}>{overlay.uri}</Text>

        {/* Delete Button (Instagram style) */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(overlay.id)}
          activeOpacity={0.7}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 6L6 18M6 6l12 12"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

/**
 * Component to render overlays (stickers, shapes, effects) with delete button
 * Similar to Instagram's overlay system
 */
const DraggableOverlays: React.FC<DraggableOverlaysProps> = ({
  overlays,
  containerWidth,
  containerHeight,
  onDelete,
  onUpdate,
}) => {
  if (!overlays || overlays.length === 0) return null;

  return (
    <GestureHandlerRootView style={{ position: "absolute", width: "100%", height: "100%" }}>
      {overlays.map((overlay, index) => (
        <DraggableOverlay
          key={overlay.id || index}
          overlay={overlay}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
  },
  overlayEmoji: {
    fontSize: 60,
  },
  deleteButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default DraggableOverlays;
