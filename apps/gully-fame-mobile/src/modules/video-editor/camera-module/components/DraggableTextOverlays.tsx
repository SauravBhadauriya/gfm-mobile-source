import React, { act, useRef, useState } from "react";
import { PanResponder, View, StyleSheet } from "react-native";
import TextOverlayComponent from "./TextOverlay";
import type { TextOverlay } from "../types/textOverlay.types";

// 🔥 Isolated Draggable Item
const DraggableItem = ({
    overlay,
    containerWidth,
    containerHeight,
    currentTime,
    isSelected,
    onUpdate,
    onPress,
    activeScale,
}: any) => {
    const [localPos, setLocalPos] = useState({ x: overlay.x, y: overlay.y });
    const currentPosRef = useRef({ x: overlay.x, y: overlay.y });

    const dragStartPos = useRef({ x: 0, y: 0 });
    const initialOverlayPos = useRef({ x: overlay.x, y: overlay.y });
    const isDragging = useRef(false);

    const latestOverlay = useRef(overlay);
    const latestOnUpdate = useRef(onUpdate);
    const latestOnPress = useRef(onPress);

    React.useEffect(() => {
        latestOverlay.current = overlay;
        latestOnUpdate.current = onUpdate;
        latestOnPress.current = onPress;

        if (!isDragging.current) {
            setLocalPos({ x: overlay.x, y: overlay.y });
            currentPosRef.current = { x: overlay.x, y: overlay.y };
            initialOverlayPos.current = { x: overlay.x, y: overlay.y };
        }
    }, [overlay, onUpdate, onPress]);

    const panResponder = useRef(
        PanResponder.create({
            // 🔥 THE FIX: Return false here so simple taps slip right through!
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return (
                    Math.abs(gestureState.dx) > 5 ||
                    Math.abs(gestureState.dy) > 5
                );
            },
            onPanResponderGrant: (evt) => {
                isDragging.current = true;
                dragStartPos.current = {
                    x: evt.nativeEvent.pageX,
                    y: evt.nativeEvent.pageY,
                };
                initialOverlayPos.current = {
                    x: currentPosRef.current.x,
                    y: currentPosRef.current.y,
                };
            },
            onPanResponderMove: (evt) => {
                const deltaX = evt.nativeEvent.pageX - dragStartPos.current.x;
                const deltaY = evt.nativeEvent.pageY - dragStartPos.current.y;

                let newX = Math.max(
                    0,
                    Math.min(
                        1,
                        initialOverlayPos.current.x + deltaX / containerWidth,
                    ),
                );
                let newY = Math.max(
                    0,
                    Math.min(
                        1,
                        initialOverlayPos.current.y + deltaY / containerHeight,
                    ),
                );

                currentPosRef.current = { x: newX, y: newY };
                setLocalPos({ x: newX, y: newY });
            },
            onPanResponderRelease: () => {
                if (isDragging.current) {
                    latestOnUpdate.current({
                        ...latestOverlay.current,
                        x: currentPosRef.current.x,
                        y: currentPosRef.current.y,
                    });
                    isDragging.current = false;
                }
            },
            onPanResponderTerminate: () => {
                if (isDragging.current) {
                    latestOnUpdate.current({
                        ...latestOverlay.current,
                        x: currentPosRef.current.x,
                        y: currentPosRef.current.y,
                    });
                    isDragging.current = false;
                }
            },
        }),
    ).current;

    const activeOverlay = isDragging.current
        ? { ...overlay, x: localPos.x, y: localPos.y }
        : overlay;
    activeOverlay.scale = isSelected ? activeScale : (activeOverlay.scale ?? 1);
    let displayOpacity = 1;
    if (currentTime !== undefined) {
        const start = activeOverlay.startTime || 0;
        const end = activeOverlay.endTime || 0;
        const fadeIn = activeOverlay.fadeIn || 0;
        const fadeOut = activeOverlay.fadeOut || 0;
        if (fadeIn > 0 && currentTime < start + fadeIn) {
            displayOpacity = Math.max(0, (currentTime - start) / fadeIn);
        } else if (fadeOut > 0 && currentTime > end - fadeOut) {
            displayOpacity = Math.max(0, (end - currentTime) / fadeOut);
        }
    }
    displayOpacity *= activeOverlay.opacity ?? 1;
    if (isSelected) {
        displayOpacity = Math.max(0.3, displayOpacity);
    }
    return (
        <View
            style={[
                StyleSheet.absoluteFill,
                { zIndex: isSelected ? 999 : activeOverlay.zIndex || 1 },
            ]}
            pointerEvents="box-none"
            {...panResponder.panHandlers}
        >
            <TextOverlayComponent
                overlay={activeOverlay}
                containerWidth={containerWidth}
                containerHeight={containerHeight}
                currentTime={currentTime}
                isEditing={isSelected}
                displayOpacity={displayOpacity}
                onPress={() => latestOnPress.current(latestOverlay.current)}
            />
        </View>
    );
};

interface DraggableTextOverlaysProps {
    overlays: TextOverlay[];
    containerWidth: number;
    containerHeight: number;
    currentTime?: number;
    onOverlayUpdate: (overlay: TextOverlay) => void;
    onOverlayPress: (overlay: TextOverlay) => void;
    selectedOverlayId?: string | null;
    activeScale?: number;
}

export default function DraggableTextOverlays({
    overlays,
    containerWidth,
    containerHeight,
    currentTime = 0,
    onOverlayUpdate,
    onOverlayPress,
    selectedOverlayId,
    activeScale,
}: DraggableTextOverlaysProps) {
    const visibleOverlays = overlays.filter(
        (overlay) =>
            overlay.startTime === undefined ||
            overlay.endTime === undefined ||
            (currentTime >= overlay.startTime &&
                currentTime <= overlay.endTime),
    );

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {visibleOverlays.map((overlay) => (
                <DraggableItem
                    key={overlay.id}
                    overlay={overlay}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                    currentTime={currentTime}
                    isSelected={selectedOverlayId === overlay.id}
                    onUpdate={onOverlayUpdate}
                    onPress={onOverlayPress}
                    activeScale={activeScale}
                />
            ))}
        </View>
    );
}
