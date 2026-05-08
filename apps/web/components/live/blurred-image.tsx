"use client";

import { IMAGE_BLUR_DEFAULT_PX } from "@/lib/schemas/question";

// Static blur per project decision (memory: project_image_reveal_static_blur).
// Active question -> heavy blur. Reveal -> blur 0. We deliberately do NOT
// animate a progressive unblur during the active timer: the original spec
// (CLAUDE.md §3.1 Type 4) was overruled because progressive unblur made the
// answer too easy to lock in once it became readable.
//
// `blurPx` is admin-set per question (rows pre-migration may be null, in
// which case we use the project default). Receives a signed URL (5-min
// expiry) generated server-side.
export function BlurredImage({
  alt,
  attribution,
  blurPx,
  reveal,
  signedUrl,
}: {
  alt: string;
  attribution: string | null;
  blurPx: number | null;
  reveal: boolean;
  signedUrl: string;
}) {
  const effectiveBlur = blurPx ?? IMAGE_BLUR_DEFAULT_PX;
  return (
    <figure className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={alt}
          src={signedUrl}
          className="h-auto w-full select-none"
          style={{
            filter: reveal ? "blur(0px)" : `blur(${effectiveBlur}px)`,
            transform: reveal ? "scale(1)" : "scale(1.04)",
            transition: "filter 600ms ease-out, transform 600ms ease-out",
          }}
          draggable={false}
        />
      </div>
      {reveal && attribution ? (
        <figcaption className="text-xs text-muted-foreground">
          {attribution}
        </figcaption>
      ) : null}
    </figure>
  );
}
