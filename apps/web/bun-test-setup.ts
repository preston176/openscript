import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { mock } from "bun:test";
// The pure JS glue: exports the public API plus the `__wbg_*` import callbacks
// and `__wbg_set_wasm`. Importing it has no side effects (it does NOT load the
// .wasm itself — the bundler entry `opencut_wasm.js` is what wires them up).
import * as glue from "opencut-wasm/opencut_wasm_bg.js";

/**
 * `opencut-wasm` is published as a wasm-pack **bundler**-target package: its
 * entry (`opencut_wasm.js`) does `import * as wasm from "./opencut_wasm_bg.wasm"`
 * and calls `wasm.__wbindgen_start()`, expecting a bundler (webpack/turbopack)
 * to instantiate the module. `bun test` doesn't run that step, so the import
 * crashes with "__wbindgen_start is not a function" and every test that reaches
 * the editor core (anything importing `@/wasm`) dies at module load.
 *
 * Here we perform the bundler step ourselves against the REAL wasm — read the
 * bytes, instantiate with the glue as the import object, wire it in, run the
 * start hook — then redirect the bare `opencut-wasm` specifier to the
 * initialized glue. Tests therefore exercise the actual Rust implementation
 * (mediaTimeFromSeconds, roundToFrame, …), not a hand-written stub that could
 * silently drift from the source of truth.
 */
const require = createRequire(import.meta.url);
const wasmBytes = readFileSync(require.resolve("opencut-wasm/opencut_wasm_bg.wasm"));

const { instance } = await WebAssembly.instantiate(wasmBytes, {
	"./opencut_wasm_bg.js": glue,
});

glue.__wbg_set_wasm(instance.exports);
const exports = instance.exports as { __wbindgen_start: () => void };
exports.__wbindgen_start();

mock.module("opencut-wasm", () => ({ ...glue }));
