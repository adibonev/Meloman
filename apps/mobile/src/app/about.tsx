import { Linking, Pressable, ScrollView, Text, View } from "react-native";

const INSTAGRAM_URL = "https://www.instagram.com/meloman.offc/";
const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61566868535472&locale=bg_BG";

export default function AboutScreen() {
  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
    >
      <Text className="text-[32px] font-black text-fg">За Meloman</Text>
      <Text className="mt-[16px] text-[16px] leading-[24px] text-muted">
        Meloman е страница за хора, които слушат музика не само за фон.
        Правим куиз вечери на живо и ежедневни малки забавления за
        останалите дни — песен на деня, мистериозен артист и кратки
        истории за артистите, които обичаме.
      </Text>
      <Text className="mt-[16px] text-[18px] font-extrabold text-fg">
        Авторски формат за живи музикални куизове.
      </Text>

      <Text className="mt-[32px] text-[20px] font-extrabold text-fg">
        За кого е
      </Text>
      <Text className="mt-[8px] text-[15px] leading-[22px] text-fg">
        За музикалната общност и за всеки любител на музика — независимо
        дали идваш на куиз вечер, или просто четеш история сутрин с
        кафето.
      </Text>

      <Text className="mt-[32px] text-[20px] font-extrabold text-fg">
        Свържи се с нас
      </Text>
      <Text className="mt-[8px] text-[15px] leading-[22px] text-fg">
        Пиши ни директно в Instagram DM или във Facebook Messenger.
      </Text>
      <View className="mt-[16px] flex-row gap-[24px]">
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
