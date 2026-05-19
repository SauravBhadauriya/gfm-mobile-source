# Video Editor Architecture Diagrams

## 1. Component Hierarchy Tree

```
App (index.tsx)
│
├── CameraScreen
│   ├── Camera (expo-camera)
│   ├── Camera Controls
│   │   ├── FlashToggle
│   │   ├── CameraSwitchButton
│   │   ├── ZoomSlider
│   │   ├── SpeedSelector
│   │   ├── TimerSelector
│   │   ├── ModeToggle
│   │   └── HDSelector
│   ├── CaptureButton
│   └── ClipList
│       └── ClipItem (for each clip)
│
├── PreviewScreen
│   ├── ModernPreviewEditor (Single Clip)
│   │   ├── Top Bar
│   │   │   ├── Back Button
│   │   │   ├── Media Info
│   │   │   └── Next Button
│   │   │
│   │   ├── Media Preview
│   │   │   ├── FilteredVideo (if video)
│   │   │   │   └── Video (expo-av)
│   │   │   └── FilteredImage (if photo)
│   │   │
│   │   ├── Overlays
│   │   │   ├── Play Button (when paused)
│   │   │   ├── Progress Bar (when playing)
│   │   │   ├── Time Display
│   │   │   └── DraggableTextOverlays
│   │   │       └── TextOverlay (for each text)
│   │   │           ├── Text Content
│   │   │           └── Action Buttons
│   │   │               ├── Done Button
│   │   │               ├── Edit Button
│   │   │               └── Delete Button
│   │   │
│   │   ├── Action Buttons
│   │   │   ├── Delete Button
│   │   │   ├── Add Button
│   │   │   └── Trim Button
│   │   │
│   │   ├── Timeline Section (video only)
│   │   │   ├── Timeline Controls
│   │   │   │   ├── Undo Button
│   │   │   │   ├── Play/Pause Button
│   │   │   │   └── Redo Button
│   │   │   │
│   │   │   ├── Timeline
│   │   │   │   ├── ScrollView (horizontal)
│   │   │   │   ├── Frames (for each frame)
│   │   │   │   └── Center Indicator (playhead)
│   │   │   │
│   │   │   └── Speed Controls
│   │   │       ├── 0.5x Button
│   │   │       ├── 1x Button
│   │   │       ├── 2x Button
│   │   │       └── 3x Button
│   │   │
│   │   ├── PreviewActionButtons
│   │   │   ├── FilterButton
│   │   │   ├── OverlayButton
│   │   │   ├── TextButton
│   │   │   ├── StickerButton
│   │   │   ├── MusicButton
│   │   │   └── TransitionButton
│   │   │
│   │   ├── AddClipOverlay (modal)
│   │   ├── DeleteConfirmationModal (modal)
│   │   └── TextEditorModal (modal)
│   │
│   └── TimelineEditor (Multiple Clips)
│       ├── Multi-clip Timeline
│       ├── Clip Sequencing
│       └── Transitions
│
└── ExportScreen
    ├── Header
    ├── Progress Indicator
    ├── Status Text
    └── Export Button
```

## 2. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                         │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
            CAPTURE      EDIT        EXPORT
                │           │           │
                ▼           ▼           ▼
        ┌──────────────┬──────────────┬──────────────┐
        │ CameraScreen │ PreviewScreen│ ExportScreen │
        └──────────────┴──────────────┴──────────────┘
                │           │           │
                ▼           ▼           ▼
        ┌──────────────┬──────────────┬──────────────┐
        │ useCamera    │ useUndoRedo  │ FFmpegKit    │
        │ Hook         │ Hook         │ Library      │
        └──────────────┴──────────────┴──────────────┘
                │           │           │
                ▼           ▼           ▼
        ┌──────────────┬──────────────┬──────────────┐
        │ CameraClip[] │ CameraClip[] │ MP4 Output   │
        │ (clips)      │ (edited)     │ (final)      │
        └──────────────┴──────────────┴──────────────┘
                │           │           │
                └───────────┼───────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │ Gallery / Storage│
                    └──────────────────┘
