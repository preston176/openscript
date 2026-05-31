# Descript-style transcript editing — design (Phase 2c)

Decided approach: **destructive ripple inside a custom undoable command**, chosen over a
non-destructive render-overlay because the overlay would need a "skip + ripple deleted
ranges" transform at 5+ independent render sites (preview render, preview audio, export
video, export audio, transform handles) kept bit-identical forever. Destructive needs
**zero render/export changes** — deleting + rippling elements makes the tracks already
correct; restore re-inserts real elements. The Rust/WASM compositor is untouched.

Confirmed decisions: whole-cut restore (one `DeletedRange` = one restore unit); immediate
ripple on delete; pre-v2 cuts permanent (struck but not restorable, with tooltip); mixed
transcript + direct-timeline editing unsupported this phase (mapping may drift → identity
seek fallback); text edits stay outside the undo stack; per-cut click restore only (no
multi-select restore yet); one-way v1→v2 migration on load; restore-at-stored-position
semantics.

## Data model (persisted, `SerializedTranscript` bumped to version 2)

- `TranscriptWord` gains `deleted?: boolean`. **`start`/`end` stay frozen SOURCE seconds** —
  the mapping anchor; never mutated after generation.
- `TranscriptDocument` gains `deletedRanges: DeletedRange[]`.
- `DeletedRange { id; wordIds: string[]; sourceStartSeconds; sourceEndSeconds;
  durationTicks: MediaTime /* exact integer gap width, reused verbatim on open */;
  removed: RemovedPiece[] }`.
- `RemovedPiece { trackId; trackType: 'main'|'audio'|'overlay'; offsetTicks: MediaTime
  /* element.startTime - gapStartTimeline at delete time */; element: Omit<TimelineElement,'id'> }`.

In-memory: the live doc is owned by a new **EditorCore `TranscriptStore`** (get/set/subscribe,
persists on set), NOT React `useState` — so a Command can mutate it from global undo/redo.
`deletedWordIds = new Set(words.filter(w => w.deleted))` replaces Phase-1b coverage derivation.

`mapping.ts` (pure): `sourceToTimeline` = `mediaTimeFromSeconds(src) − Σ durationTicks of
deletedRanges ending at/ before src`; inverse `timelineToSource`; all integer-tick math,
seconds only at boundaries. `buildWordTimeline(doc): Map<wordId,{tStartTicks,tEndTicks}>`.

## TranscriptEditCommand (undo coupling)

Ripple is applied **inside** `execute()` (NOT the global `isRippleEnabled` toggle, which
`undo()` does not reverse). `execute()` snapshots `savedTracks` before any mutation and
`savedDoc`; DELETE runs the reused split/delete machinery incrementally (to read live IDs),
captures `RemovedPiece[]`, applies `applyRippleAdjustments` to CLOSE the gap, sets
`word.deleted` + pushes the `DeletedRange`, `store.setDoc`. Captures `afterTracks`/`afterDoc`.
`undo()` = `updateTracks(savedTracks)` + `store.setDoc(savedDoc)` (atomic revert). `redo()`
replays `afterTracks`/`afterDoc` (no ripple recompute). RESTORE = `rippleOpenElements` +
`InsertElementCommand` rebuild per piece. Registered via `push()` + `reactToExternalChange()`
(empty-track pruning), `selectionOverride` declared.

## Steps (TDD; commit in coherent chunks)

1. v2 data model + `buildTranscriptDocument` init — types.ts. (pure test)
2. `mapping.ts` source↔timeline — pure test (delete [2,3], word@5s→4s; round-trip identity; in-gap clamps to edge).
3. `ripple/open.ts` `rippleOpenElements` (inverse of shift.ts) — pure test.
4. EditorCore `TranscriptStore` (lift doc out of useState) — store unit test + wire into useEditor.
5. Export apply-deletion internals; capture `RemovedPiece` before delete — test capture.
6. `TranscriptEditCommand` (delete + restore; ripple + doc delta inside) — integration test on constructed editor.
7. Round-trip delete→restore fidelity test (element-equal-mod-id; no tick drift; covers contained/straddle/retimed).
8. Rewire transcript-panel: stored deleted, mapping-based seek/highlight, click-struck-word→restore. (in-app)
9. Persistence v1→v2 migrator (derive deleted once; deletedRanges=[]; no timeline mutation). (pure migrate test)
10. Retire coverage from hot path (keep for migrator only); confirm filler/search still pass.

