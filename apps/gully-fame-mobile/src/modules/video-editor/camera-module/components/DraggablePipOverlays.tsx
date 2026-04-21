import React, { useEffect, useRef, useState } from "react";
import {
    PanResponder,
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    Text,
} from "react-native";
import { PipOverlay } from "../types/pipOverlay.types";
const getDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
};
interface DraggablePipProps {
    pip: PipOverlay;
    containerWidth: number;
    containerHeight: number;
    isSelected: boolean;
    onUpdate?: (...props: any) => void;
    onDelete?: (...props: any) => void;
    onPress?: (...props: any) => void;
    selectedPipId?: string | null;
    activeScale: number;
    currentTime: number;
}
const DraggablePip = ({
    pip,
    containerWidth,
    containerHeight,
    isSelected,
    activeScale,
    currentTime,
    onUpdate = () => {},
    onDelete = () => {},
    onPress = () => {},
}: DraggablePipProps) => {
    const [localPos, setLocalPos] = useState({ x: pip.x, y: pip.y });
    const [localScale, setLocalScale] = useState(pip.scale ?? 1);
    const currentPosRef = useRef({ x: pip.x, y: pip.y });
    const currentScaleRef = useRef(pip.scale ?? 1);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const initialPipPos = useRef({ x: pip.x, y: pip.y });
    const initialDistance = useRef(0);
    const initialScale = useRef(pip.scale ?? 1);
    const isDragging = useRef(false);
    const isPinching = useRef(false);
    const latestPip = useRef(pip);
    const latestOnUpdate = useRef(onUpdate);
    const latestOnPress = useRef(onPress);

    useEffect(() => {
        latestPip.current = pip;
        latestOnUpdate.current = onUpdate;
        latestOnPress.current = onPress;

        if (!isDragging.current && !isPinching.current) {
            setLocalPos({ x: pip.x, y: pip.y });
            setLocalScale(pip.scale ?? 1);
            currentPosRef.current = { x: pip.x, y: pip.y };
            currentScaleRef.current = pip.scale ?? 1;
            initialPipPos.current = { x: pip.x, y: pip.y };
        }
    }, [pip, onUpdate, onPress]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return (
                    Math.abs(gestureState.dx) > 5 ||
                    Math.abs(gestureState.dy) > 5
                );
            },
            onPanResponderGrant: (evt) => {
                const touches = evt.nativeEvent.touches;
                if (touches.length === 2) {
                    isPinching.current = true;
                    initialDistance.current = getDistance(touches);
                    initialScale.current = currentScaleRef.current;
                } else {
                    isDragging.current = true;
                    dragStartPos.current = {
                        x: touches[0].pageX,
                        y: touches[0].pageY,
                    };
                    initialPipPos.current = {
                        x: currentPosRef.current.x,
                        y: currentPosRef.current.y,
                    };
                }
            },
            onPanResponderMove: (evt) => {
                const touches = evt.nativeEvent.touches;
                if (touches.length === 2) {
                    if (!isPinching.current) {
                        isPinching.current = true;
                        isDragging.current = false;
                        initialDistance.current = getDistance(touches);
                        initialScale.current = currentScaleRef.current;
                    }
                    const distance = getDistance(touches);
                    const scaleFactor = distance / initialDistance.current;
                    const newScale = Math.max(
                        0.2,
                        Math.min(5, initialScale.current * scaleFactor),
                    );
                    currentScaleRef.current = newScale;
                    setLocalScale(newScale);
                } else if (touches.length === 1) {
                    if (isPinching.current) {
                        isPinching.current = false;
                        isDragging.current = true;
                        dragStartPos.current = {
                            x: touches[0].pageX,
                            y: touches[0].pageY,
                        };
                        initialPipPos.current = {
                            x: currentPosRef.current.x,
                            y: currentPosRef.current.y,
                        };
                    }
                    const deltaX = touches[0].pageX - dragStartPos.current.x;
                    const deltaY = touches[0].pageY - dragStartPos.current.y;

                    let newX = Math.max(
                        0,
                        Math.min(
                            1,
                            initialPipPos.current.x + deltaX / containerWidth,
                        ),
                    );
                    let newY = Math.max(
                        0,
                        Math.min(
                            1,
                            initialPipPos.current.y + deltaY / containerHeight,
                        ),
                    );

                    currentPosRef.current = { x: newX, y: newY };
                    setLocalPos({ x: newX, y: newY });
                }
            },
            onPanResponderRelease: () => {
                if (isDragging.current || isPinching.current) {
                    latestOnUpdate.current({
                        ...latestPip.current,
                        x: currentPosRef.current.x,
                        y: currentPosRef.current.y,
                        scale: currentScaleRef.current, // 🔥 Save the scale!
                    });
                    isDragging.current = false;
                    isPinching.current = false;
                } else {
                    latestOnPress.current(latestPip.current);
                }
            },
            onPanResponderTerminate: () => {
                if (isDragging.current || isPinching.current) {
                    latestOnUpdate.current({
                        ...latestPip.current,
                        x: currentPosRef.current.x,
                        y: currentPosRef.current.y,
                        scale: currentScaleRef.current,
                    });
                    isDragging.current = false;
                    isPinching.current = false;
                }
            },
        }),
    ).current;

    const activePip =
        isDragging.current || isPinching.current
            ? { ...pip, x: localPos.x, y: localPos.y, scale: localScale }
            : pip;
    const displayScale = isSelected ? activeScale : (activePip.scale ?? 1);
    let displayOpacity = 1;
    if (currentTime !== undefined) {
        const start = activePip.startTime || 0;
        const end = activePip.endTime || 0;
        const fadeIn = activePip.fadeIn || 0;
        const fadeOut = activePip.fadeOut || 0;
        if (fadeIn > 0 && currentTime < start + fadeIn) {
            displayOpacity = Math.max(0, (currentTime - start) / fadeIn);
        } else if (fadeOut > 0 && currentTime > end - fadeOut) {
            displayOpacity = Math.max(0, (end - currentTime) / fadeOut);
        }
    }
    displayOpacity *= activePip.opacity ?? 1;
    if (isSelected) {
        displayOpacity = Math.max(0.3, displayOpacity);
    }
    return (
        <View
            style={[
                StyleSheet.absoluteFill,
                { zIndex: isSelected ? 999 : activePip.zIndex || 1 },
            ]}
            pointerEvents="box-none"
            {...panResponder.panHandlers}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => latestOnPress.current(latestPip.current)}
                style={[
                    styles.pipContainer,
                    {
                        opacity: displayOpacity,
                        left:
                            activePip.x * containerWidth - activePip.width / 2,
                        top:
                            activePip.y * containerHeight -
                            activePip.height / 2,
                        width: activePip.width,
                        height: activePip.height,
                        transform: [
                            { rotate: `${activePip.rotation}deg` },
                            { scale: displayScale },
                        ],
                    },
                    isSelected && styles.selectedBorder,
                ]}
            >
                {/* For now we just render images. Videos would need expo-av here! */}
                <Image
                    source={{ uri: activePip.uri }}
                    style={{ width: "100%", height: "100%", borderRadius: 8 }}
                    resizeMode="cover"
                />

                {isSelected && (
                    <TouchableOpacity
                        style={styles.deleteBadge}
                        onPress={() => onDelete(pip.id)}
                    >
                        <Text style={styles.deleteBadgeText}>✕</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default function DraggablePipOverlays({
    pips,
    containerWidth,
    containerHeight,
    onPipUpdate,
    onPipPress,
    onPipDelete,
    selectedPipId,
    activeScale,
    currentTime = 0,
}: any) {
    const visiblePips = pips.filter(
        (p: any) =>
            p.startTime === undefined ||
            p.endTime === undefined ||
            (currentTime >= p.startTime && currentTime <= p.endTime),
    );

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {visiblePips.map((pip: any) => (
                <DraggablePip
                    key={pip.id}
                    pip={pip}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                    isSelected={selectedPipId === pip.id}
                    onUpdate={onPipUpdate}
                    onPress={onPipPress}
                    currentTime={currentTime}
                    activeScale={activeScale}
                    onDelete={onPipDelete}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    pipContainer: {
        position: "absolute",
        padding: 2,
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 10,
    },
    selectedBorder: {
        outlineWidth: 2,
        outlineColor: "#ec9a15",
        outlineStyle: "dashed",
    },
    deleteBadge: {
        position: "absolute",
        top: -10,
        right: -10,
        backgroundColor: "#ff4444",
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    deleteBadgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
});
