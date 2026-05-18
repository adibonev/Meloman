import Image from "next/image";

// Branded route-loading indicator: the Meloman logo over a spinning
// ring. Used by loading.tsx files so every section transition shows
// the same logo loader (not a mix of skeletons / blank). Next mounts
// it while the segment streams and unmounts it when ready.
export function BrandLoader() {
  return (
    <div
      role="status"
      aria-label="Зареждане"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <div className="relative flex h-36 w-36 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-border border-t-primary" />
        <Image
          src="/meloman-logo-white.png"
          alt="Meloman"
          width={288}
          height={288}
          priority
          sizes="96px"
          className="h-24 w-24 animate-pulse object-contain"
        />
      </div>
    </div>
  );
}
