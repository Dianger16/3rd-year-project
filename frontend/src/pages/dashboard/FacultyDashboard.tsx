import React from 'react';
import { motion } from 'framer-motion';
import {
    Users, FileText, ClipboardList,
    Plus,
    Calendar, ArrowRight,
    Sparkles, Building2, Bell, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function FacultyDashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const firstName = user?.full_name?.split(' ')[0] || 'Professor';

    const facultyMetrics = [
        { label: 'Total Students', value: '184', change: 'Semester 4', icon: Users, color: 'text-orange-500' },
        { label: 'Leave Requests', value: '12', change: '3 Pending', icon: ClipboardList, color: 'text-red-500' },
        { label: 'Staff Meetings', value: '2', change: 'This week', icon: Calendar, color: 'text-blue-500' },
        { label: 'Circulars', value: '8', change: '2 New', icon: Bell, color: 'text-cyan-400' },
    ];

    const currentCirculars = [
        { id: 1, title: 'Exam Duty Schedule - Fall 2026', tag: 'Admin', urgency: 'high' },
        { id: 2, title: 'Budget Allocation: CS Lab Upgrade', tag: 'Finance', urgency: 'medium' },
        { id: 3, title: 'New Faculty Orientation Guidelines', tag: 'HR', urgency: 'low' },
    ];

    const openChatWithPrefill = (prefill: string) => {
        navigate('/dashboard/chat', { state: { prefill } });
    };

    return (
        <div className="p-6 md:p-8 space-y-8 pb-20 overflow-y-auto h-full max-w-7xl mx-auto w-full">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 p-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Faculty Console: <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Dr. {firstName}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm">Managing Departmental Logistics and Administrative Oversight.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/dashboard/upload">
                        <Button className="bg-white text-black hover:bg-zinc-200 font-semibold px-6 h-12 rounded-2xl shadow-lg transition-all active:scale-95 flex gap-2 text-sm tracking-normal uppercase">
                            <Plus className="w-4 h-4" />
                            Upload Circular
                        </Button>
                    </Link>
                    <Link to="/dashboard/chat">
                        <Button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 h-12 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex gap-2 text-sm tracking-normal uppercase">
                            <Sparkles className="w-4 h-4" />
                            Admin Assistant
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Metrics */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {facultyMetrics.map((m, i) => (
                    <motion.div
                        key={m.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Departmental Control */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/[0.08] rounded-[2rem] p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-orange-400" />
                                Departmental Circulars
                            </h3>
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/dashboard/documents')}
                                className="text-[10px] font-black tracking-widest uppercase text-zinc-500 hover:text-orange-400 transition-colors h-auto p-0"
                            >
                                Archive
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {currentCirculars.map((c, i) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + (i * 0.1) }}
                                    className="group p-5 bg-zinc-900/70 border border-white/[0.08] rounded-2xl hover:bg-zinc-900/90 hover:border-white/[0.14] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl border flex items-center justify-center transition-colors",
                                            c.urgency === 'high' ? "bg-red-500/10 border-red-500/20 text-red-500 group-hover:bg-red-500/20" :
                                                c.urgency === 'medium' ? "bg-orange-500/10 border-orange-500/20 text-orange-500 group-hover:bg-orange-500/20" :
                                                    "bg-blue-500/10 border-blue-500/20 text-blue-500 group-hover:bg-blue-500/20"
                                        )}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{c.title}</h4>
                                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">{c.tag} - Verification Required</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openChatWithPrefill(`Acknowledge and summarize this circular for faculty: ${c.title}`)}
                                        className="text-zinc-600 group-hover:text-orange-400 transition-colors font-bold text-xs uppercase tracking-widest"
                                    >
                                        ACKNOWLEDGE <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Admin Policy AI Card */}
                    <div className="bg-zinc-950 border border-white/[0.08] rounded-[2.5rem] p-8 mt-4 group relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                                <ShieldCheck className="w-10 h-10 text-orange-500" />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h3 className="text-2xl font-black text-white leading-tight">University Policy Assistant</h3>
                                <p className="text-zinc-500 text-sm max-w-sm">Not sure about leave allotment or exam duty rules? Ask me to scan the latest University Handbook for you.</p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                                    <Link to="/dashboard/chat" state={{ prefill: 'Summarize the latest faculty policy changes for this week.' }}>
                                        <Button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold h-12 px-8 rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm tracking-normal uppercase">
                                            Open AI Policy Chat
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Meetings & Admin Tasks */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/[0.08] rounded-[2rem] p-6 space-y-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-400" />
                            Faculty Meetings
                        </h3>

                        <div className="space-y-4">
                            {[
                                { day: 'Today', time: '02:00 PM', event: 'HOD Sync (Room 402)', type: 'Admin' },
                                { day: 'Tue', time: '11:00 AM', event: 'Syllabus Review', type: 'Curriculum' },
                                { day: 'Wed', time: '04:00 PM', event: 'Student Welfare', type: 'Meeting' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="text-center shrink-0 min-w-[3.5rem]">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase">{item.day}</p>
                                        <p className="text-[11px] font-bold text-zinc-400 mt-0.5">{item.time}</p>
                                    </div>
                                    <div className="flex-1 h-px bg-white/[0.04] mt-4 self-start" />
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">{item.event}</h4>
                                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{item.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => navigate('/dashboard/courses')}
                            className="w-full text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest py-4 border border-white/[0.04] rounded-xl group/cal"
                        >
                            Full Departmental Calendar <ChevronRight className="w-3 h-3 ml-2 group-hover/cal:text-orange-400 transition-colors" />
                        </Button>
                    </div>

                    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/[0.08] rounded-[2rem] p-6">
                        <h4 className="text-sm font-bold text-white mb-4">Pending Leave Approvals</h4>
                        <div className="space-y-3">
                            {[1, 2].map((_, i) => (
                                <div key={i} className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-[10px] font-black group-hover:scale-110 transition-transform">A</div>
                                        <p className="text-[10px] font-bold text-white">Student {i + 1}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openChatWithPrefill(`Show pending leave approval details for Student ${i + 1}.`)}
                                        className="text-orange-400 h-7 text-[10px] p-0 font-bold uppercase tracking-widest hover:bg-transparent"
                                    >
                                        View
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

