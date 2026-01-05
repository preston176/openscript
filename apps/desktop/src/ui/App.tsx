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

  // Transcription state
  const [transcript, setTranscript] = useState<any>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>('');
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);

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

  const handleTranscribe = async () => {
    if (!audioPath) return;

    setIsTranscribing(true);
    setTranscriptionStatus('Initializing...');
    setTranscriptionProgress(0);

    try {
      // Create web worker
      const worker = new Worker(
        new URL('./workers/whisper.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Handle messages from worker
      worker.onmessage = (e) => {
        const { type, message, transcript: result, error } = e.data;

        switch (type) {
          case 'loading':
            setTranscriptionStatus(message);
            setTranscriptionProgress(10);
            break;
          case 'loaded':
            setTranscriptionStatus(message);
            setTranscriptionProgress(30);
            break;
          case 'transcribing':
            setTranscriptionStatus(message);
            setTranscriptionProgress(50);
            break;
          case 'complete':
            setTranscript(result);
            setTranscriptionStatus('Transcription complete!');
            setTranscriptionProgress(100);
            setIsTranscribing(false);
            worker.terminate();
            break;
          case 'error':
            console.error('Transcription error:', error);
            alert(`Transcription failed: ${error}`);
            setIsTranscribing(false);
            setTranscriptionStatus('');
            setTranscriptionProgress(0);
            worker.terminate();
            break;
        }
      };

      // Handle worker errors
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        alert(`Worker error: ${error.message}`);
        setIsTranscribing(false);
        setTranscriptionStatus('');
        setTranscriptionProgress(0);
        worker.terminate();
      };

      // Send audio path to worker
      worker.postMessage({ audioPath });

    } catch (error) {
      console.error('Error starting transcription:', error);
      alert(`Failed to start transcription: ${error}`);
      setIsTranscribing(false);
      setTranscriptionStatus('');
      setTranscriptionProgress(0);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>OpenScript</h1>
        <span className="badge">Phase 2: Transcription</span>
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

            {/* Transcription Section */}
            {audioPath && (
              <div className="transcription-section">
                <button
                  onClick={handleTranscribe}
                  disabled={isTranscribing || !!transcript}
                  className="btn-primary"
                >
                  {isTranscribing
                    ? `${transcriptionStatus} ${transcriptionProgress}%`
                    : transcript
                      ? "Transcription Complete ✓"
                      : "Start Transcription"}
                </button>

                {/* Transcript Display */}
                {transcript && (
                  <div className="transcript-container">
                    <h3>Transcript</h3>
                    <div className="transcript-text">
                      {transcript.text || JSON.stringify(transcript, null, 2)}
                    </div>
                    {transcript.chunks && transcript.chunks.length > 0 && (
                      <div className="transcript-segments">
                        <h4>Segments with Timestamps</h4>
                        {transcript.chunks.map((chunk: any, index: number) => (
                          <div key={index} className="segment">
                            <span className="timestamp">
                              [{chunk.timestamp[0].toFixed(2)}s - {chunk.timestamp[1].toFixed(2)}s]
                            </span>
                            <span className="text">{chunk.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
