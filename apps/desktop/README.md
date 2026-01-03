# OpenScript Desktop

The desktop application for OpenScript - local-first video editing.

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun dev

# Build for production
bun run build

# Package for distribution
bun run package
```

## Features (Planned)

- ✅ Local video file processing (no size limits)
- ✅ Automatic transcription with Whisper
- ✅ Text-based video editing
- ✅ Export edited videos
- ✅ 100% offline capable

## Tech Stack

- **Framework**: Electron
- **UI**: React + Tailwind CSS
- **Video Processing**: Native FFmpeg
- **Transcription**: transformers.js + Whisper
- **Language**: TypeScript

## Project Structure

```
src/
├── main/           # Electron main process
├── renderer/       # React UI
└── preload/        # IPC bridge
```

## Status

🚧 **In Development** - Phase 1: Foundation
