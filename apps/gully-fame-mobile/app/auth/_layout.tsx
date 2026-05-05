import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splashscreen" />
      <Stack.Screen name="onboarding1" />
      <Stack.Screen name="onboarding2" />
      <Stack.Screen name="onboarding3" />
      <Stack.Screen name="onboarding4" />
      <Stack.Screen name="createaccount" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="login-via-otp" />
      <Stack.Screen name="login-via-email" />
      <Stack.Screen name="location/index" />
      <Stack.Screen name="termsandconditions" />
    </Stack>
  );
}