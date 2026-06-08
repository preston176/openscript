# OpenScript — Action Plan

> Status snapshot: 2026-05-31. Branch `transcript-editor`. Derived from a full verified audit of the repo (build health, transcript feature, transcription pipeline, rebrand, desktop, infra). Each item below cites `file:line` evidence.

OpenScript is a fork of OpenCut (browser video editor, Next.js + Rust/WASM) with a new **transcript-driven editing** layer — "edit video by editing the transcript." `apps/web` is the product; `apps/website` is a separate waitlist/marketing site; `apps/desktop` is a GPUI scaffold.

**Working today:** the OpenCut editor base is healthy (project create → editor mounts, WASM/WebGPU/preview/timeline render, no console errors), the transcript happy-path is wired end-to-end, and the transcript/transcription code is type-clean. The editor runs fully local with `bun install && bun run dev:web` (no Postgres/Redis needed).

**Working method:** TDD. For every fix, a failing test (or a failing typecheck) comes first, then the implementation that makes it green. `bun test` is the runner; `next build` is the type gate.

---

## Phase 0 — Unblock the build (ship-blocking)

`next build` fails on the TypeScript gate (12 errors); the app only runs via `next dev`. 4 of the 5 root causes are also **live runtime bugs**.

- [ ] **Keybindings type guards missing.** [persistence.ts:2,4](apps/web/src/actions/keybindings/persistence.ts#L2) imports `isShortcutKey` / `isActionWithOptionalArgs` that don't exist. Implement `isShortcutKey` in [keybinding.ts](apps/web/src/actions/keybinding.ts) and `isActionWithOptionalArgs` in [definitions.ts](apps/web/src/actions/definitions.ts). Comprehensive tests already exist in [persistence.test.ts](apps/web/src/actions/keybindings/__tests__/persistence.test.ts) — they are the red tests.
- [ ] **Sticker registry registered under `undefined`.** [stickers/providers/index.ts:22](apps/web/src/stickers/providers/index.ts#L22) calls `register(provider.id, provider)` positionally against an object-param API → built-in stickers (logos/flags/shapes) broken at runtime. Fix to object form + add a unit test.
- [ ] **Storage migration adapter calls positional (4 sites).** [runner.ts:41,98](apps/web/src/services/storage/migrations/runner.ts#L41) and [v1-to-v2.ts:124,133,160](apps/web/src/services/storage/migrations/v1-to-v2.ts#L124) construct `IndexedDBAdapter` / call `.set` positionally → legacy-project migration opens `indexedDB.open(undefined)` and corrupts/fails. Fix to object form (tsc is the guard; IndexedDB isn't available under `bun test`).
- [ ] **Stale MediaTime tests.** [update-pipeline.test.ts:69](apps/web/src/timeline/__tests__/update-pipeline.test.ts#L69) and [resolve.test.ts:651](apps/web/src/timeline/placement/__tests__/resolve.test.ts#L651) pass raw `number` where the branded `MediaTime` is required. Wrap with `mediaTime({ ticks })` / `ZERO_MEDIA_TIME`.
- [ ] **Verify:** full typecheck clean, `bun test` green, `next build` exits 0.

Also noted (non-blocking): `bun.lock` is stale vs `package.json` (`--frozen-lockfile` fails); typescript/next version drift between root and `apps/web`; ESLint is red (131 problems — mostly style, but 15 `react-hooks/set-state-in-effect` are real smells).

## Phase 1 — Make the transcript feature trustworthy

Three confirmed correctness bugs in the new feature.

- [ ] **Undo desync** ([transcript-panel.tsx:212](apps/web/src/transcript-editor/transcript-panel.tsx#L212)): after delete + Cmd+Z, timeline media returns but words stay struck-through and un-selectable. Panel never subscribes to command history. Reconcile `deleted` flags from the live timeline on undo/redo.
- [ ] **`push()` vs `execute()`** ([apply-deletion.ts:60](apps/web/src/transcript-editor/apply-deletion.ts#L60)): bypasses ripple + reactors → orphan empty tracks; gaps when ripple is on; coordinate drift after other ripple edits. Route through `editor.command.execute()`.
- [ ] **No persistence**: transcript lives in React state only ([transcript-panel.tsx:39](apps/web/src/transcript-editor/transcript-panel.tsx#L39)); lost on reload/tab-toggle while timeline cuts persist → divergence. Persist `TranscriptDocument` (incl. deleted flags + model/lang) into project storage; rehydrate on mount.

## Phase 2 — Deliver the "edit by transcript" promise

- [ ] **Inline text correction** — words are delete-only today; you cannot fix a misrecognized word. The core Descript capability.
- [ ] **Ripple-close on delete** ([apply-deletion.ts:34](apps/web/src/transcript-editor/apply-deletion.ts#L34)) — deletions currently leave silent gaps instead of removing time.
- [ ] **Model + language pickers** — locked to `whisper-small`/auto ([transcript-panel.tsx:75](apps/web/src/transcript-editor/transcript-panel.tsx#L75)); 4 models + 9 languages defined but unused. Add a download-size hint.

## Phase 3 — Transcription robustness

- [ ] **COOP/COEP headers** scoped to the editor route (or default to `whisper-tiny`) — without cross-origin isolation, wasm runs single-threaded on Safari/Firefox/iOS and `whisper-small` is painfully slow ([next.config.ts](apps/web/next.config.ts) has no `headers()`). Scope carefully: global isolation breaks cross-origin images.
- [ ] **Gate Generate on `timelineHasAudio`** ([audio.ts:124](apps/web/src/media/audio.ts#L124)) instead of running Whisper on silence and erroring.
- [ ] **Graceful fallback** when a model returns no word timings (preserve `result.text`); add a Cancel button (service already supports `cancel()`).

## Phase 4 — DB + run-it-locally hygiene

- [ ] **drizzle schema path wrong**: [drizzle.config.ts:16](apps/web/drizzle.config.ts#L16) → `./src/lib/db/schema.ts` doesn't exist; real path `./src/db/schema.ts`. `db:generate/migrate/push` hard-error.
- [ ] **Migration out of sync**: [0000_brainy_saracen.sql](apps/web/migrations/0000_brainy_saracen.sql) creates dead `waitlist`, omits the `feedback` table the code uses ([feedback/queries.ts](apps/web/src/feedback/queries.ts)) → feedback popover 500s on a fresh migrated DB. Regenerate after fixing the path.
- [ ] **README**: rewrite getting-started (editor is local-only; Postgres/Redis only for optional auth/sounds/feedback; add `.env.local` copy + migrate steps). Add a migrate step to `docker-compose.yml`.

## Phase 5 — Rebrand cleanup + desktop decision

- [ ] `/roadmap` 404 ([mobile-gate.tsx:63](apps/web/src/components/editor/mobile-gate.tsx#L63)) + dead routes in [sitemap.ts](apps/web/src/app/sitemap.ts#L24).
- [ ] `manifest.json` still "OpenCut"; LICENSE copyright; `.github` docs + dead Discord invite; `"#"` placeholder social links + placeholder email on /privacy & /terms; orphan OpenCut logo assets.
- [ ] **Decide on `apps/desktop`**: a static upstream "hello window" (renders "OpenCut", no editor, no link to `rust/` crates). Either wire it (webview or native) or mark it a placeholder. Remove empty `packages/{env,ui,desktop-bridge}` and the dead `*:tools` scripts referencing the non-existent `@openscript/tools`.

---

## Ruled out (don't chase)
- ORT-wasm worker bundling — ORT loads from jsDelivr CDN by default; the `new Worker(new URL(...))` idiom is Turbopack-supported.
- `dtype:"q4"` encoder — all 4 models ship `encoder_model_q4.onnx` (verified via HF API); only a minor accuracy tradeoff.
- Next 16.1.3 vs `@opennextjs/cloudflare` peer range — OpenNext's actual version gates pass 16.1.3; it's just an install warning.
