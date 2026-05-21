import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { SpotifyIcon, YouTubeIcon } from "@/components/brand-icons";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { getDailyToday, type DailyToday } from "@/lib/api";
import { colors } from "@/lib/theme";

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
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }

  const payload = (data?.payload ?? {}) as Record<string, string>;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
    >
      <View className="mb-[24px] flex-row items-center justify-between">
        <Text className="text-[32px] font-black text-fg">Песен на деня</Text>
        <Link href="/daily-archive" asChild>
          <Pressable>
            <Text className="text-[14px] font-semibold text-accent">
              Архив →
            </Text>
          </Pressable>
        </Link>
      </View>
      {error ? (
        <Text className="text-danger">{error}</Text>
      ) : !data ? (
        <Text className="mt-[4px] text-[15px] text-muted">
          Днес няма съдържание. Върни се утре!
        </Text>
      ) : (
        <View className="rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px]">
          {(() => {
            // song_of_day → albumCoverUrl, mystery_artist →
            // blurredImageUrl (same fields the web daily page reads).
            const imageUrl =
              data.contentType === "song_of_day"
                ? payload.albumCoverUrl
                : payload.blurredImageUrl;
            return imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                resizeMode="cover"
                style={{
                  width: "100%",
                  aspectRatio: 1,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              />
            ) : null;
          })()}
          <Text className="text-[12px] font-bold uppercase tracking-[2px] text-accent">
            {data.contentType === "song_of_day"
              ? "Песен на деня"
              : "Мистериозен артист"}
          </Text>
          <Text className="mt-[8px] text-[26px] font-extrabold text-fg">
            {payload.title ?? payload.name ?? "—"}
          </Text>
          {payload.artist ? (
            <Text className="mt-[4px] text-[15px] text-muted">
              {payload.artist}
            </Text>
          ) : null}
          {payload.story ? (
            <Text className="mt-[16px] text-[15px] leading-[22px] text-fg">
              {payload.story}
            </Text>
          ) : null}
          {payload.spotifyUri || payload.youtubeUrl ? (
            <View className="mt-[16px] flex-row flex-wrap gap-[12px]">
              {payload.spotifyUri ? (
                <Pressable
                  onPress={() => Linking.openURL(payload.spotifyUri)}
                  className="flex-row items-center gap-[8px] rounded-[10px] border border-border-strong px-[16px] py-[10px]"
                >
                  <SpotifyIcon size={18} />
                  <Text className="text-[14px] font-semibold text-fg">
                    Spotify
                  </Text>
                </Pressable>
              ) : null}
              {payload.youtubeUrl ? (
                <Pressable
                  onPress={() => Linking.openURL(payload.youtubeUrl)}
                  className="flex-row items-center gap-[8px] rounded-[10px] border border-border-strong px-[16px] py-[10px]"
                >
                  <YouTubeIcon size={18} />
                  <Text className="text-[14px] font-semibold text-fg">
                    YouTube
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}
