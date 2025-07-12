import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useSegments } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BellIcon,
  ChevronLeftIcon,
  UserCircleIcon,
} from "react-native-heroicons/outline";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";

export const TopBar = ({ title, showBack = false }) => {
  const router = useRouter();
  const segments = useSegments();
  const { user, isAuthenticated } = useAuth();

  // Don't show TopBar on certain screens
  const hideOnScreens = ["login", "register", "onboarding"];
  if (hideOnScreens.includes(segments[0])) {
    return null;
  }

  return (
    <SafeAreaView className="bg-black">
      <Animated.View
        entering={FadeIn.duration(500)}
        className="px-4 py-3 bg-black border-b border-gray-900"
      >
        <View className="flex-row items-center justify-between">
          {/* Left Section */}
          <View className="flex-row items-center flex-1">
            {showBack ? (
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <ChevronLeftIcon size={24} color="#a855f7" />
              </TouchableOpacity>
            ) : (
              <View className="flex-row items-center">
                <LinearGradient
                  colors={["#a855f7", "#ec4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                >
                  <Text className="text-white font-bold text-lg">S</Text>
                </LinearGradient>
                <Text className="text-white text-xl font-bold">
                  {title || "Scrapbook"}
                </Text>
              </View>
            )}
          </View>

          {/* Right Section */}
          <View className="flex-row items-center space-x-3">
            {isAuthenticated && (
              <>
                <TouchableOpacity
                  className="relative"
                  onPress={() => router.push("/notifications")}
                >
                  <View className="bg-gray-900 rounded-full p-2">
                    <BellIcon size={20} color="#a855f7" />
                  </View>
                  {/* Notification Badge */}
                  <View className="absolute -top-1 -right-1 bg-pink-600 rounded-full w-4 h-4 items-center justify-center">
                    <Text className="text-white text-xs font-bold">3</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/profile")}
                  className="bg-gray-900 rounded-full p-2"
                >
                  {user?.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon size={20} color="#a855f7" />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};
