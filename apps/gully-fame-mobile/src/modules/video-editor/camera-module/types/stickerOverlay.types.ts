export interface StickerOverlay {
    id: string;
    source: string; // The emoji character (e.g., "🔥") or eventually an image URI
    x: number;
    y: number;
    size: number;
    rotation: number;
    startTime?: number;
    endTime?: number;
    scale?: number;
    zIndex?: number;
}
