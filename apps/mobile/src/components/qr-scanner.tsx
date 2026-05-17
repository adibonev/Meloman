import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { parseJoinCode } from "@/lib/join-code";

/**
 * Camera QR scanner for the live-quiz join flow. The host /present
 * screen shows a QR that encodes the join URL; this reads it, extracts
 * the code (parseJoinCode), and hands it back. Handles the three
 * permission states explicitly so the user is never stuck on a black
 * screen. (Camera needs a real device / dev build — Expo Go on the
 * latest SDK or `expo export` can't exercise it; logic is unit-tested
 * via parseJoinCode instead.)
 */
export function QrScanner({
  onScanned,
  onCancel,
}: {
  onScanned: (code: string) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [badScan, setBadScan] = useState(false);
  // One-shot guard: the camera fires onBarcodeScanned continuously.
  const handled = useRef(false);

  const CENTER =
    "flex-1 items-center justify-center gap-[16px] bg-bg p-[24px]";
  const BTN = "mt-[8px] items-center rounded-[14px] bg-accent py-[16px] px-[24px]";
  const BTN_TXT = "text-[16px] font-extrabold text-bg";

  if (!permission) {
    return (
      <View className={CENTER}>
        <Text className="text-[15px] text-muted">Зареждане на камерата…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className={CENTER}>
        <Text className="text-center text-[16px] text-fg">
          Нужен е достъп до камерата, за да сканираш QR кода.
        </Text>
        <Pressable className={BTN} onPress={requestPermission}>
          <Text className={BTN_TXT}>Разреши камерата</Text>
        </Pressable>
        <Pressable onPress={onCancel}>
          <Text className="mt-[8px] text-[15px] text-muted">Назад</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => {
          if (handled.current) return;
          const code = parseJoinCode(data);
          if (!code) {
            setBadScan(true);
            return;
          }
          handled.current = true;
          onScanned(code);
        }}
      />
      <View className="absolute inset-x-0 bottom-[40px] items-center gap-[12px] px-[24px]">
        <Text className="text-center text-[15px] text-fg">
          {badScan
            ? "Това не е валиден quiz QR. Опитай отново."
            : "Насочи камерата към QR кода на екрана на водещия."}
        </Text>
        <Pressable
          className="rounded-[14px] bg-card px-[24px] py-[12px]"
          onPress={onCancel}
        >
          <Text className="text-[15px] font-bold text-fg">Отказ</Text>
        </Pressable>
      </View>
    </View>
  );
}
