import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { ExtractionProgress, ExportProgress, ExportOptions } from '../types.js';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  selectVideoFile: () => ipcRenderer.invoke("select-video-file"),
  extractAudio: (videoPath: string) =>
    ipcRenderer.invoke("extract-audio", videoPath),
  readAudioFile: (audioPath: string) =>
    ipcRenderer.invoke("read-audio-file", audioPath),
  getCacheDir: () => ipcRenderer.invoke("get-cache-dir"),
  transcribeAudio: (audioPath: string) =>
    ipcRenderer.invoke("transcribe-audio", audioPath),
  exportVideo: (options: ExportOptions) =>
    ipcRenderer.invoke("export-video", options),
  onExtractionProgress: (callback: (progress: ExtractionProgress) => void) => {
    ipcRenderer.on("extraction-progress", (_event: IpcRendererEvent, progress: ExtractionProgress) =>
      callback(progress)
    );
  },
  onTranscriptionProgress: (callback: (status: string) => void) => {
    ipcRenderer.on("transcription-progress", (_event: IpcRendererEvent, status: string) =>
      callback(status)
    );
  },
  onExportProgress: (callback: (progress: ExportProgress) => void) => {
    ipcRenderer.on("export-progress", (_event: IpcRendererEvent, progress: ExportProgress) =>
      callback(progress)
    );
  },
});
