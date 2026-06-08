// `opencut-wasm` ships type declarations only for its main entry. The bun test
// preload (apps/web/bun-test-setup.ts) imports the internal wasm-bindgen glue
// subpath directly to instantiate the wasm itself; declare it as untyped so
// tsc does not error (TS7016) on the missing declaration file.
declare module "opencut-wasm/opencut_wasm_bg.js";
