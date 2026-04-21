// app/auth/splashscreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { wp, hp } from "@utils/responsive";

const DEFAULT_LOGO = require("@assets/images/logogfi.png");
const DEFAULT_BACKGROUND = "#3C2610";

export default function SplashScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // ✅ Animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // ✅ Navigation Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                // ✅ FIX: "auth_token" use karo — AuthContext se match karega
                const token = await AsyncStorage.getItem("authToken");
                let hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");

                // DEV mode: onboarding hamesha dikhao
                if (__DEV__) {
                    hasSeenOnboarding = null;
                }

                if (token) {
                    // ✅ Logged in → Home
                    router.replace("/(main)/home");
                } else if (hasSeenOnboarding === "true") {
                    // ✅ Onboarding dekhi → Signin
                    router.replace("/auth/signin");
                } else {
                    // ✅ Fresh install → Onboarding
                    router.replace("/auth/onboarding1");
                }
            } catch (error) {
                console.error("[SplashScreen] Error:", error);
                router.replace("/auth/onboarding1");
            }
        }, 2500);

        // ✅ Cleanup — component unmount hone par timer cancel
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.Image
                source={DEFAULT_LOGO}
                style={[
                    styles.logo,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: DEFAULT_BACKGROUND,
    },
    logo: {
        width: wp(70),
        height: hp(40),
        maxWidth: 300,
        maxHeight: 300,
    },
});