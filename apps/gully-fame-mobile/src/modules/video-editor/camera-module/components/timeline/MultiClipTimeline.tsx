import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { CameraClip } from '../../types/camera.types';
import {
  calculateTimelinePositions,
  getTotalTimelineDuration,
} from '../../utils/timelineHelpers';
import TimelineClip from './TimelineClip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMELINE_HEIGHT = 60;
const PIXELS_PER_SECOND = 60; // Base scale: 60 pixels per second of video

interface MultiClipTimelineProps {
  clips: CameraClip[];
  currentTime: number; // Current playback time in timeline
  selectedClipId?: string;
  thumbnails?: Map<string, string>;
  onClipPress?: (clip: CameraClip) => void;
  onTrimStart?: (clip: CameraClip, newTrimStart: number) => void;
  onTrimEnd?: (clip: CameraClip, newTrimEnd: number) => void;
  onClipReorder?: (fromIndex: number, toIndex: number) => void;
  onTimelineSeek?: (time: number) => void;
  onScroll?: (scrollX: number) => void;
}

/**
 * Multi-clip timeline with drag-and-drop, trimming, and scrubbing
 */
const MultiClipTimeline: React.FC<MultiClipTimelineProps> = ({
  clips,
  currentTime,
  selectedClipId,
  thumbnails = new Map(),
  onClipPress,
  onTrimStart,
  onTrimEnd,
  onClipReorder,
  onTimelineSeek,
  onScroll,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const isDraggingClip = useRef(false);
  const draggedClipIndex = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const [dragPreviewX, setDragPreviewX] = useState<number | null>(null);

  // Calculate timeline positions
  const positionedClips = React.useMemo(
    () => calculateTimelinePositions(clips),
    [clips]
  );

  const totalDuration = React.useMemo(
    () => getTotalTimelineDuration(clips),
    [clips]
  );

  const totalWidth = totalDuration * PIXELS_PER_SECOND;

  // Auto-scroll timeline to follow playhead - throttled for performance
  const lastScrollTimeRef = useRef(0);
  useEffect(() => {
    if (!isDraggingClip.current && scrollViewRef.current) {
      // Throttle scroll updates
      const now = Date.now();
      if (now - lastScrollTimeRef.current < 100) return;
      lastScrollTimeRef.current = now;
      
      const playheadX = currentTime * PIXELS_PER_SECOND;
      const scrollX = Math.max(0, playheadX - SCREEN_WIDTH / 2);
      scrollViewRef.current.scrollTo({ x: scrollX, animated: false });
    }
  }, [currentTime]);

  // Handle clip drag start
  const handleClipDragStart = useCallback((clip: CameraClip) => {
    const index = clips.findIndex((c) => c.id === clip.id);
    if (index === -1) return;
    
    isDraggingClip.current = true;
    draggedClipIndex.current = index;
  }, [clips]);

  // Handle clip drag
  const handleClipDrag = useCallback((clip: CameraClip, pageX: number) => {
    if (draggedClipIndex.current === null) return;
    
    // Calculate timeline position from screen X
    // Use pageX directly for drag position
    setDragPreviewX(pageX);
  }, []);

  // Handle clip drag end (reorder)
  const handleClipDragEnd = useCallback((clip: CameraClip) => {
    if (draggedClipIndex.current === null) return;
    
    const fromIndex = draggedClipIndex.current;
    
    // Calculate target index based on drag position
    if (dragPreviewX !== null && scrollViewRef.current) {
      const targetTime = dragPreviewX / PIXELS_PER_SECOND;
      const targetIndex = positionedClips.findIndex(
        (c) => targetTime >= (c.timelineStart ?? 0) && targetTime < (c.timelineEnd ?? 0)
      );
      
      if (targetIndex !== -1 && targetIndex !== fromIndex) {
        onClipReorder?.(fromIndex, targetIndex);
      }
    }
    
    isDraggingClip.current = false;
    draggedClipIndex.current = null;
    setDragPreviewX(null);
  }, [dragPreviewX, positionedClips, onClipReorder]);

  // Handle timeline scroll
  const handleScroll = useCallback((event: any) => {
            const scrollX = (event.nativeEvent as any).contentOffset?.x || 0;
    onScroll?.(scrollX);
  }, [onScroll]);

  // Handle timeline press (seek) - optimized
  const handleTimelinePress = useCallback((event: any) => {
    if (isDraggingClip.current) return;
    
    const { locationX } = event.nativeEvent;
    // Calculate time - locationX is relative to the ScrollView content
    // We need to account for the left padding (SCREEN_WIDTH / 2)
    const time = Math.max(0, (locationX - SCREEN_WIDTH / 2) / PIXELS_PER_SECOND);
    
    onTimelineSeek?.(Math.max(0, Math.min(time, totalDuration)));
  }, [totalDuration, onTimelineSeek]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={[
          styles.timelineContent,
          { width: Math.max(totalWidth + SCREEN_WIDTH, SCREEN_WIDTH) },
        ]}
        onTouchEnd={handleTimelinePress}
      >
        {/* Left padding */}
        <View style={{ width: SCREEN_WIDTH / 2 }} />

        {/* Clips */}
        {positionedClips.map((clip, index) => {
          const start = clip.timelineStart ?? 0;
          const end = clip.timelineEnd ?? 0;
          const clipWidth = (end - start) * PIXELS_PER_SECOND;
          const thumbnailUri = thumbnails.get(clip.id);

          return (
            <TimelineClip
              key={clip.id}
              clip={clip}
              width={clipWidth}
              thumbnailUri={thumbnailUri}
              isSelected={clip.id === selectedClipId}
              pixelsPerSecond={PIXELS_PER_SECOND}
              onPress={onClipPress}
              onTrimStart={onTrimStart}
              onTrimEnd={onTrimEnd}
              onDragStart={handleClipDragStart}
              onDrag={handleClipDrag}
              onDragEnd={handleClipDragEnd}
            />
          );
        })}

        {/* Right padding */}
        <View style={{ width: SCREEN_WIDTH / 2 }} />
      </ScrollView>

      {/* Playhead indicator */}
      <View
        style={[
          styles.playhead,
          { 
            left: SCREEN_WIDTH / 2 + currentTime * PIXELS_PER_SECOND,
            transform: [{ translateX: 0 }],
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: TIMELINE_HEIGHT,
    backgroundColor: '#000000',
    position: 'relative',
  },
  timelineContent: {
    paddingVertical: 4,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: TIMELINE_HEIGHT,
    backgroundColor: '#ec9a15',
    zIndex: 100,
  },
});

export default MultiClipTimeline;

