// Smart Profile Router - Automatically routes to correct profile screen based on role
// Easy to extend for new roles - just add to PROFILE_ROUTES in profileTypes.ts

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { getProfileRoute, DEFAULT_ROLE } from "./shared/profileTypes";

export default function ProfileRouter() {
  const params = useLocalSearchParams();
  const hasRouted = useRef(false);
  const profileIdRef = useRef<string>("");
  const lastRefreshRef = useRef<string>("");
  // Extract stable values from params
  const profileId = (params.id as string) || (params.userId as string) || "";
  const role = (params.role as string) || DEFAULT_ROLE;
  const firstName = (params.firstName as string) || "";
  const lastName = (params.lastName as string) || "";
  const bio = (params.bio as string) || "";
  const refresh = (params.refresh as string) || "";
  useEffect(() => {
    if (refresh && refresh !== lastRefreshRef.current) {
      hasRouted.current = false;
      profileIdRef.current = "";
      lastRefreshRef.current = refresh;
    }
    // Prevent multiple route attempts
    if (hasRouted.current) return;

    // Only proceed if profileId has changed or is newly set
    if (!profileId || profileId === profileIdRef.current) {
      return;
    }

    profileIdRef.current = profileId;

    const determineRoute = async () => {
      try {
        // Get current user's ID from AsyncStorage to compare
        const currentUserId = await AsyncStorage.getItem("userId");

        // Determine if viewing own profile or another user's profile
        // If profileId is "me", empty, or matches currentUserId, it's own profile
        const isViewingOther =
          profileId &&
          profileId !== "me" &&
          profileId !== "" &&
          profileId !== currentUserId;

        if (isViewingOther) {
          // Viewing another user's profile - use role from params or default
          const userRole = role || DEFAULT_ROLE;
          const route = getProfileRoute(userRole, false);

          hasRouted.current = true;
          router.replace({
            pathname: route,
            params: {
              id: profileId,
              userId: profileId,
              firstName: firstName,
              lastName: lastName,
              role: userRole,
              bio: bio,
            },
          } as any);
        } else {
          // Viewing own profile - get role from AsyncStorage
          const userRole =
            (await AsyncStorage.getItem("userRole")) || DEFAULT_ROLE;
          const route = getProfileRoute(userRole, true);

          hasRouted.current = true;
          router.replace(route as any);
        }
      } catch (error) {
        console.error("Error determining profile route:", error);
        // Default fallback - assume own profile
        try {
          const userRole =
            (await AsyncStorage.getItem("userRole")) || DEFAULT_ROLE;
          const fallbackRoute = getProfileRoute(userRole, true);
          hasRouted.current = true;
          router.replace(fallbackRoute as any);
        } catch (fallbackError) {
          console.error("Fallback route error:", fallbackError);
        }
      }
    };

    determineRoute();
  }, [profileId, role, firstName, lastName, bio, refresh]); // Depend on specific values, not params object

  // Show loading while determining route
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#3C2610",
      }}
    >
      <StatusBar barStyle="light-content" />
      <ActivityIndicator size="large" color="#EC9A15" />
    </View>
  );
}
