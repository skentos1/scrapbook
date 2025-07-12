// app/(tabs)/_layout.tsx - This is where you control the bottom tabs
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
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
import "../global.css";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopColor: "#1f2937",
          borderTopWidth: 1,
          paddingBottom: Platform.OS === "ios" ? 25 : 15,
          paddingTop: 10,
          height: Platform.OS === "ios" ? 90 : 80,
        },
        tabBarActiveTintColor: "#a855f7",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <HomeSolid size={24} color={color} />
            ) : (
              <HomeIcon size={24} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <MagnifyingGlassSolid size={24} color={color} />
            ) : (
              <MagnifyingGlassIcon size={24} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View className="absolute -top-5">
              <LinearGradient
                colors={
                  focused ? ["#a855f7", "#ec4899"] : ["#7c3aed", "#db2777"]
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
          ),
        }}
      />

      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <BookmarkSolid size={24} color={color} />
            ) : (
              <BookmarkIcon size={24} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <UserSolid size={24} color={color} />
            ) : (
              <UserIcon size={24} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}
