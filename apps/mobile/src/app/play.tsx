import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
import { colors, quizPalette } from "@/lib/theme";
import { QrScanner } from "@/components/qr-scanner";

const POLL_MS = 2500;

// NativeWind className (CLAUDE.md §2.2). Values are exact px arbitrary
// values mapped 1:1 from the old StyleSheet so there is no visual
// change. `colors` stays for RN color props (placeholderTextColor,
// ActivityIndicator). Reused class strings are hoisted as constants.
const BTN_PRIMARY = "mt-[8px] items-center rounded-[14px] bg-accent py-[16px]";
const TXT_PRIMARY = "text-[16px] font-extrabold text-bg";
const FIELD =
  "rounded-[12px] border border-border-strong p-[14px] text-[16px] text-fg";
const MUTED = "mt-[4px] text-[15px] text-muted";
const CENTER =
  "flex-1 items-center justify-center gap-[16px] bg-bg p-[24px]";

export default function PlayScreen() {
  const router = useRouter();
  // Optional ?code= deep link (e.g. from the Events join box) prefills the
  // join field; the player still needs to be signed in to enter.
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(
    typeof params.code === "string" ? params.code.toUpperCase() : ""
  );
  const [joinedCode, setJoinedCode] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [state, setState] = useState<PlayState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);

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
      <View className={CENTER}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!signedIn) {
    return (
      <View className={CENTER}>
        <Image
          source={require("../../assets/images/meloman-logo-white.png")}
          style={{ width: 160, height: 160 }}
          contentFit="contain"
        />
        <Text className="text-[44px] font-black tracking-[8px] text-fg">
          МЕЛОМАН
        </Text>
        <Text className={`${MUTED} text-center`}>
          Влез в профила си, за да играеш.
        </Text>
        <Pressable
          className="mt-[16px] w-full items-center rounded-[16px] bg-accent py-[18px]"
          onPress={() => router.push("/login")}
        >
          <Text className="text-[18px] font-extrabold text-bg">Вход</Text>
        </Pressable>
      </View>
    );
  }

  // Step 1 — scan the QR or enter the join code.
  if (!joinedCode && scanning) {
    return (
      <QrScanner
        onCancel={() => setScanning(false)}
        onScanned={(scanned) => {
          setScanning(false);
          setError(null);
          setState(null);
          setJoinedCode(scanned);
        }}
      />
    );
  }

  if (!joinedCode) {
    return (
      <View className="flex-1 justify-center bg-bg p-[24px]">
        <Text className="text-center text-[32px] font-black text-fg">
          Влез в куиз
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="MELO42"
          placeholderTextColor={colors.dim}
          autoCapitalize="characters"
          autoFocus
          className="mb-[16px] mt-[24px] rounded-[12px] border border-border-strong p-[15px] text-center text-[22px] tracking-[6px] text-fg"
        />
        <Pressable
          className={BTN_PRIMARY}
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
          <Text className={TXT_PRIMARY}>Продължи</Text>
        </Pressable>
        <Pressable
          className="mt-[12px] items-center rounded-[14px] border border-border-strong py-[16px]"
          onPress={() => {
            setError(null);
            setScanning(true);
          }}
        >
          <Text className="text-[16px] font-extrabold text-fg">
            Сканирай QR
          </Text>
        </Pressable>
        <Text className="mt-[16px] text-center text-[15px] text-muted">
          Кодът е на екрана в заведението.
        </Text>
        {error ? (
          <Text className="mt-[16px] text-center text-danger">{error}</Text>
        ) : null}
      </View>
    );
  }

  if (!state) {
    return (
      <View className={CENTER}>
        <ActivityIndicator color={colors.accent} />
        {error ? (
          <Text className="mt-[16px] text-center text-danger">{error}</Text>
        ) : null}
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
      <View className={CENTER}>
        <Text className={MUTED}>
          Този куиз вече е започнал или е приключил.
        </Text>
      </View>
    );
  }
  return (
    <ScrollView
      className="flex-1 bg-bg p-[24px]"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text className="mb-[8px] text-[12px] font-bold uppercase tracking-[3px] text-accent">
        Избери отбор
      </Text>
      <Text className="mb-[8px] mt-[24px] text-[20px] font-extrabold text-fg">
        Създай отбор
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Име на отбора"
        placeholderTextColor={colors.dim}
        className={FIELD}
      />
      <Pressable
        className={`${BTN_PRIMARY} ${busy ? "opacity-50" : ""}`}
        disabled={busy}
        onPress={() => name.trim().length >= 2 && onCreate(name.trim())}
      >
        <Text className={TXT_PRIMARY}>Създай</Text>
      </Pressable>

      {state.teams.length > 0 && (
        <>
          <Text className="mb-[8px] mt-[24px] text-[20px] font-extrabold text-fg">
            Или се присъедини
          </Text>
          {state.teams.map((tm) => (
            <Pressable
              key={tm.id}
              className={`mt-[8px] flex-row items-center gap-[16px] rounded-[12px] border border-border-strong bg-card p-[16px] ${
                busy ? "opacity-50" : ""
              }`}
              disabled={busy}
              onPress={() => onJoin(tm.id)}
            >
              <Text className="text-[22px]">{tm.avatarEmoji}</Text>
              <Text className="text-[16px] font-bold text-fg">{tm.name}</Text>
            </Pressable>
          ))}
        </>
      )}
      {error ? (
        <Text className="mt-[16px] text-center text-danger">{error}</Text>
      ) : null}
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
  // Per-quiz theme, scoped to the running quiz screen (mirrors the web
  // [data-quiz-theme]). Applied to the screen background as the clear
  // signal; the full NativeWind re-skin is a documented follow-up.
  const palette = quizPalette(state.quizTheme);
  const canSubmit =
    state.status === "active" &&
    team.isCaptain &&
    !state.hasSubmitted &&
    !state.isEliminated;

  return (
    <ScrollView
      className="flex-1 p-[24px]"
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text className="mb-[8px] text-[12px] font-bold uppercase tracking-[3px] text-accent">
        Твоят отбор
      </Text>
      <View className="items-center rounded-[14px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[24px]">
        <Text className="text-[48px]">{team.avatarEmoji}</Text>
        <Text className="mt-[8px] text-[26px] font-black text-fg">
          {team.name}
        </Text>
        <Text className={MUTED}>
          {team.isCaptain ? "Ти си капитан" : "Член"}
        </Text>
      </View>

      {state.status === "lobby" && (
        <Text className="mt-[24px] rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px] text-fg">
          Изчакай водещия да започне. Само капитанът изпраща отговори.
        </Text>
      )}
      {state.status === "paused" && (
        <Text className="mt-[24px] rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px] text-fg">
          ⏸ Пауза. Изчакай водещия да продължи.
        </Text>
      )}
      {state.status === "finished" && (
        <Text className="mt-[24px] rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px] text-fg">
          Куизът приключи. Гледай екрана за класирането.
        </Text>
      )}
      {state.isEliminated && state.status !== "finished" && (
        <Text className="mt-[24px] rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[16px] text-fg">
          Отборът не продължи в този кръг — само наблюдавате.
        </Text>
      )}

      {(state.status === "between_rounds" ||
        (state.status === "finished" && state.teams.length > 0)) && (
        <View>
          <Text className="mb-[8px] mt-[24px] text-[20px] font-extrabold text-fg">
            Класиране
          </Text>
          {state.teams.map((tm, i) => (
            <View
              key={tm.id}
              className="mt-[8px] flex-row items-center gap-[16px] rounded-[12px] border border-border-strong bg-card p-[16px]"
            >
              <Text className="w-[22px] font-black text-muted">{i + 1}</Text>
              <Text className="text-[22px]">{tm.avatarEmoji}</Text>
              <Text className="flex-1 font-bold text-fg">{tm.name}</Text>
              <Text className="font-black text-accent">{tm.totalScore}</Text>
            </View>
          ))}
        </View>
      )}

      {q && (state.status === "active" || state.status === "reveal") && (
        <View className="mt-[24px] gap-[16px] rounded-[14px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[24px]">
          <View className="flex-row justify-between">
            <Text className="text-[12px] font-bold uppercase tracking-[2px] text-accent">
              {state.status === "active" ? "Въпрос" : "Отговор"}
            </Text>
            <Text className={MUTED}>
              {seconds !== null ? `${seconds}s` : `${q.maxPoints} т.`}
            </Text>
          </View>
          <Text className="text-[24px] font-black text-fg">
            {q.questionText}
          </Text>

          {q.questionType === "image_reveal" && q.signedImageUrl && (
            <Image
              source={{ uri: q.signedImageUrl }}
              className="aspect-square w-full rounded-[12px]"
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
            <Text className={MUTED}>
              Само капитанът може да изпрати отговор.
            </Text>
          )}
          {state.status === "active" &&
            state.hasSubmitted &&
            team.isCaptain && (
              <Text className="overflow-hidden rounded-[12px] bg-[#4ADE80] p-[16px] text-center font-extrabold text-[#0c1f12]">
                Отговорът е изпратен ✓
              </Text>
            )}

          {state.status === "reveal" && (
            <View>
              {state.teamResult ? (
                <Text
                  className={
                    state.teamResult.isCorrect ||
                    state.teamResult.pointsAwarded > 0
                      ? "overflow-hidden rounded-[12px] bg-[#4ADE80] p-[16px] text-center font-extrabold text-[#0c1f12]"
                      : "overflow-hidden rounded-[12px] bg-danger p-[16px] text-center font-extrabold text-fg"
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
                <Text className="mt-[8px] text-center font-bold text-fg">
                  Верен отговор: {q.correctAnswerLabel}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      )}

      {error ? (
        <Text className="mt-[16px] text-center text-danger">{error}</Text>
      ) : null}
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
    <View className="gap-[8px]">
      {options.map((opt, i) => (
        <Pressable
          key={`${opt}-${i}`}
          className={`rounded-[12px] border border-border-strong p-[16px] ${
            busy ? "opacity-50" : ""
          }`}
          disabled={busy}
          onPress={() => onPick(i)}
        >
          <Text className="text-[16px] font-semibold text-fg">{opt}</Text>
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
    <View className="gap-[8px]">
      <TextInput
        value={v}
        onChangeText={setV}
        placeholder="Твоят отговор"
        placeholderTextColor={colors.dim}
        className={FIELD}
        autoCapitalize="none"
      />
      <Pressable
        className={`${BTN_PRIMARY} ${busy ? "opacity-50" : ""}`}
        disabled={busy}
        onPress={() => v.trim() && onSubmit(v.trim())}
      >
        <Text className={TXT_PRIMARY}>Изпрати</Text>
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
    <View className="gap-[8px]">
      {vals.map((val, i) => (
        <TextInput
          key={i}
          value={val}
          onChangeText={(t) =>
            setVals((prev) => prev.map((p, j) => (j === i ? t : p)))
          }
          placeholder={`Дума ${i + 1}`}
          placeholderTextColor={colors.dim}
          className={FIELD}
          autoCapitalize="none"
        />
      ))}
      <Pressable
        className={`${BTN_PRIMARY} ${busy ? "opacity-50" : ""}`}
        disabled={busy}
        onPress={() => vals.every((v) => v.trim()) && onSubmit(vals.map((v) => v.trim()))}
      >
        <Text className={TXT_PRIMARY}>Изпрати</Text>
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
    <View className="gap-[8px]">
      <TextInput
        value={decade}
        onChangeText={setDecade}
        placeholder="Десетилетие (напр. 1980)"
        placeholderTextColor={colors.dim}
        keyboardType="number-pad"
        className={FIELD}
      />
      <TextInput
        value={year}
        onChangeText={setYear}
        placeholder="Точна година"
        placeholderTextColor={colors.dim}
        keyboardType="number-pad"
        className={FIELD}
      />
      <Pressable
        className={`${BTN_PRIMARY} ${busy ? "opacity-50" : ""}`}
        disabled={busy}
        onPress={() => {
          const d = Number(decade);
          const y = Number(year);
          if (Number.isFinite(d) && Number.isFinite(y) && d > 0 && y > 0) {
            onSubmit(d, y);
          }
        }}
      >
        <Text className={TXT_PRIMARY}>Изпрати</Text>
      </Pressable>
    </View>
  );
}
