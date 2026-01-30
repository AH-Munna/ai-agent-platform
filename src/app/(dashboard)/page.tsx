"use client";

import { motion } from "framer-motion";
import { MessageSquare, Sparkles, User, Users } from "lucide-react";
import { AnimatedBackground } from "~/components/dashboard/AnimatedBackground";
import { AnimatedCounter } from "~/components/dashboard/AnimatedCounter";
import { DeveloperCard } from "~/components/dashboard/DeveloperCard";
import { FeatureCard } from "~/components/dashboard/FeatureCard";
import { TechStackOrbit } from "~/components/dashboard/TechStackOrbit";

export default function DashboardPage() {
    return (
        <div className="relative min-h-screen pb-16">
            <AnimatedBackground />
            
            {/* Hero Section */}
            <motion.div 
                className="text-center pt-8 pb-12"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 mb-6"
                >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-muted-foreground">AI-Powered Conversations</span>
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        AI Agent Platform
                    </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Where AI Characters Come to Life. Create personas, engage in immersive conversations, 
                    and watch AI characters interact with each other.
                </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
                <FeatureCard
                    icon={MessageSquare}
                    title="Chat with AI"
                    description="Engage in deep, contextual conversations with AI characters using custom personas and scenarios."
                    href="/characters"
                    gradient="from-purple-500 to-indigo-600"
                    delay={0.1}
                />
                <FeatureCard
                    icon={Users}
                    title="AI Rooms"
                    description="Create rooms where two AI characters converse with each other in fascinating dialogues."
                    href="/rooms"
                    gradient="from-blue-500 to-cyan-600"
                    delay={0.2}
                />
                <FeatureCard
                    icon={User}
                    title="Custom Personas"
                    description="Define your own persona to shape how AI characters perceive and respond to you."
                    href="/personas"
                    gradient="from-cyan-500 to-teal-600"
                    delay={0.3}
                />
            </div>

            {/* Tech Stack */}
            <TechStackOrbit />

            {/* Stats Section */}
            <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-4 my-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                <AnimatedCounter value={15} suffix="+" label="Characters" delay={0.7} />
                <AnimatedCounter value={100} suffix="+" label="Chat Sessions" delay={0.8} />
                <AnimatedCounter value={25} suffix="+" label="AI Rooms" delay={0.9} />
                <AnimatedCounter value={10000} suffix="+" label="Messages" delay={1.0} />
            </motion.div>

            {/* Developer Card */}
            <div className="mt-12">
                <motion.h2 
                    className="text-center text-2xl font-semibold mb-6 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Built by
                </motion.h2>
                <DeveloperCard />
            </div>
        </div>
    );
}
