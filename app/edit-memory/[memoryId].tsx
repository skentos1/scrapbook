import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
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
  CalendarIcon,
  CameraIcon,
  MapPinIcon,
  PhotoIcon,
} from "react-native-heroicons/outline";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { memoriesService } from "../../lib/memories";

const { width, height } = Dimensions.get("window");

const EditMemoryScreen = () => {
  const router = useRouter();
  const { memoryId } = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();

  // State pre formulár
  const [memory, setMemory] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  // State pre UI
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Načítanie údajov spomienky
  const loadMemoryData = async () => {
    try {
      setInitialLoading(true);
      const memoryData = await memoriesService.getMemory(memoryId as string);

      setMemory(memoryData);
      setTitle(memoryData.title || "");
      setDescription(memoryData.description || "");
      setDate(new Date(memoryData.date || new Date()));
      setLocation(memoryData.location || "");
      setLatitude(memoryData.latitude || null);
      setLongitude(memoryData.longitude || null);
      setCurrentImageUrl(memoryData.imageUrl || null);
    } catch (error) {
      console.error("Failed to load memory:", error);
      setError("Nepodarilo sa načítať spomienku");
      Alert.alert("Chyba", "Nepodarilo sa načítať spomienku", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (memoryId) {
      loadMemoryData();
    }
  }, [memoryId]);

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
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          fileName: asset.fileName || `memory_${Date.now()}.jpg`,
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
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          fileName: asset.fileName || `memory_${Date.now()}.jpg`,
          mimeType: asset.mimeType || "image/jpeg",
        });
      }
    } catch (error) {
      console.error("Take photo error:", error);
      Alert.alert("Chyba", "Nepodarilo sa odfotiť");
    }
  };

  // Získanie aktuálnej lokácie
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Chyba",
          "Potrebujeme prístup k lokácii pre získanie pozície."
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const locationString = [address.street, address.city, address.country]
          .filter(Boolean)
          .join(", ");

        setLocation(locationString);
        setLatitude(currentLocation.coords.latitude);
        setLongitude(currentLocation.coords.longitude);
      }
    } catch (error) {
      console.error("Get location error:", error);
      Alert.alert("Chyba", "Nepodarilo sa získať lokáciu");
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Uloženie zmien
  const handleUpdateMemory = async () => {
    if (!title.trim()) {
      setError("Názov spomienky je povinný");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const memoryData = {
        ...memory, // zachovaj existujúce údaje
        title: title.trim(),
        description: description.trim(),
        date: date.toISOString(),
        location: location.trim() || null,
        latitude,
        longitude,
      };

      await memoriesService.updateMemory(
        memoryId as string,
        memoryData,
        selectedImage
      );

      Alert.alert("Úspech", "Spomienka bola upravená!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Update memory error:", error);
      setError("Nepodarilo sa upraviť spomienku. Skúste to znova.");
      Alert.alert("Chyba", "Nepodarilo sa upraviť spomienku");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading screen
  if (initialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Načítavam spomienku...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayImage = selectedImage?.uri || currentImageUrl;

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
            Upraviť Spomienku
          </Text>

          <View style={{ width: 24 }} />
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-6">
            {/* Image Section */}
            <Animated.View
              entering={FadeIn.delay(400).duration(800)}
              className="mb-6"
            >
              <Text className="text-white text-lg font-bold mb-4">
                Obrázok spomienky
              </Text>

              {displayImage ? (
                <View className="relative">
                  <Image
                    source={{ uri: displayImage }}
                    style={{
                      width: width - 48,
                      height: (width - 48) * 0.75,
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
                    <PhotoIcon size={48} color="#6B7280" />
                    <Text className="text-gray-400 text-base mt-4 mb-6 text-center">
                      Pridajte obrázok k spomienke
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
                Názov spomienky *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Zadajte názov spomienky..."
                placeholderTextColor="#6B7280"
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-base"
                multiline={false}
              />
            </Animated.View>

            {/* Description Input */}
            <Animated.View
              entering={FadeInUp.delay(700).duration(800)}
              className="mb-6"
            >
              <Text className="text-white text-lg font-bold mb-3">
                Popis spomienky
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Popíšte svoju spomienku..."
                placeholderTextColor="#6B7280"
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-base"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Animated.View>

            {/* Date Section */}
            <Animated.View
              entering={FadeInUp.delay(800).duration(800)}
              className="mb-6"
            >
              <Text className="text-white text-lg font-bold mb-3">
                Dátum spomienky
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 flex-row items-center"
              >
                <CalendarIcon size={20} color="#8B5CF6" />
                <Text className="text-white text-base ml-3">
                  {date.toLocaleDateString("sk-SK")}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                />
              )}
            </Animated.View>

            {/* Location Section */}
            <Animated.View
              entering={FadeInUp.delay(900).duration(800)}
              className="mb-8"
            >
              <Text className="text-white text-lg font-bold mb-3">
                Lokácia spomienky
              </Text>
              <View className="space-y-3">
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Zadajte lokáciu..."
                  placeholderTextColor="#6B7280"
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-base"
                />

                <TouchableOpacity
                  onPress={getCurrentLocation}
                  disabled={isGettingLocation}
                  className={`bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-4 flex-row items-center justify-center ${
                    isGettingLocation ? "opacity-50" : ""
                  }`}
                >
                  <MapPinIcon size={20} color="#10B981" />
                  <Text className="text-green-300 font-medium ml-2">
                    {isGettingLocation
                      ? "Získavam lokáciu..."
                      : "Pridať aktuálnu lokáciu"}
                  </Text>
                </TouchableOpacity>
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
                onPress={handleUpdateMemory}
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

export default EditMemoryScreen;