```

## 3. State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  COMPONENT STATE                            │
└─────────────────────────────────────────────────────────────┘

ModernPreviewEditor:
  ├─ isPlaying: boolean
  ├─ duration: number
  ├─ currentTime: number
  ├─ selectedSpeed: number
  ├─ selectedFilter: FilterConfig | null
  ├─ selectedTextOverlay: TextOverlay | null
  ├─ selectedOverlayId: string | null
  ├─ showTrimHandles: boolean
  ├─ showAddClipOverlay: boolean
  ├─ showDeleteModal: boolean
  ├─ showTextEditor: boolean
  └─ previewDimensions: { width, height }

DraggableTextOverlays:
  ├─ draggingId: string | null
  ├─ dragStartPos: { x, y }
  └─ isDragRef: boolean

PreviewScreen:
  ├─ currentClipIndex: number
  ├─ updatedClips: CameraClip[]
  ├─ showExport: boolean
  └─ undoRedo: UndoRedoState

TimelineEditor:
  ├─ clips: CameraClip[]
  ├─ currentTime: number
  ├─ isPlaying: boolean
  └─ selectedClip: CameraClip | null

ExportScreen:
  ├─ exporting: boolean
  ├─ progress: number
  ├─ status: string
  └─ exportedUri: string | null
```

## 4. Clip Editing Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIP EDITING PIPELINE                     │
└──────────────────────────────────────────────────────────────┘

1. CAPTURE
   ├─ CameraScreen
   ├─ useCamera Hook
   └─ CameraClip created

2. PREVIEW (Single Clip)
   ├─ ModernPreviewEditor
   ├─ Display media
   ├─ Play/Pause/Seek
   └─ Apply filters

3. EDIT
   ├─ Add Text Overlays
   │  ├─ TextEditorModal
   │  ├─ TextOverlay created
   │  └─ DraggableTextOverlays renders
   │
   ├─ Add Music/Audio
   │  ├─ MusicLibraryModal
   │  ├─ AudioTrack created
   │  └─ AudioTracksPanel manages
   │
   ├─ Add Transitions
   │  ├─ TransitionSelector
   │  ├─ ClipTransition created
   │  └─ TransitionsPanel manages
   │
   └─ Apply Filters
      ├─ FilterButton
      ├─ FilterPreset selected
      └─ Preview updated

4. MULTI-CLIP (if multiple)
   ├─ TimelineEditor
   ├─ calculateTimelinePositions()
   ├─ Reorder clips
   ├─ Add transitions between clips
   └─ Manage audio tracks

5. EXPORT
   ├─ ExportScreen
   ├─ exportAndCombineClips()
   ├─ For each clip:
   │  ├─ Apply filter
   │  ├─ Apply speed
   │  └─ Convert to MP4
   ├─ Concatenate clips
   ├─ Save to gallery
   └─ Show success

6. SAVE
   ├─ MediaLibrary.createAssetAsync()
   ├─ MediaLibrary.createAlbumAsync()
   └─ Video saved to gallery
```

## 5. Timeline Composition

```
┌──────────────────────────────────────────────────────────────┐
│              TIMELINE COMPOSITION PROCESS                    │
└──────────────────────────────────────────────────────────────┘

Input: CameraClip[]
  ├─ Clip 1 (Video, 5s)
  ├─ Clip 2 (Photo, 3s default)
  └─ Clip 3 (Video, 8s)

calculateTimelinePositions():
  ├─ Clip 1: timelineStart=0, timelineEnd=5
  ├─ Clip 2: timelineStart=5, timelineEnd=8
  └─ Clip 3: timelineStart=8, timelineEnd=16

Timeline Visualization:
  0s ├─────────────────────────────────────────────────────────┤ 16s
     │ Clip 1 (5s)  │ Clip 2 (3s) │ Clip 3 (8s)              │
     │ Video        │ Photo       │ Video                    │
     │ 0-5s         │ 5-8s        │ 8-16s                    │
     └─────────────────────────────────────────────────────────┘

