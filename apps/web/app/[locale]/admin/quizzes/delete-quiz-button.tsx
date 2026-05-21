"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { deleteQuizAction } from "./actions";

// Confirm-then-soft-delete a quiz from the list. Refreshes the route so
// the row disappears immediately.
export function DeleteQuizButton({ id }: { id: string }) {
  const t = useTranslations("AdminQuizzes");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(t("deleteConfirm"))) return;
        startTransition(async () => {
          const res = await deleteQuizAction(id);
          if (res?.errorKey) {
            window.alert(t("deleteError"));
            return;
          }
          router.refresh();
        });
      }}
    >
      {pending ? t("deleting") : t("delete")}
    </Button>
  );
}
