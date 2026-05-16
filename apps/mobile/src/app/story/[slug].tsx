import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getStory, type StoryDetail } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";

// Minimal HTML → text: the body is TipTap/HTML. React Native has no DOM,
// so strip tags for a readable plain-text view (good enough for the
// reader; rich rendering is a post-MVP polish item).
function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function StoryDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getStory(slug)
      .then((r) => setStory(r.story))
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }

  if (error || !story) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          {error ?? "Историята не е намерена."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <Text style={styles.title}>{story.title}</Text>
      {story.subtitle ? (
        <Text style={styles.subtitle}>{story.subtitle}</Text>
      ) : null}
      <Text style={styles.meta}>
        {story.artistName ? `${story.artistName} · ` : ""}
        {story.readingTimeMinutes} мин четене
      </Text>
      <Text style={styles.body}>{htmlToText(story.body)}</Text>
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
    padding: spacing.lg,
  },
  title: {
    color: colors.fg,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: { color: colors.muted, fontSize: 17, marginTop: spacing.sm },
  meta: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: spacing.md,
  },
  body: {
    color: colors.fg,
    fontSize: 17,
    lineHeight: 27,
    marginTop: spacing.lg,
  },
  error: { color: colors.danger, textAlign: "center" },
});
