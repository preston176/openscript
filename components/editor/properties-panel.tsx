"use client";

import { Volume2, Gauge, Sparkles, Settings } from "lucide-react";

export function PropertiesPanel() {
    return (
        <div className="w-64 bg-zinc-900 border-l border-white/10 flex flex-col">
            {/* Header */}
            <div className="h-12 border-b border-white/10 flex items-center px-4">
                <h3 className="text-sm font-medium text-white">Properties</h3>
            </div>

            {/* Properties List */}
            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                {/* Volume */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Volume2 className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-medium text-white">Volume</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="80"
                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-xs text-zinc-500 mt-1">80%</div>
                </div>

                {/* Speed */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Gauge className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-medium text-white">Speed</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {["0.5x", "1x", "1.5x"].map((speed) => (
                            <button
                                key={speed}
                                className={`py-1.5 px-2 rounded text-xs ${speed === "1x"
                                        ? "bg-blue-500 text-white"
                                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                                    } transition-colors`}
                            >
                                {speed}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Effects */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-medium text-white">Effects</span>
                    </div>
                    <div className="space-y-2">
                        {["Remove Filler Words", "Studio Sound", "Eye Contact"].map((effect) => (
                            <label key={effect} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">
                                    {effect}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Export Settings */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Settings className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-medium text-white">Export</span>
                    </div>
                    <select className="w-full py-2 px-3 rounded-lg bg-zinc-800 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500">
                        <option>MP4 (H.264)</option>
                        <option>MOV (ProRes)</option>
                        <option>WebM</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
