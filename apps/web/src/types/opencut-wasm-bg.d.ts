// `opencut-wasm` ships type declarations only for its main entry. The vitest
// wasm shim (apps/web/test-wasm.ts) imports the internal wasm-bindgen glue
// subpath directly to instantiate the wasm itself; declare it as untyped so
// tsc does not error (TS7016) on the missing declaration file.
declare module "opencut-wasm/opencut_wasm_bg.js";
