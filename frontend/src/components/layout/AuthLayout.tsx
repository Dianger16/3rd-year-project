/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden">
            {/* 
                Persistent background across login/signup/etc to prevent flickering.
                The layout stays mounted while its children (Login/Signup pages) change.
            */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-orange-600/10 blur-[120px] mix-blend-plus-lighter animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-amber-600/10 blur-[120px] mix-blend-plus-lighter animate-pulse" style={{ animationDuration: '12s' }} />
                <div className="absolute inset-0 bg-transparent" />
            </div>

            <div className="relative z-10 w-full min-h-screen">
                {children}
            </div>
        </div>
    );
}


