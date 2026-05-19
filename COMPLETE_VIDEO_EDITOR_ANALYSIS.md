# Complete Video Editor Codebase Analysis

**Date**: May 19, 2026
**Status**: Comprehensive Architecture & Data Flow Analysis
**Scope**: Full video editor application (frontend only)

---

## 📋 Executive Summary

The video editor is a **React Native + Expo** application built with a modular architecture. It provides a complete video editing experience with:

- **Single & Multi-clip editing** (ModernPreviewEditor for single, TimelineEditor for multiple)
- **Real-time preview** with filters, text overlays, and transitions
- **Advanced playback control** (speed segments, variable playback rates)
- **Media composition** (clips, photos, audio tracks, transitions)
- **Export pipeline** (FFmpeg-based video composition and filter application)

**Key Technologies**:

- React 19.1.0, React Native 0.81.5, Expo 54.0.19
- FFmpeg Kit (video processing)
- React Native Reanimated (animations)
- Expo Camera, Media Library, Image Picker
- React Native Gesture Handler (drag/drop)

---

## 🏗️ Architecture Overview

### High-Level Flow

```
CameraScreen (Capture)
    ↓
PreviewScreen (Edit Single/Multiple)
    ├─→ ModernPreviewEditor (Single Clip)
    │   ├─ Video/Photo Preview
    │   ├─ Timeline (Video only)
    │   ├─ Text Overlays
    │   ├─ Filters
    │   ├─ Speed Control
    │   └─ Action Buttons
    │
    └─→ TimelineEditor (Multiple Clips)
        ├─ Multi-clip Timeline
        ├─ Clip Sequencing
        ├─ Transitions
        └─ Audio Tracks
    ↓
ExportScreen (Compose & Save)
    ├─ FFmpeg Processing
    ├─ Filter Application
    ├─ Clip Concatenation
    └─ Gallery Save
```

### Component Hierarchy

```
App (index.tsx)
├── CameraScreen
│   ├── Camera Controls (Flash, Zoom, Speed, Timer, Mode)
│   ├── Capture Button
│   └── Clip List
│
├── PreviewScreen
│   ├── ModernPreviewEditor (Single Clip)
│   │   ├── Media Preview (FilteredVideo/FilteredImage)
│   │   ├── Timeline (ScrollView with frames)
│   │   ├── Text Overlays (DraggableTextOverlays)
│   │   ├── Action Buttons (Delete, Add, Trim)
│   │   ├── Timeline Controls (Undo, Play, Redo)
│   │   ├── Speed Controls
│   │   └── PreviewActionButtons
│   │       ├── FilterButton
│   │       ├── TextButton
│   │       ├── StickerButton
│   │       ├── MusicButton
│   │       ├── TransitionButton
│   │       └── OverlayButton
│   │
│   └── TimelineEditor (Multiple Clips)
│       ├── Multi-clip Timeline
│       ├── Clip Sequencing
│       └── Transitions
│
└── ExportScreen
    ├── Progress Indicator
    └── Export Status
```

---

## 📊 Data Model & Types

### Core Data Structures

#### 1. **CameraClip** (Main Media Unit)

```typescript
interface CameraClip {
  id: string; // Unique identifier
  uri: string; // Local file path
  duration: number; // Video duration (seconds)
  type: "photo" | "video"; // Media type
  source: "camera" | "gallery"; // Capture source

  // Speed Control
  speed?: number; // Legacy: single speed (0.3, 0.5, 1, 2, 3)
  speedSegments?: SpeedSegment[]; // Variable speed segments

  // Trimming
  trimStart?: number; // Start trim point (seconds)
  trimEnd?: number; // End trim point (seconds)

  // Timeline Composition
  timelineStart?: number; // Start in composed timeline
  timelineEnd?: number; // End in composed timeline

  // Metadata
  filterPreset?: FilterPreset; // Applied filter
  thumbnailUri?: string; // Cached thumbnail
  textOverlays?: TextOverlay[]; // Text overlays
  audioTracks?: AudioTrack[]; // Music/voiceover/SFX
  transitions?: ClipTransition[]; // Transitions
}
```

#### 2. **SpeedSegment** (Variable Speed)

```typescript
interface SpeedSegment {
  startTime: number; // Start in video (seconds)
  endTime: number; // End in video (seconds)
  speed: number; // Playback multiplier
}
```

#### 3. **TextOverlay** (Text on Video)

```typescript
interface TextOverlay {
  id: string;
  text: string;
  x: number; // Relative position (0-1)
  y: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  textAlign: "left" | "center" | "right";
  opacity: number;
  rotation?: number;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  startTime?: number; // Video timing (seconds)
  endTime?: number;
}
```

