import { Link, type Href } from "expo-router";
import { Image, Linking, Pressable, ScrollView, Text, View } from "react-native";

// Same official Meloman pages the web footer links to — keep them 1:1.
const INSTAGRAM_URL = "https://www.instagram.com/meloman.offc/";
const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61566868535472&locale=bg_BG";

const HOW_STEPS = [
  "Водещият стартира играта",
  "Играчите влизат с код",
  "Отговорите се дават през телефон",
  "Класирането се обновява след рундовете",
];

const SECTIONS: { href: Href; label: string }[] = [
  { href: "/events", label: "Събития" },
  { href: "/stories", label: "Истории" },
  { href: "/daily", label: "Песен на деня" },
  { href: "/about", label: "За нас" },
];

export default function HomeScreen() {
  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{
        padding: 24,
        paddingBottom: 120,
        alignItems: "center",
      }}
    >
      <Image
        source={require("../../../assets/images/meloman-logo-white.png")}
        resizeMode="contain"
        style={{ width: 120, height: 120, marginTop: 24, marginBottom: 8 }}
      />
      <Text className="text-[48px] font-black tracking-[6px] text-fg">
        MELOMAN
      </Text>
      <Text className="mb-[32px] mt-[8px] text-center text-[16px] text-muted">
        Куизове на живо и ежедневни забавления
      </Text>

      <View className="w-full gap-[12px]">
        <Link href="/play" asChild>
          <Pressable className="items-center rounded-[14px] bg-accent py-[16px]">
            <Text className="text-[16px] font-extrabold text-bg">
              Влез в куиз
            </Text>
          </Pressable>
        </Link>
        <Link href="/events" asChild>
          <Pressable className="items-center rounded-[14px] border border-border-strong py-[16px]">
            <Text className="text-[16px] font-semibold text-fg">
              Виж събития
            </Text>
          </Pressable>
        </Link>
        <Link href="/login" asChild>
          <Pressable className="items-center rounded-[14px] border border-border-strong py-[16px]">
            <Text className="text-[16px] font-semibold text-fg">Вход</Text>
          </Pressable>
        </Link>
        <Link href="/register" asChild>
          <Pressable className="items-center py-[8px]">
            <Text className="text-[15px] text-accent">Регистрирай се</Text>
          </Pressable>
        </Link>
      </View>

      {/* How the quiz works */}
      <Text className="mb-[12px] mt-[40px] w-full text-[12px] font-bold uppercase tracking-[2px] text-muted">
        Как работи куизът
      </Text>
      <View className="w-full gap-[8px]">
        {HOW_STEPS.map((step, i) => (
          <View
            key={i}
            className="flex-row gap-[12px] rounded-[12px] border border-l-[3px] border-border-strong border-l-accent bg-card p-[14px]"
          >
            <Text className="text-[18px] font-black text-accent">{i + 1}</Text>
            <Text className="flex-1 text-[15px] text-fg">{step}</Text>
          </View>
        ))}
      </View>

      {/* Section links */}
      <View className="mt-[32px] w-full flex-row flex-wrap gap-[8px]">
        {SECTIONS.map((s) => (
          <Link key={s.label} href={s.href} asChild>
            <Pressable className="rounded-full border border-border-strong px-[16px] py-[8px]">
              <Text className="text-[14px] text-fg">{s.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <View className="mt-[32px] flex-row gap-[24px]">
        <Pressable onPress={() => Linking.openURL(INSTAGRAM_URL)}>
          <Text className="text-[15px] font-semibold text-accent">
            Instagram
          </Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(FACEBOOK_URL)}>
          <Text className="text-[15px] font-semibold text-accent">
            Facebook
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
