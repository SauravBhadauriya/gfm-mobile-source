import React from 'react';
import { View } from 'react-native';
import { CameraScreen } from './camera';

/**
 * Root entry point for the video editor module.
 *
 * Currently this module only exposes the camera capture flow, but it is
 * designed so you can later add timelines, editing tools, etc, without
 * changing how consumers import it:
 *
 *   import { VideoEditorModule } from '@video-editor';
 */
const VideoEditorModule: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <CameraScreen />
    </View>
  );
};

export default VideoEditorModule;


