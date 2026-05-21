import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { listEvents, type EventItem } from "@/lib/api";
import { colors } from "@/lib/theme";

// Numeric date+time, locale-independent (Hermes Intl month names aren't
// guaranteed): e.g. "21.05.2026, 20:00".
function fmt(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}, ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

function EventCard({
  e,
  onPress,
}: {
  e: EventItem;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className="mb-[12px] rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px]"
      onPress={onPress}
      disabled={!onPress}
    >
      <Text className="text-[18px] font-extrabold text-fg">
        {e.quizTitle}
        {e.bucket === "live" ? "  · НА ЖИВО" : ""}
      </Text>
      <Text className="mt-[4px] text-[14px] text-muted">
        {fmt(e.startMs)}
        {e.venue ? ` · ${e.venue}` : ""}
      </Text>
      <Text className="mt-[2px] text-[13px] text-dim">Водещ: {e.host}</Text>
    </Pressable>
  );
}

export default function EventsScreen() {
  const router = useRouter();
  const [data, setData] = useState<{
    upcoming: EventItem[];
    past: EventItem[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEvents()
      .then(setData)
      .catch((e) => setError(String((e as Error).message ?? e)));
  }, []);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-[24px]">
        <Text className="text-center text-danger">{error}</Text>
      </View>
    );
  }
  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
    >
      <Text className="mb-[16px] text-[32px] font-black text-fg">Събития</Text>

      <Pressable
        className="mb-[24px] items-center rounded-[14px] bg-accent py-[16px]"
        onPress={() => router.push("/play")}
      >
        <Text className="text-[16px] font-extrabold text-bg">
          Имаш код? Влез в куиз
        </Text>
      </Pressable>

      <Text className="mb-[8px] text-[12px] font-bold uppercase tracking-[2px] text-muted">
        Предстоящи
      </Text>
      {data.upcoming.length === 0 ? (
        <Text className="mb-[24px] text-[14px] text-muted">
          Няма предстоящи събития.
        </Text>
      ) : (
        data.upcoming.map((e) => (
          <EventCard key={e.id} e={e} onPress={() => router.push("/play")} />
        ))
      )}

      <Text className="mb-[8px] mt-[16px] text-[12px] font-bold uppercase tracking-[2px] text-muted">
        Минали
      </Text>
      {data.past.length === 0 ? (
        <Text className="text-[14px] text-muted">Все още няма минали.</Text>
      ) : (
        data.past.map((e) => <EventCard key={e.id} e={e} />)
      )}
    </ScrollView>
  );
}
