/**
 * useFFmpegExport Hook
 *
 * Manages FFmpeg export process with progress tracking
 * Handles command building, execution, and error handling
 */

import { useCallback, useRef, useState } from "react";
import * as FileSystem from "expo-file-system";
import { ExportSettings } from "../utils/exportSettings";
import {
  buildFFmpegCommand,
  buildFFmpegCommandWithOverlays,
  executeFFmpegCommand,
  cancelFFmpegOperation,
  ExportProgress,
  ExportResult,
} from "../utils/ffmpegExporter";
import type { CameraClipArray } from "../types/camera.types";

// KIRO: Fixed FileSystem import - using correct properties
const CACHE_DIR = FileSystem.cacheDirectory || `${FileSystem.documentDirectory}cache/`;
const DOCUMENT_DIR = FileSystem.documentDirectory || `${FileSystem.cacheDirectory}documents/`;

export interface UseFFmpegExportOptions {
  onProgress?: (progress: ExportProgress) => void;
  onComplete?: (result: ExportResult) => void;
  onError?: (error: string) => void;
}

export const useFFmpegExport = (options: UseFFmpegExportOptions = {}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const exportCancelledRef = useRef(false);

  /**
   * Concatenate multiple video clips
   */
  const concatenateClips = useCallback(
    async (clips: CameraClipArray): Promise<string> => {
      try {
        // KIRO: Fixed FileSystem directory references
        // Create concat demuxer file
        const concatContent = clips.map((clip) => `file '${clip.uri}'`).join("\n");

        const concatFilePath = `${CACHE_DIR}concat.txt`;
        await FileSystem.writeAsStringAsync(concatFilePath, concatContent);

        // Output path
        const outputPath = `${CACHE_DIR}concatenated_${Date.now()}.mp4`;

        // Build FFmpeg command for concatenation
        const command = `-f concat -safe 0 -i "${concatFilePath}" -c copy "${outputPath}"`;

        // Execute
        const result = await executeFFmpegCommand(command, (prog) => {
          setProgress(prog);
          options.onProgress?.(prog);
        });

        if (!result.success) {
          throw new Error(result.error || "Concatenation failed");
        }

        // Cleanup concat file
        await FileSystem.deleteAsync(concatFilePath, { idempotent: true });

        return outputPath;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Concatenation failed";
        setError(errorMsg);
        options.onError?.(errorMsg);
        throw err;
      }
    },
    [options]
  );

  /**
   * Export video with settings
   */
  const exportVideo = useCallback(
    async (
      clips: CameraClipArray,
      settings: ExportSettings,
      videoDimensions: { width: number; height: number }
    ): Promise<string> => {
      try {
        setIsExporting(true);
        setError(null);
        setProgress(null);
        exportCancelledRef.current = false;

        // Step 1: Concatenate clips if multiple
        let inputPath: string;
        if (clips.length > 1) {
          inputPath = await concatenateClips(clips);
        } else if (clips.length === 1) {
          inputPath = clips[0].uri;
        } else {
          throw new Error("No clips to export");
        }

        // KIRO: Fixed FileSystem directory reference
        // Step 2: Generate output path
        const timestamp = Date.now();
        const extension =
          settings.format === "mp4" ? ".mp4" : settings.format === "mov" ? ".mov" : ".webm";
        const outputPath = `${DOCUMENT_DIR}video_${timestamp}${extension}`;

        // Step 3: Build FFmpeg command
        const command = buildFFmpegCommand(inputPath, outputPath, settings, videoDimensions);

        // Step 4: Execute FFmpeg
        const result = await executeFFmpegCommand(
          command,
          (prog) => {
            if (!exportCancelledRef.current) {
              setProgress(prog);
              options.onProgress?.(prog);
            }
          },
          () => {
            exportCancelledRef.current = true;
          }
        );

        if (!result.success) {
          throw new Error(result.error || "Export failed");
        }

        // Step 5: Verify output file exists
        const fileInfo = await FileSystem.getInfoAsync(outputPath);
        if (!fileInfo.exists) {
          throw new Error("Output file not created");
        }

        // Step 6: Cleanup temporary files
        if (clips.length > 1) {
          await FileSystem.deleteAsync(inputPath, { idempotent: true });
        }

        // Success
        const finalResult: ExportResult = {
          success: true,
          outputPath,
          duration: result.duration,
          fileSize: fileInfo.size || 0,
        };

        options.onComplete?.(finalResult);
        setIsExporting(false);

        return outputPath;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Export failed";
        setError(errorMsg);
        options.onError?.(errorMsg);
        setIsExporting(false);
        throw err;
      }
    },
    [concatenateClips, options]
  );

  /**
   * Export video with overlays
   */
  const exportVideoWithOverlays = useCallback(
    async (
      clips: CameraClipArray,
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
    ): Promise<string> => {
      try {
        setIsExporting(true);
        setError(null);
        setProgress(null);
        exportCancelledRef.current = false;

        // Step 1: Concatenate clips if multiple
        let inputPath: string;
        if (clips.length > 1) {
          inputPath = await concatenateClips(clips);
        } else if (clips.length === 1) {
          inputPath = clips[0].uri;
        } else {
          throw new Error("No clips to export");
        }

        // KIRO: Fixed FileSystem directory reference
        // Step 2: Generate output path
        const timestamp = Date.now();
        const extension =
          settings.format === "mp4" ? ".mp4" : settings.format === "mov" ? ".mov" : ".webm";
        const outputPath = `${DOCUMENT_DIR}video_${timestamp}${extension}`;

        // Step 3: Build FFmpeg command with overlays
        const command = buildFFmpegCommandWithOverlays(
          inputPath,
          outputPath,
          settings,
          overlays,
          videoDimensions
        );

        // Step 4: Execute FFmpeg
        const result = await executeFFmpegCommand(
          command,
          (prog) => {
            if (!exportCancelledRef.current) {
              setProgress(prog);
              options.onProgress?.(prog);
            }
          },
          () => {
            exportCancelledRef.current = true;
          }
        );

        if (!result.success) {
          throw new Error(result.error || "Export failed");
        }

        // Step 5: Verify output file exists
        const fileInfo = await FileSystem.getInfoAsync(outputPath);
        if (!fileInfo.exists) {
          throw new Error("Output file not created");
        }

        // Step 6: Cleanup temporary files
        if (clips.length > 1) {
          await FileSystem.deleteAsync(inputPath, { idempotent: true });
        }

        // Success
        const finalResult: ExportResult = {
          success: true,
          outputPath,
          duration: result.duration,
          fileSize: fileInfo.size || 0,
        };

        options.onComplete?.(finalResult);
        setIsExporting(false);

        return outputPath;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Export failed";
        setError(errorMsg);
        options.onError?.(errorMsg);
        setIsExporting(false);
        throw err;
      }
    },
    [concatenateClips, options]
  );

  /**
   * Cancel export
   */
  const cancel = useCallback(async () => {
    exportCancelledRef.current = true;
    await cancelFFmpegOperation();
    setIsExporting(false);
    setProgress(null);
  }, []);

  return {
    isExporting,
    progress,
    error,
    exportVideo,
    exportVideoWithOverlays,
    cancel,
  };
};
