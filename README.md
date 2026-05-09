# OpenScript

**A fork of [OpenCut](https://github.com/opencut-app/opencut) that adds Descript-style text-based video editing.**

Edit video by editing the transcript. Delete a sentence in the text, the cut happens automatically on the timeline. Privacy-first: transcription runs locally in the browser via Whisper.

## Relationship to OpenCut

This is a hard fork. OpenCut provides the timeline, preview, WebCodecs export pipeline, and a baseline Whisper-in-Worker transcription service used for subtitles. OpenScript adds:

- Word-level Whisper timestamps (extending OpenCut's segment-level transcription).
- A transcript-edit panel that drives real cuts on the timeline — when you delete words, the timeline elements get split and removed via OpenCut's command system.

To pull updates from OpenCut upstream:

```bash
git fetch opencut main
git merge opencut/main
```

The `opencut` remote is configured to `https://github.com/opencut-app/opencut.git`.

## Project structure

- `apps/web/` — OpenCut's Next.js web editor (upstream). The transcript-edit feature lives under `apps/web/src/transcript-editor/` (forthcoming).
- `apps/desktop/` — OpenCut's native desktop shell (Rust + GPUI, in progress upstream).
- `apps/website/` — OpenScript's marketing/waitlist site (Next.js). Independent from the editor.
- `rust/` — OpenCut's GPU compositor, effects, masks, and WASM bindings.
- `docs/` — OpenCut's architecture documentation.

## Getting started

See OpenCut's documentation in `apps/web/README.md` and `docs/` for the editor. See `apps/website/README.md` for the marketing site.

```bash
bun install
bun run dev:web                  # Editor at http://localhost:3000
cd apps/website && bun dev       # Marketing site
```

## License

MIT — same as upstream OpenCut.
