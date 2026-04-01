import React from 'react';
import { motion } from 'framer-motion';
import {
    Calendar, CheckCircle2, ArrowUpRight, Sparkles,
    Building2, Wallet, Bell, MapPin, Info, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function StudentDashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const firstName = user?.full_name?.split(' ')[0] || 'Student';

    const campusMetrics = [
        { label: 'Attendance', value: '94%', change: 'Above 75%', icon: CheckCircle2, color: 'text-green-500' },
        { label: 'Fee Status', value: 'Paid', change: 'Semester 4', icon: Wallet, color: 'text-orange-500' },
        { label: 'Next Holiday', value: 'Oct 28', change: 'Diwali Break', icon: Calendar, color: 'text-blue-500' },
        { label: 'Library Dues', value: 'INR 0.00', change: 'Clear', icon: Building2, color: 'text-cyan-400' },
    ];

    const campusNotices = [
        { title: 'Convocation Ceremony 2026', tag: 'Event', date: 'Posted 2h ago', priority: 'medium' },
        { title: 'Update: Mandatory Cyber Security Seminar', tag: 'Admin', date: 'Deadline: Today', priority: 'high' },
        { title: 'Hostel WiFi maintenance schedule', tag: 'Services', date: 'Posted Yesterday', priority: 'low' },
    ];

    const openChatWithPrefill = (prefill: string) => {
        navigate('/dashboard/chat', { state: { prefill } });
    };

    const openCampusBoard = () => {
        navigate('/dashboard/documents');
    };

    const openNotice = (title: string) => {
        openChatWithPrefill(`Summarize the campus notice: ${title}`);
    };

    return (
        <div className="p-6 md:p-8 space-y-8 pb-20 overflow-y-auto h-full max-w-7xl mx-auto w-full">
            {/* Header Greeting */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 p-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Student Portal: <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">{firstName}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm">Welcome to the central navigation for your campus life.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/dashboard/chat">
                        <Button className="grow sm:grow-0 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 h-12 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex gap-2 text-sm tracking-normal uppercase">
                            <Sparkles className="w-4 h-4" />
                            Ask University Admin
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Metrics Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {campusMetrics.map((m, i) => (
                    <motion.div
                        key={m.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/[0.08] rounded-3xl p-5 hover:border-white/[0.16] transition-all shadow-[0_12px_35px_-20px_rgba(0,0,0,0.8)]"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn("p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]", m.color)}>
                                <m.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none bg-white/[0.03] px-2 py-1 rounded-md">{m.change}</span>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-1">{m.label}</p>
                            <h3 className="text-2xl font-extrabold text-white">{m.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Notices & Policies */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/[0.08] rounded-[2rem] p-6 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Bell className="w-4 h-4 text-orange-400" />
                                Official Notices
                            </h3>
                            <Button
                                variant="ghost"
                                onClick={openCampusBoard}
                                className="text-[10px] font-black tracking-widest uppercase text-zinc-500 hover:text-orange-400 transition-colors h-auto p-0"
                            >
                                Campus Board
                            </Button>
                        </div>
                        <div className="space-y-3 flex-1">
                            {campusNotices.map((n, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + (i * 0.1) }}
                                    className="group flex items-center justify-between p-4 bg-zinc-900/70 border border-white/[0.08] rounded-2xl hover:bg-zinc-900/90 hover:border-white/[0.14] transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                                            n.priority === 'high' ? "bg-red-500/10 border-red-500/20 text-red-500 group-hover:bg-red-500/20" :
                                                n.priority === 'medium' ? "bg-orange-500/10 border-orange-500/20 text-orange-500 group-hover:bg-orange-500/20" :
                                                    "bg-blue-500/10 border-blue-500/20 text-blue-500 group-hover:bg-blue-500/20"
                                        )}>
                                            <Info className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{n.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{n.tag}</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                                <span className="text-[10px] text-zinc-500 font-medium">{n.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openNotice(n.title)}
                                        className="text-zinc-600 hover:text-white hover:bg-white/5 group-hover:text-orange-400 transition-colors uppercase text-[10px] font-bold tracking-widest shrink-0 ml-2"
                                    >
                                        View <ArrowUpRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Policy Expert Card */}
                    <div className="bg-gradient-to-r from-zinc-900 to-black border border-white/[0.08] rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl shrink-0">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/5 blur-[80px] rounded-full" />
                        <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                            <div className="space-y-2 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <Building2 className="w-5 h-5 text-orange-400" />
                                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">University Policy Expert</span>
                                </div>
                                <h3 className="text-2xl font-black text-white leading-tight">Confused about campus rules?</h3>
                                <p className="text-zinc-400 text-sm max-w-sm">Ask about refund policies, hostel timings, bus passes, and certificate applications.</p>
                            </div>
                            <Link to="/dashboard/chat" state={{ prefill: 'Explain key university policy highlights for students this week.' }} className="shrink-0 md:justify-self-end">
                                <Button className="bg-white text-black hover:bg-zinc-200 h-14 px-8 rounded-2xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20 text-sm tracking-normal uppercase">
                                    ASK ADMIN AI
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column: Schedule */}
                <div className="flex flex-col gap-8 lg:col-span-4 lg:max-w-[390px] lg:ml-auto">
                    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/[0.08] rounded-[2rem] p-5 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-400" />
                                Daily Schedule
                            </h3>
                            <span className="text-[10px] font-bold text-zinc-600">OCT 22</span>
                        </div>

                        <div className="space-y-4">
                            {[
                                { time: '10:00 AM', event: 'CS301 (Hall RL-301)', type: 'Class', active: true },
                                { time: '01:30 PM', event: 'Math Seminar (Audit-A)', type: 'Workshop', active: false },
                                { time: '04:00 PM', event: 'Sports Practice', type: 'Extra', active: false },
                            ].map((item, i) => (
                                <div key={i} className={cn(
                                    "relative pl-4 border-l-2 py-1",
                                    item.active ? "border-orange-500" : "border-zinc-800"
                                )}>
                                    <p className={cn("text-[10px] font-bold uppercase", item.active ? "text-orange-500" : "text-zinc-600")}>{item.time}</p>
                                    <h4 className="text-sm font-bold text-white mt-0.5">{item.event}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{item.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link to="/dashboard/courses" className="block mt-auto">
                            <Button variant="outline" className="w-full border-white/[0.1] bg-white/[0.03] text-zinc-300 hover:text-white rounded-xl h-12 font-semibold text-xs mt-4 transition-all group/cal">
                                VIEW FULL CALENDAR <ChevronRight className="w-4 h-4 ml-2 text-zinc-600 group-hover/cal:text-orange-400 transition-colors" />
                            </Button>
                        </Link>
                    </div>

                    <div className="bg-orange-600/[0.06] border border-orange-500/20 rounded-[2rem] p-6 text-center relative overflow-hidden">
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-orange-500/5 blur-3xl rounded-full" />
                        <MapPin className="w-6 h-6 text-orange-500 mx-auto mb-3" />
                        <h4 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1.5">Campus Explorer</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                            Not sure where your next lab is? Type "Where is RL-301?" in the AI Chat.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
