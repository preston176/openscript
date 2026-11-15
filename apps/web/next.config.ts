import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";
import { withContentCollections } from "@content-collections/next";

const nextConfig: NextConfig = {
	compiler: {
		removeConsole: process.env.NODE_ENV === "production",
	},
	reactStrictMode: true,
	productionBrowserSourceMaps: true,
	output: "standalone",
	// Multi-Zones: this app is the editor "zone" and owns the /app path prefix.
	// The marketing site (apps/website) serves "/" and rewrites /app/* here.
	// basePath also namespaces this app's /_next assets under /app/_next so they
	// never collide with the marketing zone's assets.
	basePath: "/app",
	// Cross-origin isolation lets the Whisper wasm backend use threads. Scoped to the
	// editor only, and `credentialless` (not `require-corp`) so cross-origin images and
	// stickers still load. Safari ignores `credentialless` and stays single-threaded.
	async headers() {
		return [
			{
				source: "/editor/:path*",
				headers: [
					{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
					{ key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
				],
			},
		];
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "plus.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "images.marblecms.com",
			},
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
			{
				protocol: "https",
				hostname: "api.iconify.design",
			},
			{
				protocol: "https",
				hostname: "api.simplesvg.com",
			},
			{
				protocol: "https",
				hostname: "api.unisvg.com",
			},
			{
				protocol: "https",
				hostname: "cdn.brandfetch.io",
			},
		],
	},
};

export default withContentCollections(withBotId(nextConfig));
