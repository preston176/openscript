"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Github } from "lucide-react";

const features = [
    {
        icon: Shield,
        title: "Privacy First",
        description: "Your raw footage never leaves your machine. No cloud uploads.",
    },
    {
        icon: Zap,
        title: "Zero Latency",
        description: "Instant transcription using local Whisper models.",
    },
    {
        icon: Github,
        title: "Open Source",
        description: "Audit the code. Extend the features. No lock-in.",
    },
];

export function BentoGrid() {
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
                        Why Local-First?
                    </h2>
                    <p className="text-lg text-zinc-300 font-light">
                        Everything you need, without the compromises.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group relative rounded-xl border border-white/5 bg-zinc-900/30 p-8 hover:border-white/10 hover:bg-zinc-900/50 transition-all duration-300"
                        >
                            <div className="mb-4 inline-flex p-2.5 rounded-lg bg-zinc-800/50 border border-white/5">
                                <feature.icon className="w-5 h-5 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-zinc-300 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
