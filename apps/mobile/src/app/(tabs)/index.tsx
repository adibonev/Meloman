import { Link } from "expo-router";
import { Image, Linking, Pressable, Text, View } from "react-native";

// Same official Meloman pages the web footer links to — keep them 1:1.
const INSTAGRAM_URL = "https://www.instagram.com/meloman.offc/";
const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61566868535472&locale=bg_BG";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bg p-[24px] pb-[120px]">
      <Image
        source={require("../../../assets/images/meloman-logo-white.png")}
        resizeMode="contain"
        style={{ width: 140, height: 140, marginBottom: 8 }}
      />
      <Text className="text-[52px] font-black tracking-[8px] text-fg">
        MELOMAN
      </Text>
      <Text className="mb-[40px] mt-[8px] text-center text-[16px] text-muted">
        Музикален куиз и ежедневно забавление
      </Text>

      <View className="w-full gap-[16px]">
        <Link href="/play" asChild>
          <Pressable className="items-center rounded-[14px] bg-accent py-[16px]">
            <Text className="text-[16px] font-extrabold text-bg">
              Влез в куиз
            </Text>
          </Pressable>
        </Link>
        <Link href="/login" asChild>
          <Pressable className="items-center rounded-[14px] border border-border-strong py-[16px]">
            <Text className="text-[16px] font-semibold text-fg">Вход</Text>
          </Pressable>
        </Link>
      </View>

      <View className="mt-[40px] flex-row gap-[24px]">
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
    </View>
  );
}
