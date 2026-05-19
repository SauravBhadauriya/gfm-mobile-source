# Video Editor Integration Guide

**Purpose**: Guide for integrating new features into the video editor
**Audience**: Frontend developers
**Last Updated**: May 19, 2026

---

## 📋 Table of Contents

1. [Adding New Features](#adding-new-features)
2. [Modifying Clip Data](#modifying-clip-data)
3. [Adding Filters](#adding-filters)
4. [Adding Transitions](#adding-transitions)
5. [Adding Audio Features](#adding-audio-features)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)
8. [Testing Checklist](#testing-checklist)

---

## 🎯 Adding New Features

### Step 1: Define Feature Type

Determine where your feature fits:

```typescript
// Option A: Clip-level feature (stored in CameraClip)
interface CameraClip {
  // ... existing properties
  myFeature?: MyFeatureData;
}

// Option B: Overlay feature (like text)
interface MyOverlay {
  id: string;
  // ... feature properties
}

// Option C: Global feature (like transitions)
interface MyTransition {
  id: string;
  // ... feature properties
}
```

### Step 2: Create Type Definition

Create a new type file in `camera-module/types/`:

```typescript
// camera-module/types/myFeature.types.ts

export interface MyFeatureData {
  id: string;
  enabled: boolean;
  intensity: number;
  // ... other properties
}

export interface MyFeatureConfig {
  name: string;
  defaultIntensity: number;
  // ... configuration
}
```

### Step 3: Create Feature Component

Create component in `camera-module/components/`:

```typescript
// camera-module/components/MyFeatureButton.tsx

import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import type { MyFeatureData } from '../types/myFeature.types';

interface MyFeatureButtonProps {
  onPress?: () => void;
  onFeatureApply?: (feature: MyFeatureData) => void;
}

const MyFeatureButton: React.FC<MyFeatureButtonProps> = ({
  onPress,
  onFeatureApply,
}) => {
  const handlePress = () => {
    const feature: MyFeatureData = {
      id: `feature-${Date.now()}`,
      enabled: true,
      intensity: 0.5,
    };
    onFeatureApply?.(feature);
    onPress?.();
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.button}>
        <Text>My Feature</Text>
      </View>
    </TouchableOpacity>
  );
};

export default MyFeatureButton;
```

### Step 4: Add to PreviewActionButtons

Update `PreviewActionButtons.tsx`:

```typescript
import MyFeatureButton from './preview-actions/MyFeatureButton';

interface PreviewActionButtonsProps {
  // ... existing props
  onMyFeature?: (feature: MyFeatureData) => void;
}

const PreviewActionButtons: React.FC<PreviewActionButtonsProps> = ({
  // ... existing props
  onMyFeature,
}) => {
  return (
    <View style={styles.container}>
      {/* ... existing buttons */}
      <MyFeatureButton onFeatureApply={onMyFeature} />
    </View>
  );
};
```

### Step 5: Integrate with ModernPreviewEditor

Update `ModernPreviewEditor.tsx`:

```typescript
const handleMyFeature = useCallback((feature: MyFeatureData) => {
  const updatedClip = {
    ...clip,
    myFeature: feature,
  };
  onClipUpdate?.(updatedClip);
}, [clip, onClipUpdate]);

// In JSX:
<PreviewActionButtons
  // ... existing props
  onMyFeature={handleMyFeature}
/>
```

### Step 6: Add Export Logic

Update `videoExporter.ts`:

```typescript
export async function exportAndCombineClips(
  clips: CameraClipArray,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  // ... existing code

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];

    // Apply your feature
    if (clip.myFeature?.enabled) {
      await applyMyFeature(processedPath, outputPath, clip.myFeature);
    }
  }

  // ... rest of export
}
```

### Step 7: Create Utility Function

Create utility in `camera-module/utils/`:

```typescript
// camera-module/utils/myFeatureHelpers.ts

import { FFmpegKit, ReturnCode } from "ffmpeg-kit-react-native-community";
import type { MyFeatureData } from "../types/myFeature.types";

export async function applyMyFeature(
  inputPath: string,
  outputPath: string,
  feature: MyFeatureData
): Promise<string> {
  const intensity = feature.intensity * 100;
  const command = `-i "${inputPath}" -filter:v "myfilter=${intensity}" -y "${outputPath}"`;

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();

  if (ReturnCode.isSuccess(returnCode)) {
    return outputPath;
  } else {
    throw new Error("Failed to apply feature");
  }
}
```

---

## 🔄 Modifying Clip Data

### Adding a New Clip Property

1. **Update Type Definition**:

```typescript
// camera-module/types/camera.types.ts
export interface CameraClip {
  // ... existing properties
  myNewProperty?: MyNewType;
}
```

2. **Update Timeline Helpers** (if needed):

```typescript
// camera-module/utils/timelineHelpers.ts
export function calculateTimelinePositions(clips: CameraClip[]): CameraClip[] {
  // If your property affects timeline, update here
  return clips.map((clip) => ({
    ...clip,
    // ... existing properties
    myNewProperty: clip.myNewProperty, // Preserve property
  }));
}
```

3. **Update Export Logic** (if needed):

```typescript
// camera-module/utils/videoExporter.ts
if (clip.myNewProperty) {
  // Apply your property during export
}
```

4. **Update State Management**:

```typescript
// In PreviewScreen or ModernPreviewEditor
const handleUpdate = useCallback(
  (updatedClip: CameraClip) => {
    const newClips = updatedClips.map((c, idx) => (idx === currentClipIndex ? updatedClip : c));
    onClipUpdate?.(newClips);
  },
  [currentClipIndex, updatedClips, onClipUpdate]
);
```

---

## 🎨 Adding Filters

### Step 1: Define Filter Preset

```typescript
// camera-module/types/filters.ts
export interface FilterPreset {
  name: string;
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  hue?: number; // 0 to 360
  blur?: number; // 0 to 100
  // ... other properties
}

export const FILTER_PRESETS: Record<string, FilterPreset> = {
  original: { name: "Original" },
  vintage: {
    name: "Vintage",
    saturation: -20,
    brightness: 10,
    hue: 30,
  },
  // ... more presets
};
```

### Step 2: Create Filter Button

```typescript
// camera-module/components/preview-actions/FilterButton.tsx
const FilterButton: React.FC<FilterButtonProps> = ({
  mediaUri,
  onFilterApply,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleSelectFilter = (preset: FilterPreset) => {
    onFilterApply(preset);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <Text>Filters</Text>
      </TouchableOpacity>

      <Modal visible={showModal}>
        {Object.values(FILTER_PRESETS).map(preset => (
          <TouchableOpacity
            key={preset.name}
            onPress={() => handleSelectFilter(preset)}
          >
            <Text>{preset.name}</Text>
          </TouchableOpacity>
        ))}
      </Modal>
    </>
  );
};
```

### Step 3: Implement FFmpeg Filter

```typescript
// camera-module/utils/ffmpegFilters.ts
export async function applyPresetToVideo(
  inputPath: string,
  outputPath: string,
  preset: FilterPreset
): Promise<string> {
  const filters = buildFilterString(preset);
  const command = `-i "${inputPath}" -filter:v "${filters}" -y "${outputPath}"`;

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();

  if (ReturnCode.isSuccess(returnCode)) {
    return outputPath;
  } else {
    throw new Error("Filter application failed");
  }
}

function buildFilterString(preset: FilterPreset): string {
  const filters: string[] = [];

  if (preset.brightness !== undefined) {
    filters.push(`brightness=${preset.brightness / 100}`);
  }
  if (preset.contrast !== undefined) {
    filters.push(`contrast=${preset.contrast / 100}`);
  }
  // ... more filters

  return filters.join(",");
}
```

### Step 4: Add Preview Support

```typescript
// camera-module/components/FilteredVideo.tsx
import { ColorMatrix } from 'react-native-color-matrix-image-filters';

const FilteredVideo: React.FC<FilteredVideoProps> = ({
  filter,
  // ... other props
}) => {
  const colorMatrix = filter ? buildColorMatrix(filter) : undefined;

  return (
    <ColorMatrix matrix={colorMatrix}>
      <Video {...props} />
    </ColorMatrix>
  );
};
```

---

## 🎬 Adding Transitions

### Step 1: Define Transition Type

```typescript
// camera-module/types/transitions.types.ts
export interface ClipTransition {
  id: string;
  type: "fade" | "slide" | "zoom" | "wipe";
  duration: number; // seconds
  easing?: "linear" | "ease-in" | "ease-out";
}

export const TRANSITION_PRESETS = {
  fade: { type: "fade", duration: 0.5 },
  slide: { type: "slide", duration: 0.5 },
  zoom: { type: "zoom", duration: 0.5 },
  wipe: { type: "wipe", duration: 0.5 },
};
```

### Step 2: Create Transition Selector

```typescript
// camera-module/components/TransitionSelector.tsx
const TransitionSelector: React.FC<TransitionSelectorProps> = ({
  onTransitionSelect,
}) => {
  return (
    <View>
      {Object.entries(TRANSITION_PRESETS).map(([key, preset]) => (
        <TouchableOpacity
          key={key}
          onPress={() => onTransitionSelect(preset)}
        >
          <Text>{key}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

### Step 3: Add to Clip

```typescript
// In ModernPreviewEditor or TimelineEditor
const handleAddTransition = useCallback(
  (transition: ClipTransition) => {
    const updatedClip = {
      ...clip,
      transitions: [...(clip.transitions || []), transition],
    };
    onClipUpdate?.(updatedClip);
  },
  [clip, onClipUpdate]
);
```

### Step 4: Implement Export Logic

```typescript
// camera-module/utils/videoExporter.ts
if (clip.transitions && clip.transitions.length > 0) {
  // Apply transitions during export
  for (const transition of clip.transitions) {
    await applyTransition(processedPath, outputPath, transition);
  }
}
```

---

## 🎵 Adding Audio Features

### Step 1: Define Audio Type

```typescript
// camera-module/types/music.types.ts
export interface AudioTrack {
  id: string;
  type: "music" | "voiceover" | "sound_effect";
  uri: string;
  duration: number;
  volume: number; // 0-1
  startTime: number; // when to start in timeline
  isMuted: boolean;
}
```

### Step 2: Create Audio Manager

```typescript
// camera-module/components/AudioTrackEditor.tsx
const AudioTrackEditor: React.FC<AudioTrackEditorProps> = ({
  track,
  onUpdate,
  onDelete,
}) => {
  const handleVolumeChange = (volume: number) => {
    onUpdate({ ...track, volume });
  };

  return (
    <View>
      <Slider
        value={track.volume}
        onValueChange={handleVolumeChange}
        min={0}
        max={1}
      />
      <TouchableOpacity onPress={() => onDelete(track.id)}>
        <Text>Delete</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Step 3: Add to Clip

```typescript
const handleAddAudio = useCallback(
  (audio: AudioTrack) => {
    const updatedClip = {
      ...clip,
      audioTracks: [...(clip.audioTracks || []), audio],
    };
    onClipUpdate?.(updatedClip);
  },
  [clip, onClipUpdate]
);
```

### Step 4: Implement Export Logic

```typescript
// Merge audio tracks during export
if (clip.audioTracks && clip.audioTracks.length > 0) {
  // Use FFmpeg to mix audio tracks
  const audioFilters = clip.audioTracks
    .map((track, idx) => `[${idx}]aformat=sample_rates=44100[a${idx}]`)
    .join(";");

  // Apply audio mixing
}
```

---

## ✅ Best Practices

### 1. **State Management**

```typescript
// ✅ Good: Use useCallback for memoized callbacks
const handleUpdate = useCallback(
  (data) => {
    // ... update logic
  },
  [dependencies]
);

// ❌ Bad: Create new function on every render
const handleUpdate = (data) => {
  // ... update logic
};
```

### 2. **Performance**

```typescript
// ✅ Good: Memoize expensive calculations
const visibleOverlays = useMemo(() => {
  return overlays.filter((o) => isVisible(o));
}, [overlays, currentTime]);

// ❌ Bad: Recalculate on every render
const visibleOverlays = overlays.filter((o) => isVisible(o));
```

### 3. **Error Handling**

```typescript
// ✅ Good: Try/catch with user feedback
try {
  await applyFeature(input, output);
} catch (error) {
  Alert.alert("Error", "Failed to apply feature");
  console.error(error);
}

// ❌ Bad: Silent failures
await applyFeature(input, output);
```

### 4. **Type Safety**

```typescript
// ✅ Good: Explicit types
const handleUpdate = (clip: CameraClip): void => {
  // ...
};

// ❌ Bad: Implicit any
const handleUpdate = (clip: any) => {
  // ...
};
```

### 5. **Component Organization**

```typescript
// ✅ Good: Separate concerns
// - Component for UI
// - Hook for logic
// - Utility for calculations
// - Type for data

// ❌ Bad: Mix everything in one file
```

---

## 🔄 Common Patterns

### Pattern 1: Feature Toggle

```typescript
const handleToggleFeature = useCallback(
  (enabled: boolean) => {
    const updatedClip = {
      ...clip,
      myFeature: {
        ...clip.myFeature,
        enabled,
      },
    };
    onClipUpdate?.(updatedClip);
  },
  [clip, onClipUpdate]
);
```

### Pattern 2: Property Update

```typescript
const handleUpdateProperty = useCallback(
  (property: string, value: any) => {
    const updatedClip = {
      ...clip,
      [property]: value,
    };
    onClipUpdate?.(updatedClip);
  },
  [clip, onClipUpdate]
);
```

### Pattern 3: Array Management

```typescript
const handleAddItem = useCallback(
  (item: Item) => {
    const updatedClip = {
      ...clip,
      items: [...(clip.items || []), item],
    };
    onClipUpdate?.(updatedClip);
  },
  [clip, onClipUpdate]
);

const handleRemoveItem = useCallback(
  (itemId: string) => {
    const updatedClip = {
      ...clip,
      items: (clip.items || []).filter((i) => i.id !== itemId),
    };
    onClipUpdate?.(updatedClip);
  },
  [clip, onClipUpdate]
);
```

### Pattern 4: Modal Management

```typescript
const [showModal, setShowModal] = useState(false);

const handleOpen = useCallback(() => {
  setShowModal(true);
}, []);

const handleClose = useCallback(() => {
  setShowModal(false);
}, []);

const handleSave = useCallback(
  (data) => {
    // ... save logic
    handleClose();
  },
  [handleClose]
);
```

---

## 🧪 Testing Checklist

### Before Submitting Feature

- [ ] **Type Safety**
  - [ ] No `any` types
  - [ ] All props typed
  - [ ] Return types specified

- [ ] **Functionality**
  - [ ] Feature works on single clip
  - [ ] Feature works on multiple clips
  - [ ] Feature persists after navigation
  - [ ] Feature exports correctly

- [ ] **UI/UX**
  - [ ] Buttons are accessible
  - [ ] Feedback is immediate
  - [ ] Animations are smooth
  - [ ] No layout shifts

- [ ] **Performance**
  - [ ] No memory leaks
  - [ ] Smooth scrolling
  - [ ] Fast export
  - [ ] No lag during playback

- [ ] **Error Handling**
  - [ ] Graceful failures
  - [ ] User-friendly errors
  - [ ] No crashes
  - [ ] Proper logging

- [ ] **Edge Cases**
  - [ ] Empty clips
  - [ ] Very long videos
  - [ ] Multiple features combined
  - [ ] Undo/redo works

- [ ] **Documentation**
  - [ ] Code comments
  - [ ] Type documentation
  - [ ] Usage examples
  - [ ] Integration guide

---

## 📚 Reference Files

### Key Files to Understand

1. **Data Model**
   - `camera-module/types/camera.types.ts`
   - `camera-module/types/textOverlay.types.ts`
   - `camera-module/types/music.types.ts`
   - `camera-module/types/transitions.types.ts`

2. **Core Components**
   - `camera-module/components/ModernPreviewEditor.tsx`
   - `camera-module/components/PreviewActionButtons.tsx`
   - `camera-module/screens/PreviewScreen.tsx`

3. **Utilities**
   - `camera-module/utils/videoExporter.ts`
   - `camera-module/utils/timelineHelpers.ts`
   - `camera-module/utils/ffmpegFilters.ts`

4. **Hooks**
   - `camera-module/hooks/useCamera.ts`
   - `camera-module/hooks/useUndoRedo.ts`
   - `camera-module/hooks/useMusicAndTransitions.ts`

---

## 🎓 Learning Path

1. **Start Here**: Read `COMPLETE_VIDEO_EDITOR_ANALYSIS.md`
2. **Understand Architecture**: Review `VIDEO_EDITOR_ARCHITECTURE_DIAGRAMS.md`
3. **Study Examples**: Look at Phase 1 implementation (Music & Transitions)
4. **Follow Pattern**: Use this guide to add your feature
5. **Test Thoroughly**: Use testing checklist
6. **Document**: Add comments and examples

---

**Integration Guide Complete** ✅

Use this guide as a reference when adding new features to the video editor. Follow the patterns and best practices to maintain code quality and consistency.
