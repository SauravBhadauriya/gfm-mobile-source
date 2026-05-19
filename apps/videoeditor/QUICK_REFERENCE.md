# 🚀 Phase 1 Quick Reference Guide

## 📦 What's New

### New Components (6)

1. **MusicLibraryModal** - Browse and select music
2. **TransitionSelector** - Select and configure transitions
3. **TransitionButton** - Action button for transitions
4. **AudioTrackEditor** - Edit individual audio tracks
5. **AudioTracksPanel** - Display all audio tracks
6. **TransitionsPanel** - Display all transitions

### New Types (2)

1. **music.types.ts** - Music and audio types
2. **transitions.types.ts** - Transition types with 12 presets

### New Hook (1)

1. **useMusicAndTransitions** - State management

---

## 🎯 Quick Integration

### 1. Import Components

```typescript
import MusicLibraryModal from "./components/MusicLibraryModal";
import TransitionSelector from "./components/TransitionSelector";
import AudioTracksPanel from "./components/AudioTracksPanel";
import TransitionsPanel from "./components/TransitionsPanel";
import { useMusicAndTransitions } from "./hooks/useMusicAndTransitions";
```

### 2. Use Hook

```typescript
const {
  audioTracks,
  addAudioTrack,
  updateAudioTrack,
  removeAudioTrack,
  transitions,
  addTransition,
  removeTransition,
  showMusicModal,
  openMusicModal,
  closeMusicModal,
  showTransitionModal,
  openTransitionModal,
  closeTransitionModal,
} = useMusicAndTransitions();
```

### 3. Add Modals

```typescript
<MusicLibraryModal
  visible={showMusicModal}
  onSelect={handleSelectMusic}
  onCancel={closeMusicModal}
/>

<TransitionSelector
  visible={showTransitionModal}
  onSelect={handleSelectTransition}
  onCancel={closeTransitionModal}
/>
```

### 4. Add Panels

```typescript
<AudioTracksPanel
  tracks={audioTracks}
  onUpdateTrack={handleUpdateTrack}
  onDeleteTrack={handleDeleteTrack}
  maxDuration={clip.duration}
/>

<TransitionsPanel
  transitions={transitions}
  onDeleteTransition={handleDeleteTransition}
/>
```

### 5. Update Action Buttons

```typescript
<PreviewActionButtons
  onMusic={openMusicModal}
  onTransition={openTransitionModal}
  // ... other props
/>
```

---

## 📊 Component Props

### MusicLibraryModal

```typescript
interface MusicPickerModalProps {
  visible: boolean;
  onSelect: (music: Music) => void;
  onCancel: () => void;
  selectedMusic?: Music | null;
}
```

### TransitionSelector

```typescript
interface TransitionSelectorModalProps {
  visible: boolean;
  onSelect: (transition: Transition) => void;
  onCancel: () => void;
  selectedTransition?: Transition | null;
}
```

### AudioTracksPanel

```typescript
interface AudioTracksPanelProps {
  tracks: AudioTrack[];
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  onDeleteTrack: (trackId: string) => void;
  maxDuration: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}
```

### TransitionsPanel

```typescript
interface TransitionsPanelProps {
  transitions: ClipTransition[];
  onDeleteTransition: (transitionId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}
```

---

## 🎵 Music Types

### Music

```typescript
interface Music {
  id: string;
  title: string;
  artist: string;
  duration: number;
  genre?: string;
  mood?: string;
  audioUrl: string;
  isLicensed: boolean;
}
```

### AudioTrack

```typescript
interface AudioTrack {
  id: string;
  uri: string;
  type: "music" | "voiceover" | "sound-effect";
  startTime: number;
  endTime: number;
  volume: number; // 0-1
  fadeIn?: number;
  fadeOut?: number;
  isMuted?: boolean;
}
```

---

## 🎬 Transition Types

### Transition

```typescript
interface Transition {
  id: string;
  type: "fade" | "slide" | "zoom" | "wipe" | "dissolve" | "push" | "reveal";
  duration: number; // milliseconds
  direction?: "left" | "right" | "up" | "down";
  intensity?: number; // 0-1
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}
```

### ClipTransition

```typescript
interface ClipTransition {
  id: string;
  clipId: string;
  transition: Transition;
  position: "start" | "end";
}
```

---

## 🎯 Transition Presets

| Name        | Type     | Duration | Category    |
| ----------- | -------- | -------- | ----------- |
| Fade        | fade     | 300ms    | Basic       |
| Slide Left  | slide    | 400ms    | Directional |
| Slide Right | slide    | 400ms    | Directional |
| Slide Up    | slide    | 400ms    | Directional |
| Slide Down  | slide    | 400ms    | Directional |
| Zoom In     | zoom     | 350ms    | Zoom        |
| Zoom Out    | zoom     | 350ms    | Zoom        |
| Dissolve    | dissolve | 300ms    | Basic       |
| Wipe Left   | wipe     | 400ms    | Wipe        |
| Wipe Right  | wipe     | 400ms    | Wipe        |
| Push Left   | push     | 400ms    | Push        |
| Push Right  | push     | 400ms    | Push        |

---

## 🔄 Hook Methods

