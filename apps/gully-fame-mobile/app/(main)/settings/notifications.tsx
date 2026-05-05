import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Image,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { BackIcon } from "@/icons";
// Get initial dimensions
const getDimensions = () => Dimensions.get("window");

// Notification data matching the image
const todayNotifications = [
  {
    id: 1,
    title: "Rank Boost!",
    description: "Your Gully Score just climbed higher.",
    highlighted: true,
  },
  {
    id: 2,
    title: "Daily Challenge Ready",
    description: "Drop your bars to earn points today.",
    highlighted: false,
  },
  {
    id: 3,
    title: "New Rap Battle Invite",
    description: "A challenger just called you out!",
    highlighted: false,
  },
  {
    id: 4,
    title: "Upcoming Event Alert",
    description: "A new cypher is happening this weekend.",
    highlighted: false,
  },
  {
    id: 5,
    title: "Profile Update",
    description: "Add new clips to increase your visibility.",
    highlighted: false,
  },
];

const pastNotifications = [
  {
    id: 6,
    title: "Competition Results",
    description: "Results for Summer Showdown 2024 are out!",
    highlighted: false,
  },
  {
    id: 7,
    title: "Payment Successful",
    description: "Your entry fee has been processed successfully",
    highlighted: false,
  },
];

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState<"Today" | "Past">("Today");
  const [dimensions, setDimensions] = useState(getDimensions());
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Listen for dimension changes (orientation, split screen, etc.)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Animate slide when tab changes
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === "Today" ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [activeTab]);

  const currentNotifications =
    activeTab === "Today" ? todayNotifications : pastNotifications;

  // Responsive scaling functions based on current dimensions
  const scale = (size: number) => (dimensions.width / 375) * size;
  const scaleVertical = (size: number) => (dimensions.height / 812) * size;
  const getFontSize = (size: number) => {
    const scaled = scale(size);
    return Math.max(scaled, size * 0.8);
  };

  // Responsive styles based on screen size
  const isSmallScreen = dimensions.width < 375;
  const tabMargin = isSmallScreen ? scale(20) : scale(50);

  // Create responsive styles - Reduced sizes
  const responsiveStyles = {
    headerContainer: {
      ...styles.headerContainer,
      paddingTop: Math.max(insets.top, scale(20)),
      paddingBottom: scaleVertical(20),
      borderBottomLeftRadius: scale(30),
      borderBottomRightRadius: scale(30),
    },
    header: {
      ...styles.header,
      paddingHorizontal: scale(12),
      paddingTop: Platform.OS === "ios" ? scaleVertical(8) : scaleVertical(12),
      paddingBottom: scaleVertical(12),
      gap: scale(12),
    },
    headerButton: {
      ...styles.headerButton,
      width: scale(32),
      height: scale(32),
      minWidth: scale(32),
      minHeight: scale(32),
    },
    headerTitle: {
      ...styles.headerTitle,
      fontSize: getFontSize(22),
    },
    tabsContainer: {
      ...styles.tabsContainer,
      marginHorizontal: tabMargin,
      paddingHorizontal: scale(6),
      gap: scale(8),
      borderRadius: scale(12),
      marginTop: scaleVertical(8),
      marginBottom: scaleVertical(8),
    },
    tab: {
      ...styles.tab,
      paddingVertical: scaleVertical(10),
      paddingHorizontal: scale(6),
      borderRadius: scale(12),
      minHeight: scale(36),
    },
    tabText: {
      ...styles.tabText,
      fontSize: getFontSize(13),
    },
    scrollContent: {
      ...styles.scrollContent,
      paddingHorizontal: scale(12),
      paddingTop: scaleVertical(16),
      paddingBottom: scaleVertical(30),
    },
    sectionHeading: {
      ...styles.sectionHeading,
      fontSize: getFontSize(18),
      marginBottom: scaleVertical(12),
    },
    notificationsList: {
      ...styles.notificationsList,
      gap: scaleVertical(10),
    },
    notificationCard: {
      ...styles.notificationCard,
      borderRadius: scale(12),
      padding: scale(12),
      minHeight: scale(65),
    },
    bellIconContainer: {
      ...styles.bellIconContainer,
      marginRight: scale(10),
      borderRadius: scale(8),
      width: scale(45),
      height: scale(45),
      minWidth: scale(45),
      minHeight: scale(45),
    },
    bellBadge: {
      ...styles.bellBadge,
      top: scale(-5),
      right: scale(-5),
      borderRadius: scale(8),
      minWidth: scale(16),
      height: scale(16),
      paddingHorizontal: scale(3),
    },
    bellBadgeText: {
      ...styles.bellBadgeText,
      fontSize: getFontSize(7),
    },
    notificationContent: {
      ...styles.notificationContent,
      paddingRight: scale(3),
    },
    notificationTitle: {
      ...styles.notificationTitle,
      fontSize: getFontSize(16),
      marginBottom: scaleVertical(1),
    },
    notificationDescription: {
      ...styles.notificationDescription,
      fontSize: getFontSize(12),
      lineHeight: scale(16),
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

      {/* Header with curved bottom */}
      <View style={responsiveStyles.headerContainer}>
        <View style={responsiveStyles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={responsiveStyles.headerButton}
          >
            <BackIcon color="#EC9A15" />
          </TouchableOpacity>
          <Text
            style={responsiveStyles.headerTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Notifications
          </Text>
          <View style={responsiveStyles.headerButton} />
        </View>

        {/* Tabs */}
        <View style={responsiveStyles.tabsContainer}>
          {/* Animated sliding background */}
          <Animated.View
            style={[
              styles.slidingIndicator,
              {
                top: 0,
                left: scale(6),
                borderRadius: scale(12),
                height: "100%",
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        0,
                        (dimensions.width -
                          tabMargin * 2 -
                          scale(6) * 2 -
                          scale(8)) /
                          2 +
                          scale(8),
                      ],
                    }),
                  },
                ],
                width:
                  (dimensions.width - tabMargin * 2 - scale(6) * 2 - scale(8)) /
                  2,
              },
            ]}
          />
          <TouchableOpacity
            style={responsiveStyles.tab}
            onPress={() => setActiveTab("Today")}
          >
            <Text
              style={[
                responsiveStyles.tabText,
                activeTab === "Today" && styles.tabTextActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={responsiveStyles.tab}
            onPress={() => setActiveTab("Past")}
          >
            <Text
              style={[
                responsiveStyles.tabText,
                activeTab === "Past" && styles.tabTextActive,
              ]}
            >
              Past
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={responsiveStyles.scrollContent}
      >
        {activeTab === "Today" && (
          <>
            <Text style={responsiveStyles.sectionHeading}>Earlier Today</Text>
            <View style={responsiveStyles.notificationsList}>
              {currentNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    responsiveStyles.notificationCard,
                    notification.highlighted &&
                      styles.notificationCardHighlighted,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={responsiveStyles.bellIconContainer}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                        stroke="#000"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <View style={responsiveStyles.bellBadge}>
                      <Text style={responsiveStyles.bellBadgeText}>4+</Text>
                    </View>
                  </View>
                  <View style={responsiveStyles.notificationContent}>
                    <Text
                      style={responsiveStyles.notificationTitle}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {notification.title}
                    </Text>
                    <Text
                      style={responsiveStyles.notificationDescription}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {notification.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeTab === "Past" && (
          <>
            <Text style={responsiveStyles.sectionHeading}>
              Past Notifications
            </Text>
            <View style={responsiveStyles.notificationsList}>
              {currentNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={responsiveStyles.notificationCard}
                  activeOpacity={0.7}
                >
                  <View style={responsiveStyles.bellIconContainer}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                        stroke="#000"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <View style={responsiveStyles.bellBadge}>
                      <Text style={responsiveStyles.bellBadgeText}>4+</Text>
                    </View>
                  </View>
                  <View style={responsiveStyles.notificationContent}>
                    <Text
                      style={responsiveStyles.notificationTitle}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {notification.title}
                    </Text>
                    <Text
                      style={responsiveStyles.notificationDescription}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {notification.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: scaleVertical(40) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    backgroundColor: "#3C2610",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    textAlign: "left",
    fontFamily: Platform.select({
      ios: "Rubik_700Bold",
      android: "Rubik_700Bold",
      default: "Rubik_700Bold",
    }),
    flex: 1,
    flexShrink: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(234,176,75,38)",
  },
  tab: {
    flex: 1,
    borderWidth: 0,
    borderColor: "#3C2610",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  slidingIndicator: {
    position: "absolute",
    backgroundColor: "#EC9A15",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    zIndex: 0,
  },
  tabActive: {
    backgroundColor: "transparent",
  },
  tabText: {
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "Rubik_500Medium",
      android: "Rubik_500Medium",
      default: "Rubik_500Medium",
    }),
    textAlign: "center",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "Rubik_700Bold",
      android: "Rubik_700Bold",
      default: "Rubik_700Bold",
    }),
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    // Responsive values set in component
  },
  sectionHeading: {
    color: "#000000",
    fontFamily: Platform.select({
      ios: "Rubik_700Bold",
      android: "Rubik_700Bold",
      default: "Rubik_700Bold",
    }),
  },
  notificationsList: {
    // Gap set in component
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "flex-start",
  },
  notificationCardHighlighted: {
    borderColor: "#007AFF",
    borderWidth: 2,
  },
  bellIconContainer: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  bellBadge: {
    position: "absolute",
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    zIndex: 1,
  },
  bellBadgeText: {
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "Rubik_700Bold",
      android: "Rubik_700Bold",
      default: "Rubik_700Bold",
    }),
    textAlign: "center",
  },
  notificationContent: {
    flex: 1,
    flexShrink: 1,
  },
  notificationTitle: {
    color: "#000000",
    fontFamily: Platform.select({
      ios: "Rubik_700Bold",
      android: "Rubik_700Bold",
      default: "Rubik_700Bold",
    }),
    flexShrink: 1,
  },
  notificationDescription: {
    color: "#828282",
    fontFamily: Platform.select({
      ios: "Rubik_400Regular",
      android: "Rubik_400Regular",
      default: "Rubik_400Regular",
    }),
    flexShrink: 1,
  },
});
