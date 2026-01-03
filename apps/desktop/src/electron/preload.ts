import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  selectVideoFile: () => ipcRenderer.invoke("select-video-file"),
  extractAudio: (videoPath: string) =>
    ipcRenderer.invoke("extract-audio", videoPath),
  onExtractionProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on("extraction-progress", (_event, progress) =>
      callback(progress)
    );
  },
});
