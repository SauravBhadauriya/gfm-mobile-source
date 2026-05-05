import React, { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  Image,
  Alert,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UploadIcon } from "@/icons";

const { width, height } = Dimensions.get("window");

// BOTTOM NAV COMPONENT
export default function BottomNav({ activeTab, setActiveTab, tabs, onOpenDrawer }) {
  const insets = { bottom: Platform.OS === "ios" ? 20 : 0 }; // iOS safe area insets
  const [profileImage, setProfileImage] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Protected routes that require login
  const protectedRoutes = ["Upload", "MyFame"];

  const loadProfileImage = async () => {
    try {
      const loginStatus = await AsyncStorage.getItem("isLoggedIn");
      const loggedIn = loginStatus === "true";
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        const image = await AsyncStorage.getItem("userProfileImage");
        if (image && image.trim() !== "") {
          setProfileImage(image);
        } else {
          setProfileImage(null);
        }
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      console.error("Error loading profile image:", error);
      setProfileImage(null);
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    loadProfileImage();
  }, []);

  // Reload profile image more frequently for instant updates
  useEffect(() => {
    const interval = setInterval(loadProfileImage, 500);
    return () => clearInterval(interval);
  }, []);

  const handlePress = async (tabName) => {
    // Check if this is a protected route
    if (protectedRoutes.includes(tabName)) {
      try {
        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
        if (isLoggedIn !== "true") {
          // User not logged in - open drawer menu
          if (onOpenDrawer && typeof onOpenDrawer === "function") {
            onOpenDrawer();
          }
          return; // Don't navigate
        }
      } catch (e) {
        console.error("Failed to check login status", e);
        // On error, open drawer menu as fallback
        if (onOpenDrawer && typeof onOpenDrawer === "function") {
          onOpenDrawer();
        }
        return;
      }
    }

    // User is logged in or route doesn't need auth - proceed with navigation
    // Use replace for tab navigation to avoid stacking screens
    // Set active tab immediately for instant UI feedback
    setActiveTab(tabName);

    if (tabName === "Search") {
      router.replace("/(main)/search");
    } else if (tabName === "Home") {
      // Navigate to home immediately without waiting
      router.replace("/(main)/home");
    } else if (tabName === "MyFame") {
      // Route to user's own profile page - profile/[id].tsx shows own profile when isViewingOther is not true
      // Use a placeholder ID that will be ignored since we're viewing own profile
      router.push({
        pathname: "/(main)/profile/[id]",
        params: { id: "me" },
      });
    } else if (tabName === "Upload") {
      // Check if user is a fan - show restriction alert
      try {
        const userRole = await AsyncStorage.getItem("userRole");
        if (userRole === "fan") {
          Alert.alert("Upload Restricted", "Please upgrade your role to Participant to upload.", [
            { text: "OK" },
          ]);
          return; // Don't navigate
        }
      } catch (e) {
        console.error("Failed to check user role", e);
      }
      router.replace("/(main)/upload");
    } else if (tabName === "Search") {
      // TODO: Navigate to search/explore page
    } else if (tabName === "Reel") {
      router.replace("/(main)/reel");
    }
  };

  return (
    <View
      style={[
        styles.bottomNav,
        {
          paddingBottom:
            Platform.OS === "ios" ? Math.max(insets.bottom, height * 0.025) : height * 0.025,
        },
      ]}
    >
      {tabs.map((tab) => {
        if (tab.name === "Upload") {
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.uploadButton}
              onPress={() => handlePress(tab.name)}
            >
              <UploadIcon />
              <Text style={styles.uploadText}>{tab.label}</Text>
            </TouchableOpacity>
          );
        }

        const isActive = activeTab === tab.name;
        const IconComponent = tab.icon;

        // Don't render if icon is missing (except for Upload)
        if (!IconComponent) return null;

        // Check if IconComponent is actually a function
        if (typeof IconComponent !== "function") {
          return null;
        }

        // Special handling for MyFame - show user profile image if logged in and available
        if (tab.name === "MyFame" && isLoggedIn && profileImage) {
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.navItem}
              onPress={() => handlePress(tab.name)}
            >
              <Image
                source={{ uri: profileImage }}
                style={[styles.profileImageNav, isActive && styles.profileImageNavActive]}
              />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {tab.label || tab.name}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.navItem}
            onPress={() => handlePress(tab.name)}
          >
            <IconComponent color={isActive ? "#EC9A15" : "#fff"} />
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {tab.label || tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#3C2610",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: height * 0.006,
    paddingHorizontal: width * 0.02,
    borderTopWidth: 0,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: height * 0.003,
  },
  navText: {
    fontSize: width * 0.025,
    color: "#fff",
    marginTop: height * 0.003,
  },
  navTextActive: {
    color: "#EC9A15",
  },
  uploadButton: {
    backgroundColor: "#EC9A15",
    borderRadius: 25,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.04,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: width * 0.015,
    marginVertical: height * 0.004,
    minWidth: width * 0.3,
  },
  uploadText: {
    color: "#fff",
    fontSize: width * 0.032,
    marginLeft: width * 0.015,
  },
  profileImageNav: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  profileImageNavActive: {
    borderColor: "#EC9A15",
    borderWidth: 2,
  },
});
