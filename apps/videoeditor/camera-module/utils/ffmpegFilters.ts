import { FFmpegKit, ReturnCode } from "ffmpeg-kit-react-native-community";
import type { FilterPreset } from "../types/filters";

/**
 * Converts a FilterPreset into an FFmpeg filter chain string
 * Creates filters in the format: eq=brightness={b}:contrast={c}:saturation={s}:gamma={g},colorbalance=rs={warm}:bs={cool},vignette
 */
function buildFFmpegFilterChain(preset: FilterPreset): string {
    const filters: string[] = [];

    // Build eq filter (brightness, contrast, saturation, gamma)
    // FFmpeg eq filter defaults: brightness=0, contrast=1.0, saturation=1.0, gamma=1.0
    const eqParams: string[] = [];

    if (preset.brightness !== undefined && preset.brightness !== 0) {
        // FFmpeg brightness: -1.0 to 1.0, default 0.0
        const brightnessValue = Math.max(
            -1.0,
            Math.min(1.0, preset.brightness),
        );
        eqParams.push(`brightness=${brightnessValue}`);
    }

    if (preset.contrast !== undefined && preset.contrast !== 1.0) {
        // FFmpeg contrast: 0.0 to 3.0, default 1.0 (no change)
        const contrastValue = Math.max(0.0, Math.min(3.0, preset.contrast));
        eqParams.push(`contrast=${contrastValue}`);
    }

    if (preset.saturation !== undefined && preset.saturation !== 1.0) {
        // FFmpeg saturation: 0.0 to 3.0, default 1.0 (no change)
        const satValue = Math.max(0.0, Math.min(3.0, preset.saturation));
        eqParams.push(`saturation=${satValue}`);
    }

    if (preset.gamma !== undefined && preset.gamma !== 1.0) {
        // FFmpeg gamma: 0.1 to 10.0, default 1.0 (no change)
        const gammaValue = Math.max(0.1, Math.min(10.0, preset.gamma));
        eqParams.push(`gamma=${gammaValue}`);
    }

    if (eqParams.length > 0) {
        filters.push(`eq=${eqParams.join(":")}`);
    }

    // Build colorbalance filter (temperature/tint)
    // FFmpeg colorbalance: rs, gs, bs, rm, gm, bm, rh, gh, bh (-1.0 to 1.0)
    // We use rs (red shadows) and bs (blue shadows) for temperature
    // We use gs (green shadows/midtones) for tint adjustment
    if (preset.temperature !== undefined || preset.tint !== undefined) {
        const balanceParams: string[] = [];

        // Temperature: warm (positive) = increase red (rs), decrease blue (bs)
        // Cool (negative) = decrease red (rs), increase blue (bs)
        if (preset.temperature !== undefined && preset.temperature !== 0) {
            const tempValue = Math.max(-1.0, Math.min(1.0, preset.temperature));
            if (tempValue > 0) {
                // Warm: add red, subtract blue
                balanceParams.push(`rs=${tempValue}`);
                balanceParams.push(`bs=-${tempValue}`);
            } else {
                // Cool: subtract red, add blue
                balanceParams.push(`rs=${tempValue}`);
                balanceParams.push(`bs=${Math.abs(tempValue)}`);
            }
        }

        // Tint: magenta (positive) = increase red/blue, decrease green
        // Green (negative) = decrease red/blue, increase green
        if (preset.tint !== undefined && preset.tint !== 0) {
            const tintValue = Math.max(-1.0, Math.min(1.0, preset.tint));
            if (tintValue > 0) {
                // Magenta: add red and blue shadows, subtract green
                balanceParams.push(`rs=${tintValue * 0.5}`);
                balanceParams.push(`bs=${tintValue * 0.5}`);
                balanceParams.push(`gs=-${tintValue}`);
            } else {
                // Green: subtract red and blue, add green
                balanceParams.push(`rs=${tintValue * 0.5}`);
                balanceParams.push(`bs=${tintValue * 0.5}`);
                balanceParams.push(`gs=${Math.abs(tintValue)}`);
            }
        }

        if (balanceParams.length > 0) {
            filters.push(`colorbalance=${balanceParams.join(":")}`);
        }
    }

    // Add vignette if specified
    // FFmpeg vignette: angle (radians), x0/y0 (center 0.0-1.0), mode, eval
    if (preset.vignette) {
        const { angle, x0, y0 } = preset.vignette;
        const angleRad = (angle * Math.PI) / 180;
        const centerX = Math.max(0.0, Math.min(1.0, x0));
        const centerY = Math.max(0.0, Math.min(1.0, y0));
        filters.push(`vignette=angle=${angleRad}:x0=${centerX}:y0=${centerY}`);
    }

    // Add grain if specified
    // FFmpeg noise filter for grain effect
    if (preset.grain && preset.grain.strength > 0) {
        const strength = Math.max(0.0, Math.min(1.0, preset.grain.strength));
        // noise filter: alls=strength (0-4095), allf=frame type
        // Scale our 0-1 range to FFmpeg's expected range (0-100 is reasonable)
        const noiseStrength = strength * 20; // Scale to 0-20 for subtle grain
        filters.push(`noise=alls=${noiseStrength}:allf=t+u`);
    }

    return filters.length > 0 ? filters.join(",") : "";
}