#### 4. **AudioTrack** (Music/Voiceover)

```typescript
interface AudioTrack {
  id: string;
  type: "music" | "voiceover" | "sound_effect";
  uri: string;
  duration: number;
  volume: number; // 0-1
  startTime: number; // When to start in timeline
  isMuted: boolean;
}
```

#### 5. **ClipTransition** (Between Clips)

```typescript
interface ClipTransition {
  id: string;
  type: string; // 'fade', 'slide', 'zoom', etc.
  duration: number; // Transition duration (seconds)
  easing?: string; // Animation easing
}
```

#### 6. **FilterPreset** (Visual Effects)

```typescript
interface FilterPreset {
  name: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  // ... other filter properties
}
```

---

## 🔄 Data Flow & State Management

### 1. **Clip Capture Flow**

```
CameraScreen
  ↓
useCamera Hook
  ├─ takePhoto() → CameraClip (photo)
  └─ startRecording() → CameraClip (video)
  ↓
CameraClip added to clips array
  ↓
PreviewScreen receives clips
```

### 2. **Single Clip Editing Flow**

```
ModernPreviewEditor (receives CameraClip)
  ↓
State Management:
  ├─ isPlaying: boolean
  ├─ currentTime: number
  ├─ duration: number
  ├─ selectedSpeed: number
  ├─ selectedFilter: FilterConfig | null
  ├─ selectedTextOverlay: TextOverlay | null
  └─ showTrimHandles: boolean
  ↓
User Actions:
  ├─ Play/Pause → togglePlayPause()
  ├─ Seek → seekTo(time)
  ├─ Speed Change → handleSpeedChange(speed)
  ├─ Filter Apply → handleFilter(filter)
  ├─ Text Add → handleText()
  ├─ Text Edit → handleTextOverlayPress(overlay)
  ├─ Text Save → handleTextOverlaySave(overlay)
  └─ Delete → handleDeletePress()
  ↓
onClipUpdate() callback
  ↓
PreviewScreen updates clips array
```

### 3. **Multi-Clip Editing Flow**

```
TimelineEditor (receives CameraClip[])
  ↓
calculateTimelinePositions(clips)
  ├─ For each clip:
  │   ├─ Calculate effective duration
  │   ├─ Set timelineStart
  │   └─ Set timelineEnd
  ↓
State Management:
  ├─ clips: CameraClip[]
  ├─ currentTime: number
  ├─ isPlaying: boolean
  └─ selectedClip: CameraClip | null
  ↓
User Actions:
  ├─ Reorder clips
  ├─ Add transitions
  ├─ Adjust audio tracks
  └─ Trim clips
  ↓
onClipsUpdate() callback
```

### 4. **Undo/Redo Flow**

```
useUndoRedo Hook
  ├─ history: State[]
  ├─ currentIndex: number
  ├─ addToHistory(state)
  ├─ undo() → previousState
  └─ redo() → nextState
  ↓
PreviewScreen
  ├─ handleUndo() → restore previous clips
  └─ handleRedo() → restore next clips
```

### 5. **Export Flow**

```
ExportScreen
  ↓
exportAndCombineClips(clips)
  ├─ For each clip:
  │   ├─ Apply filter (if exists)
  │   ├─ Apply speed (if != 1)
  │   └─ Convert to MP4
  ├─ Create concat list
  ├─ Combine all clips with FFmpeg
  └─ Return output path
  ↓
Save to Gallery
  ├─ MediaLibrary.createAssetAsync()
  └─ MediaLibrary.createAlbumAsync()
  ↓
Success Alert
```

---

## 🎬 Key Components Deep Dive

### 1. **ModernPreviewEditor** (Single Clip Editing)

**Purpose**: Main editor for single clip with full editing capabilities

**Key Features**:

- Video/Photo preview with play/pause
- Timeline with frame thumbnails (video only)
- Speed control (0.5x, 1x, 2x, 3x)
- Text overlay management
- Filter application
- Trim controls
- Undo/Redo

**State Management**:

```typescript
const [isPlaying, setIsPlaying] = useState(false);
const [duration, setDuration] = useState(0);
const [currentTime, setCurrentTime] = useState(0);
const [selectedSpeed, setSelectedSpeed] = useState(1);
const [selectedFilter, setSelectedFilter] = useState<FilterConfig | null>(null);
const [selectedTextOverlay, setSelectedTextOverlay] = useState<TextOverlay | null>(null);
const [showTrimHandles, setShowTrimHandles] = useState(false);
```

