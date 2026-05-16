import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getDailyToday, type DailyToday } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";

export default function DailyScreen() {
  const [data, setData] = useState<DailyToday["daily"]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDailyToday()
      .then((r) => setData(r.daily))
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }

  const payload = (data?.payload ?? {}) as Record<string, string>;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
    >
      <Text style={styles.h1}>Песен на деня</Text>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !data ? (
        <Text style={styles.muted}>Днес няма съдържание. Върни се утре!</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.kicker}>
            {data.contentType === "song_of_day"
              ? "Песен на деня"
              : "Мистериозен артист"}
          </Text>
          <Text style={styles.title}>
            {payload.title ?? payload.name ?? "—"}
          </Text>
          {payload.artist ? (
            <Text style={styles.muted}>{payload.artist}</Text>
          ) : null}
          {payload.story ? (
            <Text style={styles.body}>{payload.story}</Text>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  h1: { color: colors.fg, fontSize: 32, fontWeight: "900", marginBottom: spacing.lg },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  title: {
    color: colors.fg,
    fontSize: 26,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  muted: { color: colors.muted, fontSize: 15, marginTop: 4 },
  body: { color: colors.fg, fontSize: 15, lineHeight: 22, marginTop: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderLeftColor: colors.accent,
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: spacing.md,
  },
  error: { color: colors.danger },
});
