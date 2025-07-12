import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeftIcon,
  CalendarIcon,
  HeartIcon,
  MapPinIcon,
  PencilIcon,
  ShareIcon,
  TrashIcon,
} from "react-native-heroicons/outline";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { memoriesService } from "../../lib/memories";

const { width, height } = Dimensions.get("window");

const MemoryDetailScreen = () => {
  const router = useRouter();
  const { memoryId } = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Načítanie detailov spomienky
  const loadMemoryDetails = async () => {
    try {
      setLoading(true);
      const memoryData = await memoriesService.getMemory(memoryId as string);
      setMemory(memoryData);
    } catch (error) {
      console.error("Failed to load memory details:", error);
      setError("Nepodarilo sa načítať detail spomienky");
    } finally {
      setLoading(false);
    }
  };

  // Vymazanie spomienky
  const handleDeleteMemory = () => {
    Alert.alert(
      "Vymazať spomienku",
      `Naozaj chcete vymazať "${memory?.title}"?`,
      [
        { text: "Zrušiť", style: "cancel" },
        {
          text: "Vymazať",
          style: "destructive",
          onPress: async () => {
            try {
              await memoriesService.deleteMemory(
                memoryId as string,
                memory?.scrapbookId
              );
              Alert.alert("Úspech", "Spomienka bola vymazaná", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              Alert.alert("Chyba", "Nepodarilo sa vymazať spomienku");
            }
          },
        },
      ]
    );
  };

  // Zdieľanie spomienky
  const handleShareMemory = async () => {
    try {
      const result = await Share.share({
        message: `Pozri si túto spomienku: "${memory?.title}" - ${memory?.description || ""}`,
        title: memory?.title,
      });
    } catch (error) {
      console.error("Error sharing memory:", error);
    }
  };

  // Formátovanie dátumu
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sk-SK", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Načítanie pri štarte
  useEffect(() => {
    if (memoryId) {
      loadMemoryDetails();
    }
  }, [memoryId]);

  if (!isAuthenticated) {
    router.replace("/login");
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <Text className="text-white">Načítavam...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-400 text-center mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-purple-500 rounded-xl px-6 py-3"
            onPress={loadMemoryDetails}
          >
            <Text className="text-white font-medium">Skúsiť znovu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(800)}
        className="bg-black/95 backdrop-blur-xl px-6 py-4 flex-row items-center justify-between border-b border-white/10"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeftIcon size={24} color="white" />
        </TouchableOpacity>

        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={handleShareMemory}
            className="bg-white/10 rounded-full p-2"
          >
            <ShareIcon size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/edit-memory/${memoryId}`)}
            className="bg-white/10 rounded-full p-2"
          >
            <PencilIcon size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteMemory}
            className="bg-red-500/20 rounded-full p-2"
          >
            <TrashIcon size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Main Image */}
        <Animated.View entering={FadeIn.delay(400).duration(800)}>
          {memory?.imageUrl && (
            <Image
              source={{ uri: memory.imageUrl }}
              style={{ width, height: height * 0.5 }}
              resizeMode="cover"
            />
          )}
        </Animated.View>

        {/* Content */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(800)}
          className="px-6 py-6"
        >
          {/* Title */}
          <Text className="text-white text-2xl font-bold mb-4">
            {memory?.title}
          </Text>

          {/* Date and Location */}
          <View className="space-y-3 mb-6">
            <View className="flex-row items-center">
              <CalendarIcon size={20} color="#8B5CF6" />
              <Text className="text-gray-300 text-base ml-3">
                {formatDate(memory?.date)}
              </Text>
            </View>

            {memory?.location && (
              <View className="flex-row items-center">
                <MapPinIcon size={20} color="#EF4444" />
                <Text className="text-gray-300 text-base ml-3">
                  {memory.location}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {memory?.description && (
            <View className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
              <Text className="text-gray-200 text-base leading-7">
                {memory.description}
              </Text>
            </View>
          )}

          {/* Memory Stats */}
          <View className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 mb-6 border border-purple-500/30">
            <View className="flex-row items-center mb-4">
              <HeartIcon size={20} color="#EC4899" />
              <Text className="text-pink-300 text-base font-medium ml-2">
                Detail spomienky
              </Text>
            </View>

            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-300 text-sm">Vytvorené:</Text>
                <Text className="text-white text-sm">
                  {new Date(memory?.createdAt).toLocaleDateString("sk-SK")}
                </Text>
              </View>

              {memory?.updatedAt !== memory?.createdAt && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-300 text-sm">Upravené:</Text>
                  <Text className="text-white text-sm">
                    {new Date(memory?.updatedAt).toLocaleDateString("sk-SK")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInUp.delay(800).duration(800)}
            className="space-y-4"
          >
            <TouchableOpacity
              className="bg-purple-500 rounded-xl py-4 flex-row items-center justify-center"
              onPress={() => router.push(`/edit-memory/${memoryId}`)}
              style={{
                shadowColor: "#8B5CF6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <PencilIcon size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Upraviť Spomienku
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white/10 backdrop-blur-sm rounded-xl py-4 flex-row items-center justify-center border border-white/20"
              onPress={handleShareMemory}
            >
              <ShareIcon size={20} color="white" />
              <Text className="text-white font-medium text-base ml-2">
                Zdieľať Spomienku
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Tips */}
          <Animated.View
            entering={FadeIn.delay(1000).duration(800)}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mt-6 border border-white/10"
          >
            <Text className="text-gray-300 font-medium mb-2">💡 Tip:</Text>
            <Text className="text-gray-400 text-sm leading-5">
              Každá spomienka je jedinečná. Môžete ju kedykoľvek upraviť, pridať
              viac detailov alebo zdieľať s priateľmi.
            </Text>
          </Animated.View>

          {/* Bottom Padding */}
          <View className="h-8" />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MemoryDetailScreen;
