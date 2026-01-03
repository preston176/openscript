"use client";

import { motion } from "framer-motion";
import { Type, Wand2, Download, Lock } from "lucide-react";

const features = [
    {
        icon: Type,
        title: "Text-Based Editing",
        description: "Edit your video by editing the transcript. Delete a word, delete that moment from your video.",
        visual: "transcript",
    },
    {
        icon: Wand2,
        title: "AI Transcription",
        description: "Powered by Whisper running locally on your machine. Accurate, fast, and completely private.",
        visual: "waveform",
    },
    {
        icon: Download,
        title: "Export Anywhere",
        description: "Export to MP4, MOV, or any format you need. Your video, your way, no cloud required.",
        visual: "export",
    },
    {
        icon: Lock,
        title: "100% Private",
        description: "Your footage never touches the internet. Everything runs on your GPU. Zero cloud uploads.",
        visual: "lock",
    },
];

export function FeaturesSection() {
    return (
        <section className="relative py-32 px-6 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        Everything you need.
                        <br />
                        <span className="text-zinc-500">Nothing you don't.</span>
                    </h2>
                    <p className="text-xl text-zinc-300 font-light max-w-2xl mx-auto">
                        Professional video editing without the subscription fees or privacy concerns.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="group relative rounded-2xl border border-white/5 bg-zinc-900/30 p-10 hover:border-white/10 hover:bg-zinc-900/50 transition-all duration-500"
                        >
                            {/* Icon */}
                            <div className="mb-6 inline-flex p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <feature.icon className="w-6 h-6 text-blue-400" />
                            </div>

                            {/* Content */}
                            <h3 className="text-2xl font-bold text-white mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-zinc-300 leading-relaxed text-lg">
                                {feature.description}
                            </p>

                            {/* Visual indicator based on feature type */}
                            <div className="mt-8 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                                {feature.visual === "transcript" && (
                                    <div className="space-y-2">
                                        <div className="h-2 bg-zinc-700 rounded w-full" />
                                        <div className="h-2 bg-zinc-700 rounded w-5/6" />
                                        <div className="h-2 bg-zinc-700 rounded w-4/6" />
                                    </div>
                                )}
                                {feature.visual === "waveform" && (
                                    <div className="flex items-end gap-1 h-12">
                                        {[3, 8, 5, 10, 7, 4, 9, 6, 8, 5, 7, 4].map((height, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-blue-500/30 rounded-sm"
                                                style={{ height: `${height * 4}px` }}
                                            />
                                        ))}
                                    </div>
                                )}
                                {feature.visual === "export" && (
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1.5 bg-zinc-700 rounded text-xs text-zinc-400">MP4</div>
                                        <div className="px-3 py-1.5 bg-zinc-700 rounded text-xs text-zinc-400">MOV</div>
                                        <div className="px-3 py-1.5 bg-zinc-700 rounded text-xs text-zinc-400">AVI</div>
                                    </div>
                                )}
                                {feature.visual === "lock" && (
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-8 h-8 text-zinc-700" />
                                        <div className="text-xs text-zinc-600 font-mono">
                                            localhost:3000
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Comparison callout */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-16 text-center"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 bg-zinc-900/50">
                        <span className="text-sm text-zinc-400">
                            Like Descript, but{" "}
                            <span className="text-white font-medium">local-first</span>,{" "}
                            <span className="text-white font-medium">open-source</span>, and{" "}
                            <span className="text-white font-medium">free</span>
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
