import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  PanResponder,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeftIcon,
  HeartIcon,
  MapPinIcon,
  SparklesIcon,
} from "react-native-heroicons/outline";
import Animated, {
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = height * 0.7;
const SWIPE_THRESHOLD = 50;

interface PolaroidMemoryViewProps {
  memories: any[];
  currentMemoryIndex: number;
  onNavigate: (direction: "prev" | "next") => void;
  onBack: () => void;
  formatDate: (dateString: string) => string;
}

const PolaroidMemoryView: React.FC<PolaroidMemoryViewProps> = ({
  memories,
  currentMemoryIndex,
  onNavigate,
  onBack,
  formatDate,
}) => {
  const currentMemory = memories[currentMemoryIndex];
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageCache, setImageCache] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const preloadImages = async () => {
      const urlsToLoad = [currentMemoryIndex - 1, currentMemoryIndex + 1]
        .filter((i) => i >= 0 && i < memories.length)
        .map((i) => memories[i]?.imageUrl)
        .filter(Boolean)
        .filter((url) => !imageCache[url]);

      await Promise.all(
        urlsToLoad.map((url) =>
          Image.prefetch(url).then(() =>
            setImageCache((prev) => ({ ...prev, [url]: true }))
          )
        )
      );
    };

    preloadImages();
  }, [currentMemoryIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5,
      onPanResponderGrant: () => {
        scale.value = withSpring(0.95);
      },
      onPanResponderMove: (_, gesture) => {
        translateX.value = gesture.dx;
        translateY.value = gesture.dy * 0.3;
        rotate.value = (gesture.dx / width) * 25;
      },
      onPanResponderRelease: (_, gesture) => {
        scale.value = withSpring(1);
        const isSwipeLeft = gesture.dx < -SWIPE_THRESHOLD;
        const isSwipeRight = gesture.dx > SWIPE_THRESHOLD;

        if (isSwipeRight && currentMemoryIndex > 0) {
          translateX.value = withTiming(width * 1.5, { duration: 300 });
          opacity.value = withTiming(0, { duration: 200 }, () => {
            runOnJS(onNavigate)("prev");
          });
        } else if (isSwipeLeft && currentMemoryIndex < memories.length - 1) {
          translateX.value = withTiming(-width * 1.5, { duration: 300 });
          opacity.value = withTiming(0, { duration: 200 }, () => {
            runOnJS(onNavigate)("next");
          });
        } else {
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          rotate.value = withSpring(0);
        }
      },
    })
  ).current;

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    rotate.value = 0;
    opacity.value = 0;
    scale.value = 0.8;
    setIsImageLoaded(false);

    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSpring(1, { damping: 15 });
  }, [currentMemoryIndex]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <View className="flex-1 bg-black">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <LinearGradient
        colors={["#000000", "#0a0a0a", "#000000"]}
        locations={[0, 0.5, 1]}
        className="absolute inset-0"
      />

      <Animated.View
        entering={FadeInDown.delay(300).duration(600)}
        className="absolute top-0 left-0 right-0 z-50"
      >
        <SafeAreaView>
          <View className="flex-row items-center justify-between px-6 pt-4">
            <TouchableOpacity
              onPress={onBack}
              className="bg-white/10 rounded-full p-3.5"
            >
              <ArrowLeftIcon size={18} color="white" />
            </TouchableOpacity>

            <View className="flex-row items-center space-x-2 bg-white/10 rounded-full px-4 py-2">
              <SparklesIcon size={14} color="white" opacity={0.7} />
              <Text className="text-white/80 text-sm font-light">
                {currentMemoryIndex + 1} of {memories.length}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <View className="flex-1 items-center justify-center">
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            {
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              maxWidth: 400,
              maxHeight: 600,
            },
            cardAnimatedStyle,
          ]}
        >
          <View className="flex-1 bg-white rounded-3xl p-4">
            <View className="flex-1 rounded-2xl overflow-hidden bg-gray-100">
              {!isImageLoaded && (
                <View className="absolute inset-0 bg-gray-100 items-center justify-center">
                  <SparklesIcon size={24} color="#d4d4d8" />
                </View>
              )}
              {currentMemory.imageUrl ? (
                <Image
                  source={{ uri: currentMemory.imageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                  onLoadStart={() => setIsImageLoaded(false)}
                  onLoadEnd={() => setIsImageLoaded(true)}
                />
              ) : (
                <View className="w-full h-full bg-white items-center justify-center">
                  <HeartIcon size={48} color="#e4e4e7" />
                </View>
              )}
            </View>

            <View className="mt-4 px-2">
              <Text className="text-gray-900 text-xl font-bold mb-2">
                {currentMemory.title}
              </Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-500 text-sm font-light">
                  {formatDate(currentMemory.date)}
                </Text>
                {currentMemory.location && (
                  <View className="flex-row items-center">
                    <MapPinIcon size={12} color="#9ca3af" />
                    <Text className="text-gray-500 text-sm font-light ml-1">
                      {currentMemory.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Swipe hints */}
        {currentMemoryIndex > 0 && (
          <Animated.View
            entering={FadeIn.delay(1000).duration(800)}
            className="absolute left-4"
            style={{ opacity: 0.3 }}
          >
            <View className="bg-white/10 rounded-full p-2">
              <ArrowLeftIcon size={16} color="white" />
            </View>
          </Animated.View>
        )}

        {currentMemoryIndex < memories.length - 1 && (
          <Animated.View
            entering={FadeIn.delay(1000).duration(800)}
            className="absolute right-4"
            style={{ opacity: 0.3 }}
          >
            <View className="bg-white/10 rounded-full p-2 rotate-180">
              <ArrowLeftIcon size={16} color="white" />
            </View>
          </Animated.View>
        )}
      </View>

      {/* Dots */}
      <View className="absolute bottom-16 left-0 right-0">
        <View className="flex-row justify-center space-x-2">
          {memories.map((_, index) => (
            <Animated.View
              key={index}
              entering={FadeIn.delay(600 + index * 50).duration(400)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentMemoryIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/30"
              }`}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default PolaroidMemoryView;
