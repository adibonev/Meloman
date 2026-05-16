import { Tabs } from "expo-router";
import { MeloTabBar } from "@/components/melo-tab-bar";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <MeloTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.fg,
        headerTitleStyle: { fontWeight: "800" },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Начало" }} />
      <Tabs.Screen name="stories" options={{ title: "Истории" }} />
      <Tabs.Screen name="daily" options={{ title: "Песен на деня" }} />
      <Tabs.Screen name="profile" options={{ title: "Профил" }} />
    </Tabs>
  );
}
