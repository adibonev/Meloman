import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

// Short tab labels (the screen header keeps the full name).
const LABELS: Record<string, string> = {
  index: "Начало",
  stories: "Истории",
  daily: "Песен",
  profile: "Профил",
};

/**
 * Floating, centred pill tab bar (owner request: "tabs at the bottom,
 * centred, like little buttons"). Pure RN primitives — no extra deps so
 * the EAS build stays clean. Active pill = gold, matching the web theme.
 */
export function MeloTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
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
              style={[styles.pill, focused && styles.pillActive]}
            >
              <Text
                numberOfLines={1}
                style={[styles.label, focused && styles.labelActive]}
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

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 26,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: 999,
    padding: 6,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  pillActive: { backgroundColor: colors.accent },
  label: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  labelActive: { color: colors.bg },
});
