import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CameraIcon,
  PhotoIcon,
} from "react-native-heroicons/outline";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { scrapbookService } from "../../lib/scrapbooks";

const { width, height } = Dimensions.get("window");

const EditScrapbookScreen = () => {
  const router = useRouter();
  const { scrapbookId } = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();

  // State pre formulár
  const [scrapbook, setScrapbook] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCoverImage, setSelectedCoverImage] = useState(null);
  const [currentCoverImage, setCurrentCoverImage] = useState(null);

  // State pre UI
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  // Načítanie údajov scrapbooku
  const loadScrapbookData = async () => {
    try {
      setInitialLoading(true);
      const scrapbookData = await scrapbookService.getScrapbook(
        scrapbookId as string
      );

      setScrapbook(scrapbookData);
      setTitle(scrapbookData.title || "");
      setDescription(scrapbookData.description || "");
      setCurrentCoverImage(scrapbookData.coverImage || null);
    } catch (error) {
      console.error("Failed to load scrapbook:", error);
      setError("Nepodarilo sa načítať scrapbook");
      Alert.alert("Chyba", "Nepodarilo sa načítať scrapbook", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (scrapbookId) {
      loadScrapbookData();
    }
  }, [scrapbookId]);

  // Výber obrázka z galérie
  const pickImageFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Chyba", "Potrebujeme prístup k fotkám pre výber obrázka.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedCoverImage({
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          fileName: asset.fileName || `cover_${Date.now()}.jpg`,
          mimeType: asset.mimeType || "image/jpeg",
        });
      }
    } catch (error) {
      console.error("Pick image error:", error);
      Alert.alert("Chyba", "Nepodarilo sa vybrať obrázok");
    }
  };

  // Odfotenie novej fotky
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Chyba", "Potrebujeme prístup ku kamere pre odfotenie.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedCoverImage({
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          fileName: asset.fileName || `cover_${Date.now()}.jpg`,
          mimeType: asset.mimeType || "image/jpeg",
        });
      }
    } catch (error) {
      console.error("Take photo error:", error);
      Alert.alert("Chyba", "Nepodarilo sa odfotiť");
    }
  };

  // Uloženie zmien
  const handleUpdateScrapbook = async () => {
    if (!title.trim()) {
      setError("Názov scrapbooku je povinný");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const updateData = {
        title: title.trim(),
        description: description.trim(),
      };

      // Ak je zvolený nový cover image, pridaj ho
      if (selectedCoverImage) {
        updateData.coverImage = selectedCoverImage.uri;
      }

      await scrapbookService.updateScrapbook(scrapbookId as string, updateData);

      Alert.alert("Úspech", "Scrapbook bol upravený!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Update scrapbook error:", error);
      setError("Nepodarilo sa upraviť scrapbook. Skúste to znova.");
      Alert.alert("Chyba", "Nepodarilo sa upraviť scrapbook");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading screen
  if (initialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Načítavam scrapbook...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayCoverImage = selectedCoverImage?.uri || currentCoverImage;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800)}
          className="bg-black/95 backdrop-blur-xl px-6 py-4 flex-row items-center justify-between border-b border-white/10"
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeftIcon size={24} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-lg font-bold">
            Upraviť Scrapbook
          </Text>

          <View style={{ width: 24 }} />
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-6">
            {/* Cover Image Section */}
            <Animated.View
              entering={FadeIn.delay(400).duration(800)}
              className="mb-6"
            >
              <Text className="text-white text-lg font-bold mb-4">
                Obal Scrapbooku
              </Text>

              {displayCoverImage ? (
                <View className="relative">
                  <Image
                    source={{ uri: displayCoverImage }}
                    style={{
                      width: width - 48,
                      height: (width - 48) * 0.6,
                      borderRadius: 16,
                    }}
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-4 right-4 flex-row space-x-3">
                    <TouchableOpacity
                      onPress={pickImageFromGallery}
                      className="bg-black/60 backdrop-blur-sm rounded-full p-3"
                    >
                      <PhotoIcon size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={takePhoto}
                      className="bg-black/60 backdrop-blur-sm rounded-full p-3"
                    >
                      <CameraIcon size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View className="border-2 border-dashed border-gray-600 rounded-2xl p-8">
                  <View className="items-center">
                    <BookOpenIcon size={48} color="#6B7280" />
                    <Text className="text-gray-400 text-base mt-4 mb-6 text-center">
                      Pridajte obal k scrapbooku
                    </Text>
                    <View className="flex-row space-x-4">
                      <TouchableOpacity
                        onPress={pickImageFromGallery}
                        className="bg-purple-500 rounded-xl px-6 py-3 flex-row items-center"
                      >
                        <PhotoIcon size={20} color="white" />
                        <Text className="text-white font-medium ml-2">
                          Galéria
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={takePhoto}
                        className="bg-blue-500 rounded-xl px-6 py-3 flex-row items-center"
                      >
                        <CameraIcon size={20} color="white" />
                        <Text className="text-white font-medium ml-2">
                          Kamera
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Title Input */}
            <Animated.View
              entering={FadeInUp.delay(600).duration(800)}
              className="mb-6"
            >
              <Text className="text-white text-lg font-bold mb-3">
                Názov Scrapbooku *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Zadajte názov scrapbooku..."
                placeholderTextColor="#6B7280"
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-base"
                multiline={false}
              />
            </Animated.View>

            {/* Description Input */}
            <Animated.View
              entering={FadeInUp.delay(700).duration(800)}
              className="mb-8"
            >
              <Text className="text-white text-lg font-bold mb-3">
                Popis Scrapbooku
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Popíšte váš scrapbook..."
                placeholderTextColor="#6B7280"
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-base"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Animated.View>

            {/* Stats Info */}
            <Animated.View
              entering={FadeInUp.delay(800).duration(800)}
              className="mb-8"
            >
              <View className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Text className="text-white font-bold mb-3">📊 Informácie</Text>
                <View className="flex-row justify-around">
                  <View className="items-center">
                    <Text className="text-purple-300 text-xl font-bold">
                      {scrapbook?.memoriesCount || 0}
                    </Text>
                    <Text className="text-gray-400 text-sm">Spomienky</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-blue-300 text-xl font-bold">
                      {new Date(
                        scrapbook?.createdAt || new Date()
                      ).toLocaleDateString("sk-SK", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </Text>
                    <Text className="text-gray-400 text-sm">Vytvorený</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 mb-6"
              >
                <Text className="text-red-300 text-center">{error}</Text>
              </Animated.View>
            )}

            {/* Update Button */}
            <Animated.View entering={FadeInUp.delay(1000).duration(800)}>
              <TouchableOpacity
                className={`bg-purple-500 rounded-xl py-4 flex-row items-center justify-center mb-6 border border-white/20 ${
                  isLoading || !title.trim() ? "opacity-50" : ""
                }`}
                onPress={handleUpdateScrapbook}
                disabled={isLoading || !title.trim()}
                style={{
                  shadowColor: "#8B5CF6",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text className="text-white font-bold text-lg">
                  {isLoading ? "Upravujem..." : "Uložiť Zmeny"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Bottom Padding */}
            <View className="h-8" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditScrapbookScreen;
