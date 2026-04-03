/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'student' | 'faculty' | 'admin' | 'premium' | 'glass';
}>(({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
        default: "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-primary/20 bg-background/50 text-foreground",
        student: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
        faculty: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
        admin: "bg-foreground text-background font-black",
        premium: "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-none shadow-lg shadow-orange-500/20",
        glass: "bg-white/5 backdrop-blur-md border border-white/10 text-foreground"
    };

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] transition-all",
                variantClasses[variant],
                className
            )}
            {...props}
        />
    );
});
Badge.displayName = "Badge";

export { Badge };


