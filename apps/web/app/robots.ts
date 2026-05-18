import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public content site: index everything except the API and the
// authenticated admin / host / player surfaces, which carry no SEO
// value and shouldn't be crawled.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/host",
        "/play",
        "/en/admin",
        "/en/host",
        "/en/play",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
