import {
    RefObject,
    useCallback,
    useRef,
    useState,
    type MutableRefObject,
} from "react";
import type { CameraRecordingOptions } from "expo-camera";
import type { CameraClip } from "../types/camera.types";
import { CameraModeEnum } from "../utils/mediaTypes";
// import { Camera } from "react-native-vision-camera";
export interface UseCameraResult {
    cameraRef: RefObject<Camera | null>;
    isRecording: boolean;
    takePhoto: (aspectRatio?: string) => Promise<CameraClip | null>;
    startRecording: (
        onFinished: (clip: CameraClip | null) => void | Promise<void>,
        maxDurationSeconds?: number,
        speed?: number,
        aspectRatio?: string,
    ) => Promise<void>;
    stopRecording: () => Promise<void>;
}

/**
 * Hook that encapsulates expo-camera capture logic.
 */
export const useCamera = (
    mode: CameraModeEnum,
    _flash: unknown,
): UseCameraResult => {
    const cameraRef = useRef<Camera>(null);
    const [isRecording, setIsRecording] = useState(false);
    const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const isRecordingRef = useRef(false);

    const takePhoto = useCallback(
        async (aspectRatio?: string): Promise<CameraClip | null> => {
            if (!cameraRef.current || mode !== CameraModeEnum.Photo) {
                return null;
            }

            const makeId = () =>
                `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

            try {
                const photo = await cameraRef.current.takePhoto();
                const uri = photo.path ? `file://${photo.path}` : "";
                if (!uri) {
                    return null;
                }

                return {
                    id: makeId(),
                    uri,
                    duration: 0,
                    type: "photo",
                    source: "camera",
                    aspectRatio: aspectRatio as any,
                };
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn("Failed to take photo", error);
                return null;
            }
        },
        [mode],
    );

    const startRecording = useCallback(
        async (
            onFinished: (clip: CameraClip | null) => void | Promise<void>,
            maxDurationSeconds?: number,
            speed?: number,
            aspectRatio?: string,
        ): Promise<void> => {
            if (
                !cameraRef.current ||
                mode !== CameraModeEnum.Video ||
                isRecordingRef.current
            ) {
                return;
            }

            const makeId = () =>
                `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

            setIsRecording(true);
            isRecordingRef.current = true;

            // Clear any existing timer
            if (maxDurationTimerRef.current) {
                clearTimeout(maxDurationTimerRef.current);
                maxDurationTimerRef.current = null;
            }

            try {
                if (maxDurationSeconds && maxDurationSeconds > 0) {
                    maxDurationTimerRef.current = setTimeout(async () => {
                        if (cameraRef.current && isRecordingRef.current) {
                            try {
                                await cameraRef.current.stopRecording();
                            } catch (error) {
                                // eslint-disable-next-line no-console
                                console.warn(
                                    "Failed to auto-stop recording",
                                    error,
                                );
                            }
                        }
                    }, maxDurationSeconds * 1000);
                }
                cameraRef.current.startRecording({
                    onRecordingFinished: (video) => {
                        if (maxDurationTimerRef.current) {
                            clearTimeout(maxDurationTimerRef.current);
                            maxDurationTimerRef.current = null;
                        }
                        setIsRecording(false);
                        isRecordingRef.current = false;
                        const uri = video.path ? `file://${video.path}` : "";
                        const duration = video.duration ?? 0;
                        if (!uri) {
                            void onFinished(null);
                        } else {
                            void onFinished({
                                id: makeId(),
                                uri,
                                duration,
                                type: "video",
                                source: "camera",
                                speed: speed ?? 1,
                                aspectRatio: aspectRatio as any,
                            });
                        }
                    },
                    onRecordingError: (error) => {
                        if (maxDurationTimerRef.current) {
                            clearTimeout(maxDurationTimerRef.current);
                            maxDurationTimerRef.current = null;
                        }
                        console.error("Recording Error: ", error);
                        setIsRecording(false);
                        isRecordingRef.current = false;
                        void onFinished(null);
                    },
                });
            } catch (error) {
                // Clear timer on error
                if (maxDurationTimerRef.current) {
                    clearTimeout(maxDurationTimerRef.current);
                    maxDurationTimerRef.current = null;
                }
                // eslint-disable-next-line no-console
                console.error("Failed to start recording", error);
                setIsRecording(false);
                isRecordingRef.current = false;
                void onFinished(null);
            }
        },
        [mode],
    );

    const stopRecording = useCallback(async (): Promise<void> => {
        if (!cameraRef.current || !isRecordingRef.current) {
            return;
        }

        // Clear auto-stop timer
        if (maxDurationTimerRef.current) {
            clearTimeout(maxDurationTimerRef.current);
            maxDurationTimerRef.current = null;
        }
        try {
            await cameraRef.current.stopRecording();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn("Failed to stop recording", error);
        }
    }, []);

    return {
        cameraRef,
        isRecording,
        takePhoto,
        startRecording,
        stopRecording,
    };
};
