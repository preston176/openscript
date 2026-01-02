"use client";

import { Video, FileVideo, Music } from "lucide-react";

export function MediaLibrary() {
    const mediaFiles = [
        { id: 1, name: "interview.mp4", duration: "2:34", type: "video" },
        { id: 2, name: "background-music.mp3", duration: "3:45", type: "audio" },
    ];

    return (
        <div className="w-64 bg-zinc-900 border-r border-white/10 flex flex-col">
            {/* Header */}
            <div className="h-12 border-b border-white/10 flex items-center px-4">
                <h3 className="text-sm font-medium text-white">Media</h3>
            </div>

            {/* Media List */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                {mediaFiles.map((file) => (
                    <div
                        key={file.id}
                        className="p-3 rounded-lg bg-zinc-800/50 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                    >
                        <div className="flex items-start gap-3">
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded bg-zinc-700/50 flex items-center justify-center flex-shrink-0">
                                {file.type === "video" ? (
                                    <FileVideo className="w-5 h-5 text-blue-400" />
                                ) : (
                                    <Music className="w-5 h-5 text-purple-400" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-white truncate">{file.name}</div>
                                <div className="text-xs text-zinc-500 mt-1">{file.duration}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Media Button */}
            <div className="p-3 border-t border-white/10">
                <button className="w-full py-2 px-3 rounded-lg border border-dashed border-white/20 text-sm text-zinc-400 hover:text-white hover:border-white/40 transition-colors">
                    + Add Media
                </button>
            </div>
        </div>
    );
}
