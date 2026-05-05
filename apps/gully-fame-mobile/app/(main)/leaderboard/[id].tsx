import InfiniteScrollingLeaderboard from "@/components/InfiniteScrollingLeaderboard/InfiniteScrollingLeaderboard";
import { MOCK_LEADERBOARD_DATA } from "@/data/leaderboard/mockData";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { leaderboardScreenStyles as styles } from "@/styles/leaderboardScreenStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BackIcon } from "@/icons";

function LeaderboardScreen() {
    const router = useRouter();
    const { id, title } = useLocalSearchParams();

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor="#3C2610" />

            {/* Gamified Header */}
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (id) {
                                router.push(
                                    `/(main)/competition/live/${id}` as any,
                                );
                            } else {
                                router.back();
                            }
                        }}
                    >
                        <BackIcon size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.titleWrapper}>
                        <Text style={styles.headerMainTitle}>
                            🏆 LIVE LEADERBOARD
                        </Text>
                        <Text style={styles.headerSubTitle} numberOfLines={1}>
                            {title ? title : "Top 100"}
                        </Text>
                    </View>

                    <View style={styles.placeholder} />
                </View>

                {/* Live Status Indicator */}
                <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>REFRESHES EVERY HOUR</Text>
                </View>
            </View>

            {/* The List */}
            <View style={styles.listContainer}>
                <InfiniteScrollingLeaderboard
                    data={MOCK_LEADERBOARD_DATA}
                    limit={20}
                />
            </View>
        </SafeAreaView>
    );
}
export default LeaderboardScreen;
