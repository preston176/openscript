"use client";

import { useEffect, useRef } from "react";
import { TranscriptSegment } from "@/app/editor/page";
import { motion, AnimatePresence } from "framer-motion";

interface TimelineProps {
    segments: TranscriptSegment[];
    isPlaying: boolean;
    currentTime: number;
    onTimeUpdate: (time: number) => void;
}

export function Timeline({
    segments,
    isPlaying,
    currentTime,
    onTimeUpdate,
}: TimelineProps) {
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (isPlaying) {
            const startTime = Date.now();
            const initialTime = currentTime;

            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const newTime = initialTime + elapsed;

                const totalDuration = segments
                    .filter((s) => !s.deleted)
                    .reduce((acc, s) => acc + (s.endTime - s.startTime), 0);

                if (newTime >= totalDuration) {
                    onTimeUpdate(0);
                } else {
                    onTimeUpdate(newTime);
                    animationRef.current = requestAnimationFrame(animate);
                }
            };

            animationRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        }
    }, [isPlaying, currentTime, segments, onTimeUpdate]);

    const totalDuration = segments
        .filter((s) => !s.deleted)
        .reduce((acc, s) => acc + (s.endTime - s.startTime), 0);

    const getSegmentColor = (index: number) => {
        const colors = [
            "bg-blue-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-orange-500",
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="h-32 border-t border-white/10 bg-zinc-900">
            {/* Timeline Header */}
            <div className="h-8 border-b border-white/10 flex items-center px-6">
                <h3 className="text-xs font-medium text-zinc-400">Timeline</h3>
            </div>

            {/* Timeline Content */}
            <div className="h-24 relative px-6 py-4">
                {/* Timeline Track */}
                <div className="relative h-full bg-zinc-800 rounded overflow-hidden">
                    {/* Segments */}
                    <div className="absolute inset-0 flex">
                        <AnimatePresence>
                            {segments.map((segment, index) => {
                                if (segment.deleted) return null;

                                const duration = segment.endTime - segment.startTime;
                                const widthPercent = (duration / totalDuration) * 100;

                                return (
                                    <motion.div
                                        key={segment.id}
                                        initial={{ opacity: 1, scaleX: 1 }}
                                        exit={{ opacity: 0, scaleX: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`relative h-full ${getSegmentColor(
                                            index
                                        )} border-r border-black/20`}
                                        style={{ width: `${widthPercent}%` }}
                                    >
                                        {/* Waveform decoration */}
                                        <div className="absolute inset-0 flex items-end gap-px p-1 opacity-30">
                                            {[...Array(20)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 bg-white rounded-t"
                                                    style={{
                                                        height: `${Math.random() * 60 + 40}%`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Playhead */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-all duration-100"
                        style={{
                            left: `${(currentTime / totalDuration) * 100}%`,
                        }}
                    >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
