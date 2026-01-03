import React, { useState } from 'react';

function App() {
    const [videoPath, setVideoPath] = useState<string | null>(null);

    const handleSelectVideo = async () => {
        try {
            const path = await (window as any).electron.selectVideoFile();
            if (path) {
                setVideoPath(path);
            }
        } catch (error) {
            console.error('Error selecting video:', error);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <header className="h-14 border-b border-white/10 flex items-center px-6">
                <h1 className="text-lg font-semibold">OpenScript</h1>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-8">
                {!videoPath ? (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Welcome to OpenScript
                        </h2>
                        <p className="text-zinc-400 mb-8">
                            Edit video by editing text. 100% local, 100% free.
                        </p>
                        <button
                            onClick={handleSelectVideo}
                            className="px-8 py-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl shadow-blue-500/40"
                        >
                            Open Video File
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl">
                        <p className="text-zinc-400 mb-4">Selected: {videoPath}</p>
                        <div className="aspect-video bg-zinc-900 rounded-lg border border-white/10 flex items-center justify-center">
                            <p className="text-zinc-500">Video preview coming soon...</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
