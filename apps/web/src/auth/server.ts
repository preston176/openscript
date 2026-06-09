import { betterAuth, type RateLimit } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Redis } from "@upstash/redis";
import { db } from "@/db";
import { webEnv } from "@/env/web";
import { BASE_PATH } from "@/site/brand";

const redis = new Redis({
	url: webEnv.UPSTASH_REDIS_REST_URL,
	token: webEnv.UPSTASH_REDIS_REST_TOKEN,
});

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
	}),
	secret: webEnv.BETTER_AUTH_SECRET,
	user: {
		deleteUser: {
			enabled: true,
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	rateLimit: {
		storage: "secondary-storage",
		customStorage: {
			get: async (key) => {
				const value = await redis.get(key);
				return value as RateLimit | undefined;
			},
			set: async (key, value) => {
				await redis.set(key, value);
			},
		},
	},
	// baseURL includes the /app basePath so Better Auth's endpoints resolve to
	// <origin>/app/api/auth/* — matching where Next mounts the route handler.
	baseURL: `${webEnv.NEXT_PUBLIC_SITE_URL}${BASE_PATH}`,
	appName: "OpenScript",
	// trustedOrigins is an origin check (scheme+host, no path) — leave unprefixed.
	trustedOrigins: [webEnv.NEXT_PUBLIC_SITE_URL],
});

export type Auth = typeof auth;
