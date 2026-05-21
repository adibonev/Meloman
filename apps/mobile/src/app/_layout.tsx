import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ToastProvider } from "@/components/toast";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <ToastProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.fg,
          headerTitleStyle: { fontWeight: "800" },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Вход" }} />
        <Stack.Screen name="register" options={{ title: "Регистрация" }} />
        <Stack.Screen name="play" options={{ title: "Влез в куиз" }} />
        <Stack.Screen name="events" options={{ title: "Събития" }} />
        <Stack.Screen name="about" options={{ title: "За нас" }} />
        <Stack.Screen name="daily-archive" options={{ title: "Архив" }} />
        <Stack.Screen name="story/[slug]" options={{ title: "История" }} />
      </Stack>
    </ToastProvider>
  );
}
