"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedCounterProps {
    value: number;
    suffix?: string;
    label: string;
    duration?: number;
    delay?: number;
}

export function AnimatedCounter({ value, suffix = "", label, duration = 2, delay = 0 }: AnimatedCounterProps) {
    const [isInView, setIsInView] = useState(false);
    
    const spring = useSpring(0, { 
        duration: duration * 1000,
        bounce: 0
    });
    
    const display = useTransform(spring, (current) => 
        Math.floor(current).toLocaleString()
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInView(true);
            spring.set(value);
        }, delay * 1000);
        return () => clearTimeout(timer);
    }, [spring, value, delay]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition={{ duration: 0.5 }}
            className="text-center p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                <motion.span>{display}</motion.span>
                {suffix}
            </div>
            <p className="text-muted-foreground mt-2">{label}</p>
        </motion.div>
    );
}
