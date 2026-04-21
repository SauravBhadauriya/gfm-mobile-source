import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import type { CameraClip } from "../types/camera.types";
import * as VideoThumbnails from "expo-video-thumbnails";
// Note: For video thumbnails, you may need to install expo-file-system
// or use ffmpeg-kit-react-native for frame extraction

const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_HEIGHT = 80;
const THUMBNAIL_QUALITY = 0.8;

/**
 * Generate a thumbnail for a video clip at a specific time
 * Uses FFmpeg-kit if available, otherwise falls back to image manipulation
 */
export async function generateVideoThumbnail(
    videoUri: string,
    timeSeconds: number = 0,
): Promise<string | null> {
    try {
        // TODO: Implement video thumbnail extraction using ffmpeg-kit-react-native
        // Example FFmpeg command:
        // ffmpeg -i input.mp4 -ss ${timeSeconds} -vframes 1 -vf scale=120:80 output.jpg

        // For now, return null - the timeline will show a placeholder
        // You can implement this using:
        // 1. ffmpeg-kit-react-native to extract frames
        // 2. Or use expo-file-system + expo-image-manipulator if you have frame extraction

        return null;
    } catch (error) {
        console.warn("Error generating video thumbnail:", error);
        return null;
    }
}

/**
 * Generate a thumbnail for an image clip
 */
export async function generateImageThumbnail(
    imageUri: string,
): Promise<string | null> {
    try {
        // Use expo-file-system's cacheDirectory
        const cacheBase = (FileSystem as any).cacheDirectory || "";
        const cacheDir = `${cacheBase}thumbnails/`;
        const exists = await FileSystem.getInfoAsync(cacheDir);
        if (!exists.exists) {
            await FileSystem.makeDirectoryAsync(cacheDir, {
                intermediates: true,
            });
        }

        const filename = `thumb_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const outputUri = `${cacheDir}${filename}`;

        const manipulated = await manipulateAsync(
            imageUri,
            [{ resize: { width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT } }],
            { compress: THUMBNAIL_QUALITY, format: SaveFormat.JPEG },
        );

        return manipulated.uri;
    } catch (error) {
        console.warn("Error generating image thumbnail:", error);
        return null;
    }
}

/**
 * Generate thumbnail for a clip (video or image)
 */
export async function generateClipThumbnail(
    clip: CameraClip,
): Promise<string | null> {
    if (clip.type === "video") {
        // Use middle of clip or trim start
        const time = clip.trimStart ?? clip.duration / 2;
        return generateVideoThumbnail(clip.uri, time);
    } else {
        // For images, always generate thumbnail
        return generateImageThumbnail(clip.uri);
    }
}

/**
 * Batch generate thumbnails for multiple clips
 */
export async function generateThumbnailsForClips(
    clips: CameraClip[],
): Promise<Map<string, string>> {
    const thumbnailMap = new Map<string, string>();

    // Generate thumbnails in parallel for better performance
    const thumbnailPromises = clips.map(async (clip) => {
        try {
            // If it's already an image, just use its URI directly
            if (clip.type === "photo") {
                thumbnailMap.set(clip.id, clip.uri);
                return;
            }

            // For videos, generate a thumbnail at the very beginning (0ms)
            const { uri } = await VideoThumbnails.getThumbnailAsync(clip.uri, {
                time: 0, // Get the first frame
                quality: 0.5, // 0.0 to 1.0 - lower quality is faster and fine for tiny timeline thumbnails
            });

            thumbnailMap.set(clip.id, uri);
        } catch (error) {
            console.warn(
                `Failed to generate thumbnail for clip ${clip.id}:`,
                error,
            );
            // If it fails, we just don't set it in the map, and your TimelineClip
            // will safely fall back to the 🎥 placeholder.
        }
    });

    await Promise.all(thumbnailPromises);

    return thumbnailMap;
}
