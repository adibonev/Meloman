import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { listEvents, type EventItem } from "@/lib/api";
import { colors } from "@/lib/theme";

// Mirrors the web /events "Как работи куизът" copy.
const QUIZ_HOW_STEPS = [
  "Водещият стартира играта",
  "Играчите влизат с код",
  "Отговорите се дават през телефон",
  "Класирането се обновява след рундовете",
];

const MEDALS = ["🥇", "🥈", "🥉"];

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
      {e.podium && e.podium.length > 0 && (
        <View className="mt-[8px] gap-[2px]">
          {e.podium.map((p, i) => (
            <Text key={p.name} className="text-[14px] text-fg">
              {MEDALS[i]} {p.emoji} {p.name} — {p.score}
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}

export default function EventsScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
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

  function enterCode() {
    const c = code.trim().toUpperCase();
    if (c.length < 4) {
      setError("Въведи валиден код.");
      return;
    }
    setError(null);
    router.push({ pathname: "/play", params: { code: c } });
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
    >
      <Text className="text-[32px] font-black text-fg">Събития</Text>
      <Text className="mt-[4px] mb-[24px] text-[15px] text-muted">
        Живи музикални куизове на Meloman.
      </Text>

      {/* Join by code — mirrors the web /events join box. */}
      <View className="mb-[24px] rounded-[14px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px]">
        <Text className="mb-[12px] text-[12px] font-bold uppercase tracking-[2px] text-accent">
          Имаш код за куиз?
        </Text>
        <View className="flex-row gap-[8px]">
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Код (напр. MELO42)"
            placeholderTextColor={colors.dim}
            autoCapitalize="characters"
            className="flex-1 rounded-[12px] border border-border-strong p-[14px] text-[16px] tracking-[3px] text-fg"
            onSubmitEditing={enterCode}
          />
          <Pressable
            className="items-center justify-center rounded-[12px] bg-accent px-[20px]"
            onPress={enterCode}
          >
            <Text className="text-[16px] font-extrabold text-bg">Влез</Text>
          </Pressable>
        </View>

        <View className="mt-[16px] border-t border-border-strong pt-[16px]">
          <Text className="mb-[12px] text-[12px] font-bold uppercase tracking-[2px] text-accent">
            Как работи куизът
          </Text>
          {QUIZ_HOW_STEPS.map((step, i) => (
            <View key={step} className="mb-[6px] flex-row gap-[8px]">
              <Text className="font-black text-accent">{i + 1}.</Text>
              <Text className="flex-1 text-[15px] text-fg">{step}</Text>
            </View>
          ))}
        </View>
      </View>

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
