"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Play, Pause } from "lucide-react";

export function DemoSection() {
    const [isDeleted, setIsDeleted] = useState(false);

    return (
        <section className="relative py-24 px-6 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Edit Text. Edit Video.
                    </h2>
                    <p className="text-lg text-zinc-300 font-light">
                        Delete a paragraph, and the video cuts automatically.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative rounded-xl border border-white/5 bg-zinc-900/30 overflow-hidden"
                >
                    {/* Editor-style interface */}
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Text Editor Side */}
                        <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-medium text-zinc-400">
                                    Transcript
                                </h3>
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                                </div>
                            </div>

                            <div className="space-y-4 text-sm leading-relaxed">
                                <p className="text-zinc-300">
                                    Welcome to this tutorial on video editing. Today we're going
                                    to learn how to edit videos by simply editing text.
                                </p>

                                <motion.p
                                    className={`cursor-pointer transition-all duration-300 ${isDeleted
                                        ? "line-through text-zinc-700"
                                        : "text-zinc-300 hover:text-white"
                                        }`}
                                    onClick={() => setIsDeleted(!isDeleted)}
                                    whileHover={{ x: 2 }}
                                >
                                    This paragraph can be deleted, and the corresponding video
                                    segment will be removed automatically. <span className="text-blue-500">Click to try it!</span>
                                </motion.p>

                                <p className="text-zinc-300">
                                    It's that simple. No timeline scrubbing, no complex cuts. Just
                                    edit the text like you would in a word processor.
                                </p>
                            </div>
                        </div>

                        {/* Video Timeline Side */}
                        <div className="p-8 lg:p-10 bg-zinc-950/50">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-medium text-zinc-400">
                                    Video Timeline
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button className="p-1.5 rounded hover:bg-zinc-800 transition-colors">
                                        {isDeleted ? <Play className="w-4 h-4 text-zinc-400" /> : <Pause className="w-4 h-4 text-zinc-400" />}
                                    </button>
                                    <div className="text-xs text-zinc-500 font-mono tabular-nums">
                                        00:00:45
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Video preview */}
                                <div className="aspect-video bg-zinc-900 rounded-lg border border-white/5 overflow-hidden">
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

                                {/* Timeline segments */}
                                <div className="space-y-2">
                                    <motion.div
                                        className="relative h-12 bg-blue-500/20 border border-blue-500/30 rounded overflow-hidden"
                                        layout
                                    >
                                        <div className="absolute inset-0 flex items-center px-3">
                                            <span className="text-xs text-blue-200 font-medium">Segment 1</span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="relative h-12 bg-blue-500/20 border border-blue-500/30 rounded overflow-hidden"
                                        animate={{
                                            opacity: isDeleted ? 0 : 1,
                                            height: isDeleted ? 0 : 48,
                                            marginTop: isDeleted ? 0 : 8,
                                            marginBottom: isDeleted ? 0 : 8,
                                        }}
                                        transition={{ duration: 0.4 }}
                                        layout
                                    >
                                        <div className="absolute inset-0 flex items-center px-3">
                                            <span className="text-xs text-blue-200 font-medium">Segment 2</span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="relative h-12 bg-blue-500/20 border border-blue-500/30 rounded overflow-hidden"
                                        layout
                                    >
                                        <div className="absolute inset-0 flex items-center px-3">
                                            <span className="text-xs text-blue-200 font-medium">Segment 3</span>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Playhead */}
                                <div className="relative h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="absolute inset-y-0 left-0 bg-blue-500"
                                        animate={{ width: isDeleted ? "65%" : "35%" }}
                                        transition={{ duration: 0.4 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
