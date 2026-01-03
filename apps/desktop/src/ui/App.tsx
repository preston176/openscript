import { useState } from 'react'
import './App.css'

// TypeScript declarations for Electron API
declare global {
  interface Window {
    electron: {
      selectVideoFile: () => Promise<string | null>;
      extractAudio: (videoPath: string) => Promise<string>;
      onExtractionProgress: (callback: (progress: any) => void) => void;
    };
  }
}

function App() {
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);

  const handleSelectVideo = async () => {
    try {
      const path = await window.electron.selectVideoFile();
      if (path) {
        setVideoPath(path);
        setAudioPath(null);
      }
    } catch (error) {
      console.error("Error selecting video:", error);
    }
  };

  const handleExtractAudio = async () => {
    if (!videoPath) return;

    setIsExtracting(true);
    setExtractionProgress(0);

    // Listen for progress updates
    window.electron.onExtractionProgress((progress) => {
      setExtractionProgress(Math.round(progress.percent || 0));
    });

    try {
      const audio = await window.electron.extractAudio(videoPath);
      setAudioPath(audio);
      console.log("Audio extracted to:", audio);
    } catch (error) {
      console.error("Error extracting audio:", error);
      alert(`Failed to extract audio: ${error}`);
    } finally {
      setIsExtracting(false);
      setExtractionProgress(0);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>OpenScript</h1>
        <span className="badge">Phase 1: Foundation</span>
      </header>

      {/* Main Content */}
      <main className="main">
        {!videoPath ? (
          <div className="welcome">
            <div className="icon-circle">
              <svg
                className="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2>Welcome to OpenScript</h2>
            <p className="subtitle">
              Edit video by editing text. 100% local, 100% free.
            </p>
            <p className="features">
              No file size limits • Privacy-first • Powered by AI
            </p>
            <button onClick={handleSelectVideo} className="btn-primary">
              Open Video File
            </button>
          </div>
        ) : (
          <div className="video-container">
            {/* Video Info */}
            <div className="video-info">
              <div>
                <p className="label">Selected file:</p>
                <p className="path">{videoPath}</p>
              </div>
              <button onClick={handleSelectVideo} className="btn-secondary">
                Change File
              </button>
            </div>

            {/* Video Preview */}
            <div className="video-preview">
              <video src={`file://${videoPath}`} controls />
            </div>

            {/* Actions */}
            <div className="actions">
              <button
                onClick={handleExtractAudio}
                disabled={isExtracting}
                className="btn-primary"
              >
                {isExtracting
                  ? `Extracting Audio... ${extractionProgress}%`
                  : "Extract Audio for Transcription"}
              </button>
              {audioPath && (
                <div className="success-badge">
                  <svg
                    className="check-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Audio extracted!</span>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="info-box">
              <p>
                <strong>Next:</strong> Phase 2 will add Whisper transcription
                to convert this audio into editable text.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
