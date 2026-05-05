/**
 * Coordinate Mapper
 *
 * Converts React Native UI coordinates to FFmpeg filter coordinates
 * Handles position, scale, rotation, and aspect ratio preservation
 */

export interface UICoordinates {
  x: number; // 0-1 normalized (0 = left, 1 = right)
  y: number; // 0-1 normalized (0 = top, 1 = bottom)
  width: number; // 0-1 normalized
  height: number; // 0-1 normalized
  scale: number; // 0.2-5.0
  rotation: number; // degrees (0-360)
  zIndex: number; // layer order
}

export interface FFmpegCoordinates {
  x: number; // pixel position
  y: number; // pixel position
  width: number; // pixel width
  height: number; // pixel height
  scale: number; // FFmpeg scale factor
  rotation: number; // radians
  zIndex: number; // layer order
}

export interface VideoDimensions {
  width: number;
  height: number;
}

/**
 * Convert normalized UI coordinates to FFmpeg pixel coordinates
 */
export const mapUIToFFmpeg = (
  uiCoords: UICoordinates,
  videoDimensions: VideoDimensions
): FFmpegCoordinates => {
  // Convert normalized coordinates to pixels
  const pixelX = Math.round(uiCoords.x * videoDimensions.width);
  const pixelY = Math.round(uiCoords.y * videoDimensions.height);
  const pixelWidth = Math.round(uiCoords.width * videoDimensions.width);
  const pixelHeight = Math.round(uiCoords.height * videoDimensions.height);

  // Apply scale
  const scaledWidth = Math.round(pixelWidth * uiCoords.scale);
  const scaledHeight = Math.round(pixelHeight * uiCoords.scale);

  // Center the scaled element
  const centeredX = Math.round(pixelX + (pixelWidth - scaledWidth) / 2);
  const centeredY = Math.round(pixelY + (pixelHeight - scaledHeight) / 2);

  // Convert rotation to radians
  const rotationRadians = (uiCoords.rotation * Math.PI) / 180;

  return {
    x: centeredX,
    y: centeredY,
    width: scaledWidth,
    height: scaledHeight,
    scale: uiCoords.scale,
    rotation: rotationRadians,
    zIndex: uiCoords.zIndex,
  };
};

/**
 * Convert FFmpeg coordinates back to UI coordinates
 */
export const mapFFmpegToUI = (
  ffmpegCoords: FFmpegCoordinates,
  videoDimensions: VideoDimensions
): UICoordinates => {
  // Convert pixels to normalized coordinates
  const normalizedX = ffmpegCoords.x / videoDimensions.width;
  const normalizedY = ffmpegCoords.y / videoDimensions.height;
  const normalizedWidth = ffmpegCoords.width / videoDimensions.width;
  const normalizedHeight = ffmpegCoords.height / videoDimensions.height;

  // Convert rotation to degrees
  const rotationDegrees = (ffmpegCoords.rotation * 180) / Math.PI;

  return {
    x: normalizedX,
    y: normalizedY,
    width: normalizedWidth,
    height: normalizedHeight,
    scale: ffmpegCoords.scale,
    rotation: rotationDegrees,
    zIndex: ffmpegCoords.zIndex,
  };
};

/**
 * Generate FFmpeg overlay filter string
 */
export const generateOverlayFilter = (
  ffmpegCoords: FFmpegCoordinates,
  inputLabel: string = "1"
): string => {
  // Basic overlay with position and size
  let filter = `[0:v][${inputLabel}]overlay=x=${ffmpegCoords.x}:y=${ffmpegCoords.y}:w=${ffmpegCoords.width}:h=${ffmpegCoords.height}`;

  // Add rotation if needed
  if (ffmpegCoords.rotation !== 0) {
    filter += `:rotation=${ffmpegCoords.rotation}`;
  }

  return filter;
};

/**
 * Generate FFmpeg scale filter string
 */
export const generateScaleFilter = (
  width: number,
  height: number,
  preserveAspectRatio: boolean = true
): string => {
  if (preserveAspectRatio) {
    // Use -1 to preserve aspect ratio
    return `scale=${width}:-1`;
  }
  return `scale=${width}:${height}`;
};

