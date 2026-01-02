# OpenScript

An open-source, local-first video editor that enables text-based video editing. Edit your videos by editing the transcript—delete a paragraph, and the corresponding video segment is automatically removed.

## Overview

OpenScript is the open-source alternative to Descript. Built with Next.js, it demonstrates a novel approach to video editing where users edit videos by modifying a synchronized transcript. This approach significantly reduces the complexity of video editing for content creators, podcasters, and educators.

## Key Features

### Text-Based Editing
Edit video content by modifying the transcript. Changes to the text automatically reflect in the video timeline, eliminating the need for complex timeline manipulation.

### Local-First Architecture
All processing happens in your browser. Your video files never leave your machine, ensuring complete privacy and eliminating upload times.

### Real-Time Synchronization
The transcript, timeline, and video preview remain synchronized at all times. Active segments are highlighted during playback for easy navigation.

### Professional Export
Export your edited videos in multiple formats (MP4, MOV, WebM) with configurable quality settings (1080p, 720p, 480p).

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- Node.js 18.x or higher (or Bun 1.x)
- Modern web browser with HTML5 video support

### Installation

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
# or
npm run dev
```

The application will be available at `http://localhost:3000`.

### Editor Access

Navigate to `http://localhost:3000/editor` to access the video editor interface.

## Project Structure

```
openscript/
├── app/
│   ├── editor/          # Video editor page
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
├── components/
│   ├── editor/          # Editor-specific components
│   │   ├── export-modal.tsx
│   │   ├── media-library.tsx
│   │   ├── properties-panel.tsx
│   │   ├── timeline.tsx
│   │   ├── toolbar.tsx
│   │   ├── transcript-editor.tsx
│   │   └── video-preview.tsx
│   ├── ui/              # Reusable UI components
│   ├── bento-grid.tsx
│   ├── demo-section.tsx
│   ├── features-section.tsx
│   ├── footer.tsx
│   └── hero-section.tsx
└── lib/
    └── utils.ts         # Utility functions
```

## Usage

### Landing Page

The landing page (`/`) showcases the product features and value proposition. It includes:

- Hero section with email capture for waitlist
- Feature highlights in a bento grid layout
- Interactive demo section
- Comprehensive features showcase

### Video Editor

The editor interface (`/editor`) provides:

1. **Video Preview**: Central video player with playback controls
2. **Transcript Editor**: Editable text blocks with timestamps
3. **Timeline**: Visual representation of video segments
4. **Media Library**: Sidebar for managing media files
5. **Properties Panel**: Settings for volume, speed, and effects
6. **Export Modal**: Configuration for video export

### Editing Workflow

1. Load a video file (currently configured for external URL)
2. Review the synchronized transcript
3. Edit or delete transcript paragraphs as needed
4. Observe real-time updates in the timeline
5. Export the edited video with your preferred settings

## Configuration

### Video Source

The video source can be configured in `components/editor/video-preview.tsx`:

```tsx
<source src="YOUR_VIDEO_URL" type="video/mp4" />
```

For local files, place your video in the `public/` directory and reference it as:

```tsx
<source src="/your-video.mp4" type="video/mp4" />
```

## Development

### Building for Production

```bash
bun run build
# or
npm run build
```

### Running Production Build

```bash
bun start
# or
npm start
```

## Roadmap

This is a prototype demonstrating the core concept of text-based video editing. Future enhancements may include:

- Actual video processing and export functionality
- Speech-to-text integration for automatic transcription
- Multi-track audio support
- Advanced editing features (transitions, effects)
- Collaborative editing capabilities

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with descriptive messages
4. Push to your branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

Inspired by Descript and other modern video editing tools that prioritize user experience and workflow efficiency.

## Support

For questions, issues, or feature requests, please open an issue on GitHub.