Playback:
  ├─ Play Clip 1 (0-5s)
  ├─ Transition to Clip 2 (5-8s)
  ├─ Transition to Clip 3 (8-16s)
  └─ End

Export:
  ├─ Process Clip 1 → processed_0.mp4
  ├─ Process Clip 2 → image_1.mp4 (3s video from photo)
  ├─ Process Clip 3 → processed_2.mp4
  ├─ Create concat list
  ├─ FFmpeg concat
  └─ Output: final_video.mp4
```

## 6. Text Overlay Interaction

```
┌──────────────────────────────────────────────────────────────┐
│              TEXT OVERLAY INTERACTION FLOW                   │
└──────────────────────────────────────────────────────────────┘

1. ADD TEXT
   ├─ User taps "Text" button
   ├─ TextEditorModal opens
   ├─ User enters text
   ├─ User customizes (font, color, size, etc.)
   └─ User taps "Save"

2. TEXT SAVED
   ├─ TextOverlay created
   ├─ Added to clip.textOverlays[]
   ├─ DraggableTextOverlays renders
   └─ Text appears on preview

3. SELECT TEXT
   ├─ User taps text on preview
   ├─ onOverlayPress() called
   ├─ selectedOverlayId set
   ├─ Selection border appears (dashed purple)
   └─ Action buttons appear above text

4. ACTION BUTTONS
   ├─ Done Button
   │  ├─ Confirm text
   │  ├─ Close editor
   │  └─ Keep text on video
   │
   ├─ Edit Button
   │  ├─ Open TextEditorModal
   │  ├─ Load current text properties
   │  └─ Allow modifications
   │
   └─ Delete Button
      ├─ Remove from clip.textOverlays[]
      ├─ Text disappears from preview
      └─ Update clip

5. DRAG TEXT
   ├─ User drags selected text
   ├─ PanResponder tracks movement
   ├─ onOverlayUpdate() called
   ├─ Position updated (x, y in 0-1 range)
   └─ Preview updates in real-time

6. EXPORT
   ├─ Text overlays included in export
   ├─ Rendered on final video
   └─ Saved to gallery
```

## 7. Filter Application Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│              FILTER APPLICATION PIPELINE                     │
└──────────────────────────────────────────────────────────────┘

PREVIEW (Real-time):
  ├─ User selects filter
  ├─ FilterButton → handleFilter()
  ├─ FilterPreset applied to state
  ├─ FilteredVideo/FilteredImage component
  ├─ react-native-color-matrix-image-filters
  └─ Preview updated instantly

EXPORT (FFmpeg):
  ├─ exportAndCombineClips()
  ├─ For each clip:
  │  ├─ Check if clipHasFilter()
  │  ├─ If yes:
  │  │  ├─ applyPresetToVideo() or applyPresetToImage()
  │  │  ├─ FFmpeg command generated
  │  │  ├─ Filter applied to file
  │  │  └─ Output: processed_X.mp4
  │  └─ If no:
  │     └─ Copy file as-is
  │
  ├─ Concatenate processed clips
  └─ Final video with filters applied

Filter Types:
  ├─ Brightness
  ├─ Contrast
  ├─ Saturation
  ├─ Hue
  ├─ Blur
  ├─ Sepia
  ├─ Grayscale
  └─ Custom presets
```

## 8. Speed Control System

```
┌──────────────────────────────────────────────────────────────┐
│              SPEED CONTROL SYSTEM                            │
└──────────────────────────────────────────────────────────────┘

SIMPLE SPEED (Legacy):
  ├─ clip.speed: number (0.5, 1, 2, 3)
  ├─ Applied to entire clip
  └─ Used for backward compatibility

VARIABLE SPEED (Advanced):
  ├─ clip.speedSegments: SpeedSegment[]
  ├─ Each segment has:
  │  ├─ startTime: number
  │  ├─ endTime: number
  │  └─ speed: number
  │
  ├─ Example:
  │  ├─ 0-2s: 1x (normal)
  │  ├─ 2-4s: 2x (fast)
  │  └─ 4-6s: 0.5x (slow)
  │
  └─ Playback:
     ├─ getSpeedAtTime(currentTime)
     ├─ Find matching segment
     ├─ setRateAsync(speed)
     └─ Smooth playback

EXPORT:
  ├─ If clip.speed != 1:
  │  ├─ FFmpeg setpts filter
  │  ├─ atempo filter for audio
  │  └─ Output: sped_X.mp4
  │
  └─ If speedSegments:
     ├─ Complex FFmpeg command
     ├─ Multiple segments
     └─ Output: sped_X.mp4
```

