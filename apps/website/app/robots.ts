import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The editor zone (/app) has its own robots and sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
