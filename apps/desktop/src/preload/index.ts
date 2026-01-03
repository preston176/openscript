import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // File operations
    selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
    
    // Future: FFmpeg operations
    extractAudio: (videoPath: string) => ipcRenderer.invoke('extract-audio', videoPath),
    
    // Future: Transcription
    transcribe: (audioPath: string) => ipcRenderer.invoke('transcribe', audioPath),
    
    // Future: Export
    exportVideo: (config: any) => ipcRenderer.invoke('export-video', config),
});
