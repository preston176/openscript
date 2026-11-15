import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The editor zone (/app) has its own robots and sitemap; the waitlist thank-you page isn't worth indexing.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/success"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
