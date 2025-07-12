import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  FireIcon,
  HeartIcon,
  ListBulletIcon,
  MapPinIcon,
  PhotoIcon,
  PlusIcon,
  SparklesIcon,
  Squares2X2Icon,
  StarIcon,
  TrashIcon,
} from "react-native-heroicons/outline";
import {
  FireIcon as FireSolid,
  HeartIcon as HeartSolid,
  StarIcon as StarSolid,
} from "react-native-heroicons/solid";
import Animated, {
  BounceIn,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { useAuth } from "../../../context/AuthContext";
import { scrapbookService } from "../../../lib/scrapbooks";

const { width, height } = Dimensions.get("window");

const ScrapbookListScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [scrapbooks, setScrapbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [favorites, setFavorites] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Animation values
  const sparkleRotation = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  const floatY = useSharedValue(0);
  const scaleValue = useSharedValue(1);

  // Start complex animations
  useEffect(() => {
    sparkleRotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );

    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  // Animated styles
  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  // Categories for filtering
  const categories = [
    { id: "all", name: "Všetko", icon: Squares2X2Icon, color: "#a855f7" },
    { id: "recent", name: "Nedávne", icon: ClockIcon, color: "#3b82f6" },
    { id: "favorites", name: "Obľúbené", icon: HeartIcon, color: "#ef4444" },
    { id: "active", name: "Aktívne", icon: FireIcon, color: "#f59e0b" },
  ];

  // Get filtered scrapbooks
  const getFilteredScrapbooks = () => {
    let filtered = [...scrapbooks];

    switch (selectedCategory) {
      case "recent":
        filtered = filtered.filter((item) => {
          const created = new Date(item.createdAt);
          const week = 7 * 24 * 60 * 60 * 1000;
          return Date.now() - created.getTime() < week;
        });
        break;
      case "favorites":
        filtered = filtered.filter((item) => favorites.has(item.$id));
        break;
      case "active":
        filtered = filtered.filter((item) => (item.memoriesCount || 0) > 5);
        break;
    }

    return filtered;
  };

  // Načítanie používateľových scrapbookov
  const loadUserScrapbooks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await scrapbookService.getUserScrapbooks(user.$id);
      setScrapbooks(response.documents || []);
    } catch (error) {
      console.error("Failed to load scrapbooks:", error);
      setError("Nepodarilo sa načítať scrapbooky");
    } finally {
      setLoading(false);
    }
  };

  // Refresh scrapbookov
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserScrapbooks();
    setRefreshing(false);
  };

  // Toggle favorite with animation
  const toggleFavorite = (scrapbookId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(scrapbookId)) {
      newFavorites.delete(scrapbookId);
    } else {
      newFavorites.add(scrapbookId);
    }
    setFavorites(newFavorites);
  };

  // Vymazanie scrapbooku
  const handleDeleteScrapbook = (scrapbookId, scrapbookTitle) => {
    Alert.alert(
      "Vymazať scrapbook",
      `Naozaj chcete vymazať "${scrapbookTitle}"? Táto akcia vymaže aj všetky spomienky v ňom.`,
      [
        { text: "Zrušiť", style: "cancel" },
        {
          text: "Vymazať",
          style: "destructive",
          onPress: async () => {
            try {
              await scrapbookService.deleteScrapbook(scrapbookId);
              await loadUserScrapbooks();
            } catch (error) {
              Alert.alert("Chyba", "Nepodarilo sa vymazať scrapbook");
            }
          },
        },
      ]
    );
  };

  // Enhanced date formatting
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Včera";
    if (diffDays === 2) return "Predvčerom";
    if (diffDays < 7) return `Pred ${diffDays} dňami`;
    if (diffDays < 14) return "Minulý týždeň";
    if (diffDays < 30) return `Pred ${Math.ceil(diffDays / 7)} týždňami`;
    if (diffDays < 365) return `Pred ${Math.ceil(diffDays / 30)} mesiacmi`;

    return date.toLocaleDateString("sk-SK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Enhanced mood colors with more variety
  const getMoodTheme = (index, memoriesCount = 0) => {
    const themes = [
      {
        gradient: ["from-violet-500", "via-purple-500", "to-pink-500"],
        accent: "#a855f7",
        name: "Mystická",
        pattern: "sparkles",
      },
      {
        gradient: ["from-blue-500", "via-cyan-400", "to-teal-500"],
        accent: "#06b6d4",
        name: "Oceánska",
        pattern: "waves",
      },
      {
        gradient: ["from-emerald-500", "via-green-400", "to-lime-500"],
        accent: "#10b981",
        name: "Prírodná",
        pattern: "leaves",
      },
      {
        gradient: ["from-orange-500", "via-red-500", "to-pink-500"],
        accent: "#f97316",
        name: "Ohnivá",
        pattern: "flames",
      },
      {
        gradient: ["from-indigo-500", "via-purple-500", "to-blue-500"],
        accent: "#6366f1",
        name: "Kozmická",
        pattern: "stars",
      },
      {
        gradient: ["from-pink-500", "via-rose-400", "to-red-500"],
        accent: "#ec4899",
        name: "Romantická",
        pattern: "hearts",
      },
    ];

    // Choose theme based on activity level and index
    let themeIndex = index % themes.length;
    if (memoriesCount > 20) themeIndex = 3; // Fire theme for very active
    if (memoriesCount > 50) themeIndex = 4; // Cosmic theme for super active

    return themes[themeIndex];
  };

  // Enhanced activity levels
  const getActivityLevel = (memoriesCount) => {
    if (memoriesCount > 50)
      return {
        icon: FireSolid,
        color: "#dc2626",
        text: "Legenda",
        bg: "from-red-500 to-orange-500",
      };
    if (memoriesCount > 20)
      return {
        icon: FireIcon,
        color: "#ea580c",
        text: "Majster",
        bg: "from-orange-500 to-yellow-500",
      };
    if (memoriesCount > 10)
      return {
        icon: StarSolid,
        color: "#ca8a04",
        text: "Expert",
        bg: "from-yellow-500 to-amber-500",
      };
    if (memoriesCount > 5)
      return {
        icon: StarIcon,
        color: "#7c3aed",
        text: "Pokročilý",
        bg: "from-purple-500 to-violet-500",
      };
    if (memoriesCount > 0)
      return {
        icon: HeartIcon,
        color: "#059669",
        text: "Začiatočník",
        bg: "from-green-500 to-emerald-500",
      };
    return {
      icon: ClockIcon,
      color: "#6b7280",
      text: "Nový",
      bg: "from-gray-500 to-slate-500",
    };
  };

  // Načítanie pri štarte
  useEffect(() => {
    if (user) {
      loadUserScrapbooks();
    }
  }, [user]);

  // Redirect ak nie je prihlásený
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated]);

  // Render category filter
  const renderCategoryFilter = () => (
    <Animated.View
      entering={SlideInUp.delay(300).duration(600)}
      className="px-6 mb-4"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {categories.map((category, index) => {
          const CategoryIcon = category.icon;
          const isSelected = selectedCategory === category.id;

          return (
            <Animated.View
              key={category.id}
              entering={ZoomIn.delay(100 * index).duration(400)}
            >
              <TouchableOpacity
                onPress={() => setSelectedCategory(category.id)}
                className={`mr-3 px-4 py-3 rounded-2xl flex-row items-center border ${
                  isSelected
                    ? "bg-white/15 border-white/30"
                    : "bg-white/5 border-white/10"
                }`}
                style={{
                  shadowColor: isSelected ? category.color : "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isSelected ? 0.3 : 0.1,
                  shadowRadius: 8,
                  elevation: isSelected ? 6 : 2,
                }}
              >
                <CategoryIcon
                  size={16}
                  color={isSelected ? category.color : "#9ca3af"}
                />
                <Text
                  className={`ml-2 text-sm font-medium ${
                    isSelected ? "text-white" : "text-gray-400"
                  }`}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );

  // Enhanced grid item render
  const renderGridItem = ({ item, index }) => {
    const theme = getMoodTheme(index, item.memoriesCount);
    const activity = getActivityLevel(item.memoriesCount || 0);
    const ActivityIcon = activity.icon;
    const isFavorite = favorites.has(item.$id);

    return (
      <Animated.View
        entering={ZoomIn.delay(150 * index).duration(600)}
        className="w-1/2 p-2"
      >
        <TouchableOpacity
          onPress={() => router.push(`/scrapbook/${item.$id}`)}
          className="bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10"
          style={{
            shadowColor: theme.accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
            aspectRatio: 0.8,
          }}
        >
          {/* Cover */}
          <View className="flex-1 relative">
            {item.coverImage ? (
              <Image
                source={{ uri: item.coverImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View
                className={`w-full h-full bg-gradient-to-br ${theme.gradient.join(" ")} items-center justify-center relative`}
              >
                <Animated.View
                  style={[sparkleStyle]}
                  className="absolute top-3 right-3"
                >
                  <SparklesIcon size={16} color="white" opacity={0.6} />
                </Animated.View>

                <View className="bg-white/20 rounded-full p-4 mb-2">
                  <BookOpenIcon size={24} color="white" />
                </View>
                <Text
                  className="text-white font-bold text-sm text-center px-2"
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
              </View>
            )}

            <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Favorite button */}
            <TouchableOpacity
              onPress={() => toggleFavorite(item.$id)}
              className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5"
            >
              {isFavorite ? (
                <HeartSolid size={14} color="#ef4444" />
              ) : (
                <HeartIcon size={14} color="white" />
              )}
            </TouchableOpacity>

            {/* Memory count */}
            <View className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
              <Text className="text-white text-xs font-bold">
                {item.memoriesCount || 0}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View className="p-3">
            <Text
              className="text-white font-bold text-sm mb-1"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-gray-400 text-xs">
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Enhanced list item render
  const renderListItem = ({ item, index }) => {
    const theme = getMoodTheme(index, item.memoriesCount);
    const activity = getActivityLevel(item.memoriesCount || 0);
    const ActivityIcon = activity.icon;
    const isFavorite = favorites.has(item.$id);

    return (
      <Animated.View
        entering={SlideInRight.delay(100 * index).duration(600)}
        className="mb-6"
      >
        <TouchableOpacity
          onPress={() => router.push(`/scrapbook/${item.$id}`)}
          className="bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10"
          style={{
            shadowColor: theme.accent,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 12,
          }}
        >
          {/* Enhanced Cover Image */}
          <View className="relative">
            {item.coverImage ? (
              <Image
                source={{ uri: item.coverImage }}
                style={{ width: "100%", height: height * 0.32 }}
                resizeMode="cover"
              />
            ) : (
              <View
                className={`w-full bg-gradient-to-br ${theme.gradient.join(" ")} items-center justify-center relative overflow-hidden`}
                style={{ height: height * 0.32 }}
              >
                {/* Animated background elements */}
                <Animated.View
                  style={[floatStyle]}
                  className="absolute top-8 left-8"
                >
                  <SparklesIcon size={32} color="white" opacity={0.3} />
                </Animated.View>

                <Animated.View
                  style={[sparkleStyle]}
                  className="absolute top-12 right-12"
                >
                  <StarIcon size={24} color="white" opacity={0.4} />
                </Animated.View>

                <Animated.View
                  style={[pulseStyle]}
                  className="absolute bottom-12 left-12"
                >
                  <HeartIcon size={28} color="white" opacity={0.2} />
                </Animated.View>

                {/* Main content */}
                <Animated.View
                  style={[pulseStyle]}
                  className="bg-white/20 rounded-full p-8 mb-4"
                >
                  <BookOpenIcon size={56} color="white" />
                </Animated.View>

                <Text className="text-white font-bold text-2xl text-center px-6 mb-2">
                  {item.title}
                </Text>
                <Text className="text-white/80 font-medium text-base">
                  {theme.name} téma
                </Text>
                <Text className="text-white/60 font-medium text-sm mt-2">
                  Začať písať príbeh
                </Text>
              </View>
            )}

            {/* Enhanced overlay */}
            <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Top badges row */}
            <View className="absolute top-4 left-4 right-4 flex-row justify-between items-start">
              {/* Activity badge with enhanced design */}
              <View
                className={`bg-gradient-to-r ${activity.bg} rounded-full px-3 py-2 flex-row items-center border border-white/20`}
              >
                <ActivityIcon size={14} color="white" />
                <Text className="text-white text-xs font-bold ml-1">
                  {activity.text}
                </Text>
              </View>

              {/* Favorite button with enhanced animation */}
              <TouchableOpacity
                onPress={() => toggleFavorite(item.$id)}
                className="bg-black/50 backdrop-blur-sm rounded-full p-3 border border-white/20"
              >
                <Animated.View
                  entering={isFavorite ? BounceIn.duration(500) : undefined}
                >
                  {isFavorite ? (
                    <HeartSolid size={18} color="#ef4444" />
                  ) : (
                    <HeartIcon size={18} color="white" />
                  )}
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Enhanced memory count badge */}
            <View className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20 flex-row items-center">
              <PhotoIcon size={16} color={theme.accent} />
              <Text className="text-white text-sm font-bold ml-2">
                {item.memoriesCount || 0}
              </Text>
              <Text className="text-gray-300 text-xs ml-1">spomienok</Text>
            </View>
          </View>

          {/* Enhanced content section */}
          <View className="p-6">
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1 mr-3">
                <Text className="text-white text-2xl font-bold mb-2">
                  {item.title}
                </Text>
                {item.description && (
                  <Text
                    className="text-gray-300 text-base leading-6"
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                )}
              </View>
              {isFavorite && (
                <Animated.View entering={BounceIn.duration(500)}>
                  <StarSolid size={24} color="#fbbf24" />
                </Animated.View>
              )}
            </View>

            {/* Enhanced stats grid */}
            <View
              className={`bg-gradient-to-r ${theme.gradient[0]} ${theme.gradient[1]}/20 rounded-2xl p-4 mb-4 border border-white/10`}
            >
              <View className="flex-row items-center justify-between">
                <View className="items-center flex-1">
                  <View className="bg-white/20 rounded-full p-3 mb-2">
                    <CalendarIcon size={18} color="white" />
                  </View>
                  <Text className="text-white text-xs font-medium text-center">
                    {formatDate(item.createdAt)}
                  </Text>
                </View>

                <View className="items-center flex-1">
                  <View className="bg-white/20 rounded-full p-3 mb-2">
                    <PhotoIcon size={18} color="white" />
                  </View>
                  <Text className="text-white text-sm font-bold">
                    {item.memoriesCount || 0}
                  </Text>
                  <Text className="text-white/70 text-xs">spomienok</Text>
                </View>

                <View className="items-center flex-1">
                  <View className="bg-white/20 rounded-full p-3 mb-2">
                    <MapPinIcon size={18} color="white" />
                  </View>
                  <Text className="text-white text-xs font-medium">Miesta</Text>
                </View>
              </View>
            </View>

            {/* Enhanced action buttons */}
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                className={`bg-gradient-to-r ${theme.gradient.join(" ")} rounded-2xl px-6 py-4 flex-row items-center flex-1`}
                onPress={() => router.push(`/scrapbook/${item.$id}`)}
                style={{
                  shadowColor: theme.accent,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <EyeIcon size={18} color="white" />
                <Text className="text-white text-base font-bold ml-3 flex-1 text-center">
                  Otvoriť Scrapbook
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-red-600/20 backdrop-blur-sm rounded-2xl px-4 py-4 border border-red-400/30"
                onPress={() => handleDeleteScrapbook(item.$id, item.title)}
              >
                <TrashIcon size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const filteredScrapbooks = getFilteredScrapbooks();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Enhanced Header */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(800)}
        className="bg-black/95 backdrop-blur-xl px-6 py-4 border-b border-white/10"
        style={{
          shadowColor: "#a855f7",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 bg-white/10 rounded-full p-2 border border-white/20"
            >
              <ArrowLeftIcon size={20} color="#a855f7" />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-xl font-bold">
                Moje Scrapbooky
              </Text>
              <Text className="text-gray-400 text-xs">
                Tvoje digitálne spomienky
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-3">
            {/* View mode toggle */}
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="bg-white/10 rounded-full p-2 border border-white/20"
            >
              {viewMode === "list" ? (
                <Squares2X2Icon size={18} color="#a855f7" />
              ) : (
                <ListBulletIcon size={18} color="#a855f7" />
              )}
            </TouchableOpacity>

            {/* Create button */}
            <TouchableOpacity
              onPress={() => router.push("/create")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3"
              style={{
                shadowColor: "#a855f7",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <PlusIcon size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={[pulseStyle]}
            className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10"
          >
            <View className="flex-row items-center">
              <Animated.View style={[sparkleStyle]} className="mr-3">
                <SparklesIcon size={24} color="#a855f7" />
              </Animated.View>
              <Text className="text-white text-lg font-medium">
                Načítavam scrapbooky...
              </Text>
            </View>
          </Animated.View>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 items-center">
            <Text className="text-red-400 text-center mb-4 text-lg">
              {error}
            </Text>
            <TouchableOpacity
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl px-6 py-3"
              onPress={loadUserScrapbooks}
              style={{
                shadowColor: "#a855f7",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text className="text-white font-medium">Skúsiť znovu</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : scrapbooks.length > 0 ? (
        <Animated.View
          entering={FadeInUp.delay(400).duration(800)}
          className="flex-1"
        >
          {/* Mega Enhanced Stats Header */}
          <View className="px-6 pt-6 pb-4">
            <View className="bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-purple-500/15 backdrop-blur-sm rounded-3xl p-6 border border-white/10 relative overflow-hidden">
              {/* Background decoration */}
              <Animated.View
                style={[sparkleStyle]}
                className="absolute -top-4 -right-4"
              >
                <SparklesIcon size={60} color="#a855f7" opacity={0.1} />
              </Animated.View>

              <Animated.View
                style={[floatStyle]}
                className="absolute -bottom-4 -left-4"
              >
                <HeartIcon size={50} color="#ec4899" opacity={0.1} />
              </Animated.View>

              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-bold">
                  Prehľad kolekcie
                </Text>
                <Animated.View style={[sparkleStyle]}>
                  <SparklesIcon size={20} color="#a855f7" />
                </Animated.View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="items-center flex-1">
                  <Animated.View style={[pulseStyle]}>
                    <Text className="text-white text-3xl font-bold mb-1">
                      {scrapbooks.length}
                    </Text>
                  </Animated.View>
                  <Text className="text-gray-400 text-sm">Scrapbooky</Text>
                  <View className="bg-purple-500/20 rounded-full px-2 py-1 mt-1">
                    <Text className="text-purple-300 text-xs">Kolekcia</Text>
                  </View>
                </View>

                <View className="items-center flex-1">
                  <Animated.View style={[pulseStyle]}>
                    <Text className="text-purple-400 text-3xl font-bold mb-1">
                      {scrapbooks.reduce(
                        (total, item) => total + (item.memoriesCount || 0),
                        0
                      )}
                    </Text>
                  </Animated.View>
                  <Text className="text-gray-400 text-sm">Spomienky</Text>
                  <View className="bg-purple-500/20 rounded-full px-2 py-1 mt-1">
                    <Text className="text-purple-300 text-xs">Celkom</Text>
                  </View>
                </View>

                <View className="items-center flex-1">
                  <Animated.View style={[pulseStyle]}>
                    <Text className="text-pink-400 text-3xl font-bold mb-1">
                      {favorites.size}
                    </Text>
                  </Animated.View>
                  <Text className="text-gray-400 text-sm">Obľúbené</Text>
                  <View className="bg-pink-500/20 rounded-full px-2 py-1 mt-1">
                    <Text className="text-pink-300 text-xs">❤️ Srdcu</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Category Filter */}
          {renderCategoryFilter()}

          {/* Content based on view mode */}
          {viewMode === "grid" ? (
            <FlatList
              data={filteredScrapbooks}
              renderItem={renderGridItem}
              keyExtractor={(item) => item.$id}
              numColumns={2}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 24,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#a855f7"
                  colors={["#a855f7"]}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={filteredScrapbooks}
              renderItem={renderListItem}
              keyExtractor={(item) => item.$id}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: 24,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#a855f7"
                  colors={["#a855f7"]}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.delay(600).duration(800)}
          className="flex-1 items-center justify-center px-6"
        >
          <View
            className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 items-center w-full border border-white/10 relative overflow-hidden"
            style={{
              shadowColor: "#a855f7",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            {/* Background decoration */}
            <Animated.View
              style={[sparkleStyle]}
              className="absolute top-4 right-4"
            >
              <SparklesIcon size={40} color="#a855f7" opacity={0.2} />
            </Animated.View>

            <Animated.View
              style={[floatStyle]}
              className="absolute bottom-4 left-4"
            >
              <HeartIcon size={35} color="#ec4899" opacity={0.2} />
            </Animated.View>

            <Animated.View
              style={[pulseStyle]}
              className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-full p-8 mb-6 relative"
            >
              <BookOpenIcon size={64} color="#a855f7" />
              <Animated.View
                style={[sparkleStyle]}
                className="absolute -top-2 -right-2"
              >
                <SparklesIcon size={24} color="#ec4899" />
              </Animated.View>
            </Animated.View>

            <Text className="text-white text-2xl font-bold mb-3 text-center">
              Zatiaľ žiadne scrapbooky
            </Text>
            <Text className="text-gray-400 text-center mb-8 leading-6 text-base">
              Vytvorte svoj prvý scrapbook a začnite zachytávať krásne
              spomienky. Každý príbeh si zaslúži byť zapísaný s láskou a
              kreativitou.
            </Text>

            <TouchableOpacity
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl px-8 py-4 flex-row items-center"
              onPress={() => router.push("/create")}
              style={{
                shadowColor: "#a855f7",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              <PlusIcon size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                Vytvoriť Prvý Scrapbook
              </Text>
            </TouchableOpacity>

            {/* Motivational elements */}
            <View className="flex-row items-center mt-6 space-x-4">
              <View className="bg-white/5 rounded-full px-3 py-2 border border-white/10">
                <Text className="text-gray-400 text-xs">✨ Kreativita</Text>
              </View>
              <View className="bg-white/5 rounded-full px-3 py-2 border border-white/10">
                <Text className="text-gray-400 text-xs">📚 Príbehy</Text>
              </View>
              <View className="bg-white/5 rounded-full px-3 py-2 border border-white/10">
                <Text className="text-gray-400 text-xs">💫 Spomienky</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

export default ScrapbookListScreen;
