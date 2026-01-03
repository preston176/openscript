"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function HeroSection() {
    const [timelineHeights, setTimelineHeights] = useState<number[]>([]);

    // Generate random heights on client-side only to avoid hydration mismatch
    useEffect(() => {
        setTimelineHeights(Array.from({ length: 12 }, () => Math.random() * 60 + 40));
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background grid pattern */}
            <div className="absolute inset-0 bg-grid opacity-40" />

            {/* Gradient glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/20 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Blurred Editor Dashboard Mockup */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
                <div className="w-[90%] max-w-6xl h-[600px] rounded-2xl border border-white/5 bg-zinc-900/30 backdrop-blur-3xl overflow-hidden opacity-20 blur-sm">
                    {/* Mock editor interface */}
                    <div className="h-full flex flex-col">
                        {/* Top bar */}
                        <div className="h-12 border-b border-white/5 bg-zinc-900/50 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-zinc-700" />
                            <div className="w-3 h-3 rounded-full bg-zinc-700" />
                            <div className="w-3 h-3 rounded-full bg-zinc-700" />
                        </div>

                        {/* Main content area */}
                        <div className="flex-1 flex">
                            {/* Left sidebar */}
                            <div className="w-64 border-r border-white/5 bg-zinc-900/30 p-4 space-y-2">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="h-8 bg-zinc-800/50 rounded" />
                                ))}
                            </div>

                            {/* Center - Video preview */}
                            <div className="flex-1 p-8 flex items-center justify-center">
                                <div className="w-full aspect-video bg-zinc-800/50 rounded-lg flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-blue-500/30 flex items-center justify-center">
                                        <div className="w-0 h-0 border-l-8 border-l-blue-400 border-y-6 border-y-transparent ml-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Right sidebar */}
                            <div className="w-64 border-l border-white/5 bg-zinc-900/30 p-4 space-y-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-4 bg-zinc-800/50 rounded w-3/4" />
                                        <div className="h-8 bg-zinc-800/50 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom timeline */}
                        <div className="h-32 border-t border-white/5 bg-zinc-900/50 p-4">
                            <div className="flex gap-1 h-full">
                                {timelineHeights.length > 0 ? (
                                    timelineHeights.map((height, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-blue-500/20 rounded"
                                            style={{ height: `${height}%` }}
                                        />
                                    ))
                                ) : (
                                    // Fallback for SSR
                                    [...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-blue-500/20 rounded"
                                            style={{ height: '50%' }}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 text-white">
                        Edit Video like a
                        <br />
                        Word Doc.
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-xl md:text-2xl text-zinc-300 mb-12 max-w-2xl mx-auto font-light"
                >
                    Open-source, local-first alternative to Descript.
                    <br />
                    No cloud uploads. No monthly fees.
                </motion.p>

                {/* Waitlist CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                    <button
                        data-tally-open="YOUR_FORM_ID"
                        data-tally-emoji-text="👋"
                        data-tally-emoji-animation="wave"
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/50"
                    >
                        Join Waitlist
                    </button>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-6 text-sm text-zinc-400"
                >
                    Powered by local AI (Whisper). Your footage never leaves your machine.
                </motion.p>
            </div>
        </section>
    );
}
