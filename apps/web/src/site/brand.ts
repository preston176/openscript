export const SITE_URL = "https://openscript.app";

// Keep in sync with `basePath` in next.config.ts. The editor ships as a
// Next.js Multi-Zones "zone" mounted under /app, so its API routes and the
// auth baseURL all live beneath this prefix. (next/link & next/navigation are
// basePath-aware automatically; raw fetch() and Better Auth's baseURL are not.)
export const BASE_PATH = "/app";

export const SITE_INFO = {
	title: "OpenScript",
	description:
		"Edit video by editing the transcript. Privacy-first, runs in your browser.",
	url: SITE_URL,
	openGraphImage: "/open-graph/default.jpg",
	twitterImage: "/open-graph/default.jpg",
	favicon: "/favicon.ico",
};