**Key Methods**:

- `togglePlayPause()` - Play/pause video
- `seekTo(time)` - Jump to specific time
- `handleSpeedChange(speed)` - Change playback speed
- `handleFilter(filter)` - Apply filter
- `handleText()` - Add text overlay
- `handleTextOverlayPress(overlay)` - Select text for editing
- `handleTextOverlaySave(overlay)` - Save text changes
- `handleTrim()` - Toggle trim mode

**Rendering**:

- Top bar with back/next buttons
- Media preview (FilteredVideo or FilteredImage)
- Play button overlay (when paused)
- Progress bar (when playing)
- Time display (current/total)
- Text overlays (DraggableTextOverlays)
- Action buttons (Delete, Add, Trim)
- Timeline section (video only)
- Speed controls (video only)
- Preview action buttons (Filter, Text, Music, etc.)

---

### 2. **DraggableTextOverlays** (Text Management)

**Purpose**: Render and manage draggable text overlays on preview

**Key Features**:

- Render visible text overlays
- Drag to reposition
- Tap to select/edit
- Show action buttons (Done, Edit, Delete)
- Timing support (show/hide based on video time)

**State Management**:

```typescript
const [draggingId, setDraggingId] = useState<string | null>(null);
const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
```

**Key Methods**:

- `getVisibleOverlays()` - Filter overlays by timing
- `getPanResponder(overlay)` - Create gesture handler
- `onOverlayUpdate(overlay)` - Update position
- `onOverlayPress(overlay)` - Select overlay

**Interaction Flow**:

1. User taps text → `onOverlayPress()` → Select overlay
2. Selection border appears (dashed purple)
3. Action buttons appear above text
4. User can:
   - **Done**: Confirm text (close editor)
   - **Edit**: Open text editor modal
   - **Delete**: Remove text overlay
5. User can drag to reposition (only when selected)

---

### 3. **TextOverlay** (Text Rendering)

**Purpose**: Render individual text overlay with action buttons

**Key Features**:

- Render text with styling
- Show action buttons when editing
- Selection border (dashed purple)
- Support for background, stroke, rotation

**Props**:

```typescript
interface TextOverlayProps {
  overlay: TextOverlay;
  containerWidth: number;
  containerHeight: number;
  currentTime?: number;
  isEditing?: boolean;
  onPress?: () => void;
  onDone?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

**Action Buttons**:

- **Done Button** (Purple): Confirm text, close editor
- **Edit Button** (Purple): Open text editor modal
- **Delete Button** (Red): Remove text overlay

---

### 4. **TimelineEditor** (Multi-Clip Editing)

**Purpose**: Edit multiple clips as a sequence

**Key Features**:

- Display all clips in timeline
- Reorder clips
- Add/remove clips
- Apply transitions
- Manage audio tracks
- Trim individual clips

**State Management**:

```typescript
const [clips, setClips] = useState<CameraClip[]>(clips);
const [currentTime, setCurrentTime] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);
```

**Key Methods**:

- `calculateTimelinePositions(clips)` - Position clips sequentially
- `getClipAtTimelineTime(time)` - Find clip at timeline position
- `handleClipReorder(fromIndex, toIndex)` - Reorder clips
- `handleAddTransition(clipIndex, transition)` - Add transition

---

### 5. **PreviewActionButtons** (Feature Access)

**Purpose**: Bottom action bar for accessing editing features

**Components**:

- **FilterButton** - Apply visual filters
- **TextButton** - Add text overlay
- **StickerButton** - Add stickers
- **MusicButton** - Add music/audio
- **TransitionButton** - Add transitions
- **OverlayButton** - Add overlays

**Props**:

```typescript
interface PreviewActionButtonsProps {
  displayUri?: string;
  onFilter?: (filter: FilterConfig) => void;
  onOverlay?: () => void;
  onText?: () => void;
  onSticker?: (sticker?: string | number) => void;
  onMusic?: () => void;
  onTransition?: () => void;
}
```

---

### 6. **ExportScreen** (Video Composition)

**Purpose**: Compose clips and export final video

**Key Features**:

- Progress tracking
- FFmpeg-based composition
- Filter application during export
- Gallery save
- Error handling

**Export Process**:

1. Process each clip (apply filters, convert to MP4)
2. Create concat list
3. Combine clips with FFmpeg
4. Save to gallery
5. Show success/error

**State Management**:

```typescript
const [exporting, setExporting] = useState(false);
const [progress, setProgress] = useState(0);
const [status, setStatus] = useState("Preparing export...");
const [exportedUri, setExportedUri] = useState<string | null>(null);
```

---

## 🎯 Key Hooks

### 1. **useCamera** (Capture)

```typescript
const { cameraRef, isRecording, takePhoto, startRecording, stopRecording } = useCamera(mode, flash);
```

**Functionality**:

- Manage camera reference
- Capture photos
- Record videos
- Handle max duration

---

### 2. **useMusicAndTransitions** (Audio & Transitions)

```typescript
const {
  audioTracks,
  transitions,
  addAudioTrack,
  removeAudioTrack,
  updateAudioTrack,
  addTransition,
  removeTransition,
} = useMusicAndTransitions(clip);
```

**Functionality**:

- Manage audio tracks
- Manage transitions
- Update audio properties
- Add/remove transitions

---

### 3. **useUndoRedo** (History)

```typescript
const { history, currentIndex, canUndo, canRedo, addToHistory, undo, redo, reset } =
  useUndoRedo(initialState);
