import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
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
  XMarkIcon,
} from "react-native-heroicons/outline";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { memoriesService } from "../../lib/memories";

const { width, height } = Dimensions.get("window");
const featuredScrapbook = {
  id: "1",
  title: "Spečať svoje momenty",
  description: "Svet očami cestovatela, každé dobrodružstvo je príbeh.",
  coverImage: require("../../assets/images/polaroid.jpg"),
  memories: 24,
};

const AddMemoryScreen = () => {
  const router = useRouter();
  const { scrapbookId } = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated]);

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Povolenie potrebné",
          "Potrebujeme povolenie na prístup k lokácii."
        );
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        setLocationName(
          `${place.city || place.district || place.subregion}, ${place.country}`
        );
      }
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Chyba", "Nepodarilo sa získať aktuálnu lokáciu");
    } finally {
      setIsLocationLoading(false);
    }
  }, []);

  const pickImageFromGallery = useCallback(async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Povolenie potrebné",
          "Potrebujeme povolenie na prístup k galerii."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        setStep(2);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Chyba", "Nepodarilo sa vybrať obrázok z galérie");
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Povolenie potrebné",
          "Potrebujeme povolenie na prístup ku kamere."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        setStep(2);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Chyba", "Nepodarilo sa odfotiť");
    }
  }, []);

  const removeSelectedImage = useCallback(() => {
    setSelectedImage(null);
    setStep(1);
  }, []);

  const handleDateChange = useCallback((event, selectedDate) => {
    const currentDate = selectedDate || selectedDate;
    setShowDatePicker(Platform.OS === "ios");
    setSelectedDate(currentDate);
  }, []);

  const removeLocation = useCallback(() => {
    setLocation(null);
    setLocationName("");
  }, []);

  const handleAddMemory = useCallback(async () => {
    if (!title.trim()) {
      setError("Zadajte názov spomienky");
      return;
    }
    if (!selectedImage) {
      setError("Vyberte obrázok pre spomienku");
      return;
    }
    if (!user) {
      setError("Musíte byť prihlásený");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const memoryData = {
        title: title.trim(),
        description: description.trim(),
        date: selectedDate.toISOString(),
        location: locationName || null,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
      };
      await memoriesService.createMemory(
        scrapbookId as string,
        memoryData,
        selectedImage
      );
      Alert.alert("Úspech!", "Spomienka bola úspešne pridaná do scrapbooku.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Add memory error:", error);
      setError(error.message || "Nepodarilo sa pridať spomienku");
    } finally {
      setIsLoading(false);
    }
  }, [
    title,
    description,
    selectedImage,
    user,
    locationName,
    location,
    scrapbookId,
  ]);

  const formatDate = (date) => {
    return date.toLocaleDateString("sk-SK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="bg-black/95 backdrop-blur-xl px-6 py-4 border-b border-white/10"
          style={{
            shadowColor: "#a855f7",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-4 bg-white/10 rounded-full p-2 border border-white/20"
              >
                <ArrowLeftIcon size={20} color="#a855f7" />
              </TouchableOpacity>
              <Text className="text-white text-xl font-bold">
                {step === 1 ? "Zachyť Moment" : "Pridať Spomienku"}
              </Text>
            </View>
            {step === 2 && selectedImage && (
              <TouchableOpacity
                className="bg-red-500/80 backdrop-blur-sm rounded-full p-2 border border-red-400/30"
                onPress={removeSelectedImage}
              >
                <XMarkIcon size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {step === 1 ? (
          <View className="flex-1">
            <View className="flex-1 items-center justify-center px-6">
              {/* Hero Element */}
              <View className="mb-10">
                <View className="relative">
                  <Image
                    source={featuredScrapbook.coverImage}
                    style={{ width: 300, height: 300, borderRadius: 100 }}
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-0 left-0 right-0 px-6 pb-8">
                    <Text className="text-white text-2xl font-bold mb-3 text-center">
                      {featuredScrapbook.title}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Heading */}
              <Animated.View entering={FadeInUp.duration(400)}>
                <Text className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-center leading-tight">
                  Tvoj Príbeh Začína Tu
                </Text>
                <Text className="text-gray-200 text-lg text-center mt-3 leading-6">
                  Zachyť moment, ktorý rozpráva tvoj príbeh
                </Text>
              </Animated.View>

              {/* Buttons */}
              <View className="flex-row justify-center space-x-10 mt-12">
                <TouchableOpacity
                  className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-10 border-2 border-white/30"
                  onPress={takePhoto}
                  style={{
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.6,
                    shadowRadius: 20,
                    elevation: 12,
                  }}
                >
                  <CameraIcon size={48} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-base font-semibold text-center mt-4">
                  Odfotiť
                </Text>

                <TouchableOpacity
                  className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-10 border-2 border-white/30"
                  onPress={pickImageFromGallery}
                  style={{
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.6,
                    shadowRadius: 20,
                    elevation: 12,
                  }}
                >
                  <PhotoIcon size={48} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-base font-semibold text-center mt-4">
                  Galéria
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Selected Image Preview */}
            <View className="px-6 pt-6">
              <View className=" flex items-center bg-purple-600/30 backdrop-blur-sm rounded-full px-4 py-4 self-center mb-6 border border-purple-400/30">
                <Text className="text-gray-300 text-xl font-semibold ">
                  Opíš svoju spomienku
                </Text>
              </View>
              <View className="relative mb-6">
                <Image
                  source={{ uri: selectedImage.uri }}
                  className="w-full h-64 rounded-2xl"
                  resizeMode="cover"
                  style={{
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.2,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                />
                <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </View>
            </View>

            {/* Form */}
            <View className="px-6">
              {/* Title Input */}
              <View className="mb-6">
                <Text className="text-white text-base font-semibold mb-3">
                  Názov spomienky *
                </Text>
                <TextInput
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-4 text-white text-base"
                  placeholder="napr. Náš prvý výlet do hôr"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  style={{
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                />
                <Text className="text-gray-400 text-sm mt-2">
                  {title.length}/100 znakov
                </Text>
              </View>

              {/* Description Input */}
              <View className="mb-6">
                <Text className="text-white text-base font-semibold mb-3">
                  Popis (Voliteľné)
                </Text>
                <TextInput
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-4 text-white text-base"
                  placeholder="Opíšte túto spomienku..."
                  placeholderTextColor="#9CA3AF"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                  style={{
                    minHeight: 100,
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                />
                <Text className="text-gray-400 text-sm mt-2">
                  {description.length}/500 znakov
                </Text>
              </View>

              {/* Date Selection */}
              <View className="mb-6">
                <Text className="text-white text-base font-semibold mb-3">
                  Dátum spomienky
                </Text>
                <TouchableOpacity
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-4 flex-row items-center justify-between"
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text className="text-white text-base">
                    {formatDate(selectedDate)}
                  </Text>
                  <CalendarIcon size={20} color="#a855f7" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    themeVariant="dark"
                  />
                )}
              </View>

              {/* Location Section */}
              <View className="mb-6">
                <Text className="text-white text-base font-semibold mb-3">
                  Lokácia (Voliteľné)
                </Text>
                {location && locationName ? (
                  <View
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-4 flex-row items-center justify-between"
                    style={{
                      shadowColor: "#a855f7",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <View className="flex-1 flex-row items-center">
                      <MapPinIcon size={20} color="#ef4444" />
                      <Text
                        className="text-white text-base ml-2 flex-1"
                        numberOfLines={1}
                      >
                        {locationName}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="bg-red-500/80 backdrop-blur-sm rounded-full p-2 border border-red-400/30"
                      onPress={removeLocation}
                    >
                      <XMarkIcon size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-4 flex-row items-center justify-center"
                    onPress={getCurrentLocation}
                    disabled={isLocationLoading}
                    style={{
                      shadowColor: "#a855f7",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <MapPinIcon size={20} color="#a855f7" />
                    <Text className="text-white text-base ml-2">
                      {isLocationLoading
                        ? "Získavam lokáciu..."
                        : "Pridať aktuálnu lokáciu"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Error Message */}
              {error && (
                <View
                  className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 mb-6"
                  style={{
                    shadowColor: "#ef4444",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Text className="text-red-300 text-center">{error}</Text>
                </View>
              )}

              {/* Add Memory Button */}
              <View>
                <TouchableOpacity
                  className={`bg-purple-500 rounded-xl py-4 flex-row items-center justify-center mb-6 border border-white/20 ${
                    isLoading || !title.trim() ? "opacity-50" : ""
                  }`}
                  onPress={handleAddMemory}
                  disabled={isLoading || !title.trim()}
                  style={{
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <Text className="text-white font-bold text-lg">
                    {isLoading ? "Pridávam..." : "Pridať Spomienku"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default memo(AddMemoryScreen);
