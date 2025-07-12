import TopBar from "@/components/TopBar";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowRightOnRectangleIcon,
  CameraIcon,
  PencilIcon,
  SparklesIcon,
  UserCircleIcon,
} from "react-native-heroicons/outline";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Povolenie potrebné", "Prístup k galérii je vyžadovaný.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Povolenie potrebné", "Prístup ku kamere je vyžadovaný.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert("Profilová fotka", "Vyber možnosť", [
      { text: "Kamera", onPress: takePhoto },
      { text: "Galéria", onPress: pickImage },
      { text: "Zrušiť", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <TopBar />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInUp.delay(200).duration(600)}
          className="px-6 py-8"
        >
          {/* Header */}
          <View className="items-center mb-8">
            <View className="flex-row items-center mb-4">
              <SparklesIcon size={24} color="#a855f7" />
              <Text className="text-white text-2xl font-bold ml-2">
                Tvoj Profil
              </Text>
              <SparklesIcon size={24} color="#a855f7" />
            </View>
            <Text className="text-gray-400 text-center">
              Spravuj svoj účet a nastavenia
            </Text>
          </View>

          {user ? (
            <Animated.View entering={FadeIn.delay(400).duration(600)}>
              {/* Profile Picture Section */}
              <View className="items-center mb-8">
                <TouchableOpacity
                  onPress={showImageOptions}
                  className="relative mb-4"
                >
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      className="w-32 h-32 rounded-full border-4 border-purple-600"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 items-center justify-center border-4 border-purple-600">
                      <UserCircleIcon size={60} color="white" />
                    </View>
                  )}

                  <View className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-2 border-2 border-black">
                    <CameraIcon size={16} color="white" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={showImageOptions}
                  className="bg-white/10 rounded-full px-4 py-2 border border-white/20"
                >
                  <Text className="text-white font-medium">Zmeniť fotku</Text>
                </TouchableOpacity>
              </View>

              {/* User Info Cards */}
              <View className="space-y-4 mb-8">
                <View className="bg-neutral-900 rounded-3xl p-6 border border-white/10">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-400 text-sm font-medium">
                      MENO
                    </Text>
                    <TouchableOpacity>
                      <PencilIcon size={16} color="#a855f7" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-white text-lg font-semibold">
                    {user.name}
                  </Text>
                </View>

                <View className="bg-neutral-900 rounded-3xl p-6 border border-white/10">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-400 text-sm font-medium">
                      EMAIL
                    </Text>
                    <TouchableOpacity>
                      <PencilIcon size={16} color="#a855f7" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-white text-lg font-semibold">
                    {user.email}
                  </Text>
                </View>

                <View className="bg-neutral-900 rounded-3xl p-6 border border-white/10">
                  <Text className="text-gray-400 text-sm font-medium mb-2">
                    ČLEN OD
                  </Text>
                  <Text className="text-white text-lg font-semibold">
                    {new Date(user.$createdAt).toLocaleDateString("sk-SK", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>

              {/* Stats Section */}
              <View className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-6 border border-purple-600/30 mb-8">
                <Text className="text-white text-lg font-bold mb-4 text-center">
                  Tvoje štatistiky
                </Text>
                <View className="flex-row justify-around">
                  <View className="items-center">
                    <Text className="text-white text-2xl font-bold">12</Text>
                    <Text className="text-gray-300 text-sm">Scrapbooky</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-white text-2xl font-bold">48</Text>
                    <Text className="text-gray-300 text-sm">Spomienky</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-white text-2xl font-bold">156</Text>
                    <Text className="text-gray-300 text-sm">Fotky</Text>
                  </View>
                </View>
              </View>

              {/* Logout Button */}
              <TouchableOpacity
                onPress={logout}
                className="bg-red-600 rounded-3xl py-4 px-6 flex-row items-center justify-center mb-8"
              >
                <ArrowRightOnRectangleIcon size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Odhlásiť sa
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeIn.delay(400).duration(600)}
              className="items-center"
            >
              <View className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 items-center justify-center mb-6">
                <UserCircleIcon size={60} color="white" />
              </View>

              <Text className="text-white text-xl font-bold mb-2">
                Nie si prihlásený
              </Text>
              <Text className="text-gray-400 text-center mb-8">
                Prihlás sa a začni vytvárať svoje scrapbooky
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/login")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl py-4 px-8"
              >
                <Text className="text-white font-bold text-lg">
                  Prihlásiť sa
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
