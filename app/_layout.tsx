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
        <Stack.Screen name="create" />
        <Stack.Screen
          name="scrapbook/[id]"
          options={{
            headerShown: true,
            headerTitle: "Scrapbook",
            headerStyle: {
              backgroundColor: "#000000",
              borderBottomWidth: 1,
              borderBottomColor: "#1f2937",
            },
            headerTintColor: "white",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerBackTitle: "Back",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