## 9. Undo/Redo System

```
┌──────────────────────────────────────────────────────────────┐
│              UNDO/REDO SYSTEM                                │
└──────────────────────────────────────────────────────────────┘

useUndoRedo Hook:
  ├─ history: State[]
  ├─ currentIndex: number
  ├─ canUndo: boolean
  ├─ canRedo: boolean
  │
  ├─ addToHistory(state)
  │  ├─ Trim future history
  │  ├─ Add new state
  │  └─ Update currentIndex
  │
  ├─ undo()
  │  ├─ currentIndex--
  │  └─ Return previous state
  │
  └─ redo()
     ├─ currentIndex++
     └─ Return next state

Usage in PreviewScreen:
  ├─ Before any edit:
  │  └─ undoRedo.addToHistory({ clips: updatedClips })
  │
  ├─ Undo button:
  │  ├─ handleUndo()
  │  ├─ previousState = undoRedo.undo()
  │  ├─ setUpdatedClips(previousState.clips)
  │  └─ onClipUpdate(previousState.clips)
  │
  └─ Redo button:
     ├─ handleRedo()
     ├─ nextState = undoRedo.redo()
     ├─ setUpdatedClips(nextState.clips)
     └─ onClipUpdate(nextState.clips)

History Stack:
  ├─ [State 0] ← Initial
  ├─ [State 1] ← After edit 1
  ├─ [State 2] ← After edit 2 (current)
  ├─ [State 3] ← After edit 3
  └─ [State 4] ← After edit 4

Undo: 2 → 1 → 0
Redo: 1 → 2 → 3 → 4
```

## 10. Export Process Flow

```
┌──────────────────────────────────────────────────────────────┐
│              EXPORT PROCESS FLOW                             │
└──────────────────────────────────────────────────────────────┘

START
  │
  ├─ ExportScreen mounted
  ├─ Request media library permission
  └─ Auto-start export

PROCESSING (0-70%)
  ├─ For each clip (i=0 to n):
  │  ├─ Progress: 10% + (i/n)*60%
  │  ├─ Status: "Processing clip X of Y"
  │  │
  │  ├─ If video:
  │  │  ├─ Apply filter (if exists)
  │  │  ├─ Apply speed (if != 1)
  │  │  └─ Output: processed_i.mp4
  │  │
  │  └─ If photo:
  │     ├─ Apply filter (if exists)
  │     ├─ Convert to 3s video
  │     └─ Output: image_i.mp4
  │
  └─ All clips processed

COMBINING (70-85%)
  ├─ Create concat list
  ├─ FFmpeg concat command
  ├─ Progress: 70-85%
  ├─ Status: "Combining clips..."
  └─ Output: final_video.mp4

FINALIZING (85-95%)
  ├─ Save to gallery
  ├─ MediaLibrary.createAssetAsync()
  ├─ MediaLibrary.createAlbumAsync()
  ├─ Progress: 95%
  └─ Status: "Almost done..."

SUCCESS (95-100%)
  ├─ Progress: 100%
  ├─ Status: "Export complete!"
  ├─ Show success alert
  ├─ exportedUri set
  └─ User can close

ERROR
  ├─ Catch exception
  ├─ Show error alert
  ├─ Status: "Export failed"
  ├─ Offer retry
  └─ User can go back
```

---

**Diagrams Complete** ✅

These diagrams provide visual representations of the video editor's architecture, data flow, and key processes.
