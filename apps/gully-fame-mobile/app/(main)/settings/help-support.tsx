import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { BackIcon } from "@/icons";

const helpTopics = [
  { id: 1, title: "How to join a competition?", icon: "Q" },
  { id: 2, title: "How to upload videos?", icon: "U" },
  { id: 3, title: "Payment & Refunds", icon: "P" },
  { id: 4, title: "Account Settings", icon: "A" },
  { id: 5, title: "Contact Support", icon: "C" },
];

export default function HelpSupportScreen() {
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Support Overview</Text>
          <Text style={styles.bodyText}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus a
            arcu at arcu semper vulputate. Duis pharetra, velit sed cursus
            gravida, justo justo vulputate ipsum, vitae ullamcorper erat dolor
            vel nunc. Maecenas efficitur, felis non faucibus tincidunt, sem
            magna pharetra purus, vel bibendum tortor neque vel arcu. In hac
            habitasse platea dictumst.
          </Text>
          <Text style={styles.bodyText}>
            Pellentesque habitant morbi tristique senectus et netus et malesuada
            fames ac turpis egestas. Suspendisse potenti. Integer volutpat
            vestibulum risus, sed vulputate odio placerat vel. Nulla facilisi.
          </Text>
        </View>

        {helpTopics.map((topic) => (
          <TouchableOpacity key={topic.id} style={styles.topicCard}>
            <View style={styles.topicIcon}>
              <Circle cx="20" cy="20" r="18" fill="#EC9A15" opacity="0.2" />
              <Text style={styles.topicIconText}>{topic.icon}</Text>
            </View>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-6-6-6"
                stroke="#999"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Need More Help?</Text>
          <Text style={styles.contactText}>Email: support@gullyfame.com</Text>
          <Text style={styles.contactText}>Phone: +91 1234567890</Text>
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
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    color: "#EC9A15",
    fontSize: 20,
    marginBottom: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  bodyText: {
    color: "#ccc",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  topicCard: {
    backgroundColor: "#252525",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    backgroundColor: "rgba(236, 154, 21, 0.15)",
  },
  topicIconText: {
    position: "absolute",
    color: "#EC9A15",
    fontSize: 22,
    fontWeight: "700",
  },
  topicTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  contactSection: {
    marginTop: 16,
    padding: 20,
    backgroundColor: "#252525",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(236, 154, 21, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  contactTitle: {
    color: "#EC9A15",
    fontSize: 20,
    marginBottom: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  contactText: {
    color: "#ccc",
    fontSize: 15,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
});
