import React, { useRef, useState } from "react";
import {
    PanResponder,
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Image,
} from "react-native";

const DraggableSticker = ({
    sticker,
    containerWidth,
    containerHeight,
    isSelected,
    onUpdate,
    onDelete,
    onPress,
    activeScale,
    currentTime,
}: any) => {
    const [localPos, setLocalPos] = useState({ x: sticker.x, y: sticker.y });
    const currentPosRef = useRef({ x: sticker.x, y: sticker.y });
    const dragStartPos = useRef({ x: 0, y: 0 });
    const initialStickerPos = useRef({ x: sticker.x, y: sticker.y });
    const isDragging = useRef(false);

    const latestSticker = useRef(sticker);
    const latestOnUpdate = useRef(onUpdate);
    const latestOnPress = useRef(onPress);

    React.useEffect(() => {
        latestSticker.current = sticker;
        latestOnUpdate.current = onUpdate;
        latestOnPress.current = onPress;

        if (!isDragging.current) {
            setLocalPos({ x: sticker.x, y: sticker.y });
            currentPosRef.current = { x: sticker.x, y: sticker.y };
            initialStickerPos.current = { x: sticker.x, y: sticker.y };
        }
    }, [sticker, onUpdate, onPress]);

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
                isDragging.current = true;
                dragStartPos.current = {
                    x: evt.nativeEvent.pageX,
                    y: evt.nativeEvent.pageY,
                };
                initialStickerPos.current = {
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
                        initialStickerPos.current.x + deltaX / containerWidth,
                    ),
                );
                let newY = Math.max(
                    0,
                    Math.min(
                        1,
                        initialStickerPos.current.y + deltaY / containerHeight,
                    ),
                );

                currentPosRef.current = { x: newX, y: newY };
                setLocalPos({ x: newX, y: newY });
            },
            onPanResponderRelease: () => {
                if (isDragging.current) {
                    latestOnUpdate.current({
                        ...latestSticker.current,
                        x: currentPosRef.current.x,
                        y: currentPosRef.current.y,
                    });
                    isDragging.current = false;
                }
            },
            onPanResponderTerminate: () => {
                if (isDragging.current) {
                    latestOnUpdate.current({
                        ...latestSticker.current,
                        x: currentPosRef.current.x,
                        y: currentPosRef.current.y,
                    });
                    isDragging.current = false;
                }
            },
        }),
    ).current;

    const activeSticker = isDragging.current
        ? { ...sticker, x: localPos.x, y: localPos.y }
        : sticker;

    const displayScale = isSelected ? activeScale : (activeSticker.scale ?? 1);

    let displayOpacity = 1;
    if (currentTime !== undefined) {
        const start = activeSticker.startTime || 0;
        const end = activeSticker.endTime || 9999;
        const fadeIn = activeSticker.fadeIn || 0;
        const fadeOut = activeSticker.fadeOut || 0;

        if (fadeIn > 0 && currentTime < start + fadeIn) {
            displayOpacity = Math.max(0, (currentTime - start) / fadeIn);
        } else if (fadeOut > 0 && currentTime > end - fadeOut) {
            displayOpacity = Math.max(0, (end - currentTime) / fadeOut);
        }
    }
    displayOpacity *= activeSticker.opacity ?? 1;

    if (isSelected) {
        displayOpacity = Math.max(0.3, displayOpacity);
    }

    return (
        <View
            style={[
                StyleSheet.absoluteFill,
                { zIndex: isSelected ? 999 : activeSticker.zIndex || 1 },
            ]}
            pointerEvents="box-none"
            {...panResponder.panHandlers}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => latestOnPress.current(latestSticker.current)}
                style={[
                    styles.stickerContainer,
                    {
                        opacity: displayOpacity,
                        left:
                            activeSticker.x * containerWidth -
                            activeSticker.size / 2,
                        top:
                            activeSticker.y * containerHeight -
                            activeSticker.size / 2,
                        transform: [
                            { rotate: `${activeSticker.rotation || 0}deg` },
                            { scale: displayScale },
                        ],
                    },
                    isSelected && styles.selectedBorder,
                ]}
            >
                <Image
                    source={{ uri: activeSticker.source }}
                    style={{
                        width: activeSticker.size,
                        height: activeSticker.size,
                    }}
                    resizeMode="contain"
                />

                {/* Delete Button that only shows when tapped */}
                {isSelected && (
                    <TouchableOpacity
                        style={styles.deleteBadge}
                        onPress={() => onDelete(sticker.id)}
                    >
                        <Text style={styles.deleteBadgeText}>✕</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default function DraggableStickerOverlays({
    stickers,
    containerWidth,
    containerHeight,
    currentTime = 0,
    onStickerUpdate,
    onStickerPress,
    onStickerDelete,
    selectedStickerId,
    activeScale, // 🔥 4. Accept in main component
}: any) {
    const visibleStickers = stickers.filter(
        (s: any) =>
            s.startTime === undefined ||
            s.endTime === undefined ||
            (currentTime >= s.startTime && currentTime <= s.endTime),
    );

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {visibleStickers.map((sticker: any) => (
                <DraggableSticker
                    key={sticker.id}
                    sticker={sticker}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                    currentTime={currentTime}
                    isSelected={selectedStickerId === sticker.id}
                    onUpdate={onStickerUpdate}
                    onPress={onStickerPress}
                    onDelete={onStickerDelete}
                    activeScale={activeScale}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    stickerContainer: { position: "absolute", padding: 4 },
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
    },
    deleteBadgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
});