## Test-infra notes (for steps 6-7)

- `EditorCore.getInstance()` DOES construct under `bun test` (with the wasm preload) —
  confirmed by probe. So an integration test on a real editor is feasible.
- BUT: `editor.timeline.updateTracks(...)` triggers the SaveManager → `storageService` →
  IndexedDB, which is absent under bun and will reject (risking an "unhandled error
  between tests"). The fidelity test must avoid that: either (a) extract the split/trim +
  ripple-close/open transform into a PURE `tracks -> {afterTracks, removed}` helper and
  test it directly on fixture `SceneTracks` (no editor/save), or (b) stub/disable the save
  path in the test. Prefer (a): keep the destructive transform pure and editor-agnostic;
  the TranscriptEditCommand is then a thin snapshot wrapper (mirror TracksSnapshotCommand)
  that calls the pure transform + `store.setDoc`. Reuse SplitElementsCommand's trim math by
  extracting its core if it is not already pure.
- Delete input contract: panel passes contiguous runs `{ wordIds, startSeconds, endSeconds }`
  (one DeletedRange per run); panel builds runs from consecutive selected words (step 8).

## Step 8 — panel wiring (the only remaining piece; needs in-app verification)

All backend is built + tested (transforms, plan.ts, transcript-edit-command.ts, migrate.ts).
The panel (transcript-panel.tsx) is the last integration. Exact deltas:

- doc source: replace `const [doc, setDoc] = useState` with `const doc = useEditor(e =>
  e.transcript.getDoc())`; every `setDoc(x)` becomes `editor.transcript.setDoc(x)`. Remove
  the `activeTracks` selector and the `isWordPresentInTimeline` import.
- deletedWordIds: `new Set(flatWords.filter(w => w.deleted).map(w => w.id))` (stored, not coverage).
- generate(): `editor.transcript.setDoc(document)` (store persists v2); drop the manual
  saveTranscript call.
- mount load: `storageService.loadTranscript` → `migrateTranscript({ stored, tracks:
  editor.scenes.getActiveSceneOrNull()?.tracks ?? null })` → `editor.transcript.setDoc(migrated)`.
  Skip if the store already has a doc.
- seek + active word via mapping.ts: seek `editor.playback.seek({ time: sourceToTimeline({
  sourceSeconds: word.start, deletedRanges: doc.deletedRanges }) })`; active word from
  `buildWordTimeline(doc)` comparing `currentTimeTicks` to each word's [tStart,tEnd).
- delete: build contiguous runs from selected non-deleted words (group by consecutive
  flatWords index → `{ wordIds, startSeconds: first.start, endSeconds: last.end }`) and call
  `dispatchTranscriptEdit({ editor, edit: { kind: "delete", runs } })`. Same for filler runs.
- restore: clicking a struck word finds the DeletedRange containing it (with
  `removed.length > 0`) and calls `dispatchTranscriptEdit({ editor, edit: { kind: "restore",
  rangeId } })`. In TranscriptView, make struck words clickable (drop `disabled={isDeleted}`)
  with a "click to restore" affordance; pre-v2 cuts (no owning range) stay non-restorable.
- text edit (commitWordEdit): `editor.transcript.setDoc(next)`; keep outside the undo stack.

In-app checklist (the part autonomous testing can't cover): generate a transcript on a
clip; select a sentence → Delete → the words strike through AND the timeline ripples
(gap closes, later content shifts left); play → the active-word highlight tracks correctly
post-cut; click a struck word → media returns and words un-strike; Cmd+Z → both timeline
and transcript revert in one step; reload → transcript + cuts persist; export → deleted
audio is gone.

## Risks / limitations

Direct timeline edits drift the mapping (documented; identity-seek fallback). Reconstruction
fidelity depends on capturing the whole element object (round-trip test is the gate). Missing
source media → "cannot restore" path. Tick drift avoided by reusing integer `durationTicks`/
`offsetTicks` verbatim. Pre-v2 cuts permanent. Adjacent/overlapping cuts: store
`gapStartTimeline` relative to the already-compacted timeline (multi-cut test).
