"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    href: string;
    gradient: string;
    delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, href, gradient, delay = 0 }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Link href={href}>
                <motion.div
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 h-full hover:bg-primary transition-all duration-500 cursor-pointer"
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    {/* Gradient glow on hover */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient} blur-xl`} />
                    
                    {/* Content */}
                    <div className="relative z-10">
                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} mb-4`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-white transition-colors">
                            {title}
                        </h3>
                        <p className="text-muted-foreground group-hover:text-white/80 transition-colors">
                            {description}
                        </p>
                    </div>

                    {/* Shine effect on hover */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                    />
                </motion.div>
            </Link>
        </motion.div>
    );
}
