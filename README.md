# OpenScript

**Edit video by editing the transcript.**

Delete a sentence in the text, the cut happens automatically on the timeline. Privacy-first: transcription runs locally in the browser via Whisper.

## Project structure

- `apps/web/` — The Next.js web editor: timeline, preview, WebCodecs export, and the transcript-edit panel under `apps/web/src/transcript-editor/`.
- `apps/desktop/` — Native desktop shell (Rust + GPUI, in progress).
- `apps/website/` — Marketing/waitlist site (Next.js). Independent from the editor.
- `rust/` — GPU compositor, effects, masks, and WASM bindings.
- `docs/` — Architecture documentation.

## Getting started

The editor runs entirely in your browser — no backend required. Projects, media, and
transcripts are stored locally (IndexedDB/OPFS), and transcription runs on-device via
Whisper.

```bash
bun install
bun run dev:web                  # Editor at http://localhost:3000
```

That's all you need to edit video. Postgres + Redis are only required for the optional
**auth**, **feedback**, and **sound-search** API routes (these fail gracefully when the
services are absent). To enable them:

```bash
cp apps/web/.env.example apps/web/.env.local       # set secrets as needed
docker compose up -d db redis serverless-redis-http
cd apps/web && bun run db:migrate                  # create the auth/feedback tables
```

The marketing site is separate: `cd apps/website && bun dev`.

## License

MIT.
