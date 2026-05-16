"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { GUEST_VIDEO_MAX_SIZE_BYTES } from "@/lib/schemas/round";
import {
  removeRoundGuestVideoAction,
  uploadRoundGuestVideoAction,
} from "./actions";
import { Button } from "@/components/ui/button";

type ServerErrorKey =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "guestVideoMissing"
  | "guestVideoTooLarge"
  | "guestVideoWrongType"
  | "uploadFailed"
  | "generic";

/**
 * Guest-host final round video (CLAUDE.md §3.1). Standalone from the RHF
 * round text form because it's a multipart upload with its own submit —
 * keeping it separate leaves the text form (and its body size) untouched.
 * Only meaningful for `final` rounds; for others it explains why instead
 * of silently hiding, so the admin isn't left guessing.
 */
export function GuestVideoForm({
  quizId,
  roundId,
  roundType,
  hasGuestVideo,
}: {
  quizId: string;
  roundId: string;
  roundType: "standard" | "mystery_artist" | "final";
  hasGuestVideo: boolean;
}) {
  const t = useTranslations("AdminEditRound");
  const fileRef = useRef<HTMLInputElement>(null);
  const [serverErrorKey, setServerErrorKey] = useState<ServerErrorKey | null>(
    null
  );
  const [isUploading, startUpload] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  const isFinal = roundType === "final";
  const maxMb = Math.round(GUEST_VIDEO_MAX_SIZE_BYTES / (1024 * 1024));

  function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setServerErrorKey("guestVideoMissing");
      return;
    }
    setServerErrorKey(null);
    const formData = new FormData();
    formData.set("guestVideoFile", file);
    startUpload(async () => {
      const result = await uploadRoundGuestVideoAction(
        quizId,
        roundId,
        formData
      );
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  function onRemove() {
    setServerErrorKey(null);
    startRemove(async () => {
      const result = await removeRoundGuestVideoAction(quizId, roundId);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  return (
    <section className="space-y-3 rounded-md border border-border bg-card px-5 py-5">
      <div className="space-y-1">
        <h2 className="font-heading text-lg uppercase tracking-wider">
          {t("guestVideoTitle")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("guestVideoHint", { maxMb })}
        </p>
      </div>

      {!isFinal ? (
        <p className="rounded-md bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {t("guestVideoOnlyFinal")}
        </p>
      ) : (
        <>
          <p className="text-sm">
            {hasGuestVideo
              ? t("guestVideoAttached")
              : t("guestVideoNone")}
          </p>

          <form onSubmit={onUpload} className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4"
              disabled={isUploading || isRemoving}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm hover:file:bg-muted/30"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isUploading || isRemoving}>
                {isUploading
                  ? t("guestVideoUploading")
                  : hasGuestVideo
                    ? t("guestVideoReplace")
                    : t("guestVideoUpload")}
              </Button>
              {hasGuestVideo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRemove}
                  disabled={isUploading || isRemoving}
                >
                  {isRemoving
                    ? t("guestVideoRemoving")
                    : t("guestVideoRemove")}
                </Button>
              )}
            </div>
          </form>
        </>
      )}

      {serverErrorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`errors.${serverErrorKey}`)}
        </p>
      )}
    </section>
  );
}
