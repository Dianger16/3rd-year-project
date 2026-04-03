/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

"use client";

import * as React from "react";
import { X, Settings } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UpgradeBannerProps {
    buttonText?: string;
    description?: string;
    onClose?: () => void;
    onClick?: () => void;
    className?: string;
}

export function UpgradeBanner({
    buttonText = "Upgrade",
    description = "Access advanced research analytics",
    onClose,
    onClick,
    className
}: UpgradeBannerProps) {
    const [isHovered, setIsHovered] = React.useState(false);

    const iconVariants = {
        hidden: { x: 0, y: 0, opacity: 0, rotate: 0 },
        visible: (custom: { x: number; y: number }) => ({
            x: custom.x,
            y: custom.y,
            opacity: 1,
            rotate: 360,
            transition: {
                x: { duration: 0.3 },
                y: { duration: 0.3 },
                opacity: { duration: 0.3 },
                rotate: {
                    duration: 1,
                    type: "spring" as const,
                    stiffness: 100,
                    damping: 10,
                },
            },
        }),
    };

    return (
        <div className={cn("mx-auto flex items-center justify-center relative", className)}>
            <AnimatePresence>
                <motion.div
                    className="relative z-20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <motion.div
                        initial="hidden"
                        animate={isHovered ? "visible" : "hidden"}
                        variants={iconVariants}
                        custom={{ x: -10, y: -10 }}
                        className="pointer-events-none absolute left-[4px] top-[2px]"
                    >
                        <Settings className="text-orange-400 w-4 h-4" />
                    </motion.div>
                    <motion.div
                        initial="hidden"
                        animate={isHovered ? "visible" : "hidden"}
                        variants={iconVariants}
                        custom={{ x: 10, y: 10 }}
                        className="pointer-events-none absolute bottom-[2px] right-2"
                    >
                        <Settings className="text-amber-400 w-4 h-4" />
                    </motion.div>
                    <div className="relative flex min-h-[35px] items-center gap-2 rounded-2xl sm:rounded-full border border-orange-500/20 bg-orange-500/10 backdrop-blur-md pl-4 pr-1 py-1.5 sm:py-0 text-sm shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all duration-300 hover:border-orange-500/30">
                        <span className="text-[0.75rem] sm:text-[0.8125rem] text-zinc-300 leading-tight">
                            {description}
                        </span>
                        <button
                            className="focus-visible:shadow-focus-ring rounded-full cursor-pointer border-none bg-orange-500/20 hover:bg-orange-500/40 px-3 py-1 font-sans text-[10px] sm:text-[12px] font-bold tracking-wide text-white transition-colors outline-none shrink-0"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={onClick}
                        >
                            {buttonText}
                        </button>

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="m-0 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}


