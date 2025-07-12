import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import {
  BookOpenIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  UserIcon,
} from "react-native-heroicons/solid";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const NavItem = ({
  icon: Icon,
  label,
  isActive,
  onPress,
  isCenter = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  if (isCenter) {
    return (
      <TouchableOpacity onPress={handlePress} className="relative -top-6">
        <LinearGradient
          colors={["#a855f7", "#ec4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{
            shadowColor: "#a855f7",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Animated.View style={animatedStyle}>
            <Icon size={28} color="white" />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-1 items-center py-2"
    >
      <Animated.View style={animatedStyle}>
        <Icon size={24} color={isActive ? "#a855f7" : "#6b7280"} />
      </Animated.View>
      <Text
        className={`text-xs mt-1 ${
          isActive ? "text-purple-500 font-semibold" : "text-gray-500"
        }`}
      >
        {label}
      </Text>
      {isActive && (
        <View className="absolute -bottom-0.5 w-1 h-1 bg-purple-500 rounded-full" />
      )}
    </TouchableOpacity>
  );
};

export const BottomNavBar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: HomeIcon, label: "Home", route: "/" },
    { icon: MagnifyingGlassIcon, label: "Discover", route: "/discover" },
    { icon: PlusCircleIcon, label: "Create", route: "/create", isCenter: true },
    { icon: BookOpenIcon, label: "Library", route: "/library" },
    { icon: UserIcon, label: "Profile", route: "/profile" },
  ];

  return (
    <View
      className="bg-black border-t border-gray-900"
      style={{
        paddingBottom: Platform.OS === "ios" ? 20 : 10,
      }}
    >
      <View className="flex-row items-end px-4 pt-2">
        {navItems.map((item, index) => (
          <NavItem
            key={index}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.route}
            onPress={() => router.push(item.route)}
            isCenter={item.isCenter}
          />
        ))}
      </View>
    </View>
  );
};