/**
 * Applies a filter preset to an image using FFmpeg
 * @param inputPath - Path to input image file
 * @param outputPath - Path where filtered image will be saved
 * @param preset - Filter preset configuration
 * @returns Promise that resolves to the output path
 */
export async function applyPresetToImage(
    inputPath: string,
    outputPath: string,
    preset: FilterPreset,
): Promise<string> {
    // If Original preset or no filters, just copy the file
    const filterChain = buildFFmpegFilterChain(preset);
    if (preset.name === "Original" || !filterChain) {
        // No filters to apply, copy file
        const command = `-i "${inputPath}" -c copy -y "${outputPath}"`;
        const session = await FFmpegKit.execute(command);
        const returnCode = await session.getReturnCode();

        if (ReturnCode.isSuccess(returnCode)) {
            return outputPath;
        } else {
            const failureStackTrace =
                (await session.getFailStackTrace()) || "Unknown error";
            throw new Error(
                `FFmpeg failed to process image: ${failureStackTrace}`,
            );
        }
    }

    // FFmpeg command for image processing
    // -i input, -vf filter chain, -y overwrite output
    const command = `-i "${inputPath}" -vf "${filterChain}" -y "${outputPath}"`;

    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
        return outputPath;
    } else {
        const failureStackTrace =
            (await session.getFailStackTrace()) || "Unknown error";
        throw new Error(
            `FFmpeg failed to apply filter to image: ${failureStackTrace}`,
        );
    }
}

/**
 * Applies a filter preset to a video using FFmpeg
 * @param inputPath - Path to input video file
 * @param outputPath - Path where filtered video will be saved
 * @param preset - Filter preset configuration
 * @returns Promise that resolves to the output path
 */
export async function applyPresetToVideo(
    inputPath: string,
    outputPath: string,
    preset: FilterPreset,
): Promise<string> {
    // If Original preset or no filters, just copy the file
    const filterChain = buildFFmpegFilterChain(preset);
    if (preset.name === "Original" || !filterChain) {
        // No filters to apply, copy without re-encoding
        const command = `-i "${inputPath}" -c copy -y "${outputPath}"`;
        const session = await FFmpegKit.execute(command);
        const returnCode = await session.getReturnCode();

        if (ReturnCode.isSuccess(returnCode)) {
            return outputPath;
        } else {
            const failureStackTrace =
                (await session.getFailStackTrace()) || "Unknown error";
            throw new Error(
                `FFmpeg failed to process video: ${failureStackTrace}`,
            );
        }
    }

    // FFmpeg command for video processing
    // -i input, -vf filter chain, encode video with libx264, copy audio, -y overwrite output
    // Using libx264 for video encoding with medium preset and CRF 23 for good quality/size balance
    const command = `-i "${inputPath}" -vf "${filterChain}" -c:v libx264 -c:a copy -preset medium -crf 23 -y "${outputPath}"`;

    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
        return outputPath;
    } else {
        const failureStackTrace =
            (await session.getFailStackTrace()) || "Unknown error";
        throw new Error(
            `FFmpeg failed to apply filter to video: ${failureStackTrace}`,
        );
    }
}
