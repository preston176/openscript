# Electron + React + TypeScript + Vite

A modern cross-platform desktop application boilerplate using **Electron**, **React 19**, **TypeScript**, and **Vite**. This project provides a fast, maintainable, and scalable environment for building desktop apps with a web technology stack.

---

## Features

- ⚡ **Vite** for lightning-fast React development and HMR
- 🖥️ **Electron** for native desktop app capabilities
- 🛠️ **TypeScript** for type safety across the stack
- 🧹 **ESLint** for code quality and consistency
- 📦 **electron-builder** for easy packaging and distribution (Windows, macOS, Linux)
- 🔄 Unified dev workflow for both renderer (React) and main (Electron) processes

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

```bash
npm install
```

### Development

Start both the React renderer and Electron main process in parallel:

```bash
npm run dev
```

- React app runs on [http://localhost:5123](http://localhost:5123)
- Electron loads the local dev server for live reload

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

### Building for Production

Build both the React frontend and Electron main process:

```bash
npm run build
```

### Packaging

Create distributable binaries for your platform:

- **Windows**:  
  `npm run dist:win`
- **macOS**:  
  `npm run dist:mac`
- **Linux**:  
  `npm run dist:linux`

Output files are placed in the `dist-electron` and `dist-react` folders.

---

## Project Structure

```
├── src/
│   ├── electron/      # Electron main process (TypeScript)
│   │   ├── main.ts
│   │   └── util.ts
│   └── ui/            # React renderer process (TypeScript)
│       ├── App.tsx
│       ├── main.tsx
│       └── assets/
├── dist-electron/     # Compiled Electron main process
├── dist-react/        # Built React app (renderer)
├── electron-builder.json
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

---

## Scripts

| Script       | Description                                  |
| ------------ | -------------------------------------------- |
| `dev`        | Start React and Electron in development mode |
| `build`      | Build both Electron and React for production |
| `lint`       | Run ESLint on the codebase                   |
| `preview`    | Preview the production React build           |
| `dist:win`   | Package app for Windows                      |
| `dist:mac`   | Package app for macOS                        |
| `dist:linux` | Package app for Linux                        |

---

## Configuration

- **Electron entry**: `dist-electron/main.js`
- **React build output**: `dist-react/`
- **Icons**: Set in `electron-builder.json` (`desktopIcon.png`)
- **Port**: React dev server runs on `5123` (see `vite.config.ts`)

---

## Customization

- Update the Electron main process in `src/electron/main.ts`
- Modify the React UI in `src/ui/`
- Adjust build targets and packaging in `electron-builder.json`
- Extend ESLint rules in `eslint.config.js`

---

## License

This project is private and not intended for public distribution.

---

## Credits

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [electron-builder](https://www.electron.build/)
