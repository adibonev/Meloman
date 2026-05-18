import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pressable, Text, View } from "react-native";

// App-wide toast. Any screen calls useToast().showToast("..."); the
// message sits ~2.5s then auto-dismisses, or the user can tap it away.

type ToastContextValue = { showToast: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 2500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setMessage(null);
  }, []);

  const showToast = useCallback(
    (next: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(next);
      timer.current = setTimeout(dismiss, VISIBLE_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <View
          pointerEvents="box-none"
          className="absolute left-0 right-0 top-[60px] items-center px-[24px]"
        >
          <Pressable
            onPress={dismiss}
            className="w-full rounded-[14px] border border-l-[4px] border-border-strong border-l-accent bg-card px-[18px] py-[14px]"
          >
            <Text className="text-[15px] font-semibold text-fg">
              {message}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Defensive no-op so a screen rendered outside the provider never
    // crashes; the toast just won't show.
    return { showToast: () => {} };
  }
  return ctx;
}
