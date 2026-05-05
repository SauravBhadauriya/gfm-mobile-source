/**
 * FFmpeg Exporter
 *
 * Handles FFmpeg command building and video encoding
 * Supports clips, overlays, filters, and transitions
 */

import { FFmpegKit, FFmpegSession, ReturnCode } from "ffmpeg-kit-react-native-community";
import {
  ExportSettings,
  QUALITY_PRESETS,
  FORMAT_PRESETS,
  getRecommendedBitrate,
} from "./exportSettings";
import { generateOverlayFilter, generateTextFilter, generateFadeFilter } from "./coordinateMapper";

export interface ExportProgress {
  progress: number; // 0-100
  currentFrame: number;
  totalFrames: number;
  timeRemaining: string;
  speed: string; // e.g., "1.5x"
}

export interface ExportResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration: number; // seconds
  fileSize: number; // bytes
}

/**
 * Build FFmpeg command for video export
 */
export const buildFFmpegCommand = (
  inputPath: string,
  outputPath: string,
  settings: ExportSettings,
  videoDimensions: { width: number; height: number }
): string => {
  const qualityConfig = QUALITY_PRESETS[settings.quality];
  const formatConfig = FORMAT_PRESETS[settings.format];
  const bitrate =
    settings.customBitrate || getRecommendedBitrate(settings.resolution, settings.quality);

  // Base command
  let command = `-i "${inputPath}"`;

  // Video codec and quality settings
  command += ` -c:v ${formatConfig.codec}`;
  command += ` -preset ${qualityConfig.preset}`;
  command += ` -crf ${qualityConfig.crf}`;
  command += ` -b:v ${bitrate}`;

  // Resolution
  const resolutionMap: Record<string, string> = {
    hd: "1920:1080",
    "2k": "2560:1440",
    "4k": "3840:2160",
  };
  command += ` -vf "scale=${resolutionMap[settings.resolution]}"`;

  // Audio settings
  if (settings.includeAudio && !settings.audioOnly) {
    command += ` -c:a aac`;
    command += ` -b:a ${qualityConfig.audioBitrate}`;
  } else if (settings.audioOnly) {
    command += ` -vn`;
    command += ` -c:a aac`;
    command += ` -b:a ${qualityConfig.audioBitrate}`;
  } else {
    command += ` -an`;
  }

  // Output format
  command += ` -y "${outputPath}"`;

  return command;
};

/**
 * Build FFmpeg command with overlays
 */
export const buildFFmpegCommandWithOverlays = (
  inputPath: string,
  outputPath: string,
  settings: ExportSettings,
  overlays: Array<{
    type: "text" | "image" | "video";
    path?: string;
    text?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    startTime: number;
    endTime: number;
    fadeIn?: number;
    fadeOut?: number;
  }>,
  videoDimensions: { width: number; height: number }
): string => {
  const qualityConfig = QUALITY_PRESETS[settings.quality];
  const formatConfig = FORMAT_PRESETS[settings.format];
  const bitrate =
    settings.customBitrate || getRecommendedBitrate(settings.resolution, settings.quality);

  // Base command
  let command = `-i "${inputPath}"`;

  // Add overlay inputs
  overlays.forEach((overlay, index) => {
    if (overlay.path) {
      command += ` -i "${overlay.path}"`;
    }
  });

  // Build filter complex
  let filterComplex = "";

  // Add overlays to filter complex
  overlays.forEach((overlay, index) => {
    if (overlay.type === "text") {
      const textFilter = generateTextFilter(overlay.text || "", {
        x: Math.round(overlay.x * videoDimensions.width),
        y: Math.round(overlay.y * videoDimensions.height),
        width: Math.round(overlay.width * videoDimensions.width),
        height: Math.round(overlay.height * videoDimensions.height),
        scale: 1,
        rotation: 0,
        zIndex: index,
      });

      if (filterComplex) {
        filterComplex += ";";
      }
      filterComplex += textFilter;
    } else if (overlay.type === "image" || overlay.type === "video") {
      const overlayFilter = generateOverlayFilter(
        {
          x: Math.round(overlay.x * videoDimensions.width),
          y: Math.round(overlay.y * videoDimensions.height),
          width: Math.round(overlay.width * videoDimensions.width),
          height: Math.round(overlay.height * videoDimensions.height),
          scale: 1,
          rotation: 0,
          zIndex: index,
        },
        `${index + 1}`
      );

      if (filterComplex) {
        filterComplex += ";";
      }
      filterComplex += overlayFilter;
    }
  });

  // Add filter complex if there are overlays
  if (filterComplex) {
    command += ` -filter_complex "${filterComplex}"`;
  }

  // Video codec and quality settings
  command += ` -c:v ${formatConfig.codec}`;
  command += ` -preset ${qualityConfig.preset}`;
  command += ` -crf ${qualityConfig.crf}`;
  command += ` -b:v ${bitrate}`;

  // Resolution
  const resolutionMap: Record<string, string> = {
    hd: "1920:1080",
    "2k": "2560:1440",
    "4k": "3840:2160",
  };
  command += ` -vf "scale=${resolutionMap[settings.resolution]}"`;

  // Audio settings
  if (settings.includeAudio && !settings.audioOnly) {
    command += ` -c:a aac`;
    command += ` -b:a ${qualityConfig.audioBitrate}`;
  } else if (settings.audioOnly) {
    command += ` -vn`;
    command += ` -c:a aac`;
    command += ` -b:a ${qualityConfig.audioBitrate}`;
  } else {
    command += ` -an`;
  }

  // Output format
  command += ` -y "${outputPath}"`;

  return command;
};

