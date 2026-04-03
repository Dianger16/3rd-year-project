/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface NavItem {
    name: string
    url: string
    icon: LucideIcon
}

interface NavBarProps {
    items: NavItem[]
    className?: string
}

export function NavBar({ items, className }: NavBarProps) {
    const [activeTab, setActiveTab] = useState(items[0].name)

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash || '#top'
            const currentItem = items.find(item => item.url === hash)
            if (currentItem) setActiveTab(currentItem.name)
        }

        window.addEventListener("hashchange", handleHashChange)
        handleHashChange()
        return () => window.removeEventListener("hashchange", handleHashChange)
    }, [items])

    return (
        <div
            className={cn(
                "z-[100]",
                className,
            )}
        >
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl py-1 px-1 rounded-full">
                {items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.name

                    return (
                        <a
                            key={item.name}
                            href={item.url}
                            onClick={() => setActiveTab(item.name)}
                            className={cn(
                                "relative cursor-pointer px-5 py-2 rounded-full transition-all duration-300",
                                isActive
                                    ? "text-orange-500 font-bold"
                                    : "text-zinc-400 hover:text-white hover:bg-white/[0.02]",
                            )}
                        >
                            <span className="hidden md:inline text-sm font-medium">{item.name}</span>
                            <span className="md:hidden">
                                <Icon size={16} strokeWidth={2} />
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-orange-500/10 rounded-full -z-10"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 35,
                                    }}
                                />
                            )}
                        </a>
                    )
                })}
            </div>
        </div>
    )
}


