import React, { useState, useRef, useEffect, useMemo } from "react";
import {
    Dimensions,
    ImageBackground,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    Platform,
    Animated,
    Alert,
} from "react-native";
import { homeScreenStyles as styles } from "@/styles/homeScreenStyles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNav from "../../../src/components/layout/BottomNav";
import DrawerMenu from "../../../src/components/layout/DrawerMenu";
import { ReelViewer } from "../../../src/components/reel/ReelViewer";
import { hp } from "../../../src/utils/responsive";
import RoleBasedBanner from "@/components/home/RoleBasedBanner/RoleBasedBanner";
import Svg, { Rect, Defs, RadialGradient, Stop } from "react-native-svg";
import {
    NotificationIcon,
    ChatIcon,
    HomeIconSVG,
    ReelIconSVG,
    PeopleIcon,
    SearchIconSVG,
    TrophyIcon,
    UserIconSVG,
    ViewsEyeIcon,
    CaretRightIcon,
    LimitedTimeEventClockIcon,
    ThumbsUpIcon,
    EyeIcon,
} from "@/icons";
import { homePageHeroSlidesAPIData } from "@/types/homePageHeroSlides";
import SafeImage from "@/components/SafeImage";
import HeroBannerCarousel from "@/components/home/HeroBannerCarousel/HeroBannerCarousel";
import CategoriesCarousel from "@/components/home/CategoriesCarousel/CategoriesCarousel";
import { apiClient } from "@/api";
import {
    fallbackCategories,
    upcomingCompetitionsMock,
    pastCompetitionsMock,
    heroSlides,
} from "@/data/home/mockData";
import { BASE_URL } from "@/api/axios";
import { convertToFormattedString } from "@/utils/convertToFormattedString";
import { convertToFormattedPrize } from "@/utils/convertToFormattedPrize";
import { convertDateToDaysLeft } from "@/utils/convertDateToDaysLeft";

const getDimensions = () => Dimensions.get("window");

