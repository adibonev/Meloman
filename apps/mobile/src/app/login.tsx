import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { mobileLogin } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { colors, spacing } from "@/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const r = await mobileLogin(email.trim(), password);
      await saveToken(r.token);
      router.replace("/(tabs)/profile");
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Меломан</Text>
      <Text style={styles.h1}>Вход</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Имейл"
        placeholderTextColor={colors.dim}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Парола"
        placeholderTextColor={colors.dim}
        secureTextEntry
        style={styles.input}
      />
      <Pressable style={styles.btn} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.btnText}>Влез</Text>
        )}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: "center",
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  h1: {
    color: colors.fg,
    fontSize: 34,
    fontWeight: "900",
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 15,
    color: colors.fg,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: colors.bg, fontWeight: "800", fontSize: 16 },
  error: { color: colors.danger, marginTop: spacing.md, textAlign: "center" },
});
