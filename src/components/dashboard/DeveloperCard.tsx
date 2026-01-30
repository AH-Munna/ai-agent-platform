"use client";

import { motion } from "framer-motion";
import { Github, Globe, Mail } from "lucide-react";
import Link from "next/link";

export function DeveloperCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8"
        >
            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-50">
                <div className="absolute inset-[1px] rounded-2xl bg-background" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                {/* Avatar with gradient ring */}
                <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="relative"
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 blur-md opacity-60" />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 p-[3px]">
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                            AH
                        </div>
                    </div>
                </motion.div>

                {/* Info */}
                <div className="text-center md:text-left flex-1">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Ahsanul Haque Munna
                    </h3>
                    <p className="text-muted-foreground mt-1">
                        Fullstack Developer • AI Enthusiast • Problem Solver
                    </p>
                    <p className="text-sm text-muted-foreground/80 mt-2 max-w-md">
                        Building scalable web applications with modern technologies. 
                        Passionate about AI, automation, and creating delightful user experiences.
                    </p>

                    {/* Links */}
                    <div className="flex justify-center md:justify-start gap-3 mt-4">
                        <Link 
                            href="https://github.com/ah-munna" 
                            target="_blank"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                        >
                            <Github className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                        </Link>
                        <Link 
                            href="mailto:ahmunna.developer@gmail.com"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                        >
                            <Mail className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                        </Link>
                        <Link 
                            href="https://ah-munna.github.io" 
                            target="_blank"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                        >
                            <Globe className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                        </Link>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="hidden lg:block">
                    <div className="flex flex-col gap-2 text-xs text-muted-foreground/60">
                        <span className="px-2 py-1 rounded bg-white/5">Next.js</span>
                        <span className="px-2 py-1 rounded bg-white/5">TypeScript</span>
                        <span className="px-2 py-1 rounded bg-white/5">Python</span>
                        <span className="px-2 py-1 rounded bg-white/5">LLMs</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
