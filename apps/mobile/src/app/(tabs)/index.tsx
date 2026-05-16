import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bg p-[24px] pb-[120px]">
      <Text className="mb-[16px] text-center text-[12px] font-bold uppercase tracking-[3px] text-accent">
        Музикален куиз · истории · песен на деня
      </Text>
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
    </View>
  );
}
