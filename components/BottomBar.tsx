import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import {
  BookmarkIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  UserIcon,
} from "react-native-heroicons/outline";
import {
  BookmarkIcon as BookmarkSolid,
  HomeIcon as HomeSolid,
  MagnifyingGlassIcon as MagnifyingGlassSolid,
  UserIcon as UserSolid,
} from "react-native-heroicons/solid";

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    {
      name: "Home",
      route: "/(tabs)/index",
      icon: HomeIcon,
      iconSolid: HomeSolid,
    },
    {
      name: "Discover",
      route: "/(tabs)/discover",
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassSolid,
    },
    {
      name: "Create",
      route: "/(tabs)/create",
      icon: PlusCircleIcon,
      iconSolid: PlusCircleIcon, // Solid ikonka nie je potrebná, používame gradient
    },
    {
      name: "Library",
      route: "/(tabs)/library",
      icon: BookmarkIcon,
      iconSolid: BookmarkSolid,
    },
    {
      name: "Profile",
      route: "/(tabs)/profile",
      icon: UserIcon,
      iconSolid: UserSolid,
    },
  ];

  return (
    <View
      className="bg-black border-t border-[#1f2937] flex-row justify-around"
      style={{
        paddingBottom: Platform.OS === "ios" ? 25 : 15,
        paddingTop: 10,
        height: Platform.OS === "ios" ? 90 : 80,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 10,
      }}
    >
      {tabs.map((tab, index) => {
        const isActive =
          pathname === tab.route ||
          (pathname === "/" && tab.route === "/(tabs)/index");
        return (
          <TouchableOpacity
            key={tab.name}
            className={`flex-1 items-center justify-center ${isActive && tab.name !== "Create" ? "border-t-2 border-purple-400" : ""}`}
            onPress={() => router.push(tab.route)}
            accessibilityLabel={tab.name}
          >
            {tab.name === "Create" ? (
              <View className="absolute -top-5">
                <LinearGradient
                  colors={
                    isActive ? ["#a855f7", "#ec4899"] : ["#7c3aed", "#db2777"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 6,
                  }}
                >
                  <PlusCircleIcon size={28} color="white" />
                </LinearGradient>
              </View>
            ) : (
              <>
                {isActive ? (
                  <tab.iconSolid size={24} color="#a855f7" />
                ) : (
                  <tab.icon size={24} color="#6b7280" />
                )}
                <Text
                  className={`text-xs mt-1 font-semibold ${isActive ? "text-purple-400" : "text-gray-500"}`}
                >
                  {tab.name}
                </Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
