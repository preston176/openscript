import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const web = (p: string) => fileURLToPath(new URL(`./apps/web/${p}`, import.meta.url));

export default defineConfig({
	resolve: {
		alias: [
			// Exact match only, so test-wasm.ts can still import the package's subpaths.
			{ find: /^opencut-wasm$/, replacement: web("test-wasm.ts") },
			{ find: /^@\//, replacement: web("src/") },
		],
	},
	test: {
		include: ["apps/web/src/**/*.test.ts", "eslint/**/*.test.mjs"],
	},
});
