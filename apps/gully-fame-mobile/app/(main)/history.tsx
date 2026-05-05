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

import { BackIcon } from "@/icons";
import { type historyOfEvents } from "@/types";
const historyData: historyOfEvents[] = [
    {
        id: 1,
        eventName: "Delhi Dance-Off 2025",
        status: "Live",
        date: "Oct 15, 2024",
        result: "Pending",
    },
    {
        id: 2,
        eventName: "Freestyle Clash 2025",
        status: "Upcoming",
        date: "Sep 20, 2024",
        result: "Approved",
    },
    {
        id: 3,
        eventName: "Hip-Hop Battle 2024",
        status: "Completed",
        date: "Aug 10, 2024",
        result: "Winner - 1st Place",
    },
];

export default function HistoryScreen() {
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
                <Text style={styles.headerTitle}>History</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {historyData.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.historyCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.competitionTitle}>
                                {item.eventName}
                            </Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    item.status === "Live" && styles.liveBadge,
                                    item.status === "Upcoming" &&
                                        styles.upcomingBadge,
                                    item.status === "Completed" &&
                                        styles.pastBadge,
                                ]}
                            >
                                <Text style={styles.statusText}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.dateText}>
                            Joined on: {item.date}
                        </Text>
                        <Text style={styles.resultText}>
                            Result: {item.result}
                        </Text>
                    </TouchableOpacity>
                ))}
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
        fontSize: 20,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 30,
    },
    historyCard: {
        backgroundColor: "#252525",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#333",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    competitionTitle: {
        color: "#fff",
        fontSize: 16,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    liveBadge: {
        backgroundColor: "rgba(255, 0, 0, 0.2)",
    },
    upcomingBadge: {
        backgroundColor: "rgba(255, 140, 0, 0.2)",
    },
    pastBadge: {
        backgroundColor: "rgba(136, 136, 136, 0.2)",
    },
    statusText: {
        color: "#fff",
        fontSize: 12,
    },
    dateText: {
        color: "#999",
        fontSize: 13,
        marginBottom: 4,
    },
    resultText: {
        color: "#EC9A15",
        fontSize: 14,
    },
});
