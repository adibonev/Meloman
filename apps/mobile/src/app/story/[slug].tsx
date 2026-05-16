import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { getStory, type StoryDetail } from "@/lib/api";
import { colors } from "@/lib/theme";

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
      <View className="flex-1 items-center justify-center bg-bg p-[24px]">
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }

  if (error || !story) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-[24px]">
        <Text className="text-center text-danger">
          {error ?? "Историята не е намерена."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 24 }}
    >
      <Text className="text-[32px] font-black tracking-[0.5px] text-fg">
        {story.title}
      </Text>
      {story.subtitle ? (
        <Text className="mt-[8px] text-[17px] text-muted">
          {story.subtitle}
        </Text>
      ) : null}
      <Text className="mt-[16px] text-[12px] font-bold uppercase tracking-[1.5px] text-accent">
        {story.artistName ? `${story.artistName} · ` : ""}
        {story.readingTimeMinutes} мин четене
      </Text>
      <Text className="mt-[24px] text-[17px] leading-[27px] text-fg">
        {htmlToText(story.body)}
      </Text>
    </ScrollView>
  );
}
