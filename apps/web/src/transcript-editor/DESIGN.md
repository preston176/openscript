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

## Risks / limitations

Direct timeline edits drift the mapping (documented; identity-seek fallback). Reconstruction
fidelity depends on capturing the whole element object (round-trip test is the gate). Missing
source media → "cannot restore" path. Tick drift avoided by reusing integer `durationTicks`/
`offsetTicks` verbatim. Pre-v2 cuts permanent. Adjacent/overlapping cuts: store
`gapStartTimeline` relative to the already-compacted timeline (multi-cut test).
