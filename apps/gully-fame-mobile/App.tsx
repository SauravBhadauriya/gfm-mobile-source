// KIRO: App.tsx is deprecated - using Expo Router (app directory) instead
// This file is kept for backward compatibility but is not used
// The actual app entry point is in app/_layout.tsx

import React from "react";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>This app uses Expo Router. Please use the app directory structure.</Text>
    </View>
  );
}