/**
 * Execute FFmpeg command and track progress
 */
export const executeFFmpegCommand = async (
  command: string,
  onProgress?: (progress: ExportProgress) => void,
  onCancel?: () => void
): Promise<ExportResult> => {
  try {
    let session: FFmpegSession | null = null;

    // Execute command
    session = await FFmpegKit.executeAsync(command, (s) => {
      // Track progress
      if (onProgress && s) {
        const progress = s.getProgress();
        if (progress) {
          onProgress({
            progress: progress.getPercentage(),
            currentFrame: progress.getFrame(),
            totalFrames: progress.getTotalFrames(),
            timeRemaining: formatTimeRemaining(progress.getTimeInMilliseconds()),
            speed: `${progress.getSpeed().toFixed(1)}x`,
          });
        }
      }
    });

    // Check result
    if (session) {
      const returnCode = session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        return {
          success: true,
          duration: 0, // Would need to parse from output
          fileSize: 0, // Would need to get from file system
        };
      } else if (ReturnCode.isCancel(returnCode)) {
        onCancel?.();
        return {
          success: false,
          error: "Export cancelled",
          duration: 0,
          fileSize: 0,
        };
      } else {
        const output = session.getOutput();
        return {
          success: false,
          error: `FFmpeg error: ${output}`,
          duration: 0,
          fileSize: 0,
        };
      }
    }

    return {
      success: false,
      error: "FFmpeg session failed",
      duration: 0,
      fileSize: 0,
    };
  } catch (error) {
    return {
      success: false,
      error: `Export error: ${error instanceof Error ? error.message : String(error)}`,
      duration: 0,
      fileSize: 0,
    };
  }
};

/**
 * Cancel FFmpeg operation
 */
export const cancelFFmpegOperation = async (): Promise<void> => {
  try {
    await FFmpegKit.cancel();
  } catch (error) {
    console.error("Error cancelling FFmpeg:", error);
  }
};

/**
 * Format time remaining
 */
const formatTimeRemaining = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Get FFmpeg version
 */
export const getFFmpegVersion = async (): Promise<string> => {
  try {
    const session = await FFmpegKit.executeAsync("-version");
    if (session) {
      return session.getOutput();
    }
    return "Unknown";
  } catch (error) {
    return "Error getting version";
  }
};

/**
 * Check if FFmpeg is available
 */
export const isFFmpegAvailable = async (): Promise<boolean> => {
  try {
    const session = await FFmpegKit.executeAsync("-version");
    return session !== null && session.getReturnCode() === 0;
  } catch (error) {
    return false;
  }
};
