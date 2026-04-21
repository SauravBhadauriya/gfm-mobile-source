import { useCallback, useEffect, useState } from "react";
// import { Camera } from "react-native-vision-camera";
import type { PermissionStatus } from "../types/camera.types";

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
    const [cameraPermission, setCameraPermission] =
        useState<PermissionStatus | null>(null);
    const [microphonePermission, setMicrophonePermission] =
        useState<PermissionStatus | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);

    const hasPermission =
        cameraPermission === "granted" && microphonePermission === "granted";

    const loadCurrentStatus = useCallback(() => {
        try {
            const cameraStatus = Camera.getCameraPermissionStatus();
            const microphoneStatus = Camera.getMicrophonePermissionStatus();
            setCameraPermission(cameraStatus as PermissionStatus);
            setMicrophonePermission(microphoneStatus as PermissionStatus);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn("Failed to read camera permissions", error);
            setCameraPermission("denied");
            setMicrophonePermission("denied");
        }
    }, []);

    const requestPermissions = useCallback(async (): Promise<boolean> => {
        setIsRequesting(true);
        try {
            const cameraStatus = await Camera.requestCameraPermission();
            const microphoneStatus = await Camera.requestMicrophonePermission();

            setCameraPermission(cameraStatus as PermissionStatus);
            setMicrophonePermission(microphoneStatus as PermissionStatus);

            return cameraStatus === "granted" && microphoneStatus === "granted";
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn("Failed to request camera permissions", error);
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
