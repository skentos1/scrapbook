import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BellIcon,
  PlusIcon,
  UserCircleIcon,
} from "react-native-heroicons/outline";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { scrapbookService } from "../../lib/scrapbooks";

const { width, height } = Dimensions.get("window");

// Featured scrapbook data (mock)
const featuredScrapbook = {
  id: "1",
  title: "Cestovateľské Dobrodružstvá",
  description: "Svet očami cestovatela, každé dobrodružstvo je príbeh.",
  coverImage:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
  memories: 24,
};

const HomeScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [userScrapbooks, setUserScrapbooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load user's scrapbooks
  const loadUserScrapbooks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await scrapbookService.getUserScrapbooks(user.$id);
      setUserScrapbooks(response.documents || []);
    } catch (error) {
      console.error("Failed to load scrapbooks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh scrapbooks
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserScrapbooks();
    setRefreshing(false);
  };

  // Load scrapbooks when user is available
  useEffect(() => {
    if (user) {
      loadUserScrapbooks();
    }
  }, [user]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sk-SK", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Dobré ráno";
    if (hour < 18) return "Dobrý deň";
    return "Dobrý večer";
  };

  const renderUserScrapbook = (item, index) => (
    <Animated.View
      key={item.$id}
      entering={FadeInUp.delay(300 + index * 100).duration(600)}
      className="mr-4"
      style={{ width: width * 0.42 }}
    >
      <TouchableOpacity
        className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10"
        style={{
          shadowColor: "#a855f7",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
        }}
        onPress={() => router.push(`/scrapbook/${item.$id}`)}
      >
        {/* Cover Image or Placeholder */}
        <View className="w-full h-28 bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center">
          {item.coverImage ? (
            <Image
              source={{ uri: item.coverImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="bg-gradient-to-br from-purple-500 to-pink-500 w-full h-full items-center justify-center">
              <PlusIcon size={28} color="white" />
            </View>
          )}
        </View>

        <View className="p-4">
          <Text
            className="text-white font-medium text-base mb-2 text-center"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-gray-400 text-xs text-center">
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Top Bar */}
      <Animated.View
        entering={FadeInDown.duration(600)}
        className="bg-black/95 backdrop-blur-xl px-6 py-4 border-b border-white/10"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View className="flex-row items-center justify-between">
          {/* App Name */}
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">
              Memo
              <Text className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                ries
              </Text>
            </Text>
            <Text className="text-gray-400 text-xs">Digitálne spomienky</Text>
          </View>

          {/* Right Icons */}
          <View className="flex-row items-center space-x-3">
            {/* Notifications */}
            {isAuthenticated && (
              <TouchableOpacity
                className="bg-white/10 rounded-full p-2 border border-white/20"
                onPress={() => router.push("/notifications")}
              >
                <BellIcon size={20} color="#a855f7" />
              </TouchableOpacity>
            )}

            {/* Profile */}
            <TouchableOpacity
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-2"
              onPress={() =>
                isAuthenticated
                  ? router.push("/profile")
                  : router.push("/login")
              }
            >
              <UserCircleIcon size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a855f7"
            colors={["#a855f7"]}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(800)}
          className="px-6 pt-6 "
        >
          <View className="items-center mb-8">
            <Text className="text-gray-400 text-sm mb-2">
              {getGreeting()}, {user?.name || "Tvorca"}
            </Text>
            <Text className="text-white text-3xl font-bold text-center mb-1">
              Tvoj Príbeh Čaká
            </Text>

            <TouchableOpacity
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl px-8  items-center justify-center"
              style={{
                shadowColor: "#a855f7",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={() =>
                isAuthenticated ? router.push("/create") : router.push("/login")
              }
            >
              {/* <View className="flex-row items-center">
                <PlusIcon size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  Vytvoriť Spomienku
                </Text>
              </View> */}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Featured Scrapbook */}
        <Animated.View
          entering={FadeIn.delay(400).duration(800)}
          className="mx-6 mb-8"
        >
          <TouchableOpacity
            className="bg-white/5 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/10"
            style={{
              shadowColor: "#a855f7",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
            }}
            onPress={() => router.push(`/scrapbook/${featuredScrapbook.id}`)}
          >
            <View className="relative">
              <Image
                source={{ uri: featuredScrapbook.coverImage }}
                style={{ width: "100%", height: height * 0.45 }}
                resizeMode="cover"
              />

              {/* Gradient Overlay */}
              <View className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              {/* Content Overlay */}
              <View className="absolute bottom-0 left-0 right-0 px-6 pb-8">
                <View className="bg-purple-600/30 backdrop-blur-sm rounded-full px-4 py-2 self-center mb-4 border border-purple-400/30">
                  <Text className="text-purple-200 text-xs font-medium">
                    Môj ScrapBook
                  </Text>
                </View>
                <Text className="text-white text-2xl font-bold mb-3 text-center">
                  {featuredScrapbook.title}
                </Text>
                <Text className="text-gray-200 text-base leading-6 mb-6 text-center">
                  {featuredScrapbook.description}
                </Text>
                <View className="items-center">
                  <View className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-6 py-3">
                    <Text className="text-white text-sm font-medium">
                      Zobraziť →
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* User's Scrapbooks */}
        {isAuthenticated && (
          <Animated.View
            entering={FadeInUp.delay(500).duration(800)}
            className="px-6 mb-8"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">
                Tvoja Kolekcia
              </Text>
              <TouchableOpacity onPress={() => router.push("/scrapbook")}>
                <Text className="text-purple-400 font-medium text-sm">
                  Zobraziť všetko →
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View className="flex-row space-x-4">
                {[1, 2].map((i) => (
                  <View
                    key={i}
                    className="bg-white/5 rounded-2xl animate-pulse"
                    style={{ width: width * 0.42, height: 140 }}
                  />
                ))}
              </View>
            ) : userScrapbooks.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              >
                {userScrapbooks
                  .slice(0, 5)
                  .map((item, index) => renderUserScrapbook(item, index))}
              </ScrollView>
            ) : (
              <View className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 items-center">
                <Text className="text-gray-400 text-center mb-4 text-base">
                  Zatiaľ nemáš žiadne spomienky
                </Text>
                <TouchableOpacity
                  className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl px-6 py-3"
                  onPress={() => router.push("/create")}
                >
                  <Text className="text-white font-medium">
                    Vytvoriť Prvú Spomienku
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        {/* Trending Templates Section */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(800)}
          className="px-6 mb-8"
        >
          <Text className="text-white text-xl font-bold mb-4 text-center">
            Populárne Šablóny
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4 }}
          >
            {["Cestovanie", "Narodeniny", "Láska", "Rodina"].map(
              (template, index) => (
                <TouchableOpacity
                  key={index}
                  className="mr-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 items-center"
                  style={{
                    width: width * 0.32,
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <View className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl h-16 w-full mb-3" />
                  <Text className="text-white font-medium text-sm text-center">
                    {template}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1 text-center">
                    Začať so šablónou
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
