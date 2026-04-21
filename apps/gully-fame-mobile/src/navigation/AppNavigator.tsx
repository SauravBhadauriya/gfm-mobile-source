// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

import SplashScreen from '../screens/splashscreen';
import LoginScreen from '../screens/login';
import FeedScreen from '../screens/feed';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  // SplashScreen tab dikhao jab tak token check ho raha ho
  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // ✅ Logged in → Feed
          <Stack.Screen name="Feed" component={FeedScreen} />
        ) : (
          // ❌ Not logged in → Login
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}