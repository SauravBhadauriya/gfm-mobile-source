import { useCallback, useEffect, useState } from 'react';
import { Camera } from 'expo-camera';
import type { PermissionStatus } from '../types/camera.types';

export interface UsePermissionsResult {
  hasPermission: boolean | null;
  cameraPermission: PermissionStatus | null;
  microphonePermission: PermissionStatus | null;
  isRequesting: boolean;
  requestPermissions: () => Promise<boolean>;
}

/**
 * Hook that manages camera & microphone permissions using expo-camera.
 */
export const usePermissions = (): UsePermissionsResult => {
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus | null>(null);
  const [microphonePermission, setMicrophonePermission] =
    useState<PermissionStatus | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const hasPermission =
    cameraPermission === 'granted' && microphonePermission === 'granted';

  const loadCurrentStatus = useCallback(async () => {
    try {
      const [cameraStatus, microphoneStatus] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        Camera.getMicrophonePermissionsAsync(),
      ]);

      setCameraPermission(cameraStatus.status as PermissionStatus);
      setMicrophonePermission(microphoneStatus.status as PermissionStatus);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to read camera permissions', error);
      setCameraPermission('denied');
      setMicrophonePermission('denied');
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setIsRequesting(true);
    try {
      const [cameraStatus, microphoneStatus] = await Promise.all([
        Camera.requestCameraPermissionsAsync(),
        Camera.requestMicrophonePermissionsAsync(),
      ]);

      const normalizedCamera = cameraStatus.status as PermissionStatus;
      const normalizedMicrophone = microphoneStatus.status as PermissionStatus;

      setCameraPermission(normalizedCamera);
      setMicrophonePermission(normalizedMicrophone);

      return normalizedCamera === 'granted' && normalizedMicrophone === 'granted';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to request camera permissions', error);
      setCameraPermission('denied');
      setMicrophonePermission('denied');
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