```

**Functionality**:

- Track state history
- Undo/redo operations
- Check undo/redo availability

---

### 4. **usePermissions** (Access Control)

```typescript
const {
  cameraPermission,
  mediaLibraryPermission,
  requestCameraPermission,
  requestMediaLibraryPermission,
} = usePermissions();
```

**Functionality**:

- Request camera permission
- Request media library permission
- Check permission status

---

## 🛠️ Utility Functions

### Timeline Helpers

```typescript
getClipEffectiveDuration(clip); // Duration after trimming
calculateTimelinePositions(clips); // Position clips sequentially
getTotalTimelineDuration(clips); // Total timeline duration
getClipAtTimelineTime(clips, time); // Find clip at time
timelineTimeToClipTime(clip, time); // Convert timeline → clip time
clipTimeToTimelineTime(clip, time); // Convert clip → timeline time
clampTrimPoints(clip); // Validate trim points
```

### Filter Helpers

```typescript
hasFilterChanges(filter); // Check if filter is modified
clipHasFilter(clip); // Check if clip has filter
applyPresetToVideo(input, output, preset); // Apply filter to video
applyPresetToImage(input, output, preset); // Apply filter to image
```

### Video Export

```typescript
exportAndCombineClips(clips, onProgress); // Compose and export
exportSingleClip(clip, output, onProgress); // Export single clip
```

### Media Types

```typescript
CameraModeEnum.Photo; // Photo mode
CameraModeEnum.Video; // Video mode
```

---

## 📱 Screen Flow

### 1. **CameraScreen**

- Capture photos/videos
- Display clip list
- Navigate to preview

### 2. **PreviewScreen**

- Single clip: ModernPreviewEditor
- Multiple clips: TimelineEditor
- Navigate to export

### 3. **ExportScreen**

- Compose clips
- Apply filters
- Save to gallery

---

## 🎨 Styling & Theme

**Color Scheme**:

- Primary: `#ec9a15` (Orange/Gold)
- Background: `#000000` (Black)
- Text: `#ffffff` (White)
- Accent: `#7C3AED` (Purple)
- Error: `#ff4444` (Red)

**Component Styling**:

- Dark theme throughout
- Glassmorphism effects (semi-transparent backgrounds)
- Smooth animations (Reanimated)
- Shadow effects for depth

---

## 🔌 Dependencies & Libraries

### Core

- `react` 19.1.0
- `react-native` 0.81.5
- `expo` ~54.0.19

### Camera & Media

- `expo-camera` ~17.0.10
- `expo-av` ~16.0.8
- `expo-media-library` 18.2.1
- `expo-image-picker` ~17.0.10

### Video Processing

- `ffmpeg-kit-react-native-community` 6.0.2-fork.1

### UI & Animations

- `react-native-reanimated` 4.2.2
- `react-native-gesture-handler` ^2.29.1
- `@shopify/react-native-skia` 2.2.12
- `react-native-svg` 15.12.1

### Filters

- `react-native-color-matrix-image-filters` ^8.0.2

### Navigation

- `expo-router` ^6.0.13
- `@react-navigation/native` ^7.1.8

---

## 🚀 Performance Considerations

### 1. **Timeline Rendering**

- Frames generated at 3 fps (efficient)
- ScrollView with horizontal scrolling
- Lazy rendering of visible frames

### 2. **Text Overlay Management**

- Only visible overlays rendered
- Timing-based visibility (video)
- Efficient pan responder per overlay

### 3. **Video Playback**

- Speed segments for variable playback
- Playback rate changes during playback
- Auto-loop with 1-second pause

### 4. **Export Process**

