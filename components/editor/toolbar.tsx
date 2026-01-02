"use client";

import { File, FolderOpen, Save, Download, Undo, Redo, Scissors, Copy, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ExportModal } from "./export-modal";

interface ToolbarProps {
    totalDuration: number;
}

export function Toolbar({ totalDuration }: ToolbarProps) {
    const [showExportModal, setShowExportModal] = useState(false);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <>
            <div className="h-14 bg-zinc-900 border-b border-white/10 flex items-center px-4 gap-6">
                {/* Project Title */}
                <div className="text-sm font-medium text-white">
                    My Project
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-white/10" />

                {/* File Actions */}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" className="text-zinc-400 hover:text-white p-2">
                        <File className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" className="text-zinc-400 hover:text-white p-2">
                        <FolderOpen className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" className="text-zinc-400 hover:text-white p-2">
                        <Save className="w-4 h-4" />
                    </Button>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-white/10" />

                {/* Edit Actions */}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" className="text-zinc-400 hover:text-white p-2">
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" className="text-zinc-400 hover:text-white p-2">
                        <Redo className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" className="text-zinc-400 hover:text-white p-2">
                        <Scissors className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" className="text-zinc-400 hover:text-white p-2">
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" className="text-zinc-400 hover:text-white p-2">
                        <Clipboard className="w-4 h-4" />
                    </Button>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Duration */}
                <div className="text-sm text-zinc-400">
                    {formatTime(totalDuration)}
                </div>

                {/* Export Button */}
                <Button
                    variant="primary"
                    className="gap-2 px-4 py-2"
                    onClick={() => setShowExportModal(true)}
                >
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            </div>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />
        </>
    );
}
