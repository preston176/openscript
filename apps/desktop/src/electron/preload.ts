const { contextBridge, ipcRenderer } = require("electron");

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
  onExtractionProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on("extraction-progress", (_event: any, progress: any) =>
      callback(progress)
    );
  },
  onTranscriptionProgress: (callback: (status: string) => void) => {
    ipcRenderer.on("transcription-progress", (_event: any, status: string) =>
      callback(status)
    );
  },
});
