import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
} from "react-native-heroicons/outline";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { scrapbookService } from "../lib/scrapbooks";

const CreateScrapbookScreen = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated]);

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need gallery permissions to select images."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image from gallery");
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need camera permissions to take photos."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  // Show image picker options
  const showImagePickerOptions = () => {
    Alert.alert(
      "Select Cover Image",
      "Choose how you want to add a cover image",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: pickImageFromGallery },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // Remove selected image
  const removeCoverImage = () => {
    setCoverImage(null);
  };

  const handleCreateScrapbook = async () => {
    if (!title.trim()) {
      setError("Please enter a title for your scrapbook");
      return;
    }

    if (!user) {
      setError("You must be logged in to create a scrapbook");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const newScrapbook = await scrapbookService.createScrapbook(
        title.trim(),
        description.trim(),
        user.$id,
        coverImage?.uri || null
      );

      Alert.alert("Success!", "Your scrapbook has been created successfully.", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (error) {
      console.error("Create scrapbook error:", error);
      setError(error.message || "Failed to create scrapbook");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800)}
          className="bg-gray-800 px-6 py-4 flex-row items-center"
        >
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeftIcon size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Create Scrapbook</Text>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Welcome Message */}
          <Animated.View
            entering={FadeIn.delay(400).duration(800)}
            className="px-6 py-8"
          >
            <View className="bg-blue-50 rounded-2xl p-6 mb-6">
              <View className="flex-row items-center mb-3">
                <View className="bg-blue-500 rounded-full p-2 mr-3">
                  <BookOpenIcon size={20} color="white" />
                </View>
                <Text className="text-blue-900 text-lg font-bold">
                  Welcome, {user?.name || "Creator"}!
                </Text>
              </View>
              <Text className="text-blue-700 leading-6">
                Ready to capture some amazing memories? Let's create your new
                scrapbook together.
              </Text>
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(800)}
            className="px-6"
          >
            {/* Title Input */}
            <View className="mb-6">
              <Text className="text-gray-700 text-base font-semibold mb-3">
                Scrapbook Title *
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                placeholder="e.g., Summer Adventures 2025"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              />
              <Text className="text-gray-400 text-sm mt-2">
                {title.length}/50 characters
              </Text>
            </View>

            {/* Description Input */}
            <View className="mb-6">
              <Text className="text-gray-700 text-base font-semibold mb-3">
                Description (Optional)
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                placeholder="Tell us about this scrapbook..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                  minHeight: 100,
                }}
              />
              <Text className="text-gray-400 text-sm mt-2">
                {description.length}/200 characters
              </Text>
            </View>

            {/* Cover Image Section */}
            <View className="mb-8">
              <Text className="text-gray-700 text-base font-semibold mb-3">
                Cover Image (Optional)
              </Text>

              {coverImage ? (
                // Show selected image
                <View className="relative">
                  <Image
                    source={{ uri: coverImage.uri }}
                    className="w-full h-48 rounded-xl"
                    resizeMode="cover"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  />
                  {/* Remove button */}
                  <TouchableOpacity
                    className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                    onPress={removeCoverImage}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <XMarkIcon size={16} color="white" />
                  </TouchableOpacity>

                  {/* Change button */}
                  <TouchableOpacity
                    className="absolute bottom-2 right-2 bg-blue-500 rounded-lg px-3 py-2"
                    onPress={showImagePickerOptions}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Text className="text-white text-sm font-medium">
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Show picker options
                <View className="space-y-3">
                  <TouchableOpacity
                    className="bg-white border-2 border-dashed border-gray-300 rounded-xl py-8 items-center justify-center"
                    onPress={showImagePickerOptions}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <PhotoIcon size={32} color="#9CA3AF" />
                    <Text className="text-gray-500 text-base mt-2 font-medium">
                      Add Cover Image
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      Tap to select from gallery or camera
                    </Text>
                  </TouchableOpacity>

                  {/* Quick action buttons */}
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      className="flex-1 bg-blue-50 border border-blue-200 rounded-xl py-4 flex-row items-center justify-center"
                      onPress={takePhoto}
                    >
                      <CameraIcon size={20} color="#3B82F6" />
                      <Text className="text-blue-600 font-medium ml-2">
                        Take Photo
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-1 bg-green-50 border border-green-200 rounded-xl py-4 flex-row items-center justify-center"
                      onPress={pickImageFromGallery}
                    >
                      <PhotoIcon size={20} color="#059669" />
                      <Text className="text-green-600 font-medium ml-2">
                        Gallery
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
              >
                <Text className="text-red-600 text-center">{error}</Text>
              </Animated.View>
            )}

            {/* Create Button */}
            <Animated.View entering={FadeInUp.delay(800).duration(800)}>
              <TouchableOpacity
                className={`bg-blue-500 rounded-xl py-4 flex-row items-center justify-center mb-6 ${
                  isLoading || !title.trim() ? "opacity-50" : ""
                }`}
                onPress={handleCreateScrapbook}
                disabled={isLoading || !title.trim()}
                style={{
                  shadowColor: "#3B82F6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="text-white font-bold text-lg">
                  {isLoading ? "Creating..." : "Create Scrapbook"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Tips */}
            <Animated.View
              entering={FadeIn.delay(1000).duration(800)}
              className="bg-gray-100 rounded-xl p-4 mb-8"
            >
              <Text className="text-gray-700 font-semibold mb-2">💡 Tips:</Text>
              <Text className="text-gray-600 text-sm leading-5">
                • Choose a descriptive title that captures the theme{"\n"}• Add
                a description to help you remember what this scrapbook is about
                {"\n"}• Cover images help make your scrapbooks more memorable
                {"\n"}• You can always edit these details later
              </Text>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateScrapbookScreen;
