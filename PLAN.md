# OpenScript — Action Plan

> Status snapshot: 2026-05-31, branch `transcript-editor`. **Checkboxes updated 2026-11-15** after PRs #3 to #7 merged; see `todo.todo` for what's left. Derived from a full verified audit of the repo (build health, transcript feature, transcription pipeline, rebrand, desktop, infra). Each item below cites `file:line` evidence.

OpenScript is a fork of OpenCut (browser video editor, Next.js + Rust/WASM) with a new **transcript-driven editing** layer — "edit video by editing the transcript." `apps/web` is the product; `apps/website` is a separate waitlist/marketing site; `apps/desktop` is a GPUI scaffold.

**Working today:** the OpenCut editor base is healthy (project create → editor mounts, WASM/WebGPU/preview/timeline render, no console errors), the transcript happy-path is wired end-to-end, and the transcript/transcription code is type-clean. The editor runs fully local with `bun install && bun run dev:web` (no Postgres/Redis needed).

**Working method:** TDD. For every fix, a failing test (or a failing typecheck) comes first, then the implementation that makes it green. `bun test` is the runner; `next build` is the type gate.

---

## Phase 0 — Unblock the build (ship-blocking)

`next build` fails on the TypeScript gate (12 errors); the app only runs via `next dev`. 4 of the 5 root causes are also **live runtime bugs**.

