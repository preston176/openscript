"use client";

import { useState } from "react";
import { Toolbar } from "@/components/editor/toolbar";
import { MediaLibrary } from "@/components/editor/media-library";
import { VideoPreview } from "@/components/editor/video-preview";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { TranscriptEditor } from "@/components/editor/transcript-editor";
import { Timeline } from "@/components/editor/timeline";

export interface TranscriptSegment {
    id: string;
    text: string;
    startTime: number;
    endTime: number;
    deleted?: boolean;
}

export default function EditorPage() {
    const [segments, setSegments] = useState<TranscriptSegment[]>([
        {
            id: "1",
            text: "Welcome to our local-first video editor. This is a revolutionary way to edit video content.",
            startTime: 0,
            endTime: 5,
        },
        {
            id: "2",
            text: "Simply edit the text transcript, and the video automatically updates. No complex timeline editing needed.",
            startTime: 5,
            endTime: 11,
        },
        {
            id: "3",
            text: "Delete a paragraph, and that section is removed from your video. It's that simple.",
            startTime: 11,
            endTime: 16,
        },
        {
            id: "4",
            text: "Everything runs locally on your machine. Your footage never touches the cloud.",
            startTime: 16,
            endTime: 21,
        },
    ]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const handleDeleteSegment = (id: string) => {
        setSegments((prev) =>
            prev.map((seg) => (seg.id === id ? { ...seg, deleted: !seg.deleted } : seg))
        );
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const totalDuration = segments
        .filter((s) => !s.deleted)
        .reduce((acc, s) => acc + (s.endTime - s.startTime), 0);

    return (
        <div className="h-screen bg-black flex flex-col overflow-hidden">
            {/* Toolbar */}
            <Toolbar totalDuration={totalDuration} />

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Media Library */}
                <MediaLibrary />

                {/* Center - Video Preview */}
                <div className="flex-1 flex flex-col border-x border-white/10">
                    <VideoPreview
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                        onPlayPause={handlePlayPause}
                    />

                    {/* Bottom Section - Transcript & Timeline */}
                    <div className="flex-1 flex flex-col border-t border-white/10 bg-zinc-950">
                        <TranscriptEditor
                            segments={segments}
                            onDeleteSegment={handleDeleteSegment}
                            currentTime={currentTime}
                        />
                        <Timeline
                            segments={segments}
                            isPlaying={isPlaying}
                            currentTime={currentTime}
                            onTimeUpdate={setCurrentTime}
                        />
                    </div>
                </div>

                {/* Right Sidebar - Properties */}
                <PropertiesPanel />
            </div>
        </div>
    );
}
