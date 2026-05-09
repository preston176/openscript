import { z } from "zod";

const webEnvSchema = z.object({
	// Node
	NODE_ENV: z.enum(["development", "production", "test"]),
	ANALYZE: z.string().optional(),
	NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),

	// Public
	NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
	NEXT_PUBLIC_MARBLE_API_URL: z
		.string()
		.default("https://api.marblecms.com"),

	// Server — defaulted so the editor boots without backing services.
	// Routes that actually need these (auth, DB, sounds) will fail at use.
	DATABASE_URL: z.string().default("postgres://placeholder@localhost/placeholder"),
	BETTER_AUTH_SECRET: z.string().default("dev-placeholder-secret"),
	UPSTASH_REDIS_REST_URL: z.string().default("http://localhost"),
	UPSTASH_REDIS_REST_TOKEN: z.string().default("placeholder"),
	MARBLE_WORKSPACE_KEY: z.string().default("placeholder"),
	FREESOUND_CLIENT_ID: z.string().default("placeholder"),
	FREESOUND_API_KEY: z.string().default("placeholder"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const webEnv = webEnvSchema.parse(process.env);
