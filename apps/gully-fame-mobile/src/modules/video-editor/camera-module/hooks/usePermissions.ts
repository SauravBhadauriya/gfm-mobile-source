import { useCallback, useEffect, useState } from "react";
import { Camera } from "expo-camera";
import { Audio } from "expo-av";
import type { PermissionStatus } from "../types/camera.types";

export interface UsePermissionsResult {
  hasPermission: boolean | null;
  cameraPermission: PermissionStatus | null;
  microphonePermission: PermissionStatus | null;
  isRequesting: boolean;
  requestPermissions: () => Promise<boolean>;
}

/**
 * Hook that manages camera & microphone permissions.
 * Properly checks and requests permissions for video recording.
 */
export const usePermissions = (): UsePermissionsResult => {
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<PermissionStatus | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const hasPermission = cameraPermission === "granted" && microphonePermission === "granted";

  const loadCurrentStatus = useCallback(async () => {
    try {
      console.log("=== Checking current permissions ===");

      // Check camera permission
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      console.log("Camera permission status:", cameraStatus.status);
      setCameraPermission(cameraStatus.status);

      // Check microphone permission (needed for video recording)
      const audioStatus = await Audio.getPermissionsAsync();
      console.log("Microphone permission status:", audioStatus.status);
      setMicrophonePermission(audioStatus.status);
    } catch (error) {
      console.error("Failed to read permissions", error);
      setCameraPermission("denied");
      setMicrophonePermission("denied");
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    console.log("=== Requesting permissions ===");
    setIsRequesting(true);

    try {
      // Request camera permission
      console.log("Requesting camera permission...");
      const cameraResult = await Camera.requestCameraPermissionsAsync();
      console.log("Camera permission result:", cameraResult.status);
      setCameraPermission(cameraResult.status);

      // Request microphone permission (essential for video recording)
      console.log("Requesting microphone permission...");
      const audioResult = await Audio.requestPermissionsAsync();
      console.log("Microphone permission result:", audioResult.status);
      setMicrophonePermission(audioResult.status);

      const success = cameraResult.status === "granted" && audioResult.status === "granted";
      console.log("All permissions granted:", success);

      return success;
    } catch (error) {
      console.error("Failed to request permissions", error);
      setCameraPermission("denied");
      setMicrophonePermission("denied");
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentStatus();
  }, [loadCurrentStatus]);

  return {
    hasPermission,
    cameraPermission,
    microphonePermission,
    isRequesting,
    requestPermissions,
  };
};
