import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BrandingProvider } from "@contexts/BrandingContext";
import { UserRoleProvider } from "@/contexts/UserRoleContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// ✅ ADD: React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ✅ ADD: Redux
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store"; // tumhara store path check karo

// ✅ ADD: Fonts
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
import { AuthProvider, useAuth } from "@/contexts/AuthContext";





// ✅ ADD: QueryClient instance (layout ke bahar banao — re-render se bachao)
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,               // fail hone par 2 baar retry
            staleTime: 1000 * 60,   // 1 min tak data fresh maana jayega
        },
    },
});

SplashScreen.preventAutoHideAsync();

// ✅ NEW: Separate component — useRouter/useSegments ko
//    NavigationContainer ke andar hona zaroori hai
function AuthGate() {
    const { token, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return; // Token check ho raha hai — wait karo

        const inAuthGroup = segments[0] === "auth";
        const inOnboarding = segments[0] === "onboarding";

        if (!token && !inAuthGroup && !inOnboarding) {
            // ❌ Logged out → Login bhejo
            router.replace("/auth/login");
        } else if (token && inAuthGroup) {
            // ✅ Already logged in → Main app bhejo
            router.replace("/(main)");
        }
    }, [token, isLoading, segments]);

    return null; // Koi UI nahi — sirf redirect logic
}



export default function RootLayout() {
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
            if (fontError) console.warn("⚠️ Font error:", fontError);
            else console.log("✅ Fonts ready");
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    // ✅ FIX: null ki jagah proper return — SplashScreen khud handle kar raha hai
    if (!fontsLoaded && !fontError) {
        return null; // Yeh theek hai — SplashScreen show hoga
    }

    return (
        // 1️⃣ ErrorBoundary — sabse bahar (koi bhi crash pakad le)
        <ErrorBoundary>
            {/* 2️⃣ Redux — global state ke liye */}
            <ReduxProvider store={store}>
                {/* 3️⃣ React Query — API calls ke liye */}
                <QueryClientProvider client={queryClient}>
                    {/* 4️⃣ Custom Contexts */}
                         <AuthProvider>
                    <UserRoleProvider>
                        <BrandingProvider>
                            {/* 5️⃣ Gesture Handler — animations ke liye */}
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
                    </AuthProvider>
                </QueryClientProvider>
            </ReduxProvider>
        </ErrorBoundary>
    );
}