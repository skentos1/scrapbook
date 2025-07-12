import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { BellIcon } from "react-native-heroicons/outline";
import Animated, { FadeInDown } from "react-native-reanimated";
import ProfileMenu from "../components/dropdowns/profileMenu";
import { useAuth } from "../context/AuthContext";

export default function TopBar({ showNotifications = true }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeInDown.duration(600)}
      className="bg-black/95 backdrop-blur-xl px-6 py-4 border-b border-white/10"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 10,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">
            Memo
            <Text className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              ries
            </Text>
          </Text>
          <Text className="text-gray-400 text-xs">Digitálne spomienky</Text>
        </View>
        <View className="flex-row items-center space-x-3">
          {isAuthenticated && showNotifications && (
            <TouchableOpacity
              className="bg-white/10 rounded-full p-2 border border-white/20"
              onPress={() => router.push("/notifications")}
              accessibilityLabel="Notifikácie"
            >
              <BellIcon size={20} color="#a855f7" />
            </TouchableOpacity>
          )}
          <ProfileMenu />
        </View>
      </View>
    </Animated.View>
  );
}
