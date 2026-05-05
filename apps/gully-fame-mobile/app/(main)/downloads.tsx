import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { ReelViewer } from "@components/reel/ReelViewer";

const { width, height } = Dimensions.get("window");

import { BackIcon } from "@/icons";

// Mock downloaded reels data
const downloadedReels = [
  {
    id: 1,
    username: "@Suhani0098000",
    caption: "Good morning everyone #goodmorning",
    musicName: "On the way - (alan walker)",
    video: require("@assets/1.mp4"),
    image: require("@assets/images/trending_reel1.png"),
    likes: 134,
    comments: 23,
    shares: 12,
    saves: 45,
    tips: 12,
    isLiked: false,
    isSaved: false,
    type: "video" as const,
  },
  {
    id: 2,
    username: "@DancerPro",
    caption: "Showing off my moves! 💃 #dance",
    musicName: "Original Sound - DancerPro",
    video: require("@assets/2.mp4"),
    image: require("@assets/images/trending_reel2.png"),
    likes: 256,
    comments: 45,
    shares: 23,
    saves: 67,
    tips: 28,
    isLiked: true,
    isSaved: false,
    type: "video" as const,
  },
  {
    id: 3,
    username: "@ChefMaster",
    caption: "Cooking up something special! 🍳",
    musicName: "Cooking Vibes - ChefMaster",
    video: require("@assets/3.mp4"),
    image: require("@assets/images/trending_reel3.png"),
    likes: 189,
    comments: 32,
    shares: 15,
    saves: 89,
    tips: 15,
    isLiked: false,
    isSaved: true,
    type: "video" as const,
  },
  {
    id: 4,
    username: "@ComedyKing",
    caption: "Laugh out loud! 😂 #comedy",
    musicName: "Funny Moments - ComedyKing",
    video: require("@assets/4.mp4"),
    image: require("@assets/images/trending1.png"),
    likes: 312,
    comments: 67,
    shares: 34,
    saves: 123,
    tips: 45,
    isLiked: true,
    isSaved: true,
    type: "video" as const,
  },
  {
    id: 5,
    username: "@MusicStar",
    caption: "New track dropping soon! 🎵",
    musicName: "Original Sound - MusicStar",
    video: require("@assets/5.mp4"),
    image: require("@assets/images/trending2.png"),
    likes: 445,
    comments: 89,
    shares: 56,
    saves: 156,
    tips: 67,
    isLiked: false,
    isSaved: false,
    type: "video" as const,
  },
  {
    id: 6,
    username: "@ArtistLife",
    caption: "Creating art every day! 🎨",
    musicName: "Artistic Vibes - ArtistLife",
    video: require("@assets/6.mp4"),
    image: require("@assets/images/trending3.png"),
    likes: 278,
    comments: 54,
    shares: 28,
    saves: 98,
    tips: 34,
    isLiked: true,
    isSaved: false,
    type: "video" as const,
  },
];

export default function DownloadsScreen() {
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(
    null,
  );
  const [showReelViewer, setShowReelViewer] = useState(false);

  const handleReelPress = (index: number) => {
    setSelectedReelIndex(index);
    setShowReelViewer(true);
  };

  const handleCloseReelViewer = () => {
    setShowReelViewer(false);
    setSelectedReelIndex(null);
  };

  const renderReelItem = ({
    item,
    index,
  }: {
    item: (typeof downloadedReels)[0];
    index: number;
  }) => {
    const itemWidth = (width - 60) / 2; // 2 columns with padding

    return (
      <TouchableOpacity
        style={[styles.reelItem, { width: itemWidth }]}
        onPress={() => handleReelPress(index)}
        activeOpacity={0.8}
      >
        <Image
          source={item.image}
          style={styles.reelThumbnail}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
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
        <Text style={styles.headerTitle}>Downloads</Text>
        <View style={styles.backButton} />
      </View>

      {downloadedReels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
              stroke="#666"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M7 10l5 5 5-5M12 15V3"
              stroke="#666"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.emptyText}>No downloads yet</Text>
          <Text style={styles.emptySubtext}>
            Downloaded reels will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloadedReels}
          renderItem={renderReelItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reel Viewer Modal */}
      {showReelViewer && selectedReelIndex !== null && (
        <ReelViewer
          visible={showReelViewer}
          reels={downloadedReels}
          initialIndex={selectedReelIndex}
          onClose={handleCloseReelViewer}
          hasBottomNav={false}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}
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
    fontSize: 20,
    fontWeight: "600",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 20,
  },
  reelItem: {
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#252525",
  },
  reelThumbnail: {
    width: "100%",
    height: "100%",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
});
