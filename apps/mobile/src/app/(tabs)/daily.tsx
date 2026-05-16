import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
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
      <Text className="mb-[24px] text-[32px] font-black text-fg">
        Песен на деня
      </Text>
      {error ? (
        <Text className="text-danger">{error}</Text>
      ) : !data ? (
        <Text className="mt-[4px] text-[15px] text-muted">
          Днес няма съдържание. Върни се утре!
        </Text>
      ) : (
        <View className="rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px]">
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
        </View>
      )}
    </ScrollView>
  );
}
