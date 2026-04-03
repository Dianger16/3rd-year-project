/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden glow-mesh">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-20%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px]" />
            </div>

            <motion.div
                className="w-full max-w-[460px] relative z-10"
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
                            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground">Recovery</span>
                        </div>
                    </Link>
                </div>

                <Card className="glass border-primary/10 shadow-2xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="text-center pt-10 pb-6">
                        <CardTitle className="text-3xl font-black tracking-tighter mb-2">Initialize Recovery</CardTitle>
                        <CardDescription className="text-sm font-medium">
                            {sent ? "Protocol dispatched" : "Enter your identity to reset passphrase"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-10 pb-12">
                        {sent ? (
                            <div className="text-center space-y-8 py-4">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto"
                                >
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                </motion.div>
                                <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                                    A secure recovery link has been dispatched to <span className="text-foreground font-black">{email}</span>. Please verify your inbox.
                                </p>
                                <Link to="/auth/login" className="block">
                                    <Button variant="outline" className="w-full h-14 rounded-full border-muted-foreground/20 text-sm font-semibold glass">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Return to Session
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Registered Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            type="email"
                                            placeholder="you@university.edu"
                                            className="h-14 pl-12 rounded-2xl border-border/50 bg-background/50 focus:bg-background transition-all font-bold"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-sm font-semibold"
                                >
                                    Transmit Link
                                </Button>

                                <Link
                                    to="/auth/login"
                                    className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                                >
                                    <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                                    Recall Identity
                                </Link>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Secure Link</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}


