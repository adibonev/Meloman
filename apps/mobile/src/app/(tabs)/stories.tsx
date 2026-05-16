import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { listStories, type StoryListItem } from "@/lib/api";
import { colors } from "@/lib/theme";

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
      <View className="flex-1 items-center justify-center bg-bg p-[24px]">
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-[24px]">
        <Text className="text-center text-danger">{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-bg"
      data={stories}
      keyExtractor={(s) => s.slug}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      ListEmptyComponent={
        <Text className="mt-[40px] text-center text-muted">
          Все още няма публикувани истории.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          className="mb-[16px] rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px]"
          onPress={() => router.push(`/story/${item.slug}`)}
        >
          <Text className="text-[20px] font-extrabold text-fg">
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text className="mt-[4px] text-[14px] text-muted">
              {item.subtitle}
            </Text>
          ) : null}
          <Text className="mt-[8px] text-[12px] text-dim">
            {item.artistName ? `${item.artistName} · ` : ""}
            {item.readingTimeMinutes} мин четене
          </Text>
        </Pressable>
      )}
    />
  );
}
