/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

import { useToastStore } from '@/store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const ToastProvider = () => {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-[90vw] sm:max-w-md items-center pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.94 }}
                        className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/5 backdrop-blur-md flex items-center gap-2.5 w-auto min-w-[200px] bg-zinc-900 text-white`}
                    >
                        {toast.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        )}
                        <span className="text-[13px] font-bold tracking-tight pr-1">{toast.message}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};


