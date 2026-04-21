import React, { useCallback } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView } from 'expo-camera';
import useCameraPermissions from './useCameraPermissions';

/**
 * CameraScreen
 *
 * - Handles camera + microphone permissions safely
 * - Renders a stable CameraView component from expo-camera
 * - Never evaluates to undefined (all imports are validated and default-exported)
 *
 * This screen is intentionally minimal and self-contained so it can be reused
 * from the VideoEditorModule or any future editor flows.
 */
const CameraScreen: React.FC = () => {
  const { hasPermission, isRequesting, requestPermissions } = useCameraPermissions();

  const handleRequest = useCallback(() => {
    void requestPermissions();
  }, [requestPermissions]);

  // While we are checking permission state, show a neutral loader.
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#ffffff" />
        <Text style={styles.message}>Checking camera permissions…</Text>
      </SafeAreaView>
    );
  }

  // Permissions not granted: show explanation + button to request again.
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.message}>
          This feature needs access to your camera and microphone to record video.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRequest}
          disabled={isRequesting}
        >
          <Text style={styles.primaryButtonText}>
            {isRequesting ? 'Requesting…' : 'Grant permission'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Permissions granted: render the camera preview.
  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        flash="off"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: '#050509',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#e5e7eb',
    fontSize: 14,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default CameraScreen;


