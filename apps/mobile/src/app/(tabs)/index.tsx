import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>
        Музикален куиз · истории · песен на деня
      </Text>
      <Text style={styles.logo}>MELOMAN</Text>
      <Text style={styles.tagline}>Музикален куиз и ежедневно забавление</Text>

      <View style={styles.actions}>
        <Link href="/play" asChild>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Влез в куиз</Text>
          </Pressable>
        </Link>
        <Link href="/login" asChild>
          <Pressable style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Вход</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    paddingBottom: 120,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  logo: {
    color: colors.fg,
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: 8,
  },
  tagline: {
    color: colors.muted,
    fontSize: 16,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  actions: { width: "100%", gap: spacing.md },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: colors.bg, fontSize: 16, fontWeight: "800" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryText: { color: colors.fg, fontSize: 16, fontWeight: "600" },
});
