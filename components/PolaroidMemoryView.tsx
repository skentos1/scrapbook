import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
  PencilIcon,
  SparklesIcon,
} from "react-native-heroicons/outline";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
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
  const router = useRouter();
  const currentMemory = memories[currentMemoryIndex];
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageCache, setImageCache] = useState<Record<string, boolean>>({});
  const [showEditButton, setShowEditButton] = useState(false);

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

  // Reset edit button when memory changes
  useEffect(() => {
    setShowEditButton(false);
  }, [currentMemoryIndex]);

  const handleImagePress = () => {
    setShowEditButton(!showEditButton);
  };

  const handleEditPress = () => {
    if (currentMemory?.$id) {
      router.push(`/edit-memory/${currentMemory.$id}`);
    }
  };

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
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleImagePress}
              className="flex-1 rounded-2xl overflow-hidden bg-gray-100 relative"
            >
              {!isImageLoaded && (
                <View className="absolute inset-0 bg-gray-100 items-center justify-center">
                  <SparklesIcon size={24} color="#d4d4d8" />
                </View>
              )}
              {currentMemory.imageUrl ? (
                <Image
                  source={{ uri: currentMemory.imageUrl }}
                  className="w-full h-full"
                  resizeMode="contain"
                  onLoadStart={() => setIsImageLoaded(false)}
                  onLoadEnd={() => setIsImageLoaded(true)}
                />
              ) : (
                <View className="w-full h-full bg-white items-center justify-center">
                  <HeartIcon size={48} color="#e4e4e7" />
                </View>
              )}

              {/* Edit Button Overlay */}
              {showEditButton && (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(200)}
                  className="absolute inset-0 bg-black/40 items-center justify-center"
                >
                  <TouchableOpacity
                    onPress={handleEditPress}
                    className="bg-gray-200/25 rounded-2xl px-6 py-3 flex-row items-center space-x-3"
                    style={{
                      shadowColor: "#8B5CF6",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.5,
                      shadowRadius: 16,
                      elevation: 10,
                    }}
                  >
                    <PencilIcon size={24} color="white" />
                    <Text className="text-white font-bold text-lg">
                      Upraviť
                    </Text>
                  </TouchableOpacity>

                  {/* Tap to close hint */}
                  <Animated.View
                    entering={FadeIn.delay(500).duration(600)}
                    className="absolute bottom-6 left-0 right-0"
                  >
                    <Text className="text-white/70 text-center text-sm">
                      Ťukni pre skrytie
                    </Text>
                  </Animated.View>
                </Animated.View>
              )}

              {/* Tap hint when edit button is hidden */}
              {!showEditButton && isImageLoaded && (
                <Animated.View
                  entering={FadeIn.delay(1200).duration(800)}
                  className="absolute top-4 right-4"
                >
                  <View className="bg-black/30 rounded-full px-3 py-1.5">
                    <Text className="text-white/80 text-xs font-light">
                      Ťukni pre úpravu
                    </Text>
                  </View>
                </Animated.View>
              )}
            </TouchableOpacity>

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

        {/* Swipe hints - only show when edit button is not visible */}
        {!showEditButton && currentMemoryIndex > 0 && (
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

        {!showEditButton && currentMemoryIndex < memories.length - 1 && (
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
// components/EnhancedPolaroidMemoryView.tsx
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import {
//   ActivityIndicator,
//   Dimensions,
//   InteractionManager,
//   PanResponder,
//   SafeAreaView,
//   StatusBar,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import {
//   ArrowLeftIcon,
//   HeartIcon,
//   MapPinIcon,
//   PencilIcon,
//   SparklesIcon,
// } from "react-native-heroicons/outline";
// import Animated, {
//   cancelAnimation,
//   FadeIn,
//   FadeInDown,
//   FadeOut,
//   runOnJS,
//   useAnimatedStyle,
//   useSharedValue,
//   withSpring,
//   withTiming,
// } from "react-native-reanimated";

// const { width, height } = Dimensions.get("window");
// const CARD_WIDTH = width * 0.85;
// const CARD_HEIGHT = height * 0.7;
// const SWIPE_THRESHOLD = 50;

// interface PolaroidMemoryViewProps {
//   memories: any[];
//   currentMemoryIndex: number;
//   onNavigate: (direction: "prev" | "next") => void;
//   onBack: () => void;
//   formatDate: (dateString: string) => string;
// }

// const PolaroidMemoryView: React.FC<PolaroidMemoryViewProps> = ({
//   memories,
//   currentMemoryIndex,
//   onNavigate,
//   onBack,
//   formatDate,
// }) => {
//   const router = useRouter();
//   const currentMemory = memories[currentMemoryIndex];

//   // Animation values
//   const translateX = useSharedValue(0);
//   const translateY = useSharedValue(0);
//   const scale = useSharedValue(1);
//   const rotate = useSharedValue(0);
//   const opacity = useSharedValue(1);

//   // State
//   const [showEditButton, setShowEditButton] = useState(false);
//   const [isImageLoaded, setIsImageLoaded] = useState(false);
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [imageCache, setImageCache] = useState<Record<string, boolean>>({});

//   // Refs
//   const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   // Memoized current memory for performance
//   const memoizedCurrentMemory = useMemo(
//     () => currentMemory,
//     [currentMemory?.$id]
//   );

//   // Preload images
//   const preloadImages = useCallback(async () => {
//     const urlsToLoad = [currentMemoryIndex - 1, currentMemoryIndex + 1]
//       .filter((i) => i >= 0 && i < memories.length)
//       .map((i) => memories[i]?.imageUrl)
//       .filter(Boolean)
//       .filter((url) => !imageCache[url]);

//     await Promise.all(
//       urlsToLoad.map((url) =>
//         Image.prefetch(url).then(() =>
//           setImageCache((prev) => ({ ...prev, [url]: true }))
//         )
//       )
//     );
//   }, [currentMemoryIndex, memories, imageCache]);

//   // Enhanced navigation - FIXED VERSION
//   const handleNavigation = useCallback(
//     (direction: "prev" | "next") => {
//       if (isNavigating) return;

//       console.log(`🔄 Navigating ${direction} from ${currentMemoryIndex}`);

//       setIsNavigating(true);
//       setShowEditButton(false);

//       // Clear any existing navigation timeout
//       if (navigationTimeoutRef.current) {
//         clearTimeout(navigationTimeoutRef.current);
//       }

//       // CRITICAL: Reset values immediately for smooth transition
//       navigationTimeoutRef.current = setTimeout(() => {
//         // Reset animation values BEFORE state change
//         translateX.value = 0;
//         translateY.value = 0;
//         rotate.value = 0;
//         opacity.value = 0;
//         scale.value = 0.8;
//         setIsImageLoaded(false);

//         // Change state
//         onNavigate(direction);

//         // Allow new interactions after short delay
//         setTimeout(() => {
//           setIsNavigating(false);
//         }, 150);
//       }, 50);
//     },
//     [onNavigate, isNavigating, currentMemoryIndex]
//   );

//   // FIXED pan responder
//   const panResponder = useRef(
//     PanResponder.create({
//       onMoveShouldSetPanResponder: (_, gesture) => {
//         return Math.abs(gesture.dx) > 5 && !showEditButton && !isNavigating;
//       },
//       onPanResponderGrant: () => {
//         if (isNavigating) return;
//         cancelAnimation(scale);
//         scale.value = withSpring(0.95, { damping: 20 });
//       },
//       onPanResponderMove: (_, gesture) => {
//         if (showEditButton || isNavigating) return;

//         translateX.value = gesture.dx;
//         translateY.value = gesture.dy * 0.2;
//         rotate.value = (gesture.dx / width) * 15;
//       },
//       onPanResponderRelease: (_, gesture) => {
//         if (isNavigating) return;

//         scale.value = withSpring(1, { damping: 20 });

//         const isSwipeLeft = gesture.dx < -SWIPE_THRESHOLD;
//         const isSwipeRight = gesture.dx > SWIPE_THRESHOLD;
//         const velocity = Math.abs(gesture.vx);

//         if (isSwipeRight && currentMemoryIndex > 0 && velocity > 0.3) {
//           // Swipe right - previous
//           translateX.value = withTiming(width * 1.2, { duration: 200 });
//           opacity.value = withTiming(0, { duration: 150 }, (finished) => {
//             if (finished) {
//               runOnJS(handleNavigation)("prev");
//             }
//           });
//         } else if (
//           isSwipeLeft &&
//           currentMemoryIndex < memories.length - 1 &&
//           velocity > 0.3
//         ) {
//           // Swipe left - next
//           translateX.value = withTiming(-width * 1.2, { duration: 200 });
//           opacity.value = withTiming(0, { duration: 150 }, (finished) => {
//             if (finished) {
//               runOnJS(handleNavigation)("next");
//             }
//           });
//         } else {
//           // Return to original position
//           translateX.value = withSpring(0, { damping: 20 });
//           translateY.value = withSpring(0, { damping: 20 });
//           rotate.value = withSpring(0, { damping: 20 });
//         }
//       },
//     })
//   ).current;

//   // FIXED useEffect for memory changes
//   useEffect(() => {
//     console.log(
//       `📝 Memory changed to index: ${currentMemoryIndex}, ID: ${memoizedCurrentMemory?.$id}`
//     );

//     // Cancel any ongoing animations
//     cancelAnimation(translateX);
//     cancelAnimation(translateY);
//     cancelAnimation(rotate);
//     cancelAnimation(opacity);
//     cancelAnimation(scale);

//     // Reset values
//     translateX.value = 0;
//     translateY.value = 0;
//     rotate.value = 0;
//     scale.value = 0.8;
//     opacity.value = 0;
//     setIsImageLoaded(false);

//     // Animate in with delay
//     InteractionManager.runAfterInteractions(() => {
//       opacity.value = withTiming(1, { duration: 300 });
//       scale.value = withSpring(1, { damping: 15 });
//     });

//     // Preload after animation
//     const preloadDelay = setTimeout(() => {
//       preloadImages();
//     }, 300);

//     return () => {
//       clearTimeout(preloadDelay);
//     };
//   }, [currentMemoryIndex, memoizedCurrentMemory?.$id]);

//   // Reset edit button when memory changes
//   useEffect(() => {
//     setShowEditButton(false);
//   }, [currentMemoryIndex]);

//   // Cleanup
//   useEffect(() => {
//     return () => {
//       if (navigationTimeoutRef.current) {
//         clearTimeout(navigationTimeoutRef.current);
//       }
//     };
//   }, []);

//   const handleImagePress = useCallback(() => {
//     if (isNavigating) return;
//     setShowEditButton(!showEditButton);
//   }, [showEditButton, isNavigating]);

//   const handleEditPress = useCallback(() => {
//     if (memoizedCurrentMemory?.$id) {
//       router.push(`/edit-memory/${memoizedCurrentMemory.$id}`);
//     }
//   }, [memoizedCurrentMemory?.$id, router]);

//   const cardAnimatedStyle = useAnimatedStyle(() => ({
//     transform: [
//       { translateX: translateX.value },
//       { translateY: translateY.value },
//       { scale: scale.value },
//       { rotate: `${rotate.value}deg` },
//     ],
//     opacity: opacity.value,
//   }));

//   if (!memoizedCurrentMemory) {
//     return (
//       <View className="flex-1 bg-black items-center justify-center">
//         <Text className="text-white text-lg">Žiadne spomienky</Text>
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1 bg-black">
//       <StatusBar
//         translucent
//         backgroundColor="transparent"
//         barStyle="light-content"
//       />
//       <LinearGradient
//         colors={["#000000", "#0a0a0a", "#000000"]}
//         locations={[0, 0.5, 1]}
//         className="absolute inset-0"
//       />

//       {/* Header */}
//       <Animated.View
//         entering={FadeInDown.delay(300).duration(600)}
//         className="absolute top-0 left-0 right-0 z-50"
//       >
//         <SafeAreaView>
//           <View className="flex-row items-center justify-between px-6 pt-4">
//             <TouchableOpacity
//               onPress={onBack}
//               className="bg-white/10 rounded-full p-3.5"
//             >
//               <ArrowLeftIcon size={18} color="white" />
//             </TouchableOpacity>

//             <View className="flex-row items-center space-x-2 bg-white/10 rounded-full px-4 py-2">
//               <SparklesIcon size={14} color="white" opacity={0.7} />
//               <Text className="text-white/80 text-sm font-light">
//                 {currentMemoryIndex + 1} z {memories.length}
//               </Text>
//             </View>
//           </View>
//         </SafeAreaView>
//       </Animated.View>

//       {/* Main Content */}
//       <View className="flex-1 items-center justify-center">
//         <Animated.View
//           {...panResponder.panHandlers}
//           style={[
//             {
//               width: CARD_WIDTH,
//               height: CARD_HEIGHT,
//               maxWidth: 400,
//               maxHeight: 600,
//             },
//             cardAnimatedStyle,
//           ]}
//         >
//           <View className="flex-1 bg-white rounded-3xl p-4">
//             <TouchableOpacity
//               activeOpacity={0.9}
//               onPress={handleImagePress}
//               className="flex-1 rounded-2xl overflow-hidden bg-gray-100 relative"
//             >
//               {/* Loading Indicator */}
//               {!isImageLoaded && (
//                 <View className="absolute inset-0 bg-gray-100 items-center justify-center z-10">
//                   <ActivityIndicator size="large" color="#8B5CF6" />
//                 </View>
//               )}

//               {/* Main Image - CRITICAL: Added key prop */}
//               {memoizedCurrentMemory.imageUrl ? (
//                 <Image
//                   key={memoizedCurrentMemory.$id} // FORCE RE-RENDER
//                   source={{ uri: memoizedCurrentMemory.imageUrl }}
//                   style={{ width: "100%", height: "100%" }}
//                   contentFit="contain"
//                   transition={200}
//                   onLoad={() => setIsImageLoaded(true)}
//                   onError={() => setIsImageLoaded(true)}
//                   cachePolicy="memory-disk"
//                   priority="high"
//                 />
//               ) : (
//                 <View className="w-full h-full bg-white items-center justify-center">
//                   <HeartIcon size={48} color="#e4e4e7" />
//                 </View>
//               )}

//               {/* Edit Button Overlay */}
//               {showEditButton && isImageLoaded && (
//                 <Animated.View
//                   entering={FadeIn.duration(300)}
//                   exiting={FadeOut.duration(200)}
//                   className="absolute inset-0 bg-black/40 items-center justify-center"
//                 >
//                   <TouchableOpacity
//                     onPress={handleEditPress}
//                     className="bg-gray-200/25 rounded-2xl px-6 py-3 flex-row items-center space-x-3"
//                     style={{
//                       shadowColor: "#8B5CF6",
//                       shadowOffset: { width: 0, height: 8 },
//                       shadowOpacity: 0.5,
//                       shadowRadius: 16,
//                       elevation: 10,
//                     }}
//                   >
//                     <PencilIcon size={24} color="white" />
//                     <Text className="text-white font-bold text-lg">
//                       Upraviť
//                     </Text>
//                   </TouchableOpacity>

//                   <Animated.View
//                     entering={FadeIn.delay(500).duration(600)}
//                     className="absolute bottom-6 left-0 right-0"
//                   >
//                     <Text className="text-white/70 text-center text-sm">
//                       Ťukni pre skrytie
//                     </Text>
//                   </Animated.View>
//                 </Animated.View>
//               )}

//               {/* Tap hint */}
//               {!showEditButton && isImageLoaded && !isNavigating && (
//                 <Animated.View
//                   entering={FadeIn.delay(1200).duration(800)}
//                   className="absolute top-4 right-4"
//                 >
//                   <View className="bg-black/30 rounded-full px-3 py-1.5">
//                     <Text className="text-white/80 text-xs font-light">
//                       Ťukni pre úpravu
//                     </Text>
//                   </View>
//                 </Animated.View>
//               )}
//             </TouchableOpacity>

//             {/* Memory Info */}
//             <View className="mt-4 px-2">
//               <Text className="text-gray-900 text-xl font-bold mb-2">
//                 {memoizedCurrentMemory.title}
//               </Text>
//               <View className="flex-row justify-between items-center">
//                 <Text className="text-gray-500 text-sm font-light">
//                   {formatDate(memoizedCurrentMemory.date)}
//                 </Text>
//                 {memoizedCurrentMemory.location && (
//                   <View className="flex-row items-center">
//                     <MapPinIcon size={12} color="#9ca3af" />
//                     <Text className="text-gray-500 text-sm font-light ml-1">
//                       {memoizedCurrentMemory.location}
//                     </Text>
//                   </View>
//                 )}
//               </View>
//             </View>
//           </View>
//         </Animated.View>

//         {/* Navigation Hints - only show when not navigating */}
//         {!showEditButton && !isNavigating && (
//           <>
//             {currentMemoryIndex > 0 && (
//               <Animated.View
//                 entering={FadeIn.delay(1000).duration(800)}
//                 className="absolute left-4"
//                 style={{ opacity: 0.4 }}
//               >
//                 <View className="bg-white/10 rounded-full p-2">
//                   <ArrowLeftIcon size={16} color="white" />
//                 </View>
//               </Animated.View>
//             )}

//             {currentMemoryIndex < memories.length - 1 && (
//               <Animated.View
//                 entering={FadeIn.delay(1000).duration(800)}
//                 className="absolute right-4"
//                 style={{ opacity: 0.4 }}
//               >
//                 <View className="bg-white/10 rounded-full p-2 rotate-180">
//                   <ArrowLeftIcon size={16} color="white" />
//                 </View>
//               </Animated.View>
//             )}
//           </>
//         )}
//       </View>

//       {/* Progress Dots */}
//       <View className="absolute bottom-16 left-0 right-0">
//         <View className="flex-row justify-center space-x-2">
//           {memories.map((_, index) => (
//             <Animated.View
//               key={index}
//               entering={FadeIn.delay(600 + index * 50).duration(400)}
//               className={`h-1.5 rounded-full transition-all ${
//                 index === currentMemoryIndex
//                   ? "w-6 bg-white"
//                   : "w-1.5 bg-white/30"
//               }`}
//             />
//           ))}
//         </View>
//       </View>
//     </View>
//   );
// };

// export default PolaroidMemoryView;
