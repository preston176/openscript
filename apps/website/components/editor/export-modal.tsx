"use client";

import { X, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
    const [format, setFormat] = useState("mp4");
    const [quality, setQuality] = useState("high");
    const [isExporting, setIsExporting] = useState(false);
    const [exportComplete, setExportComplete] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleExport = () => {
        setIsExporting(true);
        setProgress(0);

        // Simulate export progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsExporting(false);
                    setExportComplete(true);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    const handleClose = () => {
        setIsExporting(false);
        setExportComplete(false);
        setProgress(0);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 rounded-xl border border-white/10 shadow-2xl z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-semibold text-white">Export Video</h2>
                            <button
                                onClick={handleClose}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {!exportComplete ? (
                                <>
                                    {/* Format Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Format
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {["mp4", "mov", "webm"].map((fmt) => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => setFormat(fmt)}
                                                    disabled={isExporting}
                                                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${format === fmt
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                                                        } ${isExporting ? "opacity-50 cursor-not-allowed" : ""}`}
                                                >
                                                    {fmt.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quality Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-3">
                                            Quality
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { value: "high", label: "High (1080p)", size: "~45 MB" },
                                                { value: "medium", label: "Medium (720p)", size: "~25 MB" },
                                                { value: "low", label: "Low (480p)", size: "~12 MB" },
                                            ].map((q) => (
                                                <label
                                                    key={q.value}
                                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${quality === q.value
                                                            ? "border-blue-500 bg-blue-500/10"
                                                            : "border-white/10 hover:border-white/20"
                                                        } ${isExporting ? "opacity-50 cursor-not-allowed" : ""}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name="quality"
                                                            value={q.value}
                                                            checked={quality === q.value}
                                                            onChange={(e) => setQuality(e.target.value)}
                                                            disabled={isExporting}
                                                            className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                                                        />
                                                        <div>
                                                            <div className="text-sm text-white">{q.label}</div>
                                                            <div className="text-xs text-zinc-500">{q.size}</div>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    {isExporting && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-400">Exporting...</span>
                                                <span className="text-white font-medium">{progress}%</span>
                                            </div>
                                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    className="h-full bg-blue-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Success State */
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        Export Complete!
                                    </h3>
                                    <p className="text-sm text-zinc-400 mb-6">
                                        Your video has been exported successfully.
                                    </p>
                                    <Button
                                        variant="primary"
                                        onClick={handleClose}
                                        className="gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Video
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!exportComplete && (
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                                <Button
                                    variant="ghost"
                                    onClick={handleClose}
                                    disabled={isExporting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="gap-2"
                                >
                                    {isExporting ? (
                                        <>Exporting...</>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            Export
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
