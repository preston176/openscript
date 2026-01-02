"use client";

import { Trash2, Clock } from "lucide-react";
import { TranscriptSegment } from "@/app/editor/page";
import { Button } from "@/components/ui/button";

interface TranscriptEditorProps {
    segments: TranscriptSegment[];
    onDeleteSegment: (id: string) => void;
    currentTime: number;
}

export function TranscriptEditor({
    segments,
    onDeleteSegment,
    currentTime,
}: TranscriptEditorProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const isSegmentActive = (segment: TranscriptSegment) => {
        return currentTime >= segment.startTime && currentTime < segment.endTime;
    };

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="h-12 border-b border-white/10 flex items-center px-6 bg-zinc-900">
                <h3 className="text-sm font-medium text-white">Transcript</h3>
            </div>

            {/* Transcript Content */}
            <div className="p-6 space-y-4">
                {segments.map((segment) => (
                    <div
                        key={segment.id}
                        className={`group relative p-4 rounded-lg border transition-all ${segment.deleted
                            ? "bg-zinc-900/30 border-white/5 opacity-40"
                            : isSegmentActive(segment)
                                ? "bg-blue-500/10 border-blue-500/30"
                                : "bg-zinc-900/50 border-white/10 hover:border-white/20"
                            }`}
                    >
                        {/* Timestamp */}
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span className="text-xs text-zinc-500 font-mono">
                                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                            </span>
                        </div>

                        {/* Text Content */}
                        <p
                            className={`text-sm leading-relaxed transition-all ${segment.deleted
                                ? "text-zinc-600 line-through"
                                : isSegmentActive(segment)
                                    ? "text-white"
                                    : "text-zinc-300"
                                }`}
                            contentEditable={!segment.deleted}
                            suppressContentEditableWarning
                        >
                            {segment.text}
                        </p>

                        {/* Delete Button */}
                        <Button
                            variant="ghost"
                            onClick={() => onDeleteSegment(segment.id)}
                            className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${segment.deleted
                                ? "text-green-400 hover:text-green-300"
                                : "text-red-400 hover:text-red-300"
                                }`}
                        >
                            {segment.deleted ? (
                                <>
                                    <span className="text-xs mr-1">Restore</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
