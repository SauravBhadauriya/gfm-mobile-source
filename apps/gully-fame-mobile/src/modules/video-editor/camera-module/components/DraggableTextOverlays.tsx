import React, { useCallback, useRef, useState } from "react";
import { PanResponder, View, StyleSheet, Dimensions } from "react-native";
import TextOverlayComponent from "./TextOverlay";
import type { TextOverlay } from "../types/textOverlay.types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface DraggableTextOverlaysProps {
  overlays: TextOverlay[];
  containerWidth: number;
  containerHeight: number;
  currentTime?: number;
  onOverlayUpdate: (overlay: TextOverlay) => void;
  onOverlayPress: (overlay: TextOverlay) => void;
  selectedOverlayId?: string | null;
}

/**
 * Manages draggable text overlays on the preview
 */
const DraggableTextOverlays: React.FC<DraggableTextOverlaysProps> = ({
  overlays,
  containerWidth,
  containerHeight,
  currentTime = 0,
  onOverlayUpdate,
  onOverlayPress,
  selectedOverlayId,
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragThreshold = 10; // Minimum pixels to move before considering it a drag
  const isDragRef = useRef(false);

  // Check if text should be visible (for video timing)
  const getVisibleOverlays = useCallback(() => {
    console.log("=== Checking visible overlays ===");
    console.log("Total overlays:", overlays.length);
    console.log("Current time:", currentTime);

    return overlays.filter((overlay) => {
      console.log(`Overlay ${overlay.id}:`, {
        startTime: overlay.startTime,
        endTime: overlay.endTime,
        text: overlay.text,
      });

      // If no timing is set, show overlay always (for photos and default video behavior)
      if (overlay.startTime === undefined && overlay.endTime === undefined) {
        console.log(`Overlay ${overlay.id}: Always visible (no timing)`);
        return true;
      }

      // If only startTime is set, show from that time onwards
      if (overlay.startTime !== undefined && overlay.endTime === undefined) {
        const visible = currentTime >= overlay.startTime;
        console.log(`Overlay ${overlay.id}: Visible from ${overlay.startTime}:`, visible);
        return visible;
      }

      // If only endTime is set, show until that time
      if (overlay.startTime === undefined && overlay.endTime !== undefined) {
        const visible = currentTime <= overlay.endTime;
        console.log(`Overlay ${overlay.id}: Visible until ${overlay.endTime}:`, visible);
        return visible;
      }

      // If both times are set, show within the range
      if (overlay.startTime !== undefined && overlay.endTime !== undefined) {
        const visible = currentTime >= overlay.startTime && currentTime <= overlay.endTime;
        console.log(
          `Overlay ${overlay.id}: Visible ${overlay.startTime}-${overlay.endTime}:`,
          visible
        );
        return visible;
      }

      return true; // Default to visible
    });
  }, [overlays, currentTime]);

  const visibleOverlays = getVisibleOverlays();

  const panRespondersRef = useRef<Map<string, any>>(new Map());

  const getPanResponder = useCallback(
    (overlay: TextOverlay) => {
      if (!panRespondersRef.current.has(overlay.id)) {
        const panResponder = PanResponder.create({
          onStartShouldSetPanResponder: () => {
            // Only allow pan responder if text is selected
            return selectedOverlayId === overlay.id;
          },
          onMoveShouldSetPanResponder: (_, gestureState) => {
            // Only start dragging if text is selected AND movement exceeds threshold
            if (selectedOverlayId !== overlay.id) return false;
            return (
              Math.abs(gestureState.dx) > dragThreshold || Math.abs(gestureState.dy) > dragThreshold
            );
          },
          onPanResponderGrant: (evt) => {
            // Only allow dragging if text is selected
            if (selectedOverlayId !== overlay.id) return;
            isDragRef.current = false;
            dragStartPos.current = {
              x: evt.nativeEvent.pageX,
              y: evt.nativeEvent.pageY,
            };
          },
          onPanResponderMove: (evt) => {
            // Only allow dragging if text is selected
            if (selectedOverlayId !== overlay.id) return;

            const deltaX = evt.nativeEvent.pageX - dragStartPos.current.x;
            const deltaY = evt.nativeEvent.pageY - dragStartPos.current.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance > dragThreshold) {
              if (!isDragRef.current) {
                isDragRef.current = true;
                setDraggingId(overlay.id);
              }

              if (isDragRef.current && draggingId === overlay.id) {
                // Convert pixel movement to relative coordinates (0-1)
                const newX = Math.max(0, Math.min(1, overlay.x + deltaX / containerWidth));
                const newY = Math.max(0, Math.min(1, overlay.y + deltaY / containerHeight));

                onOverlayUpdate({
                  ...overlay,
                  x: newX,
                  y: newY,
                });

                dragStartPos.current = {
                  x: evt.nativeEvent.pageX,
                  y: evt.nativeEvent.pageY,
                };
              }
            }
          },
          onPanResponderRelease: (evt) => {
            if (!isDragRef.current) {
              // It was a tap, open editor or select text
              onOverlayPress(overlay);
            }
            setDraggingId(null);
            isDragRef.current = false;
          },
          onPanResponderTerminate: () => {
            setDraggingId(null);
            isDragRef.current = false;
          },
        });
        panRespondersRef.current.set(overlay.id, panResponder);
      }
      return panRespondersRef.current.get(overlay.id);
    },
    [
      draggingId,
      containerWidth,
      containerHeight,
      onOverlayUpdate,
      onOverlayPress,
      selectedOverlayId,
    ]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {visibleOverlays.map((overlay) => {
        const panResponder = getPanResponder(overlay);
        const isSelected = selectedOverlayId === overlay.id;
        const isDragging = draggingId === overlay.id;

        return (
          <View
            key={overlay.id}
            style={StyleSheet.absoluteFill}
            pointerEvents="auto"
            {...panResponder.panHandlers}
          >
            <TextOverlayComponent
              overlay={overlay}
              containerWidth={containerWidth}
              containerHeight={containerHeight}
              currentTime={currentTime}
              isEditing={isSelected || isDragging}
              onPress={() => {
                if (!isDragging) {
                  onOverlayPress(overlay);
                }
              }}
            />
          </View>
        );
      })}
    </View>
  );
};

export default DraggableTextOverlays;