### Audio Track Methods

```typescript
// Add audio track
addAudioTrack(track: AudioTrack): void

// Update audio track
updateAudioTrack(trackId: string, updates: Partial<AudioTrack>): void

// Remove audio track
removeAudioTrack(trackId: string): void

// Clear all audio tracks
clearAudioTracks(): void
```

### Transition Methods

```typescript
// Add transition
addTransition(clipTransition: ClipTransition): void

// Update transition
updateTransition(transitionId: string, updates: Partial<Transition>): void

// Remove transition
removeTransition(transitionId: string): void

// Clear all transitions
clearTransitions(): void
```

### Modal Methods

```typescript
// Music modal
openMusicModal(): void
closeMusicModal(): void

// Transition modal
openTransitionModal(): void
closeTransitionModal(): void
```

---

## 💻 Example Usage

### Adding Music

```typescript
const handleSelectMusic = (music: Music) => {
  const audioTrack: AudioTrack = {
    id: `audio-${Date.now()}`,
    uri: music.audioUrl,
    type: "music",
    startTime: 0,
    endTime: Math.min(music.duration, clip.duration),
    volume: 1,
    fadeIn: 0.5,
    fadeOut: 0.5,
    isMuted: false,
  };

  addAudioTrack(audioTrack);
  closeMusicModal();
};
```

### Adding Transition

```typescript
const handleSelectTransition = (transition: Transition) => {
  const clipTransition: ClipTransition = {
    id: `transition-${Date.now()}`,
    clipId: clip.id,
    transition,
    position: "end",
  };

  addTransition(clipTransition);
  closeTransitionModal();
};
```

### Updating Audio Track

```typescript
const handleUpdateAudioTrack = (trackId: string, updates: Partial<AudioTrack>) => {
  updateAudioTrack(trackId, updates);
};
```

### Deleting Audio Track

```typescript
const handleDeleteAudioTrack = (trackId: string) => {
  removeAudioTrack(trackId);
};
```

---

## 🎨 UI Features

### Music Library Modal

- 🎵 Browse music library
- 🔍 Search functionality
- 🏷️ Category filtering
- ✅ Selection feedback
- 📱 Dark theme

### Transition Selector

- 🎬 Visual previews
- ⏱️ Duration adjustment
- 📂 Category organization
- ✅ Selection feedback
- 🎨 Consistent styling

### Audio Track Editor

- 🔊 Volume control
- 🔇 Mute toggle
- ⏱️ Time display
- 🗑️ Delete button
- 📊 Visual feedback

### Panels

- 📋 List display
- 🎯 Badge count
- 📂 Collapsible
- 🗑️ Delete buttons
- 🎨 Professional styling

---

## 📁 File Locations

```
apps/videoeditor/
├── camera-module/
│   ├── types/
│   │   ├── music.types.ts
│   │   ├── transitions.types.ts
│   │   └── camera.types.ts (updated)
│   ├── components/
│   │   ├── MusicLibraryModal.tsx
│   │   ├── TransitionSelector.tsx
│   │   ├── AudioTrackEditor.tsx
│   │   ├── AudioTracksPanel.tsx
│   │   ├── TransitionsPanel.tsx
│   │   ├── PreviewActionButtons.tsx (updated)
│   │   └── preview-actions/
│   │       └── TransitionButton.tsx
│   └── hooks/
│       └── useMusicAndTransitions.ts
├── PHASE_1_IMPLEMENTATION.md
├── INTEGRATION_EXAMPLE.tsx
└── QUICK_REFERENCE.md (this file)
```

---

## ✅ Checklist

### Before Integration

- [ ] Read PHASE_1_IMPLEMENTATION.md
- [ ] Review INTEGRATION_EXAMPLE.tsx
- [ ] Check component props
- [ ] Understand data flow

### During Integration

- [ ] Import all components
- [ ] Add hook to component
- [ ] Add state variables
- [ ] Implement handlers
- [ ] Add modals to JSX
- [ ] Add panels to JSX
- [ ] Update action buttons
- [ ] Update clip state

### After Integration

- [ ] Test music modal
- [ ] Test transition modal
- [ ] Test audio panel
- [ ] Test transition panel
- [ ] Test data persistence
- [ ] Test no console errors
- [ ] Test responsive layout

---

## 🎯 Key Points

1. **All Frontend** - No backend needed for these components
2. **Type Safe** - Full TypeScript support
3. **Ready to Use** - Copy and paste integration
4. **Well Documented** - Detailed guides included
5. **Professional UI** - Dark theme with purple accents
6. **Responsive** - Works on all screen sizes
7. **Performant** - Optimized with useCallback
8. **Modular** - Easy to extend and customize

---

## 📞 Need Help?

1. **Integration Help** → See `INTEGRATION_EXAMPLE.tsx`
2. **Component Details** → See `PHASE_1_IMPLEMENTATION.md`
3. **Component Props** → Check interfaces in type files
4. **Usage Examples** → See this quick reference
5. **Data Flow** → See diagrams in PHASE_1_IMPLEMENTATION.md

---

**Status**: ✅ Ready for Integration
**Date**: May 19, 2026
**Version**: 1.0.0
