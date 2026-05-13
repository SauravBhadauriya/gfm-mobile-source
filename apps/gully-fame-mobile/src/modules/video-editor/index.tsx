import React, { useCallback, useState, useEffect } from "react";
import { View, BackHandler } from "react-native";
import { router } from "expo-router";
import HomeScreen from "./camera-module/screens/HomeScreen";
import CameraScreen from "./camera-module/screens/CameraScreen";
import PreviewScreen from "./camera-module/screens/PreviewScreen";
import ExportScreen from "./camera-module/components/ExportScreen";
import type { CameraClipArray, CameraModuleScreenName } from "./camera-module/types/camera.types";

interface VideoEditorProps {
  onExport?: (clips: CameraClipArray) => void;
  onCancel?: () => void;
  initialMode?: "camera" | "gallery";
  competitionId?: string | null;
  competitionName?: string | null;
  entryFee?: string | null;
}

/**
 * Video Editor Module Integration
 *
 * This component integrates the video editor into the Gully Fame mobile app.
 * When users try to upload photos/videos, this editor opens within the app.
 *
 * Flow: Home → Camera → Preview → Export → Return to Upload Flow
 */
const VideoEditorModule: React.FC<VideoEditorProps> = ({
  onExport,
  onCancel,
  initialMode = "camera",
  competitionId,
  competitionName,
  entryFee,
}) => {
  const [screen, setScreen] = useState<CameraModuleScreenName>(
    initialMode === "gallery" ? "Camera" : "Home"
  );
  const [previewClips, setPreviewClips] = useState<CameraClipArray>([]);
  const [cameraClips, setCameraClips] = useState<CameraClipArray>([]);
  const [showExport, setShowExport] = useState(false);
  const [previewDimensions, setPreviewDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [globalTracks, setGlobalTracks] = useState({
    text: [] as any[],
    stickers: [] as any[],
    pips: [] as any[],
  });

  // Intercept Android back button to prevent expo-router from handling it
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      // Return true to prevent default back behavior
      // This prevents the "GO_BACK was not handled by any navigator" error
      handleBackToHome();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [handleBackToHome]);

  const handleOpenCamera = useCallback(() => {
    setCameraClips([]);
    setScreen("Camera");
  }, []);

  const handleBackToHome = useCallback(() => {
    console.log("[VideoEditor] Back button pressed, calling onCancel");
    // Go back to Home screen instead of router.back()
    setScreen("Home");
    setCameraClips([]);
    setPreviewClips([]);

    // If onCancel is provided, call it (for parent component)
    if (onCancel) {
      console.log("[VideoEditor] Calling onCancel callback");
      onCancel();
    }
  }, [onCancel]);
  const [projectConfig, setProjectConfig] = useState<{
    resolution: "hd" | "2k" | "4k";
    fps: number;
  }>({
    resolution: "hd",
    fps: 30,
  });
  const handleNextFromCamera = useCallback(
    (clips: CameraClipArray, config?: { resolution: "hd" | "2k" | "4k"; fps: number }) => {
      setCameraClips(clips);
      setPreviewClips(clips);
      if (config) {
        setProjectConfig(config);
      }
      setScreen("Preview");
    },
    []
  );

  const handleAddClipFromPreview = useCallback((source: "camera" | "gallery", tracks: any) => {
    if (tracks) setGlobalTracks(tracks);
    if (source === "camera") {
      setScreen("Camera");
    }
  }, []);

  const handleBackFromPreview = useCallback((tracks: any) => {
    if (tracks) setGlobalTracks(tracks);
    setScreen("Camera");
  }, []);

  const handleClipUpdateFromPreview = useCallback((clips: CameraClipArray) => {
    setPreviewClips(clips);
    setCameraClips(clips);
  }, []);

  const handleNextFromPreview = useCallback(
    (
      clips: CameraClipArray,
      textTracks: any[],
      stickerTracks: any[],
      pipTracks: any[],
      dimensions: { width: number; height: number }
    ) => {
      setPreviewClips(clips);
      setGlobalTracks({
        text: textTracks,
        stickers: stickerTracks,
        pips: pipTracks,
      });
      setPreviewDimensions(dimensions);
      setShowExport(true);
    },
    []
  );

  const handleExportComplete = useCallback(
    (finalVideoUri: string) => {
      setShowExport(false);

      if (onExport) {
        // If the parent is listening, hand them the baked video URI!
        // (Note: you might need to update the onExport type to accept a string)
        onExport([{ ...previewClips[0], uri: finalVideoUri }] as any);
      } else {
        // Navigate to the "Post Now" screen, passing the BAKED video!
        router.push({
          pathname: "/(main)/camera/upload",
          params: {
            // Send the final baked video instead of the raw unedited clips
            clips: JSON.stringify([{ ...previewClips[0], uri: finalVideoUri }]),
            ...(competitionId && { competitionId }),
            ...(competitionName && {
              competitionName: encodeURIComponent(competitionName),
            }),
            ...(entryFee && {
              entryFee: encodeURIComponent(entryFee),
            }),
          },
        });
      }
    },
    [onExport, previewClips, competitionId, competitionName, entryFee]
  );

  const handleBackFromExport = useCallback(() => {
    setShowExport(false);
  }, []);

  // Show ExportScreen if export is triggered
  if (showExport) {
    return (
      <ExportScreen
        clips={previewClips}
        onBack={handleBackFromExport}
        onComplete={handleExportComplete}
        globalPipOverlays={globalTracks.pips}
        globalStickerOverlays={globalTracks.stickers}
        globalTextOverlays={globalTracks.text}
        previewDimensions={previewDimensions}
        projectConfig={projectConfig}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {screen === "Home" && <HomeScreen onOpenCamera={handleOpenCamera} />}
      {screen === "Camera" && (
        <CameraScreen
          onBack={handleBackToHome}
          onNext={handleNextFromCamera}
          initialClips={cameraClips}
        />
      )}
      {screen === "Preview" && (
        <PreviewScreen
          clips={previewClips}
          globalTracks={globalTracks}
          onBack={handleBackFromPreview}
          onClipUpdate={handleClipUpdateFromPreview}
          onAddClip={handleAddClipFromPreview}
          onExport={handleNextFromPreview}
        />
      )}
    </View>
  );
};

export default VideoEditorModule;
