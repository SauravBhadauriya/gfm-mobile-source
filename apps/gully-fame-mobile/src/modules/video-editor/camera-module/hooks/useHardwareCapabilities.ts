import { useMemo } from "react";
import { useCameraDevice } from "react-native-vision-camera";

/**
 * Hardware Capabilities Detection Hook
 *
 * Detects device camera capabilities including:
 * - Supported resolutions (HD, 2K, 4K)
 * - Supported frame rates (24, 30, 60 FPS)
 * - HDR support
 * - Zoom capabilities
 * - Flash support
 */

export interface DeviceCapabilities {
  // Resolution support
  supportsHD: boolean; // 1920x1080
  supports2K: boolean; // 2560x1440
  supports4K: boolean; // 3840x2160

  // Frame rate support
  supports24fps: boolean;
  supports30fps: boolean;
  supports60fps: boolean;

  // Advanced features
  supportsHDR: boolean;
  supportsNightMode: boolean;

  // Zoom capabilities
  minZoom: number;
  maxZoom: number;

  // Flash support
  supportsFlash: boolean;
  supportsTorch: boolean;

  // Focus capabilities
  supportsAutoFocus: boolean;
  supportsManualFocus: boolean;

  // Exposure capabilities
  supportsExposure: boolean;
  minExposure: number;
  maxExposure: number;
}

export const useHardwareCapabilities = (
  cameraFacing: "front" | "back" = "back"
): DeviceCapabilities => {
  const device = useCameraDevice(cameraFacing);

  const capabilities = useMemo<DeviceCapabilities>(() => {
    // Default capabilities
    const defaultCaps: DeviceCapabilities = {
      supportsHD: true,
      supports2K: false,
      supports4K: false,
      supports24fps: true,
      supports30fps: true,
      supports60fps: false,
      supportsHDR: false,
      supportsNightMode: false,
      minZoom: 1,
      maxZoom: 4,
      supportsFlash: true,
      supportsTorch: true,
      supportsAutoFocus: true,
      supportsManualFocus: false,
      supportsExposure: true,
      minExposure: -1,
      maxExposure: 1,
    };

    // If no device, return defaults
    if (!device) {
      return defaultCaps;
    }

    // Analyze device formats to detect capabilities
    if (device.formats && device.formats.length > 0) {
      device.formats.forEach((format) => {
        // Check resolution support
        const longEdge = Math.max(format.videoWidth, format.videoHeight);
        if (longEdge >= 1920) defaultCaps.supportsHD = true;
        if (longEdge >= 2560) defaultCaps.supports2K = true;
        if (longEdge >= 3840) defaultCaps.supports4K = true;

        // Check frame rate support
        if (format.maxFps >= 24) defaultCaps.supports24fps = true;
        if (format.maxFps >= 30) defaultCaps.supports30fps = true;
        if (format.maxFps >= 60) defaultCaps.supports60fps = true;

        // Check HDR support
        if (format.supportsVideoHdr) defaultCaps.supportsHDR = true;
      });
    }

    // Check zoom capabilities
    if (device.minZoom !== undefined) {
      defaultCaps.minZoom = device.minZoom;
    }
    if (device.maxZoom !== undefined) {
      defaultCaps.maxZoom = device.maxZoom;
    }

    // Check flash support
    if (device.hasFlash !== undefined) {
      defaultCaps.supportsFlash = device.hasFlash;
    }
    if (device.hasTorch !== undefined) {
      defaultCaps.supportsTorch = device.hasTorch;
    }

    // Check focus capabilities
    if (device.supportsFocus !== undefined) {
      defaultCaps.supportsAutoFocus = device.supportsFocus;
    }

    // Check exposure capabilities
    if (device.supportsExposure !== undefined) {
      defaultCaps.supportsExposure = device.supportsExposure;
    }

    return defaultCaps;
  }, [device]);

  return capabilities;
};

/**
 * Get recommended format based on desired resolution and FPS
 *
 * @param device - Camera device
 * @param targetResolution - Desired resolution (HD, 2K, 4K)
 * @param targetFps - Desired frame rate
 * @returns Best matching format or undefined
 */
export const getRecommendedFormat = (
  device: any,
  targetResolution: "hd" | "2k" | "4k" = "hd",
  targetFps: number = 30
) => {
  if (!device?.formats || device.formats.length === 0) {
    return undefined;
  }

  const targetWidth = {
    hd: 1920,
    "2k": 2560,
    "4k": 3840,
  }[targetResolution];

  // Find format that matches or exceeds target resolution and FPS
  let bestFormat = device.formats[0];
  let bestScore = -Infinity;

  device.formats.forEach((format: any) => {
    const longEdge = Math.max(format.videoWidth, format.videoHeight);

    // Score based on how close we are to target
    const resolutionScore = longEdge >= targetWidth ? longEdge : -Infinity;
    const fpsScore = format.maxFps >= targetFps ? format.maxFps : -Infinity;

    const score = resolutionScore + fpsScore;

    if (score > bestScore) {
      bestScore = score;
      bestFormat = format;
    }
  });

  return bestFormat;
};

/**
 * Get all supported resolutions on device
 */
export const getSupportedResolutions = (device: any) => {
  if (!device?.formats || device.formats.length === 0) {
    return ["hd"];
  }

  const resolutions = new Set<string>();

  device.formats.forEach((format: any) => {
    const longEdge = Math.max(format.videoWidth, format.videoHeight);
    if (longEdge >= 3840) resolutions.add("4k");
    if (longEdge >= 2560) resolutions.add("2k");
    if (longEdge >= 1920) resolutions.add("hd");
  });

  return Array.from(resolutions);
};

/**
 * Get all supported frame rates on device
 */
export const getSupportedFrameRates = (device: any) => {
  if (!device?.formats || device.formats.length === 0) {
    return [30];
  }

  const frameRates = new Set<number>();

  device.formats.forEach((format: any) => {
    if (format.maxFps >= 24) frameRates.add(24);
    if (format.maxFps >= 30) frameRates.add(30);
    if (format.maxFps >= 60) frameRates.add(60);
  });

  return Array.from(frameRates).sort((a, b) => a - b);
};
