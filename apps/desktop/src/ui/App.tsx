import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import type { TranscriptResult } from '../types.js'
import { useToasts, showToast } from './utils/toast.js'
import { ToastContainer } from './components/ToastContainer.js'
import { TranscriptEditor } from './components/TranscriptEditor.js'
import { Timeline } from './components/Timeline.js'
import { ExportDialog } from './components/ExportDialog.js'
import { useTranscriptEditor } from './hooks/useTranscriptEditor.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { transcriptToSegments, getTotalDuration } from '../types/editor.js'

function App() {
  const { toasts, removeToast } = useToasts();
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Transcription state
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>('');
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);

  // Editor state
  const editor = useTranscriptEditor();
  const totalDuration = getTotalDuration(editor.segments);

  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Update video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoPath]);

  // Seek video to time
  const handleSeekToTime = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // Toggle play/pause
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // Save project (stub for now)
  const handleSave = useCallback(() => {
    showToast('Project saved!', 'success');
  }, []);

  // Delete selected segment
  const handleDeleteSelected = useCallback(() => {
    if (editor.selectedSegmentId) {
      const segment = editor.segments.find(s => s.id === editor.selectedSegmentId);
      if (segment && !segment.deleted) {
        editor.deleteSegment(editor.selectedSegmentId);
      }
    }
  }, [editor]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: editor.undo,
    onRedo: editor.redo,
    onDelete: handleDeleteSelected,
    onPlayPause: handlePlayPause,
    onSave: handleSave,
    onEscape: () => editor.selectSegment(null),
    enabled: !!transcript,
  });

  const handleSelectVideo = async () => {
    try {
      const path = await window.electron.selectVideoFile();
      if (path) {
        setVideoPath(path);
        setAudioPath(null);
        setTranscript(null);
        editor.reset();
      }
    } catch (error) {
      console.error("Error selecting video:", error);
      showToast('Failed to select video file', 'error');
    }
  };

  const handleExtractAudio = async () => {
    if (!videoPath) return;

    setIsExtracting(true);
    setExtractionProgress(0);

    window.electron.onExtractionProgress((progress) => {
      setExtractionProgress(Math.round(progress.percent || 0));
    });

    try {
      const audio = await window.electron.extractAudio(videoPath);
      setAudioPath(audio);
      console.log("Audio extracted to:", audio);
    } catch (error) {
      console.error("Error extracting audio:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract audio';
      showToast(errorMessage, 'error');
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
      window.electron.onTranscriptionProgress((status: string) => {
        setTranscriptionStatus(status);
        if (status.includes('Loading')) {
          setTranscriptionProgress(10);
        } else if (status.includes('loaded')) {
          setTranscriptionProgress(30);
        } else if (status.includes('Transcribing')) {
          setTranscriptionProgress(50);
        }
      });

      const result = await window.electron.transcribeAudio(audioPath);
      console.log('Transcription result received:', result);
      console.log('Has chunks?', result.chunks);
      console.log('Chunks length:', result.chunks?.length);

      setTranscript(result);
      setTranscriptionStatus('Transcription complete!');
      setTranscriptionProgress(100);

      // Convert transcript to editable segments
      if (result.chunks && result.chunks.length > 0) {
        console.log('Converting chunks to segments...');
        const segments = transcriptToSegments(result.chunks);
        console.log('Created segments:', segments.length);
        editor.setSegments(segments);
        showToast('Transcription complete! You can now edit the transcript.', 'success');
      } else {
        console.warn('No chunks in transcription result!');
        showToast('Transcription completed but no segments found', 'warning');
      }
    } catch (error) {
      console.error('Error starting transcription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start transcription';
      showToast(errorMessage, 'error');
      setTranscriptionStatus('');
      setTranscriptionProgress(0);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>OpenScript</h1>
        <span className="badge">Phase 4: Export</span>
        {editor.isModified && <span className="modified-badge">Modified</span>}
        {transcript && (
          <div className="header-actions">
            <button
              className="btn-icon"
              onClick={editor.undo}
              disabled={!editor.canUndo}
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              className="btn-icon"
              onClick={editor.redo}
              disabled={!editor.canRedo}
              title="Redo (Ctrl+Y)"
            >
              ↷
            </button>
            <button
              className="btn-export"
              onClick={() => setShowExportDialog(true)}
              disabled={editor.getActiveSegments().length === 0}
              title="Export edited video"
            >
              Export
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="main">
        {!videoPath ? (
          <div className="welcome">
            <div className="icon-circle">
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="editor-layout">
            {/* Left Panel - Video */}
            <div className="video-panel">
              <div className="video-info">
                <div>
                  <p className="label">Selected file:</p>
                  <p className="path">{videoPath.split('/').pop()}</p>
                </div>
                <button onClick={handleSelectVideo} className="btn-secondary">
                  Change
                </button>
              </div>

              <div className="video-preview">
                <video
                  ref={videoRef}
                  src={`local-file://${videoPath}`}
                  controls
                />
              </div>

              {/* Timeline */}
              {transcript && editor.segments.length > 0 && (
                <Timeline
                  segments={editor.segments}
                  currentTime={currentTime}
                  totalDuration={totalDuration > 0 ? totalDuration : (videoRef.current?.duration || 0)}
                  selectedSegmentId={editor.selectedSegmentId}
                  onSeek={handleSeekToTime}
                  onSelectSegment={editor.selectSegment}
                />
              )}

              {/* Actions */}
              <div className="actions">
                {!audioPath ? (
                  <button
                    onClick={handleExtractAudio}
                    disabled={isExtracting}
                    className="btn-primary"
                  >
                    {isExtracting
                      ? `Extracting Audio... ${extractionProgress}%`
                      : "Extract Audio for Transcription"}
                  </button>
                ) : !transcript ? (
                  <button
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                    className="btn-primary"
                  >
                    {isTranscribing
                      ? `${transcriptionStatus} ${transcriptionProgress}%`
                      : "Start Transcription"}
                  </button>
                ) : (
                  <div className="success-badge">
                    <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Ready to edit!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Transcript Editor */}
            {transcript && editor.segments.length > 0 && (
              <div className="transcript-panel">
                <div className="panel-header">
                  <h3>Transcript</h3>
                  <span className="segment-count">
                    {editor.getActiveSegments().length} / {editor.segments.length} segments
                  </span>
                </div>
                <TranscriptEditor
                  segments={editor.segments}
                  selectedSegmentId={editor.selectedSegmentId}
                  onEditSegment={editor.editSegment}
                  onDeleteSegment={editor.deleteSegment}
                  onRestoreSegment={editor.restoreSegment}
                  onSelectSegment={editor.selectSegment}
                  onSeekToTime={handleSeekToTime}
                />
              </div>
            )}
          </div>
        )}
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Export Dialog */}
      {showExportDialog && videoPath && (
        <ExportDialog
          videoPath={videoPath}
          segments={editor.segments}
          onClose={() => setShowExportDialog(false)}
          onExportComplete={(outputPath) => {
            setShowExportDialog(false);
            showToast(`Video exported to ${outputPath}`, 'success');
          }}
        />
      )}
    </div>
  );
}

export default App;
