import { useCallback, useRef, useState, type MutableRefObject } from "react";
import type { CameraRecordingOptions } from "expo-camera";
import type { CameraClip } from "../types/camera.types";
import { CameraModeEnum } from "../utils/mediaTypes";

export interface UseCameraResult {
  cameraRef: MutableRefObject<any>;
  isRecording: boolean;
  takePhoto: () => Promise<CameraClip | null>;
  startRecording: (
    onFinished: (clip: CameraClip | null) => void | Promise<void>,
    maxDurationSeconds?: number,
    speed?: number
  ) => Promise<void>;
  stopRecording: () => Promise<void>;
}

/**
 * Hook that encapsulates expo-camera capture logic.
 */
export const useCamera = (mode: CameraModeEnum, _flash: unknown): UseCameraResult => {
  const cameraRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);

  const takePhoto = useCallback(async (): Promise<CameraClip | null> => {
    if (!cameraRef.current || mode !== CameraModeEnum.Photo) {
      return null;
    }

    const makeId = () =>
      `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      const uri = (photo as { uri?: string }).uri ?? "";
      if (!uri) {
        return null;
      }

      return {
        id: makeId(),
        uri,
        duration: 0,
        type: "photo",
        source: "camera",
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Failed to take photo", error);
      return null;
    }
  }, [mode]);

  const startRecording = useCallback(
    async (
      onFinished: (clip: CameraClip | null) => void | Promise<void>,
      maxDurationSeconds?: number,
      speed?: number
    ): Promise<void> => {
      console.log("=== startRecording CALLED ===");
      console.log("Camera ref exists:", !!cameraRef.current);
      console.log("Mode:", mode);
      console.log("Is already recording:", isRecording);
      console.log("Max duration:", maxDurationSeconds);
      console.log("Speed:", speed);

      if (!cameraRef.current) {
        console.error("❌ Camera ref is null - cannot start recording");
        return;
      }

      if (mode !== CameraModeEnum.Video) {
        console.error("❌ Not in video mode - current mode:", mode);
        return;
      }

      if (isRecording) {
        console.error("❌ Already recording - cannot start new recording");
        return;
      }

      const makeId = () =>
        `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

      console.log("✅ Starting video recording...");
      setIsRecording(true);
      isRecordingRef.current = true;

      // Clear any existing timer
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }

      try {
        const options: CameraRecordingOptions = {};
        console.log("Recording options:", options);

        console.log("Calling cameraRef.current.recordAsync...");
        const recordingPromise = cameraRef.current.recordAsync(options);

        // Set up auto-stop timer if maxDuration is provided
        if (maxDurationSeconds && maxDurationSeconds > 0) {
          console.log("Setting up auto-stop timer for", maxDurationSeconds, "seconds");
          maxDurationTimerRef.current = setTimeout(async () => {
            console.log("Auto-stop timer triggered");
            if (cameraRef.current && isRecordingRef.current) {
              try {
                console.log("Auto-stopping recording...");
                await cameraRef.current.stopRecording();
              } catch (error) {
                console.error("Failed to auto-stop recording", error);
              }
            }
          }, maxDurationSeconds * 1000);
        }

        recordingPromise
          .then((video: any) => {
            console.log("✅ Recording completed successfully");
            console.log("Video result:", video);

            // Clear timer if recording finishes before timeout
            if (maxDurationTimerRef.current) {
              clearTimeout(maxDurationTimerRef.current);
              maxDurationTimerRef.current = null;
            }
            setIsRecording(false);
            isRecordingRef.current = false;
            const uri = (video as { uri?: string }).uri ?? "";
            const duration = (video as { duration?: number }).duration ?? 0;

            console.log("Video URI:", uri);
            console.log("Video duration:", duration);

            if (!uri) {
              console.error("❌ No URI in video result");
              void onFinished(null);
            } else {
              const clip = {
                id: makeId(),
                uri,
                duration,
                type: "video" as const,
                source: "camera" as const,
                speed: speed ?? 1, // Store speed multiplier with clip
              };
              console.log("✅ Created video clip:", clip);
              void onFinished(clip);
            }
          })
          .catch((error: any) => {
            console.error("❌ Recording error:", error);

            // Clear timer on error
            if (maxDurationTimerRef.current) {
              clearTimeout(maxDurationTimerRef.current);
              maxDurationTimerRef.current = null;
            }
            setIsRecording(false);
            isRecordingRef.current = false;
            void onFinished(null);
          });
      } catch (error) {
        console.error("❌ Failed to start recording:", error);

        // Clear timer on error
        if (maxDurationTimerRef.current) {
          clearTimeout(maxDurationTimerRef.current);
          maxDurationTimerRef.current = null;
        }
        setIsRecording(false);
        isRecordingRef.current = false;
        void onFinished(null);
      }
    },
    [isRecording, mode]
  );

  const stopRecording = useCallback(async (): Promise<void> => {
    console.log("=== stopRecording CALLED ===");
    console.log("Camera ref exists:", !!cameraRef.current);
    console.log("Is recording:", isRecording);

    if (!cameraRef.current) {
      console.error("❌ Camera ref is null - cannot stop recording");
      return;
    }

    if (!isRecording) {
      console.error("❌ Not currently recording - cannot stop");
      return;
    }

    // Clear auto-stop timer
    if (maxDurationTimerRef.current) {
      console.log("Clearing auto-stop timer");
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    isRecordingRef.current = false;

    try {
      console.log("✅ Stopping recording...");
      await cameraRef.current.stopRecording();
      console.log("✅ Recording stopped successfully");
    } catch (error) {
      console.error("❌ Failed to stop recording:", error);
    }
  }, [isRecording]);

  return {
    cameraRef,
    isRecording,
    takePhoto,
    startRecording,
    stopRecording,
  };
};
