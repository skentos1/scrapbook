import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  PhotoIcon,
  XMarkIcon,
} from "react-native-heroicons/outline";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { scrapbookService } from "../../lib/scrapbooks";

const CreateScrapbookScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated]);

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Gallery access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverImage(result.assets[0]);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert("Pridať obrázok", "Vyber spôsob pridania", [
      { text: "Odfoť", onPress: takePhoto },
      { text: "Z galérie", onPress: pickImageFromGallery },
      { text: "Zrušiť", style: "cancel" },
    ]);
  };

  const removeCoverImage = () => setCoverImage(null);

  const handleCreateScrapbook = async () => {
    if (!title.trim()) {
      setError("Zadaj názov scrapbooku");
      return;
    }
    if (!user) {
      setError("Musíš byť prihlásený");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await scrapbookService.createScrapbook(
        title.trim(),
        description.trim(),
        user.$id,
        coverImage?.uri || null
      );

      Alert.alert("Úspech!", "Scrapbook bol vytvorený.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Chyba pri vytváraní scrapbooku");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 bg-white/10 rounded-full p-2 border border-white/20"
        >
          <ArrowLeftIcon size={20} color="#a855f7" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-bold">Nový scrapbook</Text>

        <View className="w-16" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Animated.View
            entering={FadeIn.delay(100)}
            className="px-6 py-8 items-center"
          >
            <Text className="text-white text-3xl font-bold mb-1 text-center">
              Vytvor si svoj nový scrapbook
            </Text>
            <Text className="text-gray-400 text-center mb-6 text-base">
              Začni písať príbeh svojich spomienok a zdieľaj ho s ostatnými
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(300)} className="px-6">
            <View className="bg-neutral-900 rounded-3xl p-6 border border-white/10 shadow-lg mb-8">
              <View className="flex-row items-center mb-3">
                <View className="bg-purple-600 rounded-full p-2 mr-3">
                  <BookOpenIcon size={20} color="white" />
                </View>
                <Text className="text-white text-lg font-bold">
                  Vítaj, {user?.name || "tvorca"}!
                </Text>
              </View>
              <Text className="text-gray-300">
                Pripravený vytvoriť nový scrapbook? Ulož svoje najkrajšie
                momenty navždy.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-white font-semibold mb-2">
                Názov scrapbooku *
              </Text>
              <TextInput
                className="bg-neutral-800 border border-white/10 focus:border-purple-600 rounded-3xl px-5 py-4 text-white"
                placeholder="Napr. Letné dobrodružstvá"
                placeholderTextColor="#6B7280"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />
              <Text className="text-gray-500 text-sm mt-2">
                {title.length}/50 znakov
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-white font-semibold mb-2">
                Popis (nepovinné)
              </Text>
              <TextInput
                className="bg-neutral-800 border border-white/10 focus:border-purple-600 rounded-3xl px-5 py-4 text-white"
                placeholder="Popíš, o čom je tento scrapbook..."
                placeholderTextColor="#6B7280"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
                style={{ minHeight: 100 }}
              />
              <Text className="text-gray-500 text-sm mt-2">
                {description.length}/200 znakov
              </Text>
            </View>

            <View className="mb-8">
              <Text className="text-white font-semibold mb-2">
                Titulný obrázok (nepovinné)
              </Text>

              {coverImage ? (
                <View className="relative">
                  <Image
                    source={{ uri: coverImage.uri }}
                    className="w-full h-52 rounded-3xl"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    className="absolute top-2 right-2 bg-red-600 rounded-full p-2"
                    onPress={removeCoverImage}
                  >
                    <XMarkIcon size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="absolute bottom-2 right-2 bg-purple-600 rounded-xl px-4 py-1.5"
                    onPress={showImagePickerOptions}
                  >
                    <Text className="text-white text-sm font-medium">
                      Zmeniť
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className="bg-neutral-800 border-2 border-dashed border-white/10 rounded-3xl py-10 items-center justify-center"
                  onPress={showImagePickerOptions}
                >
                  <PhotoIcon size={36} color="#9CA3AF" />
                  <Text className="text-gray-300 mt-2 font-medium">
                    Pridať obrázok
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Vyber z galérie alebo odfoť
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {error && (
              <Animated.View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
                <Text className="text-red-400 text-center">{error}</Text>
              </Animated.View>
            )}

            <TouchableOpacity
              className={`flex-row gap-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl py-4 items-center justify-center mb-16 ${
                isLoading || !title.trim() ? "opacity-50" : ""
              }`}
              onPress={handleCreateScrapbook}
              disabled={isLoading || !title.trim()}
            >
              {isLoading && <ActivityIndicator color="white" />}
              <Text className="text-white font-bold text-lg">
                {isLoading ? "Vytváram..." : "Vytvoriť scrapbook"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateScrapbookScreen;