- FFmpeg for efficient video composition
- Progress tracking
- Temp file cleanup

---

## 🔐 Security & Permissions

### Required Permissions

- **Camera**: Photo/video capture
- **Media Library**: Save to gallery
- **Image Picker**: Import from gallery

### Permission Flow

1. Request permission on first use
2. Show alert if denied
3. Graceful fallback

---

## 📝 Integration Points

### 1. **Adding New Features**

- Add to PreviewActionButtons
- Create feature component
- Integrate with clip data model
- Add to export pipeline

### 2. **Modifying Clip Data**

- Update CameraClip interface
- Update calculateTimelinePositions if needed
- Update export logic

### 3. **Adding Filters**

- Define FilterPreset
- Add to FilterButton options
- Implement FFmpeg filter command
- Add to export pipeline

### 4. **Adding Transitions**

- Define ClipTransition
- Add to TransitionButton options
- Implement transition logic
- Add to export pipeline

---

## 🐛 Known Patterns & Best Practices

### 1. **State Management**

- Use useState for local component state
- Use useCallback for memoized callbacks
- Use useRef for non-rendering values
- Use useEffect for side effects

### 2. **Performance**

- Memoize expensive calculations
- Use ScrollView for long lists
- Lazy load components
- Clean up timers/intervals

### 3. **Error Handling**

- Try/catch for async operations
- Alert for user-facing errors
- Console.warn for non-critical issues
- Graceful fallbacks

### 4. **Accessibility**

- Use activeOpacity for touch feedback
- Provide text labels for icons
- Use semantic colors
- Support screen readers

---

## 📊 File Statistics

**Total Components**: 30+
**Total Hooks**: 4
**Total Utility Files**: 12
**Total Type Files**: 6
**Lines of Code**: ~5,000+
**Package Size**: ~48 KB (minified)

---

## 🎯 Next Steps for Enhancement

### Phase 1 (Completed)

- ✅ Music library integration
- ✅ Transitions system
- ✅ Text overlay with Done button

### Phase 2 (Planned)

- Advanced trim controls
- Aspect ratio selection
- Video effects (blur, zoom, speed ramping)

### Phase 3 (Planned)

- Sticker system
- Advanced filters
- Voiceover recording

### Phase 4 (Planned)

- Picture-in-Picture
- Green screen
- Draft saving

---

## 📚 Documentation Files

- `CODEBASE_ANALYSIS.md` - High-level overview
- `DETAILED_FILE_BREAKDOWN.md` - File-by-file explanation
- `API_ENDPOINTS_AND_TYPES.md` - Data types and structures
- `FOLDER_STRUCTURE_GUIDE.md` - Directory organization
- `VIDEO_EDITOR_ENHANCEMENT_PLAN.md` - 4-phase roadmap
- `PHASE_1_IMPLEMENTATION.md` - Music & Transitions details
- `INTEGRATION_EXAMPLE.tsx` - Integration guide
- `QUICK_REFERENCE.md` - Quick lookup guide

---

## 🔗 Key File References

### Core Components

- `ModernPreviewEditor.tsx` - Single clip editor
- `TimelineEditor.tsx` - Multi-clip editor
- `PreviewScreen.tsx` - Preview screen container
- `CameraScreen.tsx` - Camera capture screen
- `ExportScreen.tsx` - Export screen

### Text Overlay System

- `TextOverlay.tsx` - Text rendering with buttons
- `DraggableTextOverlays.tsx` - Text management
- `TextEditorModal.tsx` - Text editing interface
- `textOverlay.types.ts` - Type definitions

### Audio & Transitions

- `MusicLibraryModal.tsx` - Music selection
- `AudioTrackEditor.tsx` - Audio editing
- `AudioTracksPanel.tsx` - Audio management
- `TransitionSelector.tsx` - Transition selection
- `TransitionsPanel.tsx` - Transition management
- `music.types.ts` - Audio types
- `transitions.types.ts` - Transition types

### Utilities

- `timelineHelpers.ts` - Timeline calculations
- `videoExporter.ts` - Export logic
- `ffmpegFilters.ts` - Filter application
- `filterHelpers.ts` - Filter utilities

### Hooks

- `useCamera.ts` - Camera capture
- `useMusicAndTransitions.ts` - Audio/transition state
- `useUndoRedo.ts` - History management
- `usePermissions.ts` - Permission handling

---

**Analysis Complete** ✅

This comprehensive analysis covers the entire video editor architecture, data flow, component hierarchy, and integration patterns. The codebase is well-structured, modular, and ready for feature enhancements following the 4-phase roadmap.
