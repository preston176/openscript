import { Github, Twitter } from "lucide-react";

export function Footer() {
    return (
        <footer className="relative py-12 px-6 border-t border-white/10">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-sm text-slate-400">
                        Made with ❤️ for the open-source community
                    </div>

                    <div className="flex items-center gap-6">
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="View source code on GitHub"
                            className="text-slate-400 hover:text-white transition-colors duration-200"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                        <a
                            href="https://twitter.com"
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
