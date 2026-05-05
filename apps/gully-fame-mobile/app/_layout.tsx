import { Stack } from "expo-router";
// ThemeProvider removed - not needed for expo-router
// import {
//   ThemeProvider,
//   DarkTheme,
//   DefaultTheme,
// } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
// import { useColorScheme } from "react-native"; // Not needed without ThemeProvider
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BrandingProvider } from "@contexts/BrandingContext";
import {
    useFonts,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
} from "@expo-google-fonts/rubik";
import {
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
} from "@expo-google-fonts/playfair-display";
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from "@expo-google-fonts/inter";
import { UserRoleProvider } from "@/contexts/UserRoleContext";
// Side-effect imports moved to prevent bundling issues
// import '../src/api/check-dev-mode';
// import '../src/api/axios';
// import '../src/api/test-api';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    // const colorScheme = useColorScheme(); // Not used after removing ThemeProvider

    const [fontsLoaded, fontError] = useFonts({
        Rubik_400Regular,
        Rubik_500Medium,
        Rubik_700Bold,
        PlayfairDisplay_400Regular,
        PlayfairDisplay_500Medium,
        PlayfairDisplay_600SemiBold,
        PlayfairDisplay_700Bold,
        PlayfairDisplay_800ExtraBold,
        PlayfairDisplay_900Black,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            console.log("✅ Fonts ready");
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        console.log("⏳ Waiting for fonts...");
        return null;
    }

    return (
        <UserRoleProvider>
            <BrandingProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <Stack>
                        <Stack.Screen
                            name="index"
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="auth"
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="onboarding"
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="(main)"
                            options={{ headerShown: false }}
                        />
                    </Stack>
                    <StatusBar style="auto" />
                </GestureHandlerRootView>
            </BrandingProvider>
        </UserRoleProvider>
    );
}
