import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

import React, { useState } from "react";
import {
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
  ArrowRightIcon,
  BookOpenIcon,
  EyeIcon,
  EyeSlashIcon,
} from "react-native-heroicons/outline";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error) {
      setError(error.message);
    }
  };

  // Pridaj error zobrazenie do UI
  {
    error && (
      <Text className="text-red-500 text-sm mb-4 text-center">{error}</Text>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            className="items-center pt-16 pb-8"
          >
            <View className="bg-blue-500 rounded-2xl p-4 mb-6">
              <BookOpenIcon size={48} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </Text>
            <Text className="text-gray-500 text-base">
              Sign in to continue your story
            </Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View
            entering={FadeIn.delay(400).duration(800)}
            className="px-6"
          >
            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Email
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              />
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-4 pr-12 text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                />
                <TouchableOpacity
                  className="absolute right-4 top-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon size={20} color="#9CA3AF" />
                  ) : (
                    <EyeIcon size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity className="self-end mb-6">
              <Text className="text-blue-500 font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Animated.View entering={FadeInUp.delay(600).duration(800)}>
              <TouchableOpacity
                className={`bg-blue-500 rounded-xl py-4 flex-row items-center justify-center ${isLoading ? "opacity-70" : ""}`}
                onPress={handleLogin}
                disabled={isLoading}
                style={{
                  shadowColor: "#3B82F6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="text-white font-bold text-lg mr-2">
                  {isLoading ? "Signing In..." : "Sign In"}
                </Text>
                {!isLoading && <ArrowRightIcon size={20} color="white" />}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <Animated.View
              entering={FadeIn.delay(800).duration(800)}
              className="flex-row items-center my-8"
            >
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-gray-500 text-sm">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </Animated.View>

            {/* Social Login Buttons */}
            <Animated.View
              entering={FadeInUp.delay(1000).duration(800)}
              className="space-y-3 mb-8"
            >
              <TouchableOpacity
                className="bg-white border border-gray-200 rounded-xl py-4 flex-row items-center justify-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text className="text-gray-700 font-semibold text-base">
                  Continue with Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white border border-gray-200 rounded-xl py-4 flex-row items-center justify-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text className="text-gray-700 font-semibold text-base">
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Sign Up Link */}
            <Animated.View
              entering={FadeIn.delay(1200).duration(800)}
              className="flex-row justify-center pb-8"
            >
              <Text className="text-gray-500">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text className="text-blue-500 font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
