# Developer Guide - Gully Fame Video Editor

## Project Overview

This is a complete video editing application built with React Native + Expo. It includes a mobile app for video capture/editing and an admin dashboard for content management.

## Project Structure

```
gfm-mobile-source/
├── apps/
│   ├── gully-fame-admin/          # Admin dashboard (Next.js)
│   ├── gully-fame-mobile/         # Mobile app (React Native)
│   └── videoeditor/               # Video editor (Expo)
├── packages/                       # Shared packages
└── package.json                    # Root package config
```

## Video Editor Architecture

### Core Screens

1. **CameraScreen** - Capture photos/videos with settings
   - Location: `apps/videoeditor/camera-module/screens/CameraScreen.tsx`
   - Features: Resolution (HD/4K), Frame rate (24/30/60fps), Color mode (SDR/HDR), Speed (0.5x-5x)

2. **PreviewScreen** - Edit single or multiple clips
   - Location: `apps/videoeditor/camera-module/screens/PreviewScreen.tsx`
   - Routes to ModernPreviewEditor (single) or TimelineEditor (multiple)

3. **ModernPreviewEditor** - Single clip editing
   - Location: `apps/videoeditor/camera-module/components/ModernPreviewEditor.tsx`
   - Features: Play/pause, timeline, text overlays, filters, speed control

4. **TimelineEditor** - Multi-clip editing
   - Location: `apps/videoeditor/camera-module/components/timeline/TimelineEditor.tsx`
   - Features: Clip sequencing, transitions, audio management

5. **ExportScreen** - Video composition and export
   - Location: `apps/videoeditor/camera-module/components/ExportScreen.tsx`
   - Uses FFmpeg for video processing

### Data Model

**CameraClip** - Main media unit

```typescript
{
  id: string;
  uri: string;
  duration: number;
  type: 'photo' | 'video';
  source: 'camera' | 'gallery';
  speed?: number;
  speedSegments?: SpeedSegment[];
  filterPreset?: FilterPreset;
  trimStart?: number;
  trimEnd?: number;
  textOverlays?: TextOverlay[];
  audioTracks?: AudioTrack[];
  transitions?: ClipTransition[];
  voiceOverlays?: VoiceOverlay[];
  soundEffects?: SoundEffect[];
  captions?: Caption[];
  links?: Link[];
  cutouts?: Cutout[];
  adjustSettings?: AdjustSettings;
  resolution?: 'HD' | '4K';
  frameRate?: 24 | 30 | 60;
  colorMode?: 'SDR' | 'HDR';
}
```

### Key Components

**Text Overlays**

- `TextOverlay.tsx` - Renders text with Done/Edit/Delete buttons
- `DraggableTextOverlays.tsx` - Manages draggable text overlays
- `TextEditorModal.tsx` - Text editing interface

**Audio & Music**

- `MusicLibraryModal.tsx` - Music selection
- `AudioTrackEditor.tsx` - Audio track editing
- `AudioTracksPanel.tsx` - Audio management

**Transitions**

- `TransitionSelector.tsx` - Transition selection
- `TransitionsPanel.tsx` - Transition management

**Action Buttons** (in `preview-actions/`)

- `FilterButton.tsx` - Visual filters
- `TextButton.tsx` - Text overlay
- `VoiceButton.tsx` - Voice recording
- `SoundFXButton.tsx` - Sound effects
- `CaptionsButton.tsx` - Captions/subtitles
- `AdjustButton.tsx` - Brightness, contrast, etc.
- `CutoutButton.tsx` - Cutout effects
- `LinksButton.tsx` - Interactive links
- `PasteButton.tsx` - Clipboard paste
- `MusicButton.tsx` - Music library
- `TransitionButton.tsx` - Transitions
- `StickerButton.tsx` - Stickers
- `OverlayButton.tsx` - Overlays

### Hooks

**useCamera** - Camera capture logic

```typescript
const { cameraRef, isRecording, takePhoto, startRecording, stopRecording } = useCamera(mode, flash);
```

**useUndoRedo** - History management

```typescript
const { history, canUndo, canRedo, addToHistory, undo, redo } = useUndoRedo(initialState);
```

**useMusicAndTransitions** - Audio and transition state

```typescript
const { audioTracks, transitions, addAudioTrack, addTransition } = useMusicAndTransitions(clip);
```

**usePermissions** - Permission handling

```typescript
const { cameraPermission, mediaLibraryPermission, requestCameraPermission } = usePermissions();
```

### Utilities

**Timeline Helpers** (`utils/timelineHelpers.ts`)

- `calculateTimelinePositions()` - Position clips sequentially
- `getClipAtTimelineTime()` - Find clip at timeline position
- `getClipEffectiveDuration()` - Duration after trimming

**Video Export** (`utils/videoExporter.ts`)

- `exportAndCombineClips()` - Compose and export video
- `exportSingleClip()` - Export single clip

**Filter Helpers** (`utils/ffmpegFilters.ts`)

