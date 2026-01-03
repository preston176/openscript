export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
            <div className="max-w-2xl w-full text-center">
                {/* Success Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    You're on the list! 🎉
                </h1>

                {/* Subheading */}
                <p className="text-xl text-zinc-300 mb-8">
                    Thanks for joining the OpenScript waitlist.
                    <br />
                    We'll notify you the moment we launch.
                </p>

                {/* What's Next Section */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-8 mb-8 text-left">
                    <h2 className="text-2xl font-semibold text-white mb-4">
                        What happens next?
                    </h2>
                    <ul className="space-y-3 text-zinc-300">
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">✓</span>
                            <span>You'll be the first to know when we launch</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">✓</span>
                            <span>Get early access to beta features</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-1">✓</span>
                            <span>Join our community of creators building the future of video editing</span>
                        </li>
                    </ul>
                </div>

                {/* Demo Video CTA */}
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6 mb-8">
                    <h3 className="text-xl font-semibold text-white mb-3">
                        See OpenScript in Action
                    </h3>
                    <p className="text-zinc-300 mb-4">
                        Check out our interactive demo to see how text-based video editing works
                    </p>
                    <a
                        href="/editor"
                        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                    >
                        Try the Demo →
                    </a>
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                    <p className="text-zinc-400 text-sm">
                        In the meantime, follow our progress:
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="https://github.com/preston176/openscript"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Star on GitHub
                        </a>
                        <a
                            href="/"
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                        >
                            Back to Home
                        </a>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="mt-12 text-sm text-zinc-500">
                    We're building OpenScript in public. Your feedback will shape the future of local-first video editing.
                </p>
            </div>
        </div>
    );
}
