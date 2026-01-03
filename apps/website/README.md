# OpenScript

The open-source, local-first alternative to Descript.

OpenScript is an upcoming video editor that enables text-based video editing. It runs entirely in your browser using local AI, ensuring your video files never leave your machine.

## Current Status

This repository currently hosts the Waitlist Landing Page and UI Concept Demos. 

The core video processing engine (FFmpeg.wasm + Whisper) is under active development.

## The Vision

We are solving the "CapCut Conundrum" and the "Descript Privacy Nightmare" simultaneously.

**Edit by Text**: Delete a sentence in the transcript, and the video cut happens automatically.

**100% Local**: Powered by WebAssembly and WebGPU. No cloud uploads, no monthly fees, no privacy risks.

**Open Source**: A tool for creators, built by creators.

## Technology Stack (Current)

This repository serves the landing page and UI mockups.

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **UI Components**: Shadcn/UI + Lucide React
- **Deployment**: Vercel

## Getting Started

Want to see the landing page and the UI concepts?

```bash
# Clone the repository
git clone https://github.com/preston176/openscript.git
cd openscript

# Install dependencies
bun install
# or
npm install

# Start the development server
bun run dev
```

Open http://localhost:3000 to view the landing page.

## Project Structure

```
openscript/
├── app/
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Waitlist Landing Page
├── components/
│   ├── landing/         # Landing page specific components
│   │   ├── hero.tsx     # Hero section with Email Capture
│   │   ├── bento.tsx    # Features grid
│   │   └── demo.tsx     # Interactive UI Mockup (The "Fake" Editor)
│   └── ui/              # Reusable UI components
└── public/              # Static assets
```

## Roadmap

We are building in public. Here is the plan:

### Phase 1: Validation

- [x] Launch High-Conversion Waitlist Page
- [x] Community gathering (Discord/GitHub)

### Phase 2: The Shell

- [ ] Build the functional UI Editor (Timeline, Text Editor, Media Bin) with mock data

### Phase 3: The Engine

- [ ] Integrate transformers.js for in-browser Whisper transcription
- [ ] Integrate ffmpeg.wasm for basic video trimming

### Phase 4: Alpha Release

- [ ] First usable build for waitlist members

## Contributing

While the core engine is being scaffolded, we welcome contributions to the Landing Page and UI Design:

1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

## License

This project is licensed under the MIT License.
