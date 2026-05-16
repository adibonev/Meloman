import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createTeam,
  getPlayState,
  joinTeam,
  submitAnswer,
  type PlayState,
  type SubmitAnswerPayload,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getDeviceId } from "@/lib/device";
import { colors, spacing } from "@/lib/theme";

const POLL_MS = 2500;

export default function PlayScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [joinedCode, setJoinedCode] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [state, setState] = useState<PlayState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getToken().then((t) => {
      setSignedIn(!!t);
      setAuthChecked(true);
    });
  }, []);

  // Poll the single play-state endpoint while a code is active. This is the
  // mobile realtime channel (no Pusher client in RN) + the resilience
  // fallback — the server is always the source of truth.
  useEffect(() => {
    if (!joinedCode) return;
    let alive = true;
    async function tick() {
      try {
        const s = await getPlayState(joinedCode!);
        if (alive) {
          setState(s);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(String((e as Error).message ?? e));
      }
    }
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [joinedCode]);

  const refresh = useCallback(async () => {
    if (!joinedCode) return;
    try {
      setState(await getPlayState(joinedCode));
    } catch {
      /* next poll retries */
    }
  }, [joinedCode]);

  if (!authChecked) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!signedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.kicker}>Меломан</Text>
        <Text style={styles.muted}>Влез в профила си, за да играеш.</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.primaryText}>Вход</Text>
        </Pressable>
      </View>
    );
  }

  // Step 1 — enter the join code.
  if (!joinedCode) {
    return (
      <View style={styles.screen}>
        <Text style={styles.kicker}>Live quiz</Text>
        <Text style={styles.h1}>Влез в куиз</Text>
        <Text style={styles.muted}>
          Въведи кода, който водещият показва на екрана.
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="MELO42"
          placeholderTextColor={colors.dim}
          autoCapitalize="characters"
          style={styles.codeInput}
        />
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            if (code.trim().length < 4) {
              setError("Въведи валиден код.");
              return;
            }
            setError(null);
            setState(null);
            setJoinedCode(code.trim().toUpperCase());
          }}
        >
          <Text style={styles.primaryText}>Влез</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (!state) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  // Step 2 — joined a code but not in a team yet.
  if (!state.myTeam) {
    return (
      <TeamPicker
        state={state}
        busy={busy}
        onCreate={async (name) => {
          setBusy(true);
          setError(null);
          try {
            const fp = await getDeviceId();
            await createTeam(joinedCode, name, fp);
            await refresh();
          } catch (e) {
            setError(String((e as Error).message ?? e));
          } finally {
            setBusy(false);
          }
        }}
        onJoin={async (teamId) => {
          setBusy(true);
          setError(null);
          try {
            const fp = await getDeviceId();
            await joinTeam(joinedCode, teamId, fp);
            await refresh();
          } catch (e) {
            setError(String((e as Error).message ?? e));
          } finally {
            setBusy(false);
          }
        }}
        error={error}
      />
    );
  }

  // Step 3 — in a team: lobby / question / reveal / finished.
  return (
    <Lobby
      state={state}
      busy={busy}
      error={error}
      onSubmit={async (payload) => {
        setBusy(true);
        setError(null);
        try {
          await submitAnswer(joinedCode, payload);
          await refresh();
        } catch (e) {
          setError(String((e as Error).message ?? e));
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

function TeamPicker({
  state,
  onCreate,
  onJoin,
  busy,
  error,
}: {
  state: PlayState;
  onCreate: (name: string) => void;
  onJoin: (teamId: string) => void;
  busy: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");
  if (!state.joinable) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>
          Този куиз вече е започнал или е приключил.
        </Text>
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <Text style={styles.kicker}>Избери отбор</Text>
      <Text style={styles.h2}>Създай отбор</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Име на отбора"
        placeholderTextColor={colors.dim}
        style={styles.input}
      />
      <Pressable
        style={[styles.primaryBtn, busy && styles.disabled]}
        disabled={busy}
        onPress={() => name.trim().length >= 2 && onCreate(name.trim())}
      >
        <Text style={styles.primaryText}>Създай</Text>
      </Pressable>

      {state.teams.length > 0 && (
        <>
          <Text style={styles.h2}>Или се присъедини</Text>
          {state.teams.map((tm) => (
            <Pressable
              key={tm.id}
              style={[styles.teamRow, busy && styles.disabled]}
              disabled={busy}
              onPress={() => onJoin(tm.id)}
            >
              <Text style={styles.teamEmoji}>{tm.avatarEmoji}</Text>
              <Text style={styles.teamName}>{tm.name}</Text>
            </Pressable>
          ))}
        </>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

function useCountdown(state: PlayState): number | null {
  const [now, setNow] = useState(Date.now());
  const offset = useRef(0);
  offset.current = state.serverNowMs - Date.now();
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (state.timerEndsAtMs === null || state.status !== "active") return null;
  const remaining = Math.ceil(
    (state.timerEndsAtMs - (now + offset.current)) / 1000
  );
  return Math.max(0, remaining);
}

function Lobby({
  state,
  onSubmit,
  busy,
  error,
}: {
  state: PlayState;
  onSubmit: (p: SubmitAnswerPayload) => void;
  busy: boolean;
  error: string | null;
}) {
  const team = state.myTeam!;
  const seconds = useCountdown(state);
  const q = state.question;
  const canSubmit =
    state.status === "active" &&
    team.isCaptain &&
    !state.hasSubmitted &&
    !state.isEliminated;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <Text style={styles.kicker}>Твоят отбор</Text>
      <View style={styles.teamCard}>
        <Text style={styles.teamEmojiBig}>{team.avatarEmoji}</Text>
        <Text style={styles.teamNameBig}>{team.name}</Text>
        <Text style={styles.muted}>
          {team.isCaptain ? "Ти си капитан" : "Член"}
        </Text>
      </View>

      {state.status === "lobby" && (
        <Text style={styles.notice}>
          Изчакай водещия да започне. Само капитанът изпраща отговори.
        </Text>
      )}
      {state.status === "paused" && (
        <Text style={styles.notice}>
          ⏸ Пауза. Изчакай водещия да продължи.
        </Text>
      )}
      {state.status === "finished" && (
        <Text style={styles.notice}>
          Куизът приключи. Гледай екрана за класирането.
        </Text>
      )}
      {state.isEliminated && state.status !== "finished" && (
        <Text style={styles.notice}>
          Отборът не продължи в този кръг — само наблюдавате.
        </Text>
      )}

      {(state.status === "between_rounds" ||
        (state.status === "finished" && state.teams.length > 0)) && (
        <View>
          <Text style={styles.h2}>Класиране</Text>
          {state.teams.map((tm, i) => (
            <View key={tm.id} style={styles.lbRow}>
              <Text style={styles.lbRank}>{i + 1}</Text>
              <Text style={styles.teamEmoji}>{tm.avatarEmoji}</Text>
              <Text style={styles.lbName}>{tm.name}</Text>
              <Text style={styles.lbScore}>{tm.totalScore}</Text>
            </View>
          ))}
        </View>
      )}

      {q && (state.status === "active" || state.status === "reveal") && (
        <View style={styles.qCard}>
          <View style={styles.qHead}>
            <Text style={styles.qKicker}>
              {state.status === "active" ? "Въпрос" : "Отговор"}
            </Text>
            <Text style={styles.muted}>
              {seconds !== null ? `${seconds}s` : `${q.maxPoints} т.`}
            </Text>
          </View>
          <Text style={styles.qText}>{q.questionText}</Text>

          {q.questionType === "image_reveal" && q.signedImageUrl && (
            <Image
              source={{ uri: q.signedImageUrl }}
              style={styles.qImage}
              blurRadius={state.status === "reveal" ? 0 : 28}
              contentFit="cover"
            />
          )}

          {state.status === "active" &&
            canSubmit &&
            (q.questionType === "multiple_choice" ? (
              <MultipleChoice options={q.options} busy={busy} onPick={(i) => onSubmit({ questionType: "multiple_choice", optionIndex: i })} />
            ) : q.questionType === "lyric_blank" ? (
              <LyricBlanks count={q.blankCount} busy={busy} onSubmit={(a) => onSubmit({ questionType: "lyric_blank", lyricAnswers: a })} />
            ) : q.questionType === "decade" ? (
              <DecadeInput busy={busy} onSubmit={(d, y) => onSubmit({ questionType: "decade", decade: d, year: y })} />
            ) : (
              <TextAnswer
                busy={busy}
                onSubmit={(txt) =>
                  onSubmit({
                    questionType: q.questionType as
                      | "open_text"
                      | "audio"
                      | "image_reveal",
                    textAnswer: txt,
                  })
                }
              />
            ))}

          {state.status === "active" && !team.isCaptain && (
            <Text style={styles.muted}>
              Само капитанът може да изпрати отговор.
            </Text>
          )}
          {state.status === "active" &&
            state.hasSubmitted &&
            team.isCaptain && (
              <Text style={styles.okBanner}>Отговорът е изпратен ✓</Text>
            )}

          {state.status === "reveal" && (
            <View>
              {state.teamResult ? (
                <Text
                  style={
                    state.teamResult.isCorrect || state.teamResult.pointsAwarded > 0
                      ? styles.okBanner
                      : styles.wrongBanner
                  }
                >
                  {state.teamResult.isCorrect
                    ? "✓ Правилно!"
                    : state.teamResult.pointsAwarded > 0
                      ? "Частично"
                      : "✗ Грешен отговор"}
                  {`  +${state.teamResult.pointsAwarded} т.`}
                </Text>
              ) : null}
              {q.correctAnswerLabel ? (
                <Text style={styles.correct}>
                  Верен отговор: {q.correctAnswerLabel}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

function MultipleChoice({
  options,
  onPick,
  busy,
}: {
  options: string[];
  onPick: (i: number) => void;
  busy: boolean;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {options.map((opt, i) => (
        <Pressable
          key={`${opt}-${i}`}
          style={[styles.optionBtn, busy && styles.disabled]}
          disabled={busy}
          onPress={() => onPick(i)}
        >
          <Text style={styles.optionText}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function TextAnswer({
  onSubmit,
  busy,
}: {
  onSubmit: (t: string) => void;
  busy: boolean;
}) {
  const [v, setV] = useState("");
  return (
    <View style={{ gap: spacing.sm }}>
      <TextInput
        value={v}
        onChangeText={setV}
        placeholder="Твоят отговор"
        placeholderTextColor={colors.dim}
        style={styles.input}
        autoCapitalize="none"
      />
      <Pressable
        style={[styles.primaryBtn, busy && styles.disabled]}
        disabled={busy}
        onPress={() => v.trim() && onSubmit(v.trim())}
      >
        <Text style={styles.primaryText}>Изпрати</Text>
      </Pressable>
    </View>
  );
}

function LyricBlanks({
  count,
  onSubmit,
  busy,
}: {
  count: number;
  onSubmit: (a: string[]) => void;
  busy: boolean;
}) {
  const [vals, setVals] = useState<string[]>(
    Array.from({ length: Math.max(1, count) }, () => "")
  );
  return (
    <View style={{ gap: spacing.sm }}>
      {vals.map((val, i) => (
        <TextInput
          key={i}
          value={val}
          onChangeText={(t) =>
            setVals((prev) => prev.map((p, j) => (j === i ? t : p)))
          }
          placeholder={`Дума ${i + 1}`}
          placeholderTextColor={colors.dim}
          style={styles.input}
          autoCapitalize="none"
        />
      ))}
      <Pressable
        style={[styles.primaryBtn, busy && styles.disabled]}
        disabled={busy}
        onPress={() => vals.every((v) => v.trim()) && onSubmit(vals.map((v) => v.trim()))}
      >
        <Text style={styles.primaryText}>Изпрати</Text>
      </Pressable>
    </View>
  );
}

function DecadeInput({
  onSubmit,
  busy,
}: {
  onSubmit: (decade: number, year: number) => void;
  busy: boolean;
}) {
  const [decade, setDecade] = useState("");
  const [year, setYear] = useState("");
  return (
    <View style={{ gap: spacing.sm }}>
      <TextInput
        value={decade}
        onChangeText={setDecade}
        placeholder="Десетилетие (напр. 1980)"
        placeholderTextColor={colors.dim}
        keyboardType="number-pad"
        style={styles.input}
      />
      <TextInput
        value={year}
        onChangeText={setYear}
        placeholder="Точна година"
        placeholderTextColor={colors.dim}
        keyboardType="number-pad"
        style={styles.input}
      />
      <Pressable
        style={[styles.primaryBtn, busy && styles.disabled]}
        disabled={busy}
        onPress={() => {
          const d = Number(decade);
          const y = Number(year);
          if (Number.isFinite(d) && Number.isFinite(y) && d > 0 && y > 0) {
            onSubmit(d, y);
          }
        }}
      >
        <Text style={styles.primaryText}>Изпрати</Text>
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
    padding: spacing.lg,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  h1: { color: colors.fg, fontSize: 32, fontWeight: "900" },
  h2: {
    color: colors.fg,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  muted: { color: colors.muted, fontSize: 15, marginTop: 4 },
  notice: {
    color: colors.fg,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderLeftColor: colors.accent,
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 15,
    color: colors.fg,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 14,
    color: colors.fg,
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryText: { color: colors.bg, fontWeight: "800", fontSize: 16 },
  disabled: { opacity: 0.5 },
  error: { color: colors.danger, marginTop: spacing.md, textAlign: "center" },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  teamEmoji: { fontSize: 22 },
  teamName: { color: colors.fg, fontSize: 16, fontWeight: "700" },
  teamCard: {
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderLeftColor: colors.accent,
    borderLeftWidth: 3,
    borderRadius: 14,
    padding: spacing.lg,
    alignItems: "center",
  },
  teamEmojiBig: { fontSize: 48 },
  teamNameBig: {
    color: colors.fg,
    fontSize: 26,
    fontWeight: "900",
    marginTop: spacing.sm,
  },
  qCard: {
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderLeftColor: colors.accent,
    borderLeftWidth: 3,
    borderRadius: 14,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  qHead: { flexDirection: "row", justifyContent: "space-between" },
  qKicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  qText: { color: colors.fg, fontSize: 24, fontWeight: "900" },
  qImage: { width: "100%", aspectRatio: 1, borderRadius: 12 },
  optionBtn: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: spacing.md,
  },
  optionText: { color: colors.fg, fontSize: 16, fontWeight: "600" },
  okBanner: {
    color: "#0c1f12",
    backgroundColor: "#4ADE80",
    fontWeight: "800",
    textAlign: "center",
    padding: spacing.md,
    borderRadius: 12,
    overflow: "hidden",
  },
  wrongBanner: {
    color: colors.fg,
    backgroundColor: colors.danger,
    fontWeight: "800",
    textAlign: "center",
    padding: spacing.md,
    borderRadius: 12,
    overflow: "hidden",
  },
  correct: {
    color: colors.fg,
    marginTop: spacing.sm,
    textAlign: "center",
    fontWeight: "700",
  },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  lbRank: { color: colors.muted, fontWeight: "900", width: 22 },
  lbName: { color: colors.fg, flex: 1, fontWeight: "700" },
  lbScore: { color: colors.accent, fontWeight: "900" },
});
