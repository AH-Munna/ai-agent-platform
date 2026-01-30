"use client";

import { motion } from "framer-motion";

const techStack = [
    { name: "Next.js", color: "from-gray-700 to-black" },
    { name: "React", color: "from-cyan-400 to-blue-500" },
    { name: "TypeScript", color: "from-blue-500 to-blue-700" },
    { name: "Prisma", color: "from-teal-400 to-cyan-600" },
    { name: "tRPC", color: "from-blue-400 to-indigo-500" },
    { name: "Tailwind", color: "from-cyan-400 to-blue-400" },
    { name: "Vercel AI", color: "from-gray-600 to-gray-900" },
    { name: "PostgreSQL", color: "from-blue-600 to-indigo-700" },
];

export function TechStackOrbit() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="py-8"
        >
            <h3 className="text-center text-lg font-medium text-muted-foreground mb-8">
                Built with Modern Technologies
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
                {techStack.map((tech, index) => (
                    <motion.div
                        key={tech.name}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                            duration: 0.3, 
                            delay: 0.4 + index * 0.1,
                            type: "spring",
                            stiffness: 200
                        }}
                        whileHover={{ 
                            scale: 1.1, 
                            rotate: [0, -5, 5, 0],
                            transition: { duration: 0.3 }
                        }}
                        className={`px-4 py-2 rounded-full bg-gradient-to-r ${tech.color} text-white text-sm font-medium shadow-lg cursor-default`}
                    >
                        {tech.name}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
