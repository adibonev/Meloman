import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { mobileLogin } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { colors } from "@/lib/theme";

// NativeWind POC screen (CLAUDE.md §2.2). className values are exact px
// arbitrary values mapped 1:1 from the old StyleSheet so there is no
// visual change. `colors` stays imported for RN props that take a color
// value, not a class (placeholderTextColor, ActivityIndicator).
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
    <View className="flex-1 justify-center bg-bg p-[24px]">
      <Text className="mb-[8px] text-[12px] font-bold uppercase tracking-[3px] text-accent">
        Меломан
      </Text>
      <Text className="mb-[24px] text-[34px] font-black text-fg">Вход</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Имейл"
        placeholderTextColor={colors.dim}
        autoCapitalize="none"
        keyboardType="email-address"
        className="mb-[16px] rounded-[12px] border border-border-strong p-[15px] text-[16px] text-fg"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Парола"
        placeholderTextColor={colors.dim}
        secureTextEntry
        className="mb-[16px] rounded-[12px] border border-border-strong p-[15px] text-[16px] text-fg"
      />
      <Pressable
        className="items-center rounded-[14px] bg-accent py-[16px]"
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text className="text-[16px] font-extrabold text-bg">Влез</Text>
        )}
      </Pressable>
      {error ? (
        <Text className="mt-[16px] text-center text-danger">{error}</Text>
      ) : null}
    </View>
  );
}
