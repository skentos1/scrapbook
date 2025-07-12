import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  InteractionManager,
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
  PencilIcon,
  PhotoIcon,
  PlusIcon,
  SparklesIcon,
  StarIcon,
} from "react-native-heroicons/outline";
import { StarIcon as StarSolid } from "react-native-heroicons/solid";
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
  const [imageCache, setImageCache] = useState({});
  const [isPreloading, setIsPreloading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Optimalizovaná funkcia pre URL obrázkov
  const getOptimizedImageUrl = useCallback((url, size = 800) => {
    if (!url) return null;

    // Ak je to Cloudinary URL, pridať transformácie
    if (url.includes("cloudinary")) {
      const parts = url.split("/upload/");
      if (parts.length === 2) {
        return `${parts[0]}/upload/w_${size},f_auto,q_auto/${parts[1]}`;
      }
    }
    return url;
  }, []);

  // Vylepšená preload funkcia
  const preloadImages = useCallback(
    async (centerIndex) => {
      if (isPreloading) return;
      setIsPreloading(true);

      const indicesToLoad = [];

      // Načítať 3 obrázky dopredu a 2 dozadu
      for (let i = -2; i <= 3; i++) {
        const index = centerIndex + i;
        if (index >= 0 && index < memories.length) {
          indicesToLoad.push(index);
        }
      }

      const promises = indicesToLoad.map(async (index) => {
        const memory = memories[index];
        if (memory?.imageUrl && !imageCache[memory.imageUrl]) {
          try {
            const optimizedUrl = getOptimizedImageUrl(memory.imageUrl);
            await Image.prefetch(optimizedUrl);
            setImageCache((prev) => ({ ...prev, [memory.imageUrl]: true }));
          } catch (error) {
            console.error("Preload error:", error);
          }
        }
      });

      await Promise.all(promises);
      setIsPreloading(false);
    },
    [memories, imageCache, isPreloading, getOptimizedImageUrl]
  );

  // Načítanie detailov scrapbooku
  const loadScrapbookDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Paralelné načítanie scrapbooku a memories
      const [scrapbookData, memoriesResponse] = await Promise.all([
        scrapbookService.getScrapbook(scrapbookId as string),
        memoriesService.getScrapbookMemories(scrapbookId as string),
      ]);

      setScrapbook(scrapbookData);
      setIsFavorite(scrapbookData.isFavourite === true); // Nastavenie favorite stavu

      // Optimalizácia URL pre memories
      const optimizedMemories = memoriesResponse.documents.map((memory) => ({
        ...memory,
        imageUrl: getOptimizedImageUrl(memory.imageUrl),
        thumbnailUrl: getOptimizedImageUrl(memory.imageUrl, 400),
      }));

      setMemories(optimizedMemories || []);

      // Začať preloadovať obrázky po načítaní
      if (optimizedMemories.length > 0) {
        InteractionManager.runAfterInteractions(() => {
          preloadImages(0);
        });
      }
    } catch (error) {
      console.error("Failed to load scrapbook details:", error);
      setError("Nepodarilo sa načítať detaily scrapbooku");
    } finally {
      setLoading(false);
    }
  }, [scrapbookId, getOptimizedImageUrl]);
  const handleToggleFavorite = async () => {
    try {
      // Optimistic update - zmenia sa ikona okamžite
      setIsFavorite(!isFavorite);

      // Update v databáze
      await scrapbookService.toggleFavoriteScrapbook(
        scrapbookId as string,
        isFavorite
      );

      console.log(
        `📌 Scrapbook ${scrapbookId} favorite status changed to: ${!isFavorite}`
      );
    } catch (error) {
      console.error("Failed to toggle favorite:", error);

      // Rollback pri chybe
      setIsFavorite(isFavorite);

      Alert.alert("Chyba", "Nepodarilo sa zmeniť obľúbené");
    }
  };

  // Okamžitá navigácia bez timeout
  const navigateMemory = useCallback(
    (direction: "prev" | "next") => {
      console.log(`🎯 MAIN Navigation: ${direction}`);

      // FUNCTIONAL STATE UPDATE - vždy aktuálna hodnota!
      setCurrentMemoryIndex((prevIndex) => {
        console.log(`📊 Current index in state: ${prevIndex}`);

        if (direction === "next" && prevIndex < memories.length - 1) {
          const newIndex = prevIndex + 1;
          console.log(`✅ Moving NEXT: ${prevIndex} → ${newIndex}`);

          // Preload po state update
          setTimeout(() => {
            if (memories[newIndex]) {
              preloadImages(newIndex);
            }
          }, 50);

          return newIndex;
        } else if (direction === "prev" && prevIndex > 0) {
          const newIndex = prevIndex - 1;
          console.log(`✅ Moving PREV: ${prevIndex} → ${newIndex}`);

          // Preload po state update
          setTimeout(() => {
            if (memories[newIndex]) {
              preloadImages(newIndex);
            }
          }, 50);

          return newIndex;
        } else {
          console.log(
            `❌ Cannot navigate ${direction} from ${prevIndex} (max: ${memories.length - 1})`
          );
          return prevIndex; // Zostať na aktuálnom indexe
        }
      });
    },
    [memories.length, preloadImages] // Odstránené currentMemoryIndex z dependencies!
  );
  const handleEditScrapbook = () => {
    router.push(`/edit-scrapbook/${scrapbookId}`);
  };

  // Formátovanie dátumu
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sk-SK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  // Načítanie pri mount
  useEffect(() => {
    if (scrapbookId) {
      loadScrapbookDetails();
    }
  }, [scrapbookId]);

  // Memo pre optimalizáciu renderov
  const memoriesCount = useMemo(() => memories.length, [memories]);
  const hasMemories = useMemo(() => memoriesCount > 0, [memoriesCount]);

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
          onPress={() => hasMemories && setViewMode("single")}
          className="flex-1 relative"
        >
          {scrapbook?.coverImage ? (
            <Image
              source={{ uri: getOptimizedImageUrl(scrapbook.coverImage, 1200) }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={["#8b5cf6", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-full h-full"
            />
          )}

          <View className="absolute inset-0 bg-black/40" />

          {/* Edit Button - Top Left Corner */}
          <View className="absolute top-8 left-6 z-10">
            <TouchableOpacity
              onPress={handleEditScrapbook}
              className="bg-gray-600/50 backdrop-blur-sm rounded-full p-3 border border-white/20"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <PencilIcon size={18} color="white" />
            </TouchableOpacity>
          </View>
          <View className="absolute top-8 right-6 z-10">
            <TouchableOpacity
              onPress={handleToggleFavorite}
              className={`backdrop-blur-sm rounded-full p-3 border ${
                isFavorite
                  ? "bg-yellow-500/20 border-yellow-400/30"
                  : "bg-gray-600/50 border-white/20"
              }`}
              style={{
                shadowColor: isFavorite ? "#fbbf24" : "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Animated.View>
                {isFavorite ? (
                  <StarSolid size={20} color="#fbbf24" />
                ) : (
                  <StarIcon size={20} color="white" />
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View className="absolute inset-0 items-center justify-center px-8">
            <Animated.View
              entering={FadeInUp.delay(200).duration(800)}
              className="items-center"
            >
              <Text className="text-white text-4xl font-bold mb-8 text-center">
                {scrapbook?.title}
              </Text>

              <View className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-4 flex-row items-center">
                <PhotoIcon size={20} color="white" />
                <Text className="text-white font-medium ml-2">
                  {memoriesCount}{" "}
                  {memoriesCount === 1 ? "spomienka" : "spomienok"}
                </Text>
              </View>

              {hasMemories && (
                <Text className="text-white/60 text-sm mb-2">
                  Ťuknite pre otvorenie scrapbooku
                </Text>
              )}
            </Animated.View>
          </View>

          {/* Bottom Buttons */}
          <View className="absolute bottom-16 left-8 right-8 z-10">
            {hasMemories ? (
              <>
                <TouchableOpacity
                  onPress={() => setViewMode("grid")}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl py-4 px-6 mb-4"
                >
                  <Text className="text-white text-center font-medium">
                    Zobraziť všetky memories
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/scrapbook/addMemoryScreen?scrapbookId=${scrapbookId}`
                    )
                  }
                  className="bg-white rounded-full px-6 py-4"
                >
                  <View className="flex-row items-center justify-center">
                    <PlusIcon size={20} color="black" />
                    <Text className="text-black font-medium ml-2">
                      Pridať novú spomienku
                    </Text>
                  </View>
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
        </Pressable>
      </View>
    );
  }

  if (viewMode === "single" && hasMemories) {
    return (
      <PolaroidMemoryView
        memories={memories}
        currentMemoryIndex={currentMemoryIndex}
        onNavigate={navigateMemory}
        onBack={() => setViewMode("overview")}
        // onMemoryPress={(memoryId) => router.push(`/memory/${memoryId}`)}
        formatDate={formatDate}
        // imageCache={imageCache}
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
              className="bg-white/10 rounded-full p-3 flex-row items-center"
            >
              <ArrowLeftIcon size={20} color="white" />
              <Text className="text-white font-medium ml-2">Späť</Text>
            </TouchableOpacity>
            <Text className="text-white font-medium">Všetky spomienky</Text>
            <View className="bg-white/10 rounded-full px-3 py-1">
              <Text className="text-white text-sm">{memoriesCount}</Text>
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
                entering={SlideInRight.delay(Math.min(50 * index, 300))}
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
                  {memory.thumbnailUrl ? (
                    <Image
                      source={{ uri: memory.thumbnailUrl }}
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
                </Pressable>
              </Animated.View>
            ))}
          </View>
          <View className="w-full mt-6 mb-10 items-center">
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/scrapbook/addMemoryScreen?scrapbookId=${scrapbookId}`
                )
              }
              className="bg-white rounded-full px-6 py-4"
            >
              <View className="flex-row items-center">
                <PlusIcon size={20} color="black" />
                <Text className="text-black font-medium ml-2">
                  Pridať spomienku
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="h-6" />
        </Animated.ScrollView>
      </View>
    );
  }

  return null;
};

export default ScrapbookDetailScreen;
