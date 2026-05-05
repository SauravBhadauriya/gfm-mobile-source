import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
  Alert,
  Share,
} from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Dimensions } from "react-native";
import {
  BackIcon,
  InstagramIcon,
  WhatsAppIcon,
  SnapchatIcon,
  TwitterIcon,
  FacebookIcon,
} from "@/icons";
const { width, height } = Dimensions.get("window");

// Social Media Icons

const socialPlatforms = [
  { id: 1, name: "WhatsApp", icon: WhatsAppIcon, color: "#25D366" },
  { id: 2, name: "Instagram", icon: InstagramIcon, color: "#E4405F" },
  { id: 3, name: "Snapchat", icon: SnapchatIcon, color: "#FFEC06" },
  { id: 4, name: "Twitter", icon: TwitterIcon, color: "#1DA1F2" },
  { id: 5, name: "Facebook", icon: FacebookIcon, color: "#1877F2" },
];

export default function InviteFriendScreen() {
  const shareMessage =
    "Join me on Gully Fame! Download the app and let's create amazing content together! 🎉";
  const shareUrl = "https://gullyfame.com/download";

  const handleShare = async (platform: string) => {
    try {
      const message = `${shareMessage}\n${shareUrl}`;

      switch (platform) {
        case "WhatsApp":
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
          const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
          if (canOpenWhatsApp) {
            await Linking.openURL(whatsappUrl);
          } else {
            Alert.alert(
              "WhatsApp not installed",
              "Please install WhatsApp to share",
            );
          }
          break;
        case "Instagram":
          // Instagram doesn't support direct sharing via URL scheme for text
          // Use native share instead
          await Share.share({
            message: message,
            title: "Invite to Gully Fame",
          });
          break;
        case "Snapchat":
          const snapchatUrl = `snapchat://share?text=${encodeURIComponent(message)}`;
          const canOpenSnap = await Linking.canOpenURL(snapchatUrl);
          if (canOpenSnap) {
            await Linking.openURL(snapchatUrl);
          } else {
            Alert.alert(
              "Snapchat not installed",
              "Please install Snapchat to share",
            );
          }
          break;
        case "Twitter":
          const twitterUrl = `twitter://post?message=${encodeURIComponent(message)}`;
          const canOpenTwitter = await Linking.canOpenURL(twitterUrl);
          if (canOpenTwitter) {
            await Linking.openURL(twitterUrl);
          } else {
            const twitterWebUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
            await Linking.openURL(twitterWebUrl);
          }
          break;
        case "Facebook":
          const facebookUrl = `fb://share?text=${encodeURIComponent(message)}`;
          const canOpenFB = await Linking.canOpenURL(facebookUrl);
          if (canOpenFB) {
            await Linking.openURL(facebookUrl);
          } else {
            const fbWebUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
            await Linking.openURL(fbWebUrl);
          }
          break;
        default:
          await Share.share({
            message: message,
            title: "Invite to Gully Fame",
          });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Unable to share. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Your Friend</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          <Text style={styles.title}>Share Gully Fame</Text>
          <Text style={styles.description}>
            Invite your friends to join Gully Fame and start creating amazing
            content together!
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.platformsContainer}
        >
          {socialPlatforms.map((platform) => {
            const IconComponent = platform.icon;
            return (
              <TouchableOpacity
                key={platform.id}
                style={styles.platformCard}
                onPress={() => handleShare(platform.name)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <IconComponent size={40} />
                </View>
                <Text style={styles.platformName}>{platform.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why Invite Friends?</Text>
          <Text style={styles.infoText}>
            • Get bonus coins when your friends join{"\n"}• Compete together in
            competitions{"\n"}• Share and discover amazing content{"\n"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3C2610",
    paddingTop: Platform.OS === "android" ? 20 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  contentCard: {
    backgroundColor: "#252525",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    color: "#EC9A15",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  description: {
    color: "#ccc",
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  platformsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  platformCard: {
    backgroundColor: "#252525",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    minWidth: 80,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 8,
  },
  platformName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  infoCard: {
    backgroundColor: "#252525",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  infoTitle: {
    color: "#EC9A15",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  infoText: {
    color: "#ccc",
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
});
