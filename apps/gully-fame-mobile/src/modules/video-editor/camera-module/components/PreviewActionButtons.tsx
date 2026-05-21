import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import FilterButton from "./preview-actions/FilterButton";
import MusicButton from "./preview-actions/MusicButton";
import OverlayButton from "./preview-actions/OverlayButton";
import StickerButton from "./preview-actions/StickerButton";
import TextButton from "./preview-actions/TextButton";
import VoiceButton from "./preview-actions/VoiceButton";
import CaptionsButton from "./preview-actions/CaptionsButton";
import AdjustButton from "./preview-actions/AdjustButton";

import type { FilterConfig } from "../types/filters";

interface PreviewActionButtonsProps {
  displayUri?: string;
  onFilter?: (filter: FilterConfig) => void;
  onOverlay?: () => void;
  onText?: () => void;
  onSticker?: (sticker?: string | number) => void;
  onMusic?: () => void;
  onVoice?: () => void;
  onCaptions?: () => void;
  onAdjust?: () => void;
}

/**
 * Bottom action buttons bar for preview editor
 * Contains all editing tools: filter, overlay, text, sticker, music, voice, captions, and adjustments
 */
const PreviewActionButtons: React.FC<PreviewActionButtonsProps> = ({
  displayUri,
  onFilter,
  onOverlay,
  onText,
  onSticker,
  onMusic,
  onVoice,
  onCaptions,
  onAdjust,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FilterButton mediaUri={displayUri || ""} onFilterApply={onFilter || (() => {})} />
        <OverlayButton onPress={onOverlay} />
        <TextButton onPress={onText} />
        <StickerButton onPress={onSticker} onStickerSelect={onSticker} />
        <MusicButton onPress={onMusic} />
        <VoiceButton onPress={onVoice} />
        <CaptionsButton onPress={onCaptions} />
        <AdjustButton onPress={onAdjust} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 24,
    alignItems: "center",
  },
});

export default PreviewActionButtons;
