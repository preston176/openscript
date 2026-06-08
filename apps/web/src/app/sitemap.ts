import { SITE_URL } from "@/site/brand";
import type { MetadataRoute } from "next";

// Only the routes that actually ship. The /contributors, /roadmap,
// /why-not-capcut and /blog routes were removed with the marketing surfaces;
// advertising them here just emits 404s and hurts crawl health.
export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: SITE_URL,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${SITE_URL}/privacy`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${SITE_URL}/terms`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
	];
}
