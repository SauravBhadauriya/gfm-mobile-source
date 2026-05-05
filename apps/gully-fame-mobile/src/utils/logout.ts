import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeAuthToken } from "@api/axios";

export const performLogout = async (): Promise<void> => {
  try {
    await removeAuthToken();

    await AsyncStorage.multiRemove([
      "isLoggedIn",
      "authToken",
      "userId",
      "userRole",
      "userEmail",
      "userFirstName",
      "userLastName",
      "userMobile",
      "accountCreated",
      "profileCompleted",
      "termsAccepted",
      "hasSeenOnboarding",
    ]);

    if (__DEV__) {
      console.log("✅ Logout successful - All user data cleared");
    }

    // Note: Navigation will be handled by the app's main navigation context
    // This function just clears the session data
  } catch (error) {
    console.error("❌ Failed to log out:", error);
  }
};