/**
 * Generate FFmpeg rotate filter string
 */
export const generateRotateFilter = (rotationRadians: number): string => {
  return `rotate=${rotationRadians}`;
};

/**
 * Generate FFmpeg drawtext filter for text overlays
 */
export const generateTextFilter = (
  text: string,
  ffmpegCoords: FFmpegCoordinates,
  options: {
    fontsize?: number;
    fontcolor?: string;
    fontfile?: string;
    fontweight?: number;
    boxcolor?: string;
    box?: boolean;
  } = {}
): string => {
  const {
    fontsize = 24,
    fontcolor = "white",
    fontfile,
    fontweight = 400,
    boxcolor = "black",
    box = false,
  } = options;

  let filter = `drawtext=text='${text}':x=${ffmpegCoords.x}:y=${ffmpegCoords.y}:fontsize=${fontsize}:fontcolor=${fontcolor}`;

  if (fontfile) {
    filter += `:fontfile='${fontfile}'`;
  }

  if (box) {
    filter += `:box=1:boxcolor=${boxcolor}`;
  }

  return filter;
};

/**
 * Generate FFmpeg fade filter
 */
export const generateFadeFilter = (
  fadeIn: number = 0,
  fadeOut: number = 0,
  totalDuration: number
): string => {
  let filter = "";

  if (fadeIn > 0) {
    // Fade in: start=0, duration=fadeIn
    filter += `fade=t=in:st=0:d=${fadeIn}`;
  }

  if (fadeOut > 0) {
    // Fade out: start=(duration-fadeOut), duration=fadeOut
    const fadeOutStart = Math.max(0, totalDuration - fadeOut);
    if (filter) {
      filter += ",";
    }
    filter += `fade=t=out:st=${fadeOutStart}:d=${fadeOut}`;
  }

  return filter;
};

/**
 * Calculate aspect ratio
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

/**
 * Fit dimensions to aspect ratio
 */
export const fitToAspectRatio = (
  width: number,
  height: number,
  targetAspectRatio: number
): { width: number; height: number } => {
  const currentAspectRatio = calculateAspectRatio(width, height);

  if (currentAspectRatio > targetAspectRatio) {
    // Width is too large, reduce it
    return {
      width: Math.round(height * targetAspectRatio),
      height,
    };
  } else {
    // Height is too large, reduce it
    return {
      width,
      height: Math.round(width / targetAspectRatio),
    };
  }
};

/**
 * Clamp coordinates to video bounds
 */
export const clampToVideoBounds = (
  coords: FFmpegCoordinates,
  videoDimensions: VideoDimensions
): FFmpegCoordinates => {
  return {
    ...coords,
    x: Math.max(0, Math.min(coords.x, videoDimensions.width - coords.width)),
    y: Math.max(0, Math.min(coords.y, videoDimensions.height - coords.height)),
    width: Math.min(coords.width, videoDimensions.width),
    height: Math.min(coords.height, videoDimensions.height),
  };
};

/**
 * Sort overlays by z-index
 */
export const sortByZIndex = (
  overlays: Array<{ zIndex: number; [key: string]: any }>
): Array<{ zIndex: number; [key: string]: any }> => {
  return [...overlays].sort((a, b) => a.zIndex - b.zIndex);
};

/**
 * Validate coordinates
 */
export const validateCoordinates = (
  coords: UICoordinates
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (coords.x < 0 || coords.x > 1) {
    errors.push("X coordinate must be between 0 and 1");
  }

  if (coords.y < 0 || coords.y > 1) {
    errors.push("Y coordinate must be between 0 and 1");
  }

  if (coords.width <= 0 || coords.width > 1) {
    errors.push("Width must be between 0 and 1");
  }

  if (coords.height <= 0 || coords.height > 1) {
    errors.push("Height must be between 0 and 1");
  }

  if (coords.scale < 0.2 || coords.scale > 5.0) {
    errors.push("Scale must be between 0.2 and 5.0");
  }

  if (coords.rotation < 0 || coords.rotation > 360) {
    errors.push("Rotation must be between 0 and 360 degrees");
  }

  if (coords.zIndex < 0) {
    errors.push("Z-index must be non-negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
