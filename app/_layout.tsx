// Layout Component - app/_layout.js
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";

export default function Layout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />

        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="scrapbook/[id]"
          options={{
            headerShown: true,
            headerTitle: "Scrapbook",
            headerBackTitle: "Späť",
            headerTintColor: "#a855f7", // ← Fialová farba pre šípku aj text
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 20,
              color: "#ffffff",
            },
            headerStyle: {
              backgroundColor: "#000000",
              borderBottomWidth: 1,
              borderBottomColor: "#374151",
              elevation: 0,
              shadowOpacity: 0,
            },
            headerBackTitleStyle: {
              fontSize: 16,
              fontWeight: "600",
              color: "#a855f7", // ← Fialová farba pre "Späť" text
            },
            headerLeftContainerStyle: {
              paddingLeft: 16,
              backgroundColor: "rgba(255, 255, 255, 0.1)", // ← Priehľadné pozadie
              borderRadius: 24, // ← Zaoblené rohy
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.2)", // ← Jemný border
              marginLeft: 8,
              padding: 8,
            },
            headerTitleAlign: "center",
            headerPressColorAndroid: "#374151",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
