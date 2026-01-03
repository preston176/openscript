"use client";

import { Github, Twitter } from "lucide-react";
import { useEffect, useState } from "react";

export function Footer() {
    const [dayGreeting, setDayGreeting] = useState("");

    useEffect(() => {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = new Date().getDay();
        setDayGreeting(`Have a nice ${days[today]}!`);
    }, []);

    return (
        <footer className="relative py-12 px-6 border-t border-white/10">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-sm text-slate-400">
                        {dayGreeting || "Have a nice day!"}
                    </div>

                    <div className="flex items-center gap-6">
                        <a
                            href="https://github.com/preston176/openscript"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="View source code on GitHub"
                            className="text-slate-400 hover:text-white transition-colors duration-200"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                        <a
                            href="https://x.com/@Preston_Mayieka"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Follow us on Twitter"
                            className="text-slate-400 hover:text-white transition-colors duration-200"
                        >
                            <Twitter className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-slate-500">
                    © 2026 Local Video Editor. Open source and privacy-first.
                </div>
            </div>
        </footer>
    );
}
