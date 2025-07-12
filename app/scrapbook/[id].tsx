import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeftIcon,
  HeartIcon,
  PlusIcon,
  SparklesIcon,
} from "react-native-heroicons/outline";
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";
import PolaroidMemoryView from "../../components/PolaroidMemoryView";
import { useAuth } from "../../context/AuthContext";
import { memoriesService } from "../../lib/memories";
import { scrapbookService } from "../../lib/scrapbooks";
import "../global.css";

const { width, height } = Dimensions.get("window");

const ScrapbookDetailScreen = () => {
  const router = useRouter();
  const { id: scrapbookId } = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [scrapbook, setScrapbook] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("overview");
  const [currentMemoryIndex, setCurrentMemoryIndex] = useState(0);
  const [nextImageLoaded, setNextImageLoaded] = useState(false);
  const navigationTimeout = useRef(null);

  const loadScrapbookDetails = useCallback(async () => {
    try {
      setLoading(true);
      const scrapbookData = await scrapbookService.getScrapbook(scrapbookId);
      setScrapbook(scrapbookData);

      const memoriesData =
        await memoriesService.getScrapbookMemories(scrapbookId);
      setMemories(memoriesData.documents || []);
    } catch (error) {
      console.error("Failed to load scrapbook details:", error);
      setError("Nepodarilo sa načítať detail scrapbooku");
    } finally {
      setLoading(false);
    }
  }, [scrapbookId]);

  const handleDeleteMemory = useCallback(
    (memoryId, memoryTitle) => {
      Alert.alert(
        "Vymazať spomienku",
        `Naozaj chcete vymazať "${memoryTitle}"?`,
        [
          { text: "Zrušiť", style: "cancel" },
          {
            text: "Vymazať",
            style: "destructive",
            onPress: async () => {
              try {
                await memoriesService.deleteMemory(memoryId, scrapbookId);
                await loadScrapbookDetails();
                setCurrentMemoryIndex(0);
              } catch (error) {
                Alert.alert("Chyba", "Nepodarilo sa vymazať spomienku");
              }
            },
          },
        ]
      );
    },
    [scrapbookId, loadScrapbookDetails]
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sk-SK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const navigateMemory = useCallback(
    (direction) => {
      if (navigationTimeout.current) clearTimeout(navigationTimeout.current);

      navigationTimeout.current = setTimeout(() => {
        if (direction === "next" && currentMemoryIndex < memories.length - 1) {
          setCurrentMemoryIndex((prev) => {
            const newIndex = prev + 1;
            preloadNextImage(newIndex);
            return newIndex;
          });
        } else if (direction === "prev" && currentMemoryIndex > 0) {
          setCurrentMemoryIndex((prev) => {
            const newIndex = prev - 1;
            preloadNextImage(newIndex);
            return newIndex;
          });
        }
      }, 50);
    },
    [currentMemoryIndex, memories.length]
  );

  const preloadNextImage = useCallback(
    (index) => {
      const start = Math.max(0, index - 2);
      const end = Math.min(memories.length - 1, index + 2);
      for (let i = start; i <= end; i++) {
        const memory = memories[i];
        if (memory?.imageUrl) {
          Image.prefetch(memory.imageUrl)
            .then(() => {
              if (i === index + 1) setNextImageLoaded(true); // Mark next image as loaded
            })
            .catch((error) =>
              console.log(`Preload error for ${memory.imageUrl}:`, error)
            );
        }
      }
    },
    [memories]
  );

  // Initial preload and update on index change
  useEffect(() => {
    if (memories.length > 0) {
      preloadNextImage(currentMemoryIndex);
    }
  }, [currentMemoryIndex, memories, preloadNextImage]);

  useEffect(() => {
    if (scrapbookId) {
      loadScrapbookDetails();
    }
  }, [scrapbookId, loadScrapbookDetails]);

  if (!isAuthenticated) {
    router.replace("/login");
    return null;
  }

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <Animated.View entering={FadeIn.duration(400)}>
          <SparklesIcon size={32} color="#ffffff" />
          <Text className="text-white text-lg mt-4">Načítavam...</Text>
        </Animated.View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <Text className="text-white text-lg text-center mb-6">{error}</Text>
        <TouchableOpacity
          onPress={loadScrapbookDetails}
          className="bg-white rounded-full px-6 py-3"
        >
          <Text className="text-black font-medium">Skúsiť znovu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (viewMode === "overview") {
    return (
      <View className="flex-1 bg-black">
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <Pressable
          onPress={() => memories.length > 0 && setViewMode("single")}
          className="flex-1 relative"
        >
          {scrapbook?.coverImage ? (
            <Image
              source={{ uri: scrapbook.coverImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={["#8b5cf6", "#ec4899", "#f59e0b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: "100%", height: "100%" }}
              className="items-center justify-center"
            >
              <HeartIcon size={80} color="white" opacity={0.3} />
            </LinearGradient>
          )}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          />
          <SafeAreaView className="absolute top-0 left-0 right-0">
            <View className="px-6 py-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-black/20 backdrop-blur-sm rounded-full p-3 self-start"
              >
                <ArrowLeftIcon size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <View className="absolute bottom-0 left-0 right-0 px-8 pb-12">
            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
              <Text className="text-white text-4xl font-black mb-4">
                {scrapbook?.title}
              </Text>
              {scrapbook?.description && (
                <Text className="text-white/80 text-lg mb-8 leading-6">
                  {scrapbook.description}
                </Text>
              )}
              <View className="flex-row items-center mb-8">
                <View className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Text className="text-white font-medium">
                    {memories.length} spomienok
                  </Text>
                </View>
              </View>
              <View className="space-y-4">
                {memories.length > 0 ? (
                  <>
                    <Text className="text-white/60 text-sm mb-2">
                      Ťuknite pre otvorenie scrapbooku
                    </Text>
                    <TouchableOpacity
                      onPress={() => setViewMode("grid")}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl py-4 px-6"
                    >
                      <Text className="text-white text-center font-medium">
                        Zobraziť všetky memories
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/scrapbook/addMemoryScreen?scrapbookId=${scrapbookId}`
                      )
                    }
                    className="bg-white rounded-2xl py-4 px-6"
                  >
                    <View className="flex-row items-center justify-center">
                      <PlusIcon size={20} color="black" />
                      <Text className="text-black font-medium ml-2">
                        Pridať prvú spomienku
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </View>
        </Pressable>
      </View>
    );
  }

  if (viewMode === "single" && memories.length > 0) {
    return (
      <PolaroidMemoryView
        memories={memories}
        currentMemoryIndex={currentMemoryIndex}
        onNavigate={navigateMemory}
        onBack={() => setViewMode("overview")}
        onMemoryPress={(memoryId) => router.push(`/memory/${memoryId}`)}
        formatDate={formatDate}
        nextImageLoaded={nextImageLoaded}
      />
    );
  }

  if (viewMode === "grid") {
    return (
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <SafeAreaView>
          <View className="flex-row items-center justify-between px-6 py-4">
            <TouchableOpacity
              onPress={() => setViewMode("overview")}
              className="bg-white/10 rounded-full p-3"
            >
              <ArrowLeftIcon size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-medium">Všetky spomienky</Text>
            <View className="bg-white/10 rounded-full px-3 py-1">
              <Text className="text-white text-sm">{memories.length}</Text>
            </View>
          </View>
        </SafeAreaView>
        <Animated.ScrollView
          entering={FadeIn.delay(200)}
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap justify-between">
            {memories.map((memory, index) => (
              <Animated.View
                key={memory.$id}
                entering={SlideInRight.delay(50 * index)}
                className="w-[48%] mb-4"
              >
                <Pressable
                  onPress={() => {
                    setCurrentMemoryIndex(index);
                    setViewMode("single");
                  }}
                  className="bg-white/5 rounded-2xl overflow-hidden aspect-square relative"
                  style={({ pressed }) => [
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <View className="absolute top-3 left-3 z-10">
                    <Text className="text-white text-xs font-medium bg-black/40 px-2 py-1 rounded">
                      {formatDate(memory.date)}
                    </Text>
                  </View>
                  {memory.imageUrl ? (
                    <Image
                      source={{ uri: memory.imageUrl }}
                      className="w-full flex-1"
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={["#8b5cf6", "#ec4899"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="w-full flex-1 items-center justify-center"
                    >
                      <HeartIcon size={24} color="white" opacity={0.5} />
                    </LinearGradient>
                  )}
                  <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <Text
                      className="text-white font-medium text-sm"
                      numberOfLines={1}
                    >
                      {memory.title}
                    </Text>
                    {memory.location && (
                      <Text
                        className="text-white/60 text-xs mt-1"
                        numberOfLines={1}
                      >
                        {memory.location}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/scrapbook/addMemoryScreen?scrapbookId=${scrapbookId}`
                      )
                    }
                    className="absolute bottom-8 right-6 bg-white rounded-full p-4 shadow-lg shadow-black/30"
                    style={{ elevation: 5 }}
                  >
                    <PlusIcon size={24} color="black" />
                  </TouchableOpacity>
                </Pressable>
              </Animated.View>
            ))}
          </View>
          <View className="h-6" />
        </Animated.ScrollView>
      </View>
    );
  }

  return null;
};

export default ScrapbookDetailScreen;
