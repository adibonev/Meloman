import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { listStories, type StoryListItem } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";

export default function StoriesScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listStories()
      .then((r) => setStories(r.stories))
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

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={stories}
      keyExtractor={(s) => s.slug}
      contentContainerStyle={{ padding: spacing.md }}
      ListEmptyComponent={
        <Text style={styles.empty}>Все още няма публикувани истории.</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/story/${item.slug}`)}
        >
          <Text style={styles.title}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          ) : null}
          <Text style={styles.meta}>
            {item.artistName ? `${item.artistName} · ` : ""}
            {item.readingTimeMinutes} мин четене
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: { color: colors.fg, fontSize: 20, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },
  meta: { color: colors.dim, fontSize: 12, marginTop: 8 },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  error: { color: colors.danger, textAlign: "center" },
});