- `applyPresetToVideo()` - Apply filter to video
- `applyPresetToImage()` - Apply filter to image

## State Management Flow

### Capture Flow

```
CameraScreen → useCamera Hook → CameraClip → clips[]
```

### Edit Flow

```
ModernPreviewEditor → State Updates → onClipUpdate() → clips[]
```

### Multi-clip Flow

```
TimelineEditor → calculateTimelinePositions() → clips[] with timeline
```

### Export Flow

```
ExportScreen → exportAndCombineClips() → FFmpeg → MP4 → Gallery
```

### Undo/Redo Flow

```
useUndoRedo Hook → history[] → undo()/redo() → clips[]
```

## Features Implemented

### Video Settings

- Resolution: HD, 4K
- Frame Rate: 24, 30, 60 fps
- Color Mode: SDR, HDR
- Speed: 0.5x, 1x, 2x, 3x, 5x

### Editing Tools

- Text Overlays (with Done/Edit/Delete buttons)
- Filters (brightness, contrast, saturation, etc.)
- Transitions (fade, slide, zoom, wipe)
- Music Library
- Audio Tracks (music, voiceover, sound effects)
- Voice Recording
- Sound Effects (6 built-in)
- Captions (with styles: Regular, Bold, Italic, Outline)
- Adjust (8 controls: brightness, contrast, saturation, hue, temperature, tint, sharpness, blur)
- Links (interactive CTAs)
- Cutout Effects (circle, rectangle, custom)
- Paste (clipboard content)
- Stickers
- Overlays

### Timeline Features

- Multi-clip sequencing
- Clip trimming
- Speed segments (variable speed)
- Undo/Redo
- Real-time preview

### Export

- FFmpeg-based composition
- Filter application during export
- Gallery save
- Progress tracking

## Development Workflow

### Adding a New Feature

1. **Define Types** - Add to `types/` directory
2. **Create Component** - Add to `components/` or `preview-actions/`
3. **Add Handler** - Update ModernPreviewEditor or TimelineEditor
4. **Integrate** - Add to PreviewActionButtons
5. **Test** - Verify with single and multiple clips

### File Organization

```
camera-module/
├── components/           # UI components
│   ├── preview-actions/  # Action buttons
│   ├── timeline/         # Timeline components
│   └── ...
├── screens/              # Main screens
├── hooks/                # Custom hooks
├── types/                # TypeScript types
├── utils/                # Utility functions
├── styles/               # Styling
└── assets/               # Images, fonts
```

## Key Technologies

- **React Native 0.81.5** - Mobile framework
- **Expo 54.0.19** - Development platform
- **React 19.1.0** - UI library
- **FFmpeg Kit** - Video processing
- **React Native Reanimated** - Animations
- **Expo Camera** - Camera access
- **Expo Media Library** - Gallery access
- **React Native Gesture Handler** - Touch handling

## Common Tasks

### Modify Speed Options

File: `components/SpeedSelector.tsx`

- Update `speedOptions` array
- Update `speedLabels` object
- Update ModernPreviewEditor speed controls

### Add New Filter

1. Define in `types/filters.ts`
2. Create FFmpeg command in `utils/ffmpegFilters.ts`
3. Add to FilterButton options
4. Update export logic

### Add New Transition

1. Define in `types/transitions.types.ts`
2. Add to TransitionSelector options
3. Implement in export pipeline

### Add New Audio Feature

1. Define in `types/voiceOverlay.types.ts`
2. Create component in `preview-actions/`
3. Add handler in ModernPreviewEditor
4. Update export logic

## Performance Optimization

- Timeline renders only visible frames (3 fps)
- Text overlays only render visible ones
- Speed segments for efficient variable playback
- Memoized callbacks with useCallback
- Lazy component loading

## Testing Checklist

- [ ] Single clip editing works
- [ ] Multiple clips sequence correctly
- [ ] Text overlays appear and are draggable
- [ ] Filters apply in preview and export
- [ ] Speed changes work smoothly
- [ ] Undo/Redo functions properly
- [ ] Export completes successfully
- [ ] Gallery save works
- [ ] All permissions requested
- [ ] No memory leaks on navigation

## Troubleshooting

**Video won't play**

- Check clip URI is valid
- Verify permissions granted
- Check FFmpeg installation

**Export fails**

- Check disk space
- Verify FFmpeg Kit installed
- Check file permissions

**Text overlay not visible**

- Check opacity > 0
- Verify position within bounds
- Check timing for video clips

**Performance issues**

- Reduce timeline frame count
- Disable real-time preview
- Check for memory leaks

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "FEATURE: Description"

# Push and create PR
git push origin feature/feature-name
```

## Deployment

Video editor runs on Expo. To build:

```bash
# Development
npm run start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## Support

For issues or questions, check:

1. Component documentation in code
2. Type definitions in `types/`
3. Utility functions in `utils/`
4. Example usage in screens

---

**Last Updated**: May 19, 2026
**Version**: 1.0.0
**Status**: Production Ready
