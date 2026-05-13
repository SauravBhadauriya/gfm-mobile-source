import { useCallback, useEffect, useState } from "react";
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
 * For expo-camera, permissions are automatically handled by CameraView component.
 * This hook provides a simple interface for permission status.
 */
export const usePermissions = (): UsePermissionsResult => {
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<PermissionStatus | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const hasPermission = cameraPermission === "granted" && microphonePermission === "granted";

  const loadCurrentStatus = useCallback(async () => {
    try {
      // For Expo Go and development, assume permissions are granted
      // CameraView component will handle permission requests automatically
      setCameraPermission("granted");
      setMicrophonePermission("granted");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Failed to read permissions", error);
      setCameraPermission("denied");
      setMicrophonePermission("denied");
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setIsRequesting(true);
    try {
      // CameraView component automatically requests permissions when needed
      // We just need to return true to indicate permissions are available
      setCameraPermission("granted");
      setMicrophonePermission("granted");
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Failed to request permissions", error);
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
