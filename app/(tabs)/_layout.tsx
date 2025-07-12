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
          title: "Create",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LinearGradient
                colors={
                  focused ? ["#a855f7", "#ec4899"] : ["#6366f1", "#8b5cf6"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: focused ? "#a855f7" : "#6366f1",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <PlusCircleIcon size={18} color="white" />
              </LinearGradient>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="library"
        options={{
          title: "Scrapbooks", // Zmení sa len názov z "Library" na "Scrapbooks"
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
