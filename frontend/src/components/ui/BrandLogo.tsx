/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

import React, { forwardRef } from 'react';
import type { LucideProps } from 'lucide-react';

export const BrandLogo = forwardRef<SVGSVGElement, LucideProps>(
    ({ className = "w-6 h-6", ...props }, ref) => (
        <svg
            ref={ref}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {/* Top Node */}
            <circle cx="12" cy="4" r="2" fill="currentColor" />
            {/* Bottom Node */}
            <circle cx="12" cy="20" r="2" fill="currentColor" />
            {/* Left Nodes */}
            <circle cx="4" cy="8" r="2" fill="currentColor" />
            <circle cx="4" cy="16" r="2" fill="currentColor" />
            {/* Right Nodes */}
            <circle cx="20" cy="8" r="2" fill="currentColor" />
            <circle cx="20" cy="16" r="2" fill="currentColor" />
            {/* Center Node */}
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />

            {/* Connections */}
            <line x1="12" y1="4" x2="4" y2="8" strokeWidth="2.5" />
            <line x1="12" y1="4" x2="20" y2="8" strokeWidth="2.5" />
            <line x1="4" y1="8" x2="4" y2="16" strokeWidth="2.5" />
            <line x1="20" y1="8" x2="20" y2="16" strokeWidth="2.5" />
            <line x1="4" y1="16" x2="12" y2="20" strokeWidth="2.5" />
            <line x1="20" y1="16" x2="12" y2="20" strokeWidth="2.5" />

            <line x1="4" y1="8" x2="12" y2="12" strokeWidth="2.5" />
            <line x1="20" y1="8" x2="12" y2="12" strokeWidth="2.5" />
            <line x1="12" y1="20" x2="12" y2="12" strokeWidth="2.5" />
        </svg>
    )
);

BrandLogo.displayName = "BrandLogo";


