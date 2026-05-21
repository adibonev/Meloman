import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { listDailyArchive, type DailyArchiveItem } from "@/lib/api";
import { colors } from "@/lib/theme";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export default function DailyArchiveScreen() {
  const [items, setItems] = useState<DailyArchiveItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listDailyArchive(page)
      .then((r) => {
        if (!active) return;
        setItems((prev) => (page === 1 ? r.items : [...prev, ...r.items]));
        setTotalPages(r.totalPages);
      })
      .catch((e) => active && setError(String((e as Error).message ?? e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-[24px]">
        <Text className="text-center text-danger">{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-bg"
      data={items}
      keyExtractor={(i) => i.contentDate}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      ListHeaderComponent={
        <Text className="mb-[16px] text-[32px] font-black text-fg">
          Архив
        </Text>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text className="mt-[24px] text-center text-muted">
            Все още няма архив.
          </Text>
        )
      }
      renderItem={({ item }) => (
        <View className="mb-[12px] rounded-[12px] border border-border-strong bg-card p-[16px]">
          <Text className="text-[13px] text-muted">
            {fmtDate(item.contentDate)} ·{" "}
            {item.contentType === "song_of_day"
              ? "Песен на деня"
              : "Мистериозен артист"}
          </Text>
          <Text className="mt-[4px] text-[16px] font-bold text-fg">
            {item.label ?? "—"}
          </Text>
        </View>
      )}
      ListFooterComponent={
        page < totalPages ? (
          <Pressable
            className="mt-[8px] items-center rounded-[14px] border border-border-strong py-[14px]"
            onPress={() => setPage((p) => p + 1)}
            disabled={loading}
          >
            <Text className="font-semibold text-fg">
              {loading ? "Зареждане..." : "Зареди още"}
            </Text>
          </Pressable>
        ) : null
      }
    />
  );
}
