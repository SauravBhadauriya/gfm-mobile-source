import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoEditorModule from '@modules/video-editor';

const CameraUploadScreen = () => {
  const params = useLocalSearchParams();
  const competitionId = params.competitionId ? String(params.competitionId) : null;
  const competitionName = params.competitionName ? String(params.competitionName) : null;
  const entryFee = params.entryFee ? String(params.entryFee) : null;
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [roleVerified, setRoleVerified] = useState(false);

  useEffect(() => {
    const verifyRole = async () => {
      const role = await AsyncStorage.getItem("userRole");
      const isParticipant = role === "participant" || role === "participants";
      
      if (!isParticipant) {
        Alert.alert(
          "Participants only",
          "Switch your account role to participant to submit entries. Fans can still follow and vote!",
          [{ text: "OK", onPress: () => router.replace("/(main)") }]
        );
      } else {
        setRoleVerified(true);
        // Open VideoEditor directly instead of camera screen
        setShowVideoEditor(true);
      }
    };
    verifyRole();
  }, []);

  const handleVideoEditorExport = (clips: any[]) => {
    setShowVideoEditor(false);
    // Navigate to upload screen with clips
    router.push({
      pathname: '/(main)/camera/upload',
      params: {
        clips: JSON.stringify(clips),
        ...(competitionId && { competitionId }),
        ...(competitionName && { competitionName: encodeURIComponent(competitionName) }),
        ...(entryFee && { entryFee: encodeURIComponent(entryFee) }),
      },
    });
  };

  const handleVideoEditorCancel = () => {
    setShowVideoEditor(false);
    router.back();
  };

  if (!roleVerified) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (showVideoEditor) {
    return (
      <VideoEditorModule
        onExport={handleVideoEditorExport}
        onCancel={handleVideoEditorCancel}
        initialMode="camera"
        competitionId={competitionId}
        competitionName={competitionName}
        entryFee={entryFee}
      />
    );
  }

  return <View style={{ flex: 1, backgroundColor: '#000' }} />;
};

export default CameraUploadScreen;
