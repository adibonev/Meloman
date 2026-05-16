import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getSession } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";

export default function PlayScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setError(null);
    setStatus(null);
    if (code.trim().length < 4) {
      setError("Въведи валиден код.");
      return;
    }
    setLoading(true);
    try {
      const r = await getSession(code.trim().toUpperCase());
      setStatus(r.session.status);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
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
        style={styles.input}
      />
      <Pressable style={styles.btn} onPress={join} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.btnText}>Провери сесията</Text>
        )}
      </Pressable>

      {status ? (
        <Text style={styles.ok}>Сесия намерена · статус: {status}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  h1: { color: colors.fg, fontSize: 32, fontWeight: "900" },
  muted: { color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 15,
    color: colors.fg,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: "center",
  },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: spacing.md,
  },
  btnText: { color: colors.bg, fontWeight: "800", fontSize: 16 },
  ok: { color: colors.fg, marginTop: spacing.lg, textAlign: "center" },
  error: { color: colors.danger, marginTop: spacing.lg, textAlign: "center" },
});
