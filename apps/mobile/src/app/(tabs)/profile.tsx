import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getProgress, type Progress } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { colors, spacing } from "@/lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
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
          if (active) setState(r.progress);
        } catch {
          if (active) setState(null);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }

  if (!signedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Влез, за да видиш профила си.</Text>
        <Pressable
          style={styles.btn}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.btnText}>Вход</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.h1}>Профил</Text>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{state?.streak ?? 0}</Text>
          <Text style={styles.muted}>Поредица</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{state?.totalXp ?? 0}</Text>
          <Text style={styles.muted}>Общо XP</Text>
        </View>
      </View>
      <Text style={styles.h2}>Значки</Text>
      {state && state.badges.length > 0 ? (
        state.badges.map((b) => (
          <Text key={b.slug} style={styles.badge}>
            • {b.name}
          </Text>
        ))
      ) : (
        <Text style={styles.muted}>Все още нямаш значки.</Text>
      )}
      <Pressable
        style={styles.signOut}
        onPress={async () => {
          await clearToken();
          router.replace("/(tabs)");
        }}
      >
        <Text style={styles.signOutText}>Изход</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  h1: { color: colors.fg, fontSize: 32, fontWeight: "900" },
  h2: {
    color: colors.fg,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  statNum: { color: colors.fg, fontSize: 36, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: 14 },
  badge: { color: colors.fg, fontSize: 15, marginTop: 4 },
  btn: {
    backgroundColor: colors.fg,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  btnText: { color: colors.bg, fontWeight: "700" },
  signOut: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutText: { color: colors.fg, fontWeight: "600" },
});
