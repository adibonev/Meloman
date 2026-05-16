import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>MELOMAN</Text>
      <Text style={styles.tagline}>Музикален quiz и daily entertainment</Text>

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
  },
  logo: {
    color: colors.fg,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 6,
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
    backgroundColor: colors.fg,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: { color: colors.fg, fontSize: 16, fontWeight: "600" },
});
