/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function VerifyEmail() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden glow-mesh">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[140px]" />
            </div>

            <motion.div
                className="w-full max-w-[480px] relative z-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 transition-transform hover:scale-105">
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                            <BrandLogo className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <div className="text-left">
                            <span className="text-2xl font-black tracking-tighter block leading-none" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                                <span className="text-foreground">Univ</span>
                                <span className="text-orange-400">GPT</span>
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground">Verification</span>
                        </div>
                    </Link>
                </div>

                <Card className="glass border-primary/10 shadow-2xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="text-center pt-12 pb-6 px-10">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mx-auto w-20 h-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6"
                        >
                            <Mail className="w-10 h-10 text-emerald-500" />
                        </motion.div>
                        <CardTitle className="text-3xl font-black tracking-tighter mb-4">Confirm Identity</CardTitle>
                        <CardDescription className="text-sm font-medium leading-relaxed">
                            We've dispatched a secure activation link to your email address.
                            Please verify your inbox to initialize your university node.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-10 pb-12 space-y-6">
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10">
                            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wider">
                                Check your spam folder if the dispatch doesn't arrive within 60 seconds.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button variant="outline" className="w-full h-14 rounded-full border-muted-foreground/20 text-sm font-semibold glass">
                                Resend Authorization
                            </Button>

                            <Link to="/auth/login" className="block text-center pt-2">
                                <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-2 group">
                                    <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                                    Return to Session Entry
                                </span>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}


