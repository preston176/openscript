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

```bash
bun install
bun run dev:web                  # Editor at http://localhost:3000
cd apps/website && bun dev       # Marketing site
```

The editor needs Postgres + Redis for auth/rate-limiting — see `docker-compose.yml`.

## License

MIT.