function GullyFameHome() {
    const [activeTab, setActiveTab] = useState("Home");
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [dimensions, setDimensions] = useState(getDimensions());
    const insets = useSafeAreaInsets();

    // API States
    const [banners, setBanners] = useState<homePageHeroSlidesAPIData[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [trendingData, setTrendingData] = useState<any[]>([]);
    const [liveCompetitions, setLiveCompetitions] = useState<any[]>(
        upcomingCompetitionsMock,
    );
    const [pastCompetitions, setPastCompetitions] =
        useState<any[]>(pastCompetitionsMock);
    const [upcomingCompetitions, setUpcomingCompeitions] = useState<any[]>(
        upcomingCompetitionsMock,
    );
    const [topCompetitors, setTopCompetitors] = useState<any[]>([]);

    // Reel viewer state
    const [showReelViewer, setShowReelViewer] = useState(false);
    const [selectedReelIndex, setSelectedReelIndex] = useState(0);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const liveDotBlink = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current; // New Heartbeat animation
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        async function fetchHomePage() {
            try {
                const resp = await apiClient.get(`/user/homeScreen`);
                if (resp.status !== 200)
                    throw new Error("Error trying to receive home screen api");

                const data = resp.data.data;
                if (data.banners) setBanners(data.banners);

                if (data.trending) setTrendingData(data.trending);
                if (data.liveCompetitions)
                    setLiveCompetitions(data.liveCompetitions);
                if (data.pastCompetitions)
                    setPastCompetitions(data.pastCompetitions);
                if (data.upcomingCompetitions)
                    setUpcomingCompeitions(data.upcomingCompetitions);
                if (data.topCompetitors) setTopCompetitors(data.topCompetitors);
            } catch (err) {
                setBanners(heroSlides);
                console.error(`Error: ${err}`);
            }
        }
        fetchHomePage();
    }, []);

    // Formatted Data Memos
    const liveCompetitionsFull = useMemo(
        () =>
            liveCompetitions.map((comp) => ({
                defaultThumbnailImage: require("@assets/images/trending_reel2.png"),
                people: convertToFormattedString(comp.participants),
                endDate: new Date(
                    Date.now() + 10 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                prize: convertToFormattedPrize(comp.prize),
                ...comp,
            })),
        [liveCompetitions],
    );
    const pastCompetitionsFull = useMemo(
        () =>
            pastCompetitions.map((comp) => ({
                defaultThumbnailImage: require("@assets/images/trending_reel2.png"),
                ...comp,
            })),
        [pastCompetitions],
    );
    const upcomingCompetitionsFull = useMemo(
        () =>
            upcomingCompetitions.map((comp) => ({
                defaultThumbnailImage: require("@assets/images/trending_reel2.png"),
                ...comp,
            })),
        [upcomingCompetitions],
    );

    const convertTrendingReelsToReels = useMemo(() => {
        return trendingData.map((reel) => ({
            id: reel.id,
            username: reel.title || "GullyFame Creator",
            caption: reel.category || "",
            musicName: "Original Sound",
            video: require("@assets/1.mp4"),
            likes: reel.likes || 0,
            comments: 0,
            shares: 0,
            saves: 0,
            tips: 0,
            isLiked: false,
            isSaved: false,
            type: "video" as const,
        }));
    }, [trendingData]);

    useEffect(() => {
        const subscription = Dimensions.addEventListener(
            "change",
            ({ window }) => setDimensions(window),
        );
        return () => {
            if (subscription) subscription.remove();
        };
    }, []);

    // Animations setup (Blink and Heartbeat)
    useEffect(() => {
        fadeAnim.setValue(1);
        const blinkAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(liveDotBlink, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(liveDotBlink, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );

        // Heartbeat pulse for high-priority CTA buttons
        const heartbeatAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        );

        blinkAnimation.start();
        heartbeatAnimation.start();
        return () => {
            blinkAnimation.stop();
            heartbeatAnimation.stop();
        };
    }, []);

    const tabs = [
        { name: "Home", icon: HomeIconSVG, label: "" },
        { name: "Reel", icon: ReelIconSVG, label: "GullyReel" },
        { name: "Upload", icon: null, label: "UPLOAD" },
        { name: "Search", icon: SearchIconSVG, label: "" },
        { name: "MyFame", icon: UserIconSVG, label: "" },
    ];

    const checkAuthAndNavigate = async (
        route: string,
        requiresParticipant: boolean = false,
    ) => {
        try {
            const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
            if (isLoggedIn !== "true") {
                setDrawerVisible(true);
                return;
            }
            if (requiresParticipant) {
                const role = await AsyncStorage.getItem("userRole");
                if (role !== "participant" && role !== "participants") {
                    Alert.alert(
                        "Participants only",
                        "Switch your account role to participant to submit entries. Fans can still follow and vote!",
                    );
                    return;
                }
            }
            router.push(route as any);
        } catch (e) {
            setDrawerVisible(true);
        }
    };

    // Section Architecture
    const homeSections = [
        { id: "hero" },
        { id: "user_progress" }, // <-- New Gamification Hub
        { id: "categories" },
        { id: "trending" },
        { id: "live" },
        { id: "upcoming" },
        { id: "past" },
        { id: "top_competitors" },
        { id: "role_banner" },
    ];

    const renderSection = ({ item }: { item: { id: string } }) => {
        switch (item.id) {
            case "hero":
                return (
                    <View style={[styles.heroSection, { height: hp(40) }]}>
                        <View style={styles.radialGradientContainer}>
                            <Svg
                                width={dimensions.width}
                                height={hp(40)}
                                style={styles.radialGradientSvg}
                            >
                                <Defs>
                                    <RadialGradient
                                        id="radialGradient"
                                        cx="50%"
                                        cy="0%"
                                        r="200%"
                                    >
                                        <Stop
                                            offset="0%"
                                            stopColor="#EC9A15"
                                            stopOpacity="1"
                                        />
                                        <Stop
                                            offset="100%"
                                            stopColor="#1E1111"
                                            stopOpacity="1"
                                        />
                                    </RadialGradient>
                                </Defs>
                                <Rect
                                    width="100%"
                                    height="100%"
                                    fill="url(#radialGradient)"
                                />
                            </Svg>
                        </View>
                        <View
                            style={[
                                styles.heroHeaderIcons,
                                {
                                    paddingTop:
                                        Platform.OS === "ios"
                                            ? insets.top + 40
                                            : insets.top + 40,
                                },
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.heroIconButton}
                                onPress={() =>
                                    checkAuthAndNavigate(
                                        "/(main)/settings/notifications",
                                    )
                                }
                            >
                                <NotificationIcon />
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        3
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.heroIconButton}
                                onPress={() =>
                                    checkAuthAndNavigate("/(main)/inbox")
                                }
                            >
                                <ChatIcon />
                            </TouchableOpacity>
                        </View>
                        <HeroBannerCarousel
                            slides={banners}
                        ></HeroBannerCarousel>
                    </View>
                );

            case "user_progress":
                return (
                    <View style={styles.gamificationCardWrapper}>
                        <LinearGradient
                            colors={["#2A1A0A", "#1E1111"]}
                            style={styles.gamificationCard}
                        >
                            <View style={styles.gamificationHeader}>
                                <View>
                                    <Text style={styles.gamificationLevelTitle}>
                                        Street Hustler
                                    </Text>
                                    <Text style={styles.gamificationLevelSub}>
                                        Level 12
                                    </Text>
                                </View>
                                <View style={styles.streakBadge}>
                                    <Text style={styles.streakText}>
                                        🔥 5 Day Streak
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.progressBarBackground}>
                                <LinearGradient
                                    colors={["#EC9A15", "#FF3B30"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.progressBarFill,
                                        { width: "65%" },
                                    ]}
                                />
                            </View>
                            <View style={styles.gamificationFooter}>
                                <Text style={styles.gamificationSubtext}>
                                    350 XP to Level 13
                                </Text>
                                <TouchableOpacity
                                    onPress={() =>
                                        router.push("/(main)/quests" as any)
                                    }
                                >
                                    <Text style={styles.gamificationActionText}>
                                        Earn XP ▸
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                );

            case "categories":
                return (
                    <CategoriesCarousel
                        categories={categories}
                    ></CategoriesCarousel>
                );

            case "trending":
                if (!trendingData.length) return null;
                return (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderWithIcon}>
                            <View style={styles.sectionTitleRow}>
                                <Text style={styles.sectionTitle}>
                                    Trending 🔥
                                </Text>
                            </View>
                        </View>
                        <View style={styles.subsectionContainer}>
                            <Text style={styles.subsectionTitle}>
                                Trending Reels
                            </Text>
                            <TouchableOpacity
                                style={styles.viewAllContainer}
                                onPress={() =>
                                    router.push(
                                        "/(main)/competition/live/1?scrollToEntries=true" as any,
                                    )
                                }
                            >
                                <Text style={styles.viewAllButton}>
                                    View All
                                </Text>
                                <CaretRightIcon></CaretRightIcon>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.trendingScroll}
                            nestedScrollEnabled={true}
                        >
                            {trendingData.map((reel, index) => (
                                <View
                                    key={reel.id}
                                    style={styles.trendingReelCardWrapper}
                                >
                                    <TouchableOpacity
                                        style={styles.trendingReelCard}
                                        onPress={() => {
                                            setSelectedReelIndex(index);
                                            requestAnimationFrame(() =>
                                                setShowReelViewer(true),
                                            );
                                        }}
                                        activeOpacity={0.9}
                                    >
                                        <ImageBackground
                                            source={require("@assets/images/badge.png")}
                                            style={styles.topBadge}
                                            resizeMode="contain"
                                        >
                                            <View
                                                style={styles.topBadgeContent}
                                            >
                                                <Text
                                                    style={styles.topBadgeText}
                                                >
                                                    TOP
                                                </Text>
                                                <Text
                                                    style={
                                                        styles.topBadgeNumber
                                                    }
                                                >
                                                    {index + 1}
                                                </Text>
                                            </View>
                                        </ImageBackground>

                                        <SafeImage
                                            style={styles.trendingReelImage}
                                            imageUrl={`${BASE_URL}${reel.image}`}
                                            defaultImage={require("@assets/images/trending_reel2.png")}
                                            resizeMode="contain"
                                        />
                                    </TouchableOpacity>
                                    <Text
                                        style={styles.trendingReelTitleBelow}
                                        numberOfLines={1}
                                    >
                                        {reel.title}
                                    </Text>
                                    <View style={styles.trendingReelStatsBelow}>
                                        <View style={styles.statItem}>
                                            <ThumbsUpIcon />
                                            <Text style={styles.statText}>
                                                {convertToFormattedString(
                                                    reel.likes,
                                                )}
                                            </Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <EyeIcon color="#EAB04B" />
                                            <Text style={styles.statText}>
                                                {convertToFormattedString(
                                                    reel.views,
                                                )}{" "}
                                                views
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                );

            case "live":
                if (!liveCompetitionsFull.length) return null;
                return (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View
                                style={[
                                    styles.sectionTitleRow,
                                    { alignItems: "center" },
                                ]}
                            >
                                <Animated.View
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: "#FF3B30",
                                        marginRight: 8,
                                        opacity: liveDotBlink,
                                    }}
                                />
                                <Text style={styles.sectionTitle}>
                                    Live Competitions
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.viewAllContainer}
                                onPress={() =>
                                    checkAuthAndNavigate(
                                        "/(main)/competitions/live",
                                    )
                                }
                            >
                                <Text style={styles.viewAllButton}>
                                    View All
                                </Text>
                                <CaretRightIcon></CaretRightIcon>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.competitionsScroll}
                            nestedScrollEnabled={true}
                        >
                            {liveCompetitionsFull.map((comp) => (
                                <View
                                    key={`live-${comp.id}`}
                                    style={styles.upcomingCompCardWrapper}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.upcomingCompCard,
                                            styles.glowingCard,
                                        ]}
                                        activeOpacity={0.9}
                                        onPress={() =>
                                            router.push(
                                                `/(main)/competition/live/${comp.id}` as any,
                                            )
                                        }
                                    >
                                        <View
                                            style={
                                                styles.upcomingCompImageWrapper
                                            }
                                        >
                                            <SafeImage
                                                defaultImage={
                                                    comp.defaultThumbnailImage
                                                }
                                                imageUrl={`${BASE_URL}${comp.image}`}
                                                style={styles.upcomingCompImage}
                                                resizeMode="contain"
                                            />
                                            <View
                                                style={{
                                                    position: "absolute",
                                                    top: 12,
                                                    left: 12,
                                                    backgroundColor: "#FF3B30",
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 4,
                                                    borderRadius: 20,
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    gap: 6,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: 3,
                                                        backgroundColor: "#FFF",
                                                    }}
                                                />
                                                <Text
                                                    style={{
                                                        color: "#fff",
                                                        fontSize: 11,
                                                        fontWeight: "700",
                                                        letterSpacing: 0.5,
                                                    }}
                                                >
                                                    LIVE
                                                </Text>
                                            </View>

                                            {/* Gamified Pulse Animation applied here */}
                                            <Animated.View
                                                style={[
                                                    styles.joinButtonOverlay,
                                                    {
                                                        transform: [
                                                            {
                                                                scale: pulseAnim,
                                                            },
                                                        ],
                                                    },
                                                ]}
                                            >
                                                <TouchableOpacity
                                                    style={
                                                        styles.joinButtonOnImage
                                                    }
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        router.push(
                                                            `/(main)/competition/live/${comp.id}` as any,
                                                        );
                                                    }}
                                                >
                                                    <LinearGradient
                                                        colors={[
                                                            "#FF3B30",
                                                            "#D32F2F",
                                                        ]}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={
                                                            styles.joinButtonGradientOnImage
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.joinButtonTextOnImage
                                                            }
                                                        >
                                                            Vote Now
                                                        </Text>
                                                        <Text
                                                            style={
                                                                styles.joinButtonPrizeText
                                                            }
                                                        >
                                                            {convertToFormattedPrize(
                                                                comp.prize,
                                                            )}
                                                        </Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </Animated.View>
                                        </View>
                                        <View
                                            style={styles.upcomingCompContent}
                                        >
                                            <Text
                                                style={styles.upcomingCompTitle}
                                                numberOfLines={2}
                                            >
                                                {comp.title}
                                            </Text>
                                            <View style={styles.compInfoRow}>
                                                <View
                                                    style={styles.compInfoItem}
                                                >
                                                    <LimitedTimeEventClockIcon />
                                                    <Text
                                                        style={
                                                            styles.upcomingCompDeadline
                                                        }
                                                    >
                                                        {convertDateToDaysLeft(
                                                            comp.endDate,
                                                        )}{" "}
                                                        Days Left
                                                    </Text>
                                                </View>
                                                <View
                                                    style={styles.compInfoItem}
                                                >
                                                    <PeopleIcon
                                                        color="#EC9A15"
                                                        size={14}
                                                    />
                                                    <Text
                                                        style={
                                                            styles.upcomingCompParticipants
                                                        }
                                                    >
                                                        {convertToFormattedString(
                                                            comp.participants,
                                                        )}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                );

            case "upcoming":
                if (!upcomingCompetitionsFull.length) return null;
                return (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <TrophyIcon size={24} />
                                <Text style={styles.sectionTitle}>
                                    Upcoming Competitions
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.viewAllContainer}
                                onPress={() =>
                                    checkAuthAndNavigate(
                                        "/(main)/competitions/upcoming",
                                    )
                                }
                            >
                                <Text style={styles.viewAllButton}>
                                    View All
                                </Text>
                                <CaretRightIcon></CaretRightIcon>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.competitionsScroll}
                            nestedScrollEnabled={true}
                        >
                            {upcomingCompetitionsFull.map((comp) => (
                                <View
                                    key={`upcoming-${comp.id}`}
                                    style={styles.upcomingCompCardWrapper}
                                >
                                    <TouchableOpacity
                                        style={styles.upcomingCompCard}
                                        activeOpacity={0.9}
                                        onPress={() =>
                                            router.push(
                                                `/(main)/competition/upcoming/${comp.id}` as any,
                                            )
                                        }
                                    >
                                        <View
                                            style={
                                                styles.upcomingCompImageWrapper
                                            }
                                        >
                                            <SafeImage
                                                defaultImage={
                                                    comp.defaultThumbnailImage
                                                }
                                                imageUrl={`${BASE_URL}${comp.image}`}
                                                style={styles.upcomingCompImage}
                                                resizeMode="contain"
                                            ></SafeImage>
                                            <View
                                                style={styles.joinButtonOverlay}
                                            >
                                                <TouchableOpacity
                                                    style={
                                                        styles.joinButtonOnImage
                                                    }
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        router.push(
                                                            `/(main)/competition/upcoming/${comp.id}` as any,
                                                        );
                                                    }}
                                                >
                                                    <LinearGradient
                                                        colors={[
                                                            "#1E88E5",
                                                            "#1565C0",
                                                        ]}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={
                                                            styles.joinButtonGradientOnImage
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.joinButtonTextOnImage
                                                            }
                                                        >
                                                            View Details
                                                        </Text>
                                                        <Text
                                                            style={
                                                                styles.joinButtonPrizeText
                                                            }
                                                        >
                                                            {convertToFormattedPrize(
                                                                comp.prize,
                                                            )}
                                                        </Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View
                                            style={styles.upcomingCompContent}
                                        >
                                            <Text
                                                style={styles.upcomingCompTitle}
                                                numberOfLines={2}
                                            >
                                                {comp.title}
                                            </Text>
                                            <View style={styles.compInfoRow}>
                                                <View
                                                    style={styles.compInfoItem}
                                                >
                                                    <LimitedTimeEventClockIcon></LimitedTimeEventClockIcon>
                                                    <Text
                                                        style={
                                                            styles.upcomingCompDeadline
                                                        }
                                                    >
                                                        {convertDateToDaysLeft(
                                                            comp.endDate,
                                                        )}{" "}
                                                        Days Left
                                                    </Text>
                                                </View>
                                                <View
                                                    style={styles.compInfoItem}
                                                >
                                                    <PeopleIcon
                                                        color="#EC9A15"
                                                        size={14}
                                                    />
                                                    <Text
                                                        style={
                                                            styles.upcomingCompParticipants
                                                        }
                                                    >
                                                        {convertToFormattedString(
                                                            comp.participants,
                                                        )}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                );

            case "past":
                if (!pastCompetitionsFull.length) return null;
                return (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <TrophyIcon size={24} />
                                <Text style={styles.sectionTitle}>
                                    Past Competitions
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.viewAllContainer}
                                onPress={() =>
                                    checkAuthAndNavigate(
                                        "/(main)/competitions/past",
                                    )
                                }
                            >
                                <Text style={styles.viewAllButton}>
                                    View All
                                </Text>
                                <CaretRightIcon></CaretRightIcon>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.pastCompScroll}
                            nestedScrollEnabled={true}
                        >
                            {pastCompetitionsFull.map((comp) => (
                                <TouchableOpacity
                                    key={comp.id}
                                    style={styles.pastCompCard}
                                    onPress={() =>
                                        router.push(
                                            `/(main)/competition/past/${comp.id}` as any,
                                        )
                                    }
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.pastCompImageWrapper}>
                                        <SafeImage
                                            style={styles.pastCompImage}
                                            resizeMode="contain"
                                            imageUrl={`${BASE_URL}${comp.image}`}
                                            defaultImage={
                                                comp.defaultThumbnailImage
                                            }
                                        ></SafeImage>
                                        <View style={styles.pastCompBadge}>
                                            <Text
                                                style={styles.pastCompBadgeText}
                                            >
                                                Ended
                                            </Text>
                                        </View>
                                        <View
                                            style={
                                                styles.viewResultsButtonOverlay
                                            }
                                        >
                                            <TouchableOpacity
                                                style={styles.viewResultsButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    router.push(
                                                        `/(main)/competition/past/${comp.id}` as any,
                                                    );
                                                }}
                                            >
                                                <LinearGradient
                                                    colors={[
                                                        "#EBA229",
                                                        "#EBA229",
                                                    ]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={
                                                        styles.viewResultsButtonGradient
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.viewResultsButtonText
                                                        }
                                                    >
                                                        View Results
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.pastCompContent}>
                                        <Text
                                            style={styles.pastCompTitle}
                                            numberOfLines={1}
                                        >
                                            {comp.title}
                                        </Text>
                                        <View style={styles.winnerViewsRow}>
                                            <View style={styles.winnerRow}>
                                                <TrophyIcon size={10} />
                                                <Text
                                                    style={
                                                        styles.pastCompWinnerLabel
                                                    }
                                                >
                                                    Winner:{" "}
                                                </Text>
                                                <Text
                                                    style={
                                                        styles.pastCompWinner
                                                    }
                                                >
                                                    {comp.winner}
                                                </Text>
                                            </View>
                                            <View style={styles.viewsRow}>
                                                <ViewsEyeIcon
                                                    size={15}
                                                ></ViewsEyeIcon>
                                                <Text
                                                    style={styles.pastCompViews}
                                                >
                                                    {convertToFormattedString(
                                                        comp.views,
                                                    )}{" "}
                                                    Views
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                );

            case "top_competitors":
                if (!topCompetitors.length) return null;
                return (
                    <View style={[styles.section, styles.hallOfFameSection]}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <TrophyIcon size={24} color="#EAB04B" />
                                <Text style={styles.sectionTitle}>
                                    Hall of Fame
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.hallOfFameSubtitle}>
                            Overall point leaders across all GullyFame events.
                        </Text>

                        {/* Gamified Personal Rank Placement */}
                        <View style={styles.personalRankBar}>
                            <Text style={styles.personalRankText}>
                                You are currently Rank{" "}
                                <Text
                                    style={{
                                        color: "#EAB04B",
                                        fontWeight: "bold",
                                    }}
                                >
                                    #4,892
                                </Text>
                            </Text>
                            <Text style={styles.personalRankSubtext}>
                                Top 18% of all players
                            </Text>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.competitionsScroll}
                            nestedScrollEnabled={true}
                        >
                            {topCompetitors.map((competitor) => (
                                <View
                                    key={`top-${competitor.rank}`}
                                    style={[
                                        styles.hallOfFameCard,
                                        {
                                            borderColor:
                                                competitor.rank === 1
                                                    ? "#EAB04B"
                                                    : "#333",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.hallOfFameRank,
                                            {
                                                color:
                                                    competitor.rank === 1
                                                        ? "#EAB04B"
                                                        : "#aaa",
                                            },
                                        ]}
                                    >
                                        #{competitor.rank}
                                    </Text>
                                    <SafeImage
                                        style={styles.hallOfFameImage}
                                        imageUrl={`${BASE_URL}${competitor.image}`}
                                        defaultImage={require("@assets/images/trending_reel2.png")}
                                    />
                                    <Text
                                        style={styles.hallOfFameName}
                                        numberOfLines={1}
                                    >
                                        {competitor.name}
                                    </Text>
                                    <Text style={styles.hallOfFamePoints}>
                                        {convertToFormattedString(
                                            competitor.points,
                                        )}{" "}
                                        pts
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                );

            case "role_banner":
                return (
                    <View style={{ marginBottom: 40 }}>
                        <RoleBasedBanner />
                    </View>
                );

            default:
                return null;
        }
    };

    if (typeof BottomNav !== "function" || typeof DrawerMenu !== "function")
        return null;

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent
            />
            {scrollY > 50 && (
                <Animated.View
                    style={[
                        styles.stickyHeader,
                        {
                            opacity: scrollY > 50 ? 1 : 0,
                            paddingTop:
                                Platform.OS === "ios"
                                    ? insets.top + 10
                                    : insets.top + 10,
                        },
                    ]}
                >
                    <View style={styles.stickyHeaderContent}>
                        <TouchableOpacity
                            style={styles.stickyHeaderIconButton}
                            onPress={() =>
                                checkAuthAndNavigate(
                                    "/(main)/settings/notifications",
                                )
                            }
                        >
                            <NotificationIcon />
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>
                                    3
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.stickyHeaderIconButton}
                            onPress={() =>
                                checkAuthAndNavigate("/(main)/inbox")
                            }
                        >
                            <ChatIcon />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            <Animated.FlatList
                data={homeSections}
                keyExtractor={(item) => item.id}
                renderItem={renderSection}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { opacity: fadeAnim },
                ]}
                scrollEventThrottle={16}
                onScroll={(event) =>
                    setScrollY(event.nativeEvent.contentOffset.y)
                }
            />

            <BottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={tabs}
                onOpenDrawer={() => setDrawerVisible(true)}
            />
            <DrawerMenu
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
            />
            <ReelViewer
                visible={showReelViewer}
                reels={convertTrendingReelsToReels}
                initialIndex={selectedReelIndex}
                onClose={() => setShowReelViewer(false)}
                hasBottomNav={false}
                insets={insets}
            />
        </View>
    );
}

export default GullyFameHome;
