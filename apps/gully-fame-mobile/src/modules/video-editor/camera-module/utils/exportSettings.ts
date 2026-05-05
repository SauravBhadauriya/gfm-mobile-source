/**
 * Export Settings & Presets
 *
 * Defines quality presets, resolution options, and encoding parameters
 * for video export with FFmpeg
 */

export type Resolution = "hd" | "2k" | "4k";
export type QualityPreset = "low" | "medium" | "high" | "maximum";
export type VideoFormat = "mp4" | "mov" | "webm";

export interface ResolutionConfig {
  name: string;
  width: number;
  height: number;
  label: string;
}

export interface QualityConfig {
  name: QualityPreset;
  label: string;
  preset: "fast" | "medium" | "slow" | "veryslow";
  crf: number; // 0-51, lower = better quality
  bitrate: string; // e.g., "5000k"
  audioBitrate: string; // e.g., "128k"
  estimatedTime: string; // Estimated encoding time
}

export interface ExportSettings {
  resolution: Resolution;
  quality: QualityPreset;
  format: VideoFormat;
  customBitrate?: string;
  includeAudio: boolean;
  audioOnly: boolean;
}

// Resolution Presets
export const RESOLUTION_PRESETS: Record<Resolution, ResolutionConfig> = {
  hd: {
    name: "hd",
    width: 1920,
    height: 1080,
    label: "HD (1920x1080)",
  },
  "2k": {
    name: "2k",
    width: 2560,
    height: 1440,
    label: "2K (2560x1440)",
  },
  "4k": {
    name: "4k",
    width: 3840,
    height: 2160,
    label: "4K (3840x2160)",
  },
};

// Quality Presets
export const QUALITY_PRESETS: Record<QualityPreset, QualityConfig> = {
  low: {
    name: "low",
    label: "Low (Smaller File)",
    preset: "fast",
    crf: 28, // Lower quality
    bitrate: "2000k",
    audioBitrate: "64k",
    estimatedTime: "30-60s",
  },
  medium: {
    name: "medium",
    label: "Medium (Balanced)",
    preset: "medium",
    crf: 23, // Medium quality
    bitrate: "5000k",
    audioBitrate: "128k",
    estimatedTime: "60-120s",
  },
  high: {
    name: "high",
    label: "High (Better Quality)",
    preset: "slow",
    crf: 18, // High quality
    bitrate: "10000k",
    audioBitrate: "192k",
    estimatedTime: "120-240s",
  },
  maximum: {
    name: "maximum",
    label: "Maximum (Best Quality)",
    preset: "veryslow",
    crf: 15, // Highest quality
    bitrate: "20000k",
    audioBitrate: "256k",
    estimatedTime: "240-600s",
  },
};

// Format Presets
export const FORMAT_PRESETS: Record<
  VideoFormat,
  { label: string; codec: string; extension: string }
> = {
  mp4: {
    label: "MP4 (H.264)",
    codec: "libx264",
    extension: ".mp4",
  },
  mov: {
    label: "MOV (H.264)",
    codec: "libx264",
    extension: ".mov",
  },
  webm: {
    label: "WebM (VP9)",
    codec: "libvpx-vp9",
    extension: ".webm",
  },
};

// Default Export Settings
export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  resolution: "hd",
  quality: "medium",
  format: "mp4",
  includeAudio: true,
  audioOnly: false,
};

/**
 * Get recommended bitrate based on resolution and quality
 */
export const getRecommendedBitrate = (resolution: Resolution, quality: QualityPreset): string => {
  const qualityConfig = QUALITY_PRESETS[quality];

  // Adjust bitrate based on resolution
  const resolutionMultiplier: Record<Resolution, number> = {
    hd: 1,
    "2k": 1.5,
    "4k": 2.5,
  };

  const baseBitrate = parseInt(qualityConfig.bitrate);
  const adjustedBitrate = Math.round(baseBitrate * resolutionMultiplier[resolution]);

  return `${adjustedBitrate}k`;
};

/**
 * Get estimated file size
 */
export const getEstimatedFileSize = (
  durationSeconds: number,
  resolution: Resolution,
  quality: QualityPreset
): string => {
  const bitrate = parseInt(getRecommendedBitrate(resolution, quality));
  const sizeInBytes = (bitrate * 1000 * durationSeconds) / 8;

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
};

/**
 * Get estimated encoding time
 */
export const getEstimatedEncodingTime = (
  durationSeconds: number,
  quality: QualityPreset
): string => {
  const qualityConfig = QUALITY_PRESETS[quality];

  // Rough estimation: encoding speed varies by device
  // Assume 1x real-time for medium quality on modern device
  const speedMultiplier: Record<QualityPreset, number> = {
    low: 0.5, // 2x faster
    medium: 1, // 1x real-time
    high: 2, // 2x slower
    maximum: 4, // 4x slower
  };

  const estimatedSeconds = durationSeconds * speedMultiplier[quality];

  if (estimatedSeconds < 60) {
    return `~${Math.round(estimatedSeconds)}s`;
  } else if (estimatedSeconds < 3600) {
    return `~${Math.round(estimatedSeconds / 60)}m`;
  } else {
    const hours = Math.floor(estimatedSeconds / 3600);
    const minutes = Math.round((estimatedSeconds % 3600) / 60);
    return `~${hours}h ${minutes}m`;
  }
};

/**
 * Validate export settings
 */
export const validateExportSettings = (settings: ExportSettings): string[] => {
  const errors: string[] = [];

  if (!settings.resolution || !RESOLUTION_PRESETS[settings.resolution]) {
    errors.push("Invalid resolution selected");
  }

  if (!settings.quality || !QUALITY_PRESETS[settings.quality]) {
    errors.push("Invalid quality preset selected");
  }

  if (!settings.format || !FORMAT_PRESETS[settings.format]) {
    errors.push("Invalid format selected");
  }

  if (settings.customBitrate) {
    const bitrateMatch = settings.customBitrate.match(/^(\d+)k?$/);
    if (!bitrateMatch) {
      errors.push('Invalid bitrate format (use format like "5000k")');
    }
  }

  return errors;
};
