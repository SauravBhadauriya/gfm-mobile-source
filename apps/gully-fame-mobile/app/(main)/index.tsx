import { router } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Main index - Only reached if user is logged in
 * If not logged in, root index.tsx will route to splash screen first
 */
export default function MainIndex() {
  useEffect(() => {
    const checkAuth = async () => {
      const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
      if (isLoggedIn === "true") {
        router.replace('/(main)/home' as any);
      } else {
        // If somehow reached here without login, go to splash
        router.replace('/auth/splashscreen' as any);
      }
    };
    checkAuth();
  }, []);
  return null;
}

