import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, FileText, Shield, MessageSquare,
    ArrowUpRight, Activity, Send, Bot, X, Minus, User, Brain, TrendingUp, Plus, ArrowUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ─── Hover Bar Chart ─── */
function InteractiveBarChart() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const queries = [42, 78, 56, 89, 120, 65, 34];
    const uploads = [5, 12, 8, 15, 22, 10, 3];
    const max = Math.max(...queries);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Weekly Activity</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-orange-500" /><span className="text-[10px] text-zinc-500">Queries</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500/50" /><span className="text-[10px] text-zinc-500">Uploads</span></div>
                </div>
            </div>
            <div className="flex items-end gap-3 h-40">
                {days.map((day, i) => (
                    <div
                        key={day}
                        className="flex-1 flex flex-col items-center gap-1 justify-end h-full relative cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                    >
                        {/* Tooltip */}
                        <AnimatePresence>
                            {hoveredIdx === i && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    className="absolute -top-14 left-1/2 -translate-x-1/2 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 z-10 whitespace-nowrap shadow-xl"
                                >
                                    <div className="text-[10px] font-bold text-white">{day}</div>
                                    <div className="text-[9px] text-orange-400">{queries[i]} queries</div>
                                    <div className="text-[9px] text-amber-400">{uploads[i]} uploads</div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 border-r border-b border-white/10 rotate-45" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="w-full flex flex-col items-center gap-[2px] flex-1 justify-end">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(queries[i] / max) * 100}%` }}
                                transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                                className={`w-full max-w-[18px] rounded-t-md min-h-[4px] transition-colors ${hoveredIdx === i ? 'bg-orange-400' : 'bg-orange-500'}`}
                            />
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(uploads[i] / max) * 40}%` }}
                                transition={{ delay: i * 0.06 + 0.1, duration: 0.5, ease: 'easeOut' }}
                                className={`w-full max-w-[18px] rounded-t-md min-h-[2px] transition-colors ${hoveredIdx === i ? 'bg-amber-400/60' : 'bg-amber-500/40'}`}
                            />
                        </div>
                        <span className={`text-[9px] mt-1 transition-colors ${hoveredIdx === i ? 'text-white' : 'text-zinc-600'}`}>{day}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Donut Chart ─── */
function DonutChart() {
    const segments = [
        { label: 'Students', value: 68, color: '#f97316' },
        { label: 'Faculty', value: 22, color: '#f59e0b' },
        { label: 'Admin', value: 10, color: '#ef4444' },
    ];
    const total = segments.reduce((a, s) => a + s.value, 0);
    let cum = 0;
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">User Distribution</h3>
            <div className="flex items-center gap-6">
                <div className="relative w-28 h-28 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        {segments.map((seg, idx) => {
                            const dash = (seg.value / total) * 100;
                            const offset = -cum;
                            cum += dash;
                            return (
                                <circle
                                    key={seg.label} r="15.9" cx="18" cy="18" fill="none"
                                    stroke={seg.color} strokeWidth="3"
                                    strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    className="transition-all duration-300 cursor-pointer"
                                    style={{ opacity: hovered !== null && hovered !== idx ? 0.3 : 1 }}
                                    onMouseEnter={() => setHovered(idx)}
                                    onMouseLeave={() => setHovered(null)}
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-extrabold text-white">2.8k</span>
                        <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Total</span>
                    </div>
                </div>
                <div className="space-y-2.5 flex-1">
                    {segments.map((seg, idx) => (
                        <div
                            key={seg.label}
                            className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${hovered === idx ? 'bg-white/[0.04]' : ''}`}
                            onMouseEnter={() => setHovered(idx)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                                <span className="text-xs text-zinc-400">{seg.label}</span>
                            </div>
                            <span className="text-xs font-bold text-white">{seg.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Admin Chatbot Bubble ─── */
function AdminChatBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);
    const { messages, isQuerying, sendQuery, newConversation } = useChatStore();
    const { token } = useAuthStore();

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !token || isQuerying) return;
        const q = input; setInput('');
        await sendQuery(token, q);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-16 right-0 w-[calc(100vw-3rem)] sm:w-[380px] h-[520px] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-orange-500/5 to-transparent shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                                    <Brain className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">Admin Assistant</h4>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] text-zinc-500">Ready</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <button onClick={() => newConversation()} title="New chat" className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {messages.length === 0 && (
                                <div className="text-center py-10 space-y-3">
                                    <div className="w-12 h-12 mx-auto rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium">How can I help you today?</p>
                                    <div className="space-y-1.5">
                                        {['Show system stats', 'Recent user activity', 'Check document status'].map(s => (
                                            <button key={s} onClick={() => setInput(s)} className="block w-full text-left text-[11px] text-zinc-500 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                                                {s} →
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center mt-0.5 ${msg.role === 'user' ? 'bg-orange-500/20' : 'bg-gradient-to-br from-orange-500 to-amber-500'}`}>
                                        {msg.role === 'user' ? <User className="w-3 h-3 text-orange-400" /> : <Bot className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className={`rounded-xl px-3 py-2 text-xs max-w-[80%] leading-relaxed ${msg.role === 'user' ? 'bg-orange-500/10 border border-orange-500/20 text-white' : 'bg-white/[0.04] border border-white/[0.06] text-zinc-300'}`}>
                                        {msg.role === 'user' ? msg.content : (
                                            <div className="prose prose-xs prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 prose-a:text-orange-400">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isQuerying && (
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                                        <Bot className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="flex gap-1 items-center px-3 py-2">
                                        {[0, 150, 300].map(d => <div key={d} className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                                    </div>
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={send} className="px-3 py-2.5 border-t border-white/[0.06] shrink-0">
                            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 focus-within:border-orange-500/30 transition-colors">
                                <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about users, docs, system..." className="flex-1 bg-transparent py-2.5 text-xs outline-none placeholder:text-zinc-700" disabled={isQuerying} />
                                <Button type="submit" size="icon" className="h-7 w-7 rounded-lg bg-orange-600 hover:bg-orange-500 text-white shrink-0 transition-all hover:shadow-md hover:shadow-orange-500/20 active:scale-90" disabled={!input.trim() || isQuerying}>
                                    <ArrowUp className="w-3 h-3" />
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-500/30 text-white"
            >
                {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </motion.button>
        </div>
    );
}

/* ─── Stat Card with sparkline ─── */
function MiniBarChart({ data, color, hovered }: { data: number[], color: string, hovered: boolean }) {
    const max = Math.max(...data);
    return (
        <div className="flex items-end gap-[3px] h-10 mt-2">
            {data.map((v, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${(v / max) * 100}%` }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    className="flex-1 rounded-sm min-w-[3px] transition-colors"
                    style={{ backgroundColor: color, opacity: hovered ? 0.4 + (v / max) * 0.6 : 0.2 + (v / max) * 0.5 }}
                />
            ))}
        </div>
    );
}

/* ─── Admin Dashboard ─── */
const AdminDashboard = () => {
    const { user } = useAuthStore();
    const firstName = user?.full_name?.split(' ')[0] || 'Admin';
    const [hoveredStat, setHoveredStat] = useState<number | null>(null);

    const stats = [
        { label: 'Total Users', value: '2,847', icon: Users, change: '+32 this month', color: '#f97316', sparkline: [12, 19, 15, 28, 35, 42, 38] },
        { label: 'Documents', value: '456', icon: FileText, change: '+18 this week', color: '#f59e0b', sparkline: [8, 12, 9, 14, 18, 15, 22] },
        { label: 'Total Queries', value: '14.2k', icon: MessageSquare, change: '+1.2k this week', color: '#10b981', sparkline: [45, 62, 55, 78, 89, 95, 120] },
        { label: 'System Health', value: '99.9%', icon: Activity, change: 'All systems normal', color: '#3b82f6', sparkline: [98, 99, 99, 100, 99, 100, 99] },
    ];

    const recentAudit = [
        { action: 'User Login', user: 'student@unigpt.edu', time: '2m ago', type: 'auth' },
        { action: 'Document Upload', user: 'faculty@unigpt.edu', time: '15m ago', type: 'upload' },
        { action: 'Policy Update', user: 'admin@unigpt.edu', time: '1h ago', type: 'admin' },
        { action: 'New User Signup', user: 'john@university.edu', time: '3h ago', type: 'auth' },
    ];

    const typeStyles: Record<string, string> = {
        auth: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        upload: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        admin: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    };

    return (
        <>
            <div className="p-5 md:p-8 space-y-6 pb-24 max-w-7xl mx-auto">
                {/* Welcome */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-950 via-zinc-950 to-orange-950/20 p-5 sm:p-6 md:p-10">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-orange-500/[0.05] to-transparent pointer-events-none" />
                    <div className="relative z-10 space-y-4 max-w-xl">
                        <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                            <Shield className="w-3 h-3 mr-1.5" /> Admin Console
                        </Badge>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                            System Overview, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">{firstName}</span>
                        </h1>
                        <p className="text-zinc-500 text-xs sm:text-sm">Monitor health, manage users, review logs.</p>
                        <div className="flex flex-wrap gap-2 sm:gap-3 pt-1">
                            <Link to="/dashboard/users"><Button className="rounded-xl h-8 sm:h-9 px-3 sm:px-4 bg-orange-600 hover:bg-orange-500 text-white text-[10px] sm:text-xs font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"><Users className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 sm:mr-1.5" /> Manage Users</Button></Link>
                            <Link to="/dashboard/audit"><Button variant="glass" className="rounded-xl h-8 sm:h-9 px-3 sm:px-4 text-zinc-300 text-[10px] sm:text-xs font-semibold hover:text-white transition-all active:scale-95"><Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 sm:mr-1.5" /> Audit Logs</Button></Link>
                        </div>
                    </div>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                            <div
                                className="p-5 rounded-2xl bg-zinc-900/50 border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-default group"
                                onMouseEnter={() => setHoveredStat(i)}
                                onMouseLeave={() => setHoveredStat(null)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '1a' }}>
                                        <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                                    </div>
                                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</div>
                                <div className="text-[11px] text-zinc-500">{stat.label}</div>
                                <MiniBarChart data={stat.sparkline} color={stat.color} hovered={hoveredStat === i} />
                                <div className="flex items-center gap-1.5 mt-1">
                                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] text-zinc-600">{stat.change}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-3 p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.06]">
                        <InteractiveBarChart />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.06]">
                        <DonutChart />
                    </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold text-white">Recent Activity</h2>
                        <Link to="/dashboard/audit" className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold transition-colors">View all →</Link>
                    </div>
                    <div className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
                        {recentAudit.map((item, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-3">
                                    <Badge className={`text-[9px] font-semibold px-2 py-0.5 border ${typeStyles[item.type]}`}>{item.type}</Badge>
                                    <div>
                                        <div className="text-xs font-medium text-zinc-300">{item.action}</div>
                                        <div className="text-[10px] text-zinc-600">{item.user}</div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-600">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <AdminChatBubble />
        </>
    );
};

export default AdminDashboard;
