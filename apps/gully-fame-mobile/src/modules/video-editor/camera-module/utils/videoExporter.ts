import * as FileSystem from 'expo-file-system';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native-community';
import type { CameraClip, CameraClipArray } from '../types/camera.types';
import { applyPresetToVideo, applyPresetToImage } from './ffmpegFilters';
import { clipHasFilter } from './filterHelpers';

/**
 * Export and combine multiple clips into a single video
 * Applies filters and text overlays during export
 */
export async function exportAndCombineClips(
  clips: CameraClipArray,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  if (clips.length === 0) {
    throw new Error('No clips to export');
  }

  const cacheDir = `${(FileSystem as any).cacheDirectory || ''}exports/`;
  const dirInfo = await FileSystem.getInfoAsync(cacheDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  }

  onProgress?.(0.1, 'Preparing clips...');

  // Process each clip (apply filters, prepare for concatenation)
  const processedClips: string[] = [];
  const clipCount = clips.length;

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const progress = 0.1 + (i / clipCount) * 0.6;
    onProgress?.(progress, `Processing clip ${i + 1} of ${clipCount}...`);

    const processedPath = `${cacheDir}processed_${i}_${Date.now()}.mp4`;

    if (clip.type === 'video') {
      // Apply filter if exists
      if (clipHasFilter(clip) && clip.filterPreset) {
        await applyPresetToVideo(clip.uri, processedPath, clip.filterPreset);
      } else {
        // Copy without filter
        await FileSystem.copyAsync({ from: clip.uri, to: processedPath });
      }

      // Apply speed if needed
      if (clip.speed && clip.speed !== 1) {
        const spedUpPath = `${cacheDir}sped_${i}_${Date.now()}.mp4`;
        const speedCommand = `-i "${processedPath}" -filter:v "setpts=${1 / clip.speed}*PTS" -filter:a "atempo=${clip.speed}" -y "${spedUpPath}"`;
        const session = await FFmpegKit.execute(speedCommand);
        const returnCode = await session.getReturnCode();
        if (ReturnCode.isSuccess(returnCode)) {
          // Delete old file
          await FileSystem.deleteAsync(processedPath, { idempotent: true });
          processedClips.push(spedUpPath);
        } else {
          processedClips.push(processedPath);
        }
      } else {
        processedClips.push(processedPath);
      }
    } else if (clip.type === 'photo') {
      // Convert image to video (3 seconds duration)
      const imageVideoPath = `${cacheDir}image_${i}_${Date.now()}.mp4`;
      
      // Apply filter to image first if needed
      let imageUri = clip.uri;
      if (clipHasFilter(clip) && clip.filterPreset) {
        const filteredImagePath = `${cacheDir}filtered_image_${i}_${Date.now()}.jpg`;
        await applyPresetToImage(clip.uri, filteredImagePath, clip.filterPreset);
        imageUri = filteredImagePath;
      }

      // Convert image to 3-second video
      const imageCommand = `-loop 1 -i "${imageUri}" -t 3 -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -y "${imageVideoPath}"`;
      const session = await FFmpegKit.execute(imageCommand);
      const returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        processedClips.push(imageVideoPath);
      } else {
        throw new Error(`Failed to convert image ${i} to video`);
      }
    }
  }

  onProgress?.(0.7, 'Combining clips...');

  // Create concat file list
  const concatListPath = `${cacheDir}concat_list_${Date.now()}.txt`;
  const concatList = processedClips.map((path) => `file '${path.replace(/'/g, "'\\''")}'`).join('\n');
  await FileSystem.writeAsStringAsync(concatListPath, concatList);

  // Combine all clips
  const outputPath = `${cacheDir}final_${Date.now()}.mp4`;
  const concatCommand = `-f concat -safe 0 -i "${concatListPath}" -c copy -y "${outputPath}"`;
  
  onProgress?.(0.85, 'Finalizing video...');
  
  const session = await FFmpegKit.execute(concatCommand);
  const returnCode = await session.getReturnCode();

  // Cleanup temp files
  try {
    await FileSystem.deleteAsync(concatListPath, { idempotent: true });
    // Keep processed clips for now (can be cleaned up later)
  } catch (error) {
    console.warn('Cleanup error:', error);
  }

  if (!ReturnCode.isSuccess(returnCode)) {
    const failureStackTrace = await session.getFailStackTrace() || 'Unknown error';
    throw new Error(`Failed to combine clips: ${failureStackTrace}`);
  }

  onProgress?.(0.95, 'Almost done...');

  return outputPath;
}

/**
 * Export a single clip with filters
 */
export async function exportSingleClip(
  clip: CameraClip,
  outputPath: string,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  onProgress?.(0.1, 'Preparing clip...');

  if (clip.type === 'video') {
    if (clipHasFilter(clip) && clip.filterPreset) {
      onProgress?.(0.5, 'Applying filter...');
      return await applyPresetToVideo(clip.uri, outputPath, clip.filterPreset);
    } else {
      onProgress?.(0.5, 'Copying video...');
      await FileSystem.copyAsync({ from: clip.uri, to: outputPath });
      return outputPath;
    }
  } else {
    if (clipHasFilter(clip) && clip.filterPreset) {
      onProgress?.(0.5, 'Applying filter...');
      return await applyPresetToImage(clip.uri, outputPath, clip.filterPreset);
    } else {
      onProgress?.(0.5, 'Copying image...');
      await FileSystem.copyAsync({ from: clip.uri, to: outputPath });
      return outputPath;
    }
  }
}

