# OpenScript

**Edit video by editing the transcript.**

Delete a sentence in the text, the cut happens automatically on the timeline. Privacy-first: transcription runs locally in the browser via Whisper.

## Project structure

- `apps/web/` — The Next.js web editor: timeline, preview, WebCodecs export, and the transcript-edit panel under `apps/web/src/transcript-editor/`.
- `apps/desktop/` — Placeholder native shell (Rust + GPUI). Not part of the launch; the product is the web editor.
- `apps/website/` — Landing page (Next.js). Serves `/` and proxies `/app` to the editor (Multi-Zones).
- `rust/` — GPU compositor, effects, masks, and WASM bindings.
- `docs/` — Architecture documentation.

## Getting started

The editor runs entirely in your browser — no backend required. Projects, media, and
transcripts are stored locally (IndexedDB/OPFS), and transcription runs on-device via
Whisper.

```bash
bun install
bun run dev:web                  # Editor at http://localhost:3000/app
```

That's all you need to edit video. Postgres + Redis are only required for the optional
**auth**, **feedback**, and **sound-search** API routes (these fail gracefully when the
services are absent). To enable them:

```bash
cp apps/web/.env.example apps/web/.env.local       # set secrets as needed
docker compose up -d db redis serverless-redis-http
docker compose run --rm migrate                    # create the auth/feedback tables
```

The marketing site is separate: `cd apps/website && bun dev`.

## License

MIT.
