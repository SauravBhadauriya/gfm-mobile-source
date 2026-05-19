/**
 * INTEGRATION EXAMPLE - How to integrate Phase 1 components into ModernPreviewEditor
 *
 * This file shows the exact code needed to integrate Music & Transitions
 * into the existing ModernPreviewEditor component.
 *
 * Copy and paste the relevant sections into ModernPreviewEditor.tsx
 */

import React, { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";

// ============ IMPORTS ============
import MusicLibraryModal from "./camera-module/components/MusicLibraryModal";
import TransitionSelector from "./camera-module/components/TransitionSelector";
import AudioTracksPanel from "./camera-module/components/AudioTracksPanel";
import TransitionsPanel from "./camera-module/components/TransitionsPanel";
import PreviewActionButtons from "./camera-module/components/PreviewActionButtons";
import { useMusicAndTransitions } from "./camera-module/hooks/useMusicAndTransitions";
import type { AudioTrack, Music } from "./camera-module/types/music.types";
import type { Transition, ClipTransition } from "./camera-module/types/transitions.types";
import type { CameraClip } from "./camera-module/types/camera.types";

// ============ EXAMPLE COMPONENT ============

interface ModernPreviewEditorProps {
  clip: CameraClip;
  onClipUpdate?: (updatedClip: CameraClip) => void;
  // ... other props
}

const ModernPreviewEditor: React.FC<ModernPreviewEditorProps> = ({
  clip,
  onClipUpdate,
  // ... other props
}) => {
  // ============ STEP 1: USE THE HOOK ============
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

  // ============ STEP 2: ADD LOCAL STATE ============
  const [audioExpanded, setAudioExpanded] = useState(true);
  const [transitionExpanded, setTransitionExpanded] = useState(true);

  // ============ STEP 3: ADD HANDLERS ============

  /**
   * Handle music selection from library
   */
  const handleSelectMusic = useCallback(
    (music: Music) => {
      // Create audio track from selected music
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

      // Add to state
      addAudioTrack(audioTrack);

      // Update clip with audio tracks
      if (onClipUpdate) {
        onClipUpdate({
          ...clip,
          audioTracks: [...(clip.audioTracks || []), audioTrack],
        });
      }

      // Close modal
      closeMusicModal();
    },
    [clip, addAudioTrack, closeMusicModal, onClipUpdate]
  );

  /**
   * Handle transition selection
   */
  const handleSelectTransition = useCallback(
    (transition: Transition) => {
      // Create clip transition
      const clipTransition: ClipTransition = {
        id: `transition-${Date.now()}`,
        clipId: clip.id,
        transition,
        position: "end",
      };

      // Add to state
      addTransition(clipTransition);

      // Update clip with transitions
      if (onClipUpdate) {
        onClipUpdate({
          ...clip,
          transitions: [...(clip.transitions || []), clipTransition],
        });
      }

      // Close modal
      closeTransitionModal();
    },
    [clip, addTransition, closeTransitionModal, onClipUpdate]
  );

  /**
   * Handle audio track update
   */
  const handleUpdateAudioTrack = useCallback(
    (trackId: string, updates: Partial<AudioTrack>) => {
      updateAudioTrack(trackId, updates);

      // Update clip
      if (onClipUpdate) {
        const updatedTracks = audioTracks.map((track) =>
          track.id === trackId ? { ...track, ...updates } : track
        );
        onClipUpdate({
          ...clip,
          audioTracks: updatedTracks,
        });
      }
    },
    [audioTracks, updateAudioTrack, onClipUpdate, clip]
  );

  /**
   * Handle audio track deletion
   */
  const handleDeleteAudioTrack = useCallback(
    (trackId: string) => {
      removeAudioTrack(trackId);

      // Update clip
      if (onClipUpdate) {
        const updatedTracks = audioTracks.filter((track) => track.id !== trackId);
        onClipUpdate({
          ...clip,
          audioTracks: updatedTracks,
        });
      }
    },
    [audioTracks, removeAudioTrack, onClipUpdate, clip]
  );

  /**
   * Handle transition deletion
   */
  const handleDeleteTransition = useCallback(
    (transitionId: string) => {
      removeTransition(transitionId);

      // Update clip
      if (onClipUpdate) {
        const updatedTransitions = transitions.filter((t) => t.id !== transitionId);
        onClipUpdate({
          ...clip,
          transitions: updatedTransitions,
        });
      }
    },
    [transitions, removeTransition, onClipUpdate, clip]
  );

  // ============ STEP 4: RENDER JSX ============

  return (
    <View style={{ flex: 1 }}>
      {/* Existing preview content */}
      <View style={{ flex: 1 }}>{/* Video preview, timeline, etc. */}</View>

      {/* Action buttons with music and transition buttons */}
      <PreviewActionButtons
        displayUri={clip.uri}
        onFilter={handleFilter}
        onOverlay={handleOverlay}
        onText={handleText}
        onSticker={handleSticker}
        onMusic={openMusicModal}
        onTransition={openTransitionModal}
      />

      {/* Scrollable panels for audio tracks and transitions */}
      <ScrollView style={{ maxHeight: 300 }}>
        {/* Audio Tracks Panel */}
        <AudioTracksPanel
          tracks={audioTracks}
          onUpdateTrack={handleUpdateAudioTrack}
          onDeleteTrack={handleDeleteAudioTrack}
          maxDuration={clip.duration}
          isExpanded={audioExpanded}
          onToggleExpand={() => setAudioExpanded(!audioExpanded)}
        />

        {/* Transitions Panel */}
        <TransitionsPanel
          transitions={transitions}
          onDeleteTransition={handleDeleteTransition}
          isExpanded={transitionExpanded}
          onToggleExpand={() => setTransitionExpanded(!transitionExpanded)}
        />
      </ScrollView>

      {/* ============ STEP 5: ADD MODALS ============ */}

      {/* Music Library Modal */}
      <MusicLibraryModal
        visible={showMusicModal}
        onSelect={handleSelectMusic}
        onCancel={closeMusicModal}
        selectedMusic={audioTracks.find((t) => t.type === "music") || null}
      />

      {/* Transition Selector Modal */}
      <TransitionSelector
        visible={showTransitionModal}
        onSelect={handleSelectTransition}
        onCancel={closeTransitionModal}
        selectedTransition={transitions[0]?.transition || null}
      />
    </View>
  );
};

export default ModernPreviewEditor;

// ============ SUMMARY OF CHANGES ============

/**
 * CHANGES NEEDED IN ModernPreviewEditor.tsx:
 *
 * 1. ADD IMPORTS:
 *    - MusicLibraryModal
 *    - TransitionSelector
 *    - AudioTracksPanel
 *    - TransitionsPanel
 *    - useMusicAndTransitions hook
 *    - Music, AudioTrack types
 *    - Transition, ClipTransition types
 *
 * 2. ADD HOOK CALL:
 *    const { audioTracks, addAudioTrack, ... } = useMusicAndTransitions();
 *
 * 3. ADD STATE:
 *    const [audioExpanded, setAudioExpanded] = useState(true);
 *    const [transitionExpanded, setTransitionExpanded] = useState(true);
 *
 * 4. ADD HANDLERS:
 *    - handleSelectMusic()
 *    - handleSelectTransition()
 *    - handleUpdateAudioTrack()
 *    - handleDeleteAudioTrack()
 *    - handleDeleteTransition()
 *
 * 5. UPDATE PreviewActionButtons:
 *    - Add onMusic={openMusicModal}
 *    - Add onTransition={openTransitionModal}
 *
 * 6. ADD PANELS:
 *    - AudioTracksPanel
 *    - TransitionsPanel
 *
 * 7. ADD MODALS:
 *    - MusicLibraryModal
 *    - TransitionSelector
 *
 * 8. UPDATE onClipUpdate:
 *    - Include audioTracks in updated clip
 *    - Include transitions in updated clip
 */

// ============ TESTING CHECKLIST ============

/**
 * MANUAL TESTING:
 *
 * ✅ Music Library Modal
 *    - [ ] Modal opens when Music button clicked
 *    - [ ] Can search music by title
 *    - [ ] Can filter by category
 *    - [ ] Can select music
 *    - [ ] Selected music appears in AudioTracksPanel
 *    - [ ] Can close modal
 *
 * ✅ Transition Selector
 *    - [ ] Modal opens when Transition button clicked
 *    - [ ] Can select transition type
 *    - [ ] Can adjust duration
 *    - [ ] Selected transition appears in TransitionsPanel
 *    - [ ] Can close modal
 *
 * ✅ Audio Tracks Panel
 *    - [ ] Shows added music tracks
 *    - [ ] Can adjust volume
 *    - [ ] Can mute/unmute
 *    - [ ] Can delete track
 *    - [ ] Panel can collapse/expand
 *
 * ✅ Transitions Panel
 *    - [ ] Shows added transitions
 *    - [ ] Shows transition type and duration
 *    - [ ] Can delete transition
 *    - [ ] Panel can collapse/expand
 *
 * ✅ Data Persistence
 *    - [ ] Audio tracks saved to clip
 *    - [ ] Transitions saved to clip
 *    - [ ] Data persists on navigation
 *    - [ ] Data persists on re-render
 */
