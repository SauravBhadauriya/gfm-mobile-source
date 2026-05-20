import React from "react";
import { StyleSheet, View } from "react-native";
import FilterButton from "./preview-actions/FilterButton";
import MusicButton from "./preview-actions/MusicButton";
import OverlayButton from "./preview-actions/OverlayButton";
import StickerButton from "./preview-actions/StickerButton";
import TextButton from "./preview-actions/TextButton";

import type { FilterConfig } from "../types/filters";

interface PreviewActionButtonsProps {
  displayUri?: string;
  onFilter?: (filter: FilterConfig) => void;
  onOverlay?: () => void;
  onText?: () => void;
  onSticker?: (sticker?: string | number) => void;
  onMusic?: () => void;
}

/**
 * Bottom action buttons bar for preview editor
 * Contains filter, overlay, text, sticker, and music buttons
 */
const PreviewActionButtons: React.FC<PreviewActionButtonsProps> = ({
  displayUri,
  onFilter,
  onOverlay,
  onText,
  onSticker,
  onMusic,
}) => {
  return (
    <View style={styles.container}>
      <FilterButton mediaUri={displayUri || ""} onFilterApply={onFilter || (() => {})} />
      <OverlayButton onPress={onOverlay} />
      <TextButton onPress={onText} />
      <StickerButton onPress={onSticker} onStickerSelect={onSticker} />
      <MusicButton onPress={onMusic} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
});

export default PreviewActionButtons;
