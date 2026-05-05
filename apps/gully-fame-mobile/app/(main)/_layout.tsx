import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        animationDuration: 0,
        contentStyle: {
          backgroundColor: '#3C2610',
        },
      }}
    >
      <Stack.Screen 
        name="home" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="reel" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="search" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="profile" 
        options={{
          animation: 'none',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="community" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="inbox" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="settings" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="competitions" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="camera" 
        options={{
          animation: 'none',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="upload" 
        options={{
          animation: 'none',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="competition" 
        options={{
          animation: 'none',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="category" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="chat" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="account-center" 
        options={{
          animation: 'none',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="change-password" 
        options={{
          animation: 'none',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="coins" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="history" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="saved" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="modal" 
        options={{
          animation: 'none',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}