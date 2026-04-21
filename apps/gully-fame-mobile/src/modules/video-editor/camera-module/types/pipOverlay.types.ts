export interface PipOverlay {
    id: string;
    uri: string;
    type: "image" | "video";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    startTime?: number;
    endTime?: number;
    scale?: number;
    zIndex?: number;
    fadeIn?: number;
    fadeOut?: number;
    opacity?: number;
}
