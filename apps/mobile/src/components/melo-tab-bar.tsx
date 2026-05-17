import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";

// Short tab labels (the screen header keeps the full name).
const LABELS: Record<string, string> = {
  index: "Начало",
  stories: "Истории",
  daily: "Песен",
  profile: "Профил",
};

/**
 * Floating, centred pill tab bar (owner request: "tabs at the bottom,
 * centred, like little buttons"). Active pill = gold, matching the web
 * theme. NativeWind className (CLAUDE.md §2.2).
 */
export function MeloTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View
      className="absolute bottom-[26px] left-0 right-0 items-center"
      pointerEvents="box-none"
    >
      <View className="flex-row gap-[4px] rounded-full border border-border-strong bg-card p-[6px]">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = LABELS[route.name] ?? route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              className={`rounded-full px-[18px] py-[11px] ${
                focused ? "bg-accent" : ""
              }`}
            >
              <Text
                className={`text-[13px] font-bold ${
                  focused ? "text-bg" : "text-muted"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
