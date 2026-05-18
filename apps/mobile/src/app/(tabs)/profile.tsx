import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useToast } from "@/components/toast";
import { getProgress, type Progress } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { getItem, setItem } from "@/lib/secure-storage";
import { colors } from "@/lib/theme";

const SEEN_BADGES_KEY = "meloman.seenBadges";

// Toast any badge that wasn't present last time progress was read.
// First ever read just records a baseline so we don't announce
// badges the user already had.
async function announceNewBadges(
  badges: { slug: string; name: string }[],
  showToast: (m: string) => void
): Promise<void> {
  const raw = await getItem(SEEN_BADGES_KEY);
  const current = badges.map((b) => b.slug);
  if (raw === null) {
    await setItem(SEEN_BADGES_KEY, JSON.stringify(current));
    return;
  }
  let seen: string[] = [];
  try {
    seen = JSON.parse(raw) as string[];
  } catch {
    seen = [];
  }
  const fresh = badges.filter((b) => !seen.includes(b.slug));
  if (fresh.length > 0) {
    showToast(
      fresh.length === 1
        ? `Спечели значка: ${fresh[0].name}`
        : `Спечели нови значки: ${fresh.map((b) => b.name).join(", ")}`
    );
  }
  await setItem(SEEN_BADGES_KEY, JSON.stringify(current));
}

export default function ProfileScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [state, setState] = useState<Progress["progress"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const token = await getToken();
        if (!active) return;
        if (!token) {
          setSignedIn(false);
          setLoading(false);
          return;
        }
        setSignedIn(true);
        try {
          const r = await getProgress();
          if (!active) return;
          setState(r.progress);
          await announceNewBadges(r.progress.badges, showToast);
        } catch {
          if (active) setState(null);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [showToast])
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }

  if (!signedIn) {
    return (
      <View className="flex-1 items-center justify-center gap-[16px] bg-bg p-[24px] pb-[120px]">
        <Text className="text-[14px] text-muted">
          Влез, за да видиш профила си.
        </Text>
        <Pressable
          className="rounded-[14px] bg-accent px-[24px] py-[14px]"
          onPress={() => router.push("/login")}
        >
          <Text className="font-extrabold text-bg">Вход</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg p-[24px] pb-[120px]">
      <Text className="text-[32px] font-black text-fg">Профил</Text>
      <View className="mt-[24px] flex-row gap-[16px]">
        <View className="flex-1 items-center rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px]">
          <Text className="text-[36px] font-black text-fg">
            {state?.streak ?? 0}
          </Text>
          <Text className="text-[14px] text-muted">Поредица</Text>
        </View>
        <View className="flex-1 items-center rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px]">
          <Text className="text-[36px] font-black text-fg">
            {state?.totalXp ?? 0}
          </Text>
          <Text className="text-[14px] text-muted">Общо XP</Text>
        </View>
      </View>
      <Text className="mb-[8px] mt-[40px] text-[20px] font-extrabold text-fg">
        Значки
      </Text>
      {state && state.badges.length > 0 ? (
        state.badges.map((b) => (
          <Text key={b.slug} className="mt-[4px] text-[15px] text-fg">
            • {b.name}
          </Text>
        ))
      ) : (
        <Text className="text-[14px] text-muted">Все още нямаш значки.</Text>
      )}
      <Pressable
        className="mt-[40px] items-center rounded-[14px] border border-border-strong py-[14px]"
        onPress={async () => {
          await clearToken();
          router.replace("/(tabs)");
        }}
      >
        <Text className="font-semibold text-fg">Изход</Text>
      </Pressable>
    </View>
  );
}
