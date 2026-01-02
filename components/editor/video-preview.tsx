"use client";

import { useRef, useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPreviewProps {
    isPlaying: boolean;
    currentTime: number;
    onPlayPause: () => void;
}

export function VideoPreview({ isPlaying, currentTime, onPlayPause }: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoLoaded, setVideoLoaded] = useState(false);

    // Sync video playback with isPlaying prop
    useEffect(() => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    }, [isPlaying]);

    // Sync video currentTime with prop
    useEffect(() => {
        if (!videoRef.current) return;
        const diff = Math.abs(videoRef.current.currentTime - currentTime);
        // Only update if difference is significant to avoid constant updates
        if (diff > 0.5) {
            videoRef.current.currentTime = currentTime;
        }
    }, [currentTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="h-full bg-black flex flex-col">
            {/* Video Preview Area */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-4">
                <div className="relative w-full h-full max-w-4xl bg-zinc-900 rounded-lg overflow-hidden border border-white/10">
                    {/* Actual Video Element */}
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain bg-black"
                        loop
                        muted
                        playsInline
                        crossOrigin="anonymous"
                        onLoadedData={() => setVideoLoaded(true)}
                        onCanPlay={() => setVideoLoaded(true)}
                        onError={(e) => {
                            console.error('Video load error:', e);
                            setVideoLoaded(true); // Show video element even on error
                        }}
                    >
                        <source src="https://ajbk6cdk7t.ufs.sh/f/bj0QrlC8Kw5DKQDqbnSbA4tIxXChouHgsJ1mqQVTp9YGN3c2" type="video/mp4" />
                    </video>

                    {/* Fallback if video fails to load */}
                    {!videoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                            <div className="text-center text-zinc-400 text-sm">
                                Loading video...
                            </div>
                        </div>
                    )}

                    {/* Play/Pause Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                        <Button
                            variant="ghost"
                            className="w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm p-0"
                            onClick={onPlayPause}
                        >
                            {isPlaying ? (
                                <Pause className="w-8 h-8 text-white" />
                            ) : (
                                <Play className="w-8 h-8 text-white ml-1" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="h-16 flex-shrink-0 border-t border-white/10 bg-zinc-900 flex items-center px-6 gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPlayPause}
                    className="text-white hover:bg-white/10"
                >
                    {isPlaying ? (
                        <Pause className="w-5 h-5" />
                    ) : (
                        <Play className="w-5 h-5" />
                    )}
                </Button>

                <div className="text-sm text-zinc-400 font-mono">
                    {formatTime(currentTime)}
                </div>

                {/* Progress Bar */}
                <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{ width: `${(currentTime / 21) * 100}%` }}
                    />
                </div>

                <div className="text-sm text-zinc-400 font-mono">
                    {formatTime(21)}
                </div>
            </div>
        </div>
    );
}
