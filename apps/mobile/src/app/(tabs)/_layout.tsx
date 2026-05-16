import { Tabs } from "expo-router";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.fg,
        headerTitleStyle: { fontWeight: "800" },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.fg,
        tabBarInactiveTintColor: colors.dim,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Начало" }} />
      <Tabs.Screen name="stories" options={{ title: "Истории" }} />
      <Tabs.Screen name="daily" options={{ title: "Всеки ден" }} />
      <Tabs.Screen name="profile" options={{ title: "Профил" }} />
    </Tabs>
  );
}
