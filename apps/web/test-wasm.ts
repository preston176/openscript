import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
// The pure JS glue: exports the public API plus the `__wbg_*` import callbacks
// and `__wbg_set_wasm`. Importing it has no side effects (it does NOT load the
// .wasm itself — the bundler entry `opencut_wasm.js` is what wires them up).
import * as glue from "opencut-wasm/opencut_wasm_bg.js";

/**
 * `opencut-wasm` is published as a wasm-pack **bundler**-target package: its
 * entry (`opencut_wasm.js`) does `import * as wasm from "./opencut_wasm_bg.wasm"`
 * and calls `wasm.__wbindgen_start()`, expecting a bundler (webpack/turbopack)
 * to instantiate the module. Vitest doesn't run that step, so every test that
 * reaches the editor core (anything importing `@/wasm`) would die at module load.
 *
 * vitest.config.ts aliases the bare `opencut-wasm` specifier to this file, which
 * performs the bundler step against the REAL wasm — read the bytes, instantiate
 * with the glue as the import object, wire it in, run the start hook — and
 * re-exports the initialized glue. Tests therefore exercise the actual Rust
 * implementation, not a hand-written stub that could drift from the source of truth.
 */
const require = createRequire(import.meta.url);
const wasmBytes = readFileSync(require.resolve("opencut-wasm/opencut_wasm_bg.wasm"));

const { instance } = await WebAssembly.instantiate(wasmBytes, {
	"./opencut_wasm_bg.js": glue,
});

glue.__wbg_set_wasm(instance.exports);
(instance.exports as { __wbindgen_start: () => void }).__wbindgen_start();

export * from "opencut-wasm/opencut_wasm_bg.js";