- [x] **Keybindings type guards missing.** [persistence.ts:2,4](apps/web/src/actions/keybindings/persistence.ts#L2) imports `isShortcutKey` / `isActionWithOptionalArgs` that don't exist. Implement `isShortcutKey` in [keybinding.ts](apps/web/src/actions/keybinding.ts) and `isActionWithOptionalArgs` in [definitions.ts](apps/web/src/actions/definitions.ts). Comprehensive tests already exist in [persistence.test.ts](apps/web/src/actions/keybindings/__tests__/persistence.test.ts) — they are the red tests.
- [x] **Sticker registry registered under `undefined`.** [stickers/providers/index.ts:22](apps/web/src/stickers/providers/index.ts#L22) calls `register(provider.id, provider)` positionally against an object-param API → built-in stickers (logos/flags/shapes) broken at runtime. Fix to object form + add a unit test.
- [x] **Storage migration adapter calls positional (4 sites).** [runner.ts:41,98](apps/web/src/services/storage/migrations/runner.ts#L41) and [v1-to-v2.ts:124,133,160](apps/web/src/services/storage/migrations/v1-to-v2.ts#L124) construct `IndexedDBAdapter` / call `.set` positionally → legacy-project migration opens `indexedDB.open(undefined)` and corrupts/fails. Fix to object form (tsc is the guard; IndexedDB isn't available under `bun test`).
- [x] **Stale MediaTime tests.** [update-pipeline.test.ts:69](apps/web/src/timeline/__tests__/update-pipeline.test.ts#L69) and [resolve.test.ts:651](apps/web/src/timeline/placement/__tests__/resolve.test.ts#L651) pass raw `number` where the branded `MediaTime` is required. Wrap with `mediaTime({ ticks })` / `ZERO_MEDIA_TIME`.
- [x] **Verify:** full typecheck clean, tests green, `next build` exits 0. (2026-11-15, on npm: typecheck clean for both apps, `npm test` (vitest) 42 files / 264 tests pass, `next build` exits 0 for both apps.)

Also noted (non-blocking): `bun.lock` is stale vs `package.json` (`--frozen-lockfile` fails); typescript/next version drift between root and `apps/web`; ESLint is red (131 problems — mostly style, but 15 `react-hooks/set-state-in-effect` are real smells).

## Phase 1 — Make the transcript feature trustworthy

Three confirmed correctness bugs in the new feature.

- [x] **Undo desync** ([transcript-panel.tsx:212](apps/web/src/transcript-editor/transcript-panel.tsx#L212)): after delete + Cmd+Z, timeline media returns but words stay struck-through and un-selectable. Panel never subscribes to command history. Reconcile `deleted` flags from the live timeline on undo/redo.
- [x] **`push()` vs `execute()`** ([apply-deletion.ts:60](apps/web/src/transcript-editor/apply-deletion.ts#L60)): bypasses ripple + reactors → orphan empty tracks; gaps when ripple is on; coordinate drift after other ripple edits. Route through `editor.command.execute()`.
- [x] **No persistence**: transcript lives in React state only ([transcript-panel.tsx:39](apps/web/src/transcript-editor/transcript-panel.tsx#L39)); lost on reload/tab-toggle while timeline cuts persist → divergence. Persist `TranscriptDocument` (incl. deleted flags + model/lang) into project storage; rehydrate on mount.

## Phase 2 — Deliver the "edit by transcript" promise

- [x] **Inline text correction** — words are delete-only today; you cannot fix a misrecognized word. The core Descript capability.
- [x] **Ripple-close on delete** ([apply-deletion.ts:34](apps/web/src/transcript-editor/apply-deletion.ts#L34)) — deletions currently leave silent gaps instead of removing time.
- [x] **Model + language pickers** — locked to `whisper-small`/auto ([transcript-panel.tsx:75](apps/web/src/transcript-editor/transcript-panel.tsx#L75)); 4 models + 9 languages defined but unused. Add a download-size hint.

## Phase 3 — Transcription robustness

- [x] **COOP/COEP headers** (2026-11-15: `headers()` on `/editor/:path*`, COEP `credentialless`; Safari ignores it and stays single-threaded, default model is already `whisper-tiny`) scoped to the editor route (or default to `whisper-tiny`) — without cross-origin isolation, wasm runs single-threaded on Safari/Firefox/iOS and `whisper-small` is painfully slow ([next.config.ts](apps/web/next.config.ts) has no `headers()`). Scope carefully: global isolation breaks cross-origin images.
- [x] **Gate Generate on `timelineHasAudio`** ([audio.ts:124](apps/web/src/media/audio.ts#L124)) instead of running Whisper on silence and erroring.
- [x] **Graceful fallback** when a model returns no word timings (preserve `result.text`); add a Cancel button (service already supports `cancel()`).

## Phase 4 — DB + run-it-locally hygiene

- [x] **drizzle schema path wrong**: [drizzle.config.ts:16](apps/web/drizzle.config.ts#L16) → `./src/lib/db/schema.ts` doesn't exist; real path `./src/db/schema.ts`. `db:generate/migrate/push` hard-error.
- [x] **Migration out of sync**: [0000_brainy_saracen.sql](apps/web/migrations/0000_brainy_saracen.sql) creates dead `waitlist`, omits the `feedback` table the code uses ([feedback/queries.ts](apps/web/src/feedback/queries.ts)) → feedback popover 500s on a fresh migrated DB. Regenerate after fixing the path.
- [x] **README**: (2026-11-15: `/app` URL fixed; compose has a one-shot `migrate` service that `web` waits on, tested against a fresh Postgres) rewrite getting-started (editor is local-only; Postgres/Redis only for optional auth/sounds/feedback; add `.env.local` copy + migrate steps). Add a migrate step to `docker-compose.yml`.

## Phase 5 — Rebrand cleanup + desktop decision

- [x] `/roadmap` 404 ([mobile-gate.tsx:63](apps/web/src/components/editor/mobile-gate.tsx#L63)) + dead routes in [sitemap.ts](apps/web/src/app/sitemap.ts#L24).
- [x] `manifest.json` still "OpenCut"; LICENSE copyright; `.github` docs + dead Discord invite; `"#"` placeholder social links + placeholder email on /privacy & /terms; orphan OpenCut logo assets.
- [x] **Decide on `apps/desktop`**: (2026-11-15: labeled a placeholder, not part of the launch; README says so) a static upstream "hello window" (renders "OpenCut", no editor, no link to `rust/` crates). Either wire it (webview or native) or mark it a placeholder. Remove empty `packages/{env,ui,desktop-bridge}` and the dead `*:tools` scripts referencing the non-existent `@openscript/tools`.

---

## Ruled out (don't chase)
- ORT-wasm worker bundling — ORT loads from jsDelivr CDN by default; the `new Worker(new URL(...))` idiom is Turbopack-supported.
- `dtype:"q4"` encoder — all 4 models ship `encoder_model_q4.onnx` (verified via HF API); only a minor accuracy tradeoff.
- Next 16.1.3 vs `@opennextjs/cloudflare` peer range — OpenNext's actual version gates pass 16.1.3; it's just an install warning.

---

## Phase 6 — Launch (goal: 1000 users)

- [x] **Landing page** in `apps/website`, in OpenScript's dark theme (black, zinc, `#0070f3`, Inter), structure ported from Offsite (`~/Code/personal/S3-bucket`): nav, hero, Screen Studio–style scripted demo (`components/demo-reel.tsx`: transcribe, remove fillers, cut a retake, export), how it works, features, privacy, FAQ with JSON-LD, footer, OG image, robots, sitemap. Builds with npm.
- [x] **Analytics**: dropped (user call, 2026-11-15). Removed the Databuddy claims from the privacy page; nothing ever loaded it.
- [ ] **Waitlist**: `NEXT_PUBLIC_TALLY_FORM_ID` unset, so the "Get launch updates" link is hidden. Set it in the website deploy.
- [x] **Deploy both zones**: already wired. Vercel Git integration builds `openscript` (website, root domain `tryopenscript.vercel.app`) and `openscript-app` (editor) on every push; merging to `main` deploys production. Live `/app` proxy confirmed 2026-11-15.
- [x] **Package manager**: moved to npm (2026-11-15). `package-lock.json` replaces `bun.lock`, `.npmrc` only sets `legacy-peer-deps`, tests run on vitest (`apps/web/test-wasm.ts` instantiates the real wasm), CI and the Dockerfile use Node 22 + `npm ci`, better-auth pinned to `~1.6.9`.

