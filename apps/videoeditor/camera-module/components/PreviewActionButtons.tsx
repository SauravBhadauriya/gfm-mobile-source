import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import FilterButton from "./preview-actions/FilterButton";
import MusicButton from "./preview-actions/MusicButton";
import OverlayButton from "./preview-actions/OverlayButton";
import StickerButton from "./preview-actions/StickerButton";
import TextButton from "./preview-actions/TextButton";
import TransitionButton from "./preview-actions/TransitionButton";
import VoiceButton from "./preview-actions/VoiceButton";
import SoundFXButton from "./preview-actions/SoundFXButton";
import CaptionsButton from "./preview-actions/CaptionsButton";
import AdjustButton from "./preview-actions/AdjustButton";
import CutoutButton from "./preview-actions/CutoutButton";
import LinksButton from "./preview-actions/LinksButton";
import PasteButton from "./preview-actions/PasteButton";

import type { FilterConfig } from "../types/filters";
import type {
  VoiceOverlay,
  SoundEffect,
  Caption,
  AdjustSettings,
  Cutout,
  Link,
} from "../types/voiceOverlay.types";

interface PreviewActionButtonsProps {
  displayUri?: string;
  onFilter?: (filter: FilterConfig) => void;
  onOverlay?: () => void;
  onText?: () => void;
  onSticker?: (sticker?: string | number) => void;
  onMusic?: () => void;
  onTransition?: () => void;
  onVoiceAdd?: (voice: VoiceOverlay) => void;
  onSoundFXAdd?: (sound: SoundEffect) => void;
  onCaptionAdd?: (caption: Caption) => void;
  onAdjustChange?: (settings: AdjustSettings) => void;
  onCutoutAdd?: (cutout: Cutout) => void;
  onLinkAdd?: (link: Link) => void;
  onPaste?: (content: string) => void;
  startTime?: number;
}

/**
 * Bottom action buttons bar for preview editor
 * Contains all editing tools: filters, text, voice, captions, effects, etc.
 */
const PreviewActionButtons: React.FC<PreviewActionButtonsProps> = ({
  displayUri,
  onFilter,
  onOverlay,
  onText,
  onSticker,
  onMusic,
  onTransition,
  onVoiceAdd,
  onSoundFXAdd,
  onCaptionAdd,
  onAdjustChange,
  onCutoutAdd,
  onLinkAdd,
  onPaste,
  startTime = 0,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <MusicButton onPress={onMusic} />
      <TextButton onPress={onText} />
      <VoiceButton onPress={onVoiceAdd} onVoiceAdd={onVoiceAdd} startTime={startTime} />
      <LinksButton onPress={onLinkAdd} onLinkAdd={onLinkAdd} />
      <CaptionsButton onPress={onCaptionAdd} onCaptionAdd={onCaptionAdd} />
      <AdjustButton onPress={onAdjustChange} onAdjustChange={onAdjustChange} />
      <FilterButton mediaUri={displayUri || ""} onFilterApply={onFilter || (() => {})} />
      <OverlayButton onPress={onOverlay} />
      <SoundFXButton onPress={onSoundFXAdd} onSoundSelect={onSoundFXAdd} />
      <CutoutButton onPress={onCutoutAdd} onCutoutAdd={onCutoutAdd} />
      <StickerButton onPress={onSticker} onStickerSelect={onSticker} />
      <PasteButton onPress={onPaste} onPaste={onPaste} />
      <TransitionButton onPress={onTransition} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
  },
});

export default PreviewActionButtons;
