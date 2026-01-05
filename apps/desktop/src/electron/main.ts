import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { isDev } from "./util.js";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath() + "/dist-react/index.html"));
  }
});

// IPC Handler: Select video file
ipcMain.handle("select-video-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Videos",
        extensions: ["mp4", "mov", "avi", "mkv", "webm", "m4v", "flv"],
      },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// IPC Handler: Extract audio from video
ipcMain.handle("extract-audio", async (event, videoPath: string) => {
  try {
    const { extractAudio } = await import("./ffmpeg.js");
    
    const audioPath = await extractAudio(videoPath, (progress) => {
      // Send progress updates to renderer
      if (mainWindow) {
        mainWindow.webContents.send("extraction-progress", progress);
      }
    });
    
    return audioPath;
  } catch (error) {
    console.error("Audio extraction error:", error);
    throw error;
  }
});

// Cleanup temp files on app quit
app.on("before-quit", async () => {
  const { cleanupTempFiles } = await import("./ffmpeg.js");
  cleanupTempFiles();
});

