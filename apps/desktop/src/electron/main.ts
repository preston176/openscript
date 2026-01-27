import { app, BrowserWindow, dialog, ipcMain, protocol } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { isDev } from "./util.js";
import fs from "fs";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Register protocol to serve local files
app.whenReady().then(() => {
  protocol.registerFileProtocol('local-file', (request, callback) => {
    const url = request.url.replace('local-file://', '');
    const decodedPath = decodeURIComponent(url);
    callback({ path: decodedPath });
  });
});

app.on("ready", () => {
  const preloadPath = path.join(__dirname, "preload.js");
  console.log("Preload path:", preloadPath);
  console.log("__dirname:", __dirname);
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
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

// IPC Handler: Read audio file for transcription
ipcMain.handle("read-audio-file", async (_event, audioPath: string) => {
  try {
    const audioData = fs.readFileSync(audioPath);
    return audioData.buffer;
  } catch (error) {
    console.error("Error reading audio file:", error);
    throw error;
  }
});

// IPC Handler: Get cache directory for models
ipcMain.handle("get-cache-dir", async () => {
  const cacheDir = path.join(app.getPath("userData"), "models");
  // Ensure directory exists
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
});

// IPC Handler: Transcribe audio file
ipcMain.handle("transcribe-audio", async (event, audioPath: string) => {
  try {
    const { transcribeAudio } = await import("./transcribe.js");
    
    // Send progress updates with safety check
    const sendProgress = (status: string) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        try {
          mainWindow.webContents.send("transcription-progress", status);
        } catch (err) {
          console.warn("Could not send progress update:", err);
        }
      }
    };
    
    const result = await transcribeAudio(audioPath, sendProgress);
    console.log("Transcription result:", JSON.stringify(result).substring(0, 200));
    return result;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
});

// IPC Handler: Export edited video
ipcMain.handle("export-video", async (event, options: {
  videoPath: string;
  segments: Array<{ startTime: number; endTime: number; deleted: boolean }>;
  outputPath?: string;
  format?: 'mp4' | 'mov' | 'webm';
  quality?: 'low' | 'medium' | 'high';
}) => {
  try {
    const { exportEditedVideo, getDefaultOutputPath } = await import("./export.js");
    
    // Get output path from dialog if not provided
    let outputPath = options.outputPath;
    if (!outputPath) {
      const defaultPath = getDefaultOutputPath(options.videoPath, options.format || 'mp4');
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Export Edited Video',
        defaultPath,
        filters: [
          { name: 'MP4 Video', extensions: ['mp4'] },
          { name: 'MOV Video', extensions: ['mov'] },
          { name: 'WebM Video', extensions: ['webm'] },
        ],
      });
      
      if (result.canceled || !result.filePath) {
        return { canceled: true };
      }
      outputPath = result.filePath;
    }
    
    // Export the video
    const exportedPath = await exportEditedVideo(
      options.videoPath,
      options.segments,
      outputPath,
      {
        format: options.format || 'mp4',
        quality: options.quality || 'high',
      },
      undefined,
      mainWindow || undefined
    );
    
    return { success: true, outputPath: exportedPath };
  } catch (error) {
    console.error("Error exporting video:", error);
    throw error;
  }
});

// Cleanup temp files on app quit
app.on("before-quit", async () => {
  const { cleanupTempFiles } = await import("./ffmpeg.js");
  cleanupTempFiles();
});
