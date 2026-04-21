# Multi-Clip Timeline System Guide

## Overview

A comprehensive timeline system for multi-clip video editing with:
- **Horizontal draggable timeline** showing all clips in sequence
- **Real thumbnail previews** for each clip
- **Drag-and-drop reordering** of clips
- **Trim handles** (left/right) with live preview feedback
- **Frame-accurate seeking** and scrubbing
- **Seamless playback** across clip boundaries
- **Non-destructive editing** until export

## Architecture

### Core Components

1. **TimelineEditor** (`camera-module/components/timeline/TimelineEditor.tsx`)
   - Main editor component that orchestrates everything
   - Manages playback state, clip selection, and timeline interactions

2. **MultiClipTimeline** (`camera-module/components/timeline/MultiClipTimeline.tsx`)
   - Horizontal scrolling timeline showing all clips
   - Displays clip thumbnails, trim handles, and playhead
   - Handles drag-and-drop reordering
   - Supports timeline scrubbing

3. **TimelineClip** (`camera-module/components/timeline/TimelineClip.tsx`)
   - Individual clip item in the timeline
   - Shows thumbnail, duration, and video indicator
   - Has left/right trim handles for trimming
   - Supports drag gestures for reordering

4. **MultiClipPlayer** (`camera-module/components/timeline/MultiClipPlayer.tsx`)
   - Plays videos seamlessly across clip boundaries
   - Automatically switches between clips during playback
   - Maintains correct audio/video sync
   - Supports frame-accurate seeking

### Utility Functions

1. **timelineHelpers.ts**
   - `calculateTimelinePositions()` - Calculates timeline start/end for all clips
   - `getTotalTimelineDuration()` - Gets total composed duration
   - `getClipAtTimelineTime()` - Finds clip at a specific timeline time
   - `clampTrimPoints()` - Validates and clamps trim values

2. **thumbnailGenerator.ts**
   - `generateClipThumbnail()` - Generates thumbnails for clips
   - `generateThumbnailsForClips()` - Batch thumbnail generation

## Data Model

### Extended CameraClip

```typescript
interface CameraClip {
  id: string;
  uri: string;
  duration: number;
  type: 'video' | 'photo';
  source: 'camera' | 'gallery';
  
  // Trim points (non-destructive)
  trimStart?: number;  // Start trim in original clip (seconds)
  trimEnd?: number;   // End trim in original clip (seconds)
  
  // Timeline positions (calculated)
  timelineStart?: number;  // Start time in composed timeline
  timelineEnd?: number;    // End time in composed timeline
  
  // Thumbnail
  thumbnailUri?: string;   // Cached thumbnail URI
  
  // Other properties...
  speed?: number;
  speedSegments?: SpeedSegment[];
  filterPreset?: FilterPreset;
}
```

## Features

### 1. Timeline Display
- Shows all clips in sequence with proportional widths
- Each clip displays a thumbnail preview
- Total duration mapped to timeline width (60px per second)
- Playhead indicator shows current playback position

### 2. Clip Trimming
- Left trim handle: drag to set clip start
- Right trim handle: drag to set clip end
- Live preview feedback during trimming
- Minimum clip duration: 0.1 seconds
- Trim values are clamped to valid ranges

### 3. Drag-and-Drop Reordering
- Drag any clip to reorder in timeline
- Visual feedback during drag
- Automatic timeline recalculation after reorder

### 4. Playback Control
- Play/pause button
- Timeline scrubbing (tap to seek)
- Auto-scroll timeline to follow playhead
- Seamless playback across clip boundaries

### 5. Clip Management
- Select clip by tapping on timeline
- Delete selected clip
- Add new clips from camera or gallery
- All changes are non-destructive

## Usage

### Basic Setup

```typescript
import TimelineEditor from './components/timeline/TimelineEditor';

<TimelineEditor
  clips={clips}
  onClipsUpdate={(updatedClips) => {
    // Handle clip updates
    setClips(updatedClips);
  }}
  onBack={() => navigation.goBack()}
  onNext={() => navigation.navigate('Export')}
/>
```

### Integration with PreviewScreen

The `PreviewScreen` component automatically uses `TimelineEditor` when clips are available:

```typescript
// PreviewScreen.tsx automatically switches to TimelineEditor
// for multi-clip editing
```

## Timeline Scale

- **Base scale**: 60 pixels per second
- **Minimum clip width**: 40 pixels
- **Timeline height**: 100 pixels
- **Clip height**: 80 pixels

## Performance Considerations

1. **Thumbnail Generation**
   - Thumbnails are generated asynchronously
   - Cached in `FileSystem.cacheDirectory`
   - Reused across renders

2. **Playback Updates**
   - Status polling at ~30fps (33ms intervals)
   - Optimized to avoid unnecessary re-renders

3. **Timeline Rendering**
   - Only visible clips are rendered
   - Virtual scrolling for large timelines
   - Memoized calculations

## Export Integration

When exporting, use the trim points:

```typescript
// For each clip, apply trim points during export
const trimStart = clip.trimStart ?? 0;
const trimEnd = clip.trimEnd ?? clip.duration;

// Use FFmpeg to trim:
// -ss ${trimStart} -t ${trimEnd - trimStart}
```

## Future Enhancements

1. **Transitions**: Add transitions between clips
2. **Audio Sync**: Better audio/video synchronization
3. **Keyframe Editing**: Support for keyframe-based editing
4. **Multi-track**: Support multiple video/audio tracks
5. **Effects**: Apply effects to individual clips
6. **Text Overlays**: Add text overlays to clips
7. **Speed Ramping**: Variable speed within clips

## Troubleshooting

### Thumbnails not showing
- Check that `thumbnailGenerator.ts` has proper permissions
- Verify image/video files are accessible
- Check cache directory permissions

### Playback not syncing
- Ensure `currentTime` is updated correctly
- Check that `MultiClipPlayer` is receiving correct clip data
- Verify video refs are properly registered

### Trim handles not working
- Check that `onTrimStart` and `onTrimEnd` callbacks are provided
- Verify `pixelsPerSecond` calculation is correct
- Ensure clip has valid duration

### Drag-and-drop not working
- Check that `onClipReorder` callback is provided
- Verify `handleClipDragEnd` is calculating target index correctly
- Ensure clips have valid timeline positions

