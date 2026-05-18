import { BrandLoader } from "@/components/brand-loader";

// Global route-loading UI: every navigation under /[locale] that
// suspends shows the Meloman logo loader, unless a nested segment
// overrides it (they all use BrandLoader too, for consistency).
export default function Loading() {
  return <BrandLoader />;
}
