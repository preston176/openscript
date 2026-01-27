import { useState, useRef, useEffect, forwardRef } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
    videoPath?: string;
    currentTime?: number;
    onTimeUpdate?: (time: number) => void;
    onSeek?: (time: number) => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
    ({ videoPath, currentTime = 0, onTimeUpdate, onSeek }, ref) => {
        const internalVideoRef = useRef<HTMLVideoElement>(null);
        const videoRef = (ref as React.RefObject<HTMLVideoElement>) || internalVideoRef;

        const [isPlaying, setIsPlaying] = useState(false);
        const [duration, setDuration] = useState(0);
        const [volume, setVolume] = useState(1);
        const [isMuted, setIsMuted] = useState(false);
        const [playbackRate, setPlaybackRate] = useState(1);
        const [localTime, setLocalTime] = useState(0);

        useEffect(() => {
            if (videoRef.current && currentTime !== undefined) {
                videoRef.current.currentTime = currentTime;
            }
        }, [currentTime]);

        const togglePlay = async () => {
            if (!videoRef.current) return;

            try {
                if (isPlaying) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                } else {
                    await videoRef.current.play();
                    setIsPlaying(true);
                }
            } catch (error) {
                // Ignore AbortError - happens when play/pause is called rapidly
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Video playback error:', error);
                }
            }
        };

        const handleTimeUpdate = () => {
            if (!videoRef.current) return;
            const time = videoRef.current.currentTime;
            setLocalTime(time);
            onTimeUpdate?.(time);
        };

        const handleLoadedMetadata = () => {
            if (!videoRef.current) return;
            setDuration(videoRef.current.duration);
        };

        const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!videoRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const time = percent * duration;
            videoRef.current.currentTime = time;
            setLocalTime(time);
            onSeek?.(time);
        };

        const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setVolume(percent);
            if (videoRef.current) {
                videoRef.current.volume = percent;
            }
            if (percent > 0) setIsMuted(false);
        };

        const toggleMute = () => {
            if (!videoRef.current) return;
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            videoRef.current.muted = newMuted;
        };

        const cyclePlaybackRate = () => {
            const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
            const currentIndex = rates.indexOf(playbackRate);
            const nextRate = rates[(currentIndex + 1) % rates.length];
            setPlaybackRate(nextRate);
            if (videoRef.current) {
                videoRef.current.playbackRate = nextRate;
            }
        };

        const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        return (
            <div className="video-player">
                <div className="video-player__preview">
                    {videoPath ? (
                        <video
                            ref={videoRef}
                            src={videoPath}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />
                    ) : (
                        <div className="video-player__placeholder">
                            <svg className="video-player__placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <div>
                                <div style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>No video loaded</div>
                                <div style={{ fontSize: 'var(--text-sm)' }}>Select a video file to begin editing</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="video-player__controls">
                    <div className="video-player__timeline">
                        <span className="video-player__time">{formatTime(localTime)}</span>
                        <div className="video-player__progress" onClick={handleSeek}>
                            <div
                                className="video-player__progress-bar"
                                style={{ width: `${(localTime / duration) * 100}%` }}
                            >
                                <div className="video-player__progress-handle" />
                            </div>
                        </div>
                        <span className="video-player__time">{formatTime(duration)}</span>
                    </div>

                    <div className="video-player__buttons">
                        <button
                            className="video-player__button video-player__button--primary"
                            onClick={togglePlay}
                            disabled={!videoPath}
                        >
                            {isPlaying ? (
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </button>

                        <div className="video-player__volume">
                            <button className="video-player__button" onClick={toggleMute}>
                                {isMuted || volume === 0 ? (
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    </svg>
                                ) : (
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    </svg>
                                )}
                            </button>
                            <div className="video-player__volume-slider" onClick={handleVolumeChange}>
                                <div
                                    className="video-player__volume-bar"
                                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="video-player__spacer" />

                        <div className="video-player__speed" onClick={cyclePlaybackRate}>
                            {playbackRate}x
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

VideoPlayer.displayName = 'VideoPlayer';
