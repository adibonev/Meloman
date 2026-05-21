import { useState } from "react";
import { Link, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { mobileRegister } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { colors } from "@/lib/theme";

const FIELD =
  "mb-[16px] rounded-[12px] border border-border-strong p-[15px] text-[16px] text-fg";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    if (name.trim().length < 2) return setError("Името е твърде кратко.");
    if (password.length < 8) return setError("Паролата трябва да е поне 8 символа.");
    setLoading(true);
    try {
      const r = await mobileRegister(email.trim(), password, name.trim());
      if (r.token) {
        await saveToken(r.token);
        router.replace("/(tabs)/profile");
      } else {
        // Verification enforced — confirmation email was sent.
        setPending(true);
      }
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setLoading(false);
    }
  }

  if (pending) {
    return (
      <View className="flex-1 justify-center gap-[16px] bg-bg p-[24px]">
        <Text className="text-[28px] font-black text-fg">
          Потвърди имейла си
        </Text>
        <Text className="text-[15px] text-muted">
          Изпратихме ти линк за потвърждение. Провери пощата си, после
          влез.
        </Text>
        <Pressable
          className="items-center rounded-[14px] bg-accent py-[16px]"
          onPress={() => router.replace("/login")}
        >
          <Text className="text-[16px] font-extrabold text-bg">Към вход</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center bg-bg p-[24px]">
      <Text className="mb-[8px] text-[12px] font-bold uppercase tracking-[3px] text-accent">
        Меломан
      </Text>
      <Text className="mb-[24px] text-[34px] font-black text-fg">
        Регистрация
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Потребителско име"
        placeholderTextColor={colors.dim}
        className={FIELD}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Имейл"
        placeholderTextColor={colors.dim}
        autoCapitalize="none"
        keyboardType="email-address"
        className={FIELD}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Парола (мин. 8 символа)"
        placeholderTextColor={colors.dim}
        secureTextEntry
        className={FIELD}
      />
      <Pressable
        className="items-center rounded-[14px] bg-accent py-[16px]"
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text className="text-[16px] font-extrabold text-bg">
            Създай профил
          </Text>
        )}
      </Pressable>
      <Link href="/login" asChild>
        <Pressable className="mt-[16px]">
          <Text className="text-center text-[15px] text-muted">
            Вече имаш акаунт? <Text className="text-accent">Влез</Text>
          </Text>
        </Pressable>
      </Link>
      {error ? (
        <Text className="mt-[16px] text-center text-danger">{error}</Text>
      ) : null}
    </View>
  );
}
