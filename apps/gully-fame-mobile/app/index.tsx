import { useEffect } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';

/**
 * Root index file - Always redirects to splash screen first
 * Splash screen will then check login/onboarding status and route accordingly
 */
export default function Index() {
  useEffect(() => {
    // Always start with splash screen
    // Splash screen will handle the routing logic based on login/onboarding status
    router.replace('/auth/splashscreen' as any);
  }, []);

  return <View style={{ flex: 1 }} />;
}

