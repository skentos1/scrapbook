import { useRouter } from "expo-router";
import React, { useState } from "react";
import { authService } from "../../lib/auth";

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
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from "react-native-heroicons/outline";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

const RegisterScreen = () => {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const fullName = `${firstName} ${lastName}`;
      await authService.register(email, password, fullName);
      router.replace("/(tabs)");
    } catch (error) {
      setError(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

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
            className="items-center pt-12 pb-6"
          >
            <View className="bg-blue-500 rounded-2xl p-4 mb-4">
              <BookOpenIcon size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </Text>
            <Text className="text-gray-500 text-base">
              Start your scrapbook journey
            </Text>
          </Animated.View>

          {/* Registration Form */}
          <Animated.View
            entering={FadeIn.delay(400).duration(800)}
            className="px-6"
          >
            {/* Name Fields */}
            <View className="flex-row space-x-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">
                  First Name
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                  placeholder="John"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm font-medium mb-2">
                  Last Name
                </Text>
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                  placeholder="Doe"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                />
              </View>
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Email
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                placeholder="john.doe@example.com"
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
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-4 pr-12 text-gray-900"
                  placeholder="Create a strong password"
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

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Confirm Password
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-4 pr-12 text-gray-900"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
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
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon size={20} color="#9CA3AF" />
                  ) : (
                    <EyeIcon size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <Animated.View
              entering={FadeIn.delay(600).duration(800)}
              className="flex-row items-start mb-6"
            >
              <TouchableOpacity
                className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                  acceptTerms
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300 bg-white"
                }`}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                {acceptTerms && <CheckIcon size={12} color="white" />}
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-gray-600 text-sm leading-5">
                  I agree to the{" "}
                  <Text className="text-blue-500 font-medium">
                    Terms of Service
                  </Text>{" "}
                  and{" "}
                  <Text className="text-blue-500 font-medium">
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </Animated.View>

            {/* Register Button */}
            <Animated.View entering={FadeInUp.delay(700).duration(800)}>
              <TouchableOpacity
                className={`bg-blue-500 rounded-xl py-4 flex-row items-center justify-center ${
                  isLoading || !acceptTerms ? "opacity-50" : ""
                }`}
                onPress={handleRegister}
                disabled={isLoading || !acceptTerms}
                style={{
                  shadowColor: "#3B82F6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="text-white font-bold text-lg mr-2">
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Text>
                {!isLoading && <ArrowRightIcon size={20} color="white" />}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <Animated.View
              entering={FadeIn.delay(900).duration(800)}
              className="flex-row items-center my-6"
            >
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-gray-500 text-sm">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </Animated.View>

            {/* Social Registration Buttons */}
            <Animated.View
              entering={FadeInUp.delay(1100).duration(800)}
              className="space-y-3 mb-6"
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

            {/* Sign In Link */}
            <Animated.View
              entering={FadeIn.delay(1300).duration(800)}
              className="flex-row justify-center pb-8"
            >
              <Text className="text-gray-500">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text className="text-blue-500 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
