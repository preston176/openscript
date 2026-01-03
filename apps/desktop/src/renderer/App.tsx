import React, { useState, useRef } from 'react';

interface ElectronAPI {
    selectVideoFile: () => Promise<string | null>;
    extractAudio: (videoPath: string) => Promise<string>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

function App() {
    const [videoPath, setVideoPath] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [audioPath, setAudioPath] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleSelectVideo = async () => {
        try {
            const path = await window.electron.selectVideoFile();
            if (path) {
                setVideoPath(path);
                setAudioPath(null);
            }
        } catch (error) {
            console.error('Error selecting video:', error);
        }
    };

    const handleExtractAudio = async () => {
        if (!videoPath) return;

        setIsExtracting(true);
        try {
            const audio = await window.electron.extractAudio(videoPath);
            setAudioPath(audio);
            console.log('Audio extracted to:', audio);
        } catch (error) {
            console.error('Error extracting audio:', error);
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <header className="h-14 border-b border-white/10 flex items-center px-6">
                <h1 className="text-lg font-semibold">OpenScript</h1>
                <div className="ml-auto text-xs text-zinc-500">Phase 1: Foundation</div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-8">
                {!videoPath ? (
                    <div className="text-center">
                        <div className="mb-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold mb-4">
                                Welcome to OpenScript
                            </h2>
                            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                                Edit video by editing text. 100% local, 100% free.
                                <br />
                                <span className="text-xs text-zinc-500 mt-2 block">
                                    No file size limits • Privacy-first • Powered by AI
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={handleSelectVideo}
                            className="px-8 py-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl shadow-blue-500/40"
                        >
                            Open Video File
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-5xl">
                        {/* Video Info */}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-500 mb-1">Selected file:</p>
                                <p className="text-zinc-300 font-mono text-sm truncate max-w-2xl">
                                    {videoPath}
                                </p>
                            </div>
                            <button
                                onClick={handleSelectVideo}
                                className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                            >
                                Change File
                            </button>
                        </div>

                        {/* Video Preview */}
                        <div className="aspect-video bg-zinc-900 rounded-lg border border-white/10 overflow-hidden mb-6">
                            <video
                                ref={videoRef}
                                src={`file://${videoPath}`}
                                controls
                                className="w-full h-full"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleExtractAudio}
                                disabled={isExtracting}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
                            >
                                {isExtracting ? 'Extracting Audio...' : 'Extract Audio for Transcription'}
                            </button>
                            {audioPath && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-green-300">Audio extracted!</span>
                                </div>
                            )}
                        </div>

                        {/* Next Steps Info */}
                        <div className="mt-8 p-4 bg-zinc-900/50 border border-white/5 rounded-lg">
                            <p className="text-sm text-zinc-400">
                                <strong className="text-zinc-300">Next:</strong> Phase 2 will add Whisper transcription to convert this audio into editable text.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
