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

            {/* Blurred Video Background */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
                <div className="w-[90%] max-w-6xl h-[600px] rounded-2xl border border-white/5 bg-zinc-900/30 backdrop-blur-3xl overflow-hidden opacity-30 blur-sm">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src="https://ajbk6cdk7t.ufs.sh/f/bj0QrlC8Kw5DqPhAHgNmbzOFUMQE3LXcwePZ5idsaRAqkxK6" type="video/mp4" />
                    </video>
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
                    className="flex justify-center "
                >
                    <button
                        onClick={() => window.open(`https://tally.so/r/${process.env.NEXT_PUBLIC_TALLY_FORM_ID || 'YOUR_FORM_ID'}`, '_blank')}
                        className="group relative px-10 py-5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-blue-500/40 hover:shadow-blue-400/60 border border-blue-400/20 cursor-pointer"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <span>Join Waitlist</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
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
