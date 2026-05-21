import "../global.css";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text } from "react-native";
import { ToastProvider } from "@/components/toast";
import { colors } from "@/lib/theme";

// Explicit back control. Native shows a back arrow automatically, but the
// Expo web export renders the header without one, leaving pushed screens
// (e.g. /play) with no way back. Falls back to the home tab when there is
// no navigation history (deep link / direct load).
function HeaderBack() {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      hitSlop={12}
      style={{ paddingVertical: 4, paddingRight: 16 }}
    >
      <Text style={{ color: colors.fg, fontSize: 17, fontWeight: "700" }}>
        ‹ Назад
      </Text>
    </Pressable>
  );
}

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
          headerLeft: () => <HeaderBack />,
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
