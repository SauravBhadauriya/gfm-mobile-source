import { useEffect, useState } from "react";
import { StyleSheet, View, Image } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { router } from "expo-router";

// Prevent the native splash screen from auto‑hiding
(async () => {
  try {
    await SplashScreen.preventAutoHideAsync();
  } catch (e) {
    console.warn("Error preventing auto hide splash:", e);
  }
})();

// Mock hook for auth check
const useAuthStatus = (): boolean | null => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAuthenticated(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return isAuthenticated;
};

export default function AppSplash() {
  const isAuthenticated = useAuthStatus();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 5000); // 5 seconds minimum

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated !== null && minTimePassed) {
      (async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn("Error hiding splash screen:", e);
        }

        if (isAuthenticated) {
          router.replace("./(main)");
        } else {
          router.replace("/onboarding" as any);
        }
      })();
    }
  }, [isAuthenticated, minTimePassed]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
