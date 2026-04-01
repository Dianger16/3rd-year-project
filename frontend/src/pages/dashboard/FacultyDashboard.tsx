import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    FileText,
    Plus,
    Calendar,
    ArrowRight,
    Sparkles,
    Building2,
    Bell,
    ShieldCheck,
    ChevronRight,
    Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { authApi, documentsApi, type DocumentResponse, type UserExportData } from '@/lib/api';

const isCircular = (doc: DocumentResponse) => {
    const name = (doc.filename || '').toLowerCase();
    const tags = (doc.tags || []).map((tag) => tag.toLowerCase());
    return (
        name.includes('circular') ||
        name.includes('notice') ||
        name.includes('announcement') ||
        tags.includes('circular') ||
        tags.includes('notice') ||
        tags.includes('announcement')
    );
};

const timeAgo = (value?: string) => {
    if (!value) return 'recently';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'recently';
    const mins = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export default function FacultyDashboard() {
    const { user, token } = useAuthStore();
    const navigate = useNavigate();
    const firstName = user?.full_name?.split(' ')[0] || 'Professor';

    const [exportData, setExportData] = useState<UserExportData | null>(null);
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);

    useEffect(() => {
        let alive = true;
        const loadData = async () => {
            if (!token) return;
            try {
                const [exportPayload, docsPayload] = await Promise.all([
                    authApi.exportUserData(token),
                    documentsApi.list(token, { page: 1, per_page: 60 }),
                ]);
                if (!alive) return;
                setExportData(exportPayload);
                setDocuments(docsPayload.documents || []);
            } catch {
                if (!alive) return;
                setExportData(null);
                setDocuments([]);
            }
        };

        loadData();
        return () => {
            alive = false;
        };
    }, [token]);

    const circulars = useMemo(() => {
        return documents
            .filter(isCircular)
            .sort((a, b) => {
                const da = new Date(a.uploaded_at || a.created_at || '').getTime() || 0;
                const db = new Date(b.uploaded_at || b.created_at || '').getTime() || 0;
                return db - da;
            })
            .slice(0, 4)
            .map((doc) => ({
                id: doc.id,
                title: doc.filename,
                tag: doc.doc_type,
                urgency: (doc.tags || []).some((tag) => ['urgent', 'important', 'deadline'].includes(tag.toLowerCase()))
                    ? 'high'
                    : 'medium',
                dateLabel: timeAgo(doc.uploaded_at || doc.created_at),
            }));
    }, [documents]);

    const openChatWithPrefill = (prefill: string) => {
        navigate('/dashboard/chat', { state: { prefill } });
    };

    const facultyMetrics = [
        {
            label: 'Accessible Docs',
            value: exportData ? String(exportData.documents) : '--',
            change: 'Role-based scope',
            icon: FileText,
            color: 'text-orange-500',
        },
        {
            label: 'Notices (30d)',
            value: exportData ? String(exportData.notices) : '--',
            change: 'Recent circular flow',
            icon: Bell,
            color: 'text-blue-500',
        },
        {
            label: 'Total Queries',
            value: exportData ? String(exportData.queries) : '--',
            change: 'From your account',
            icon: Activity,
            color: 'text-emerald-500',
        },
        {
            label: 'Department',
            value: user?.department || 'Not set',
            change: user?.program || 'Program not set',
            icon: Users,
            color: 'text-cyan-400',
        },
    ];

    return (
        <div className="p-6 md:p-8 space-y-8 pb-20 overflow-y-auto h-full max-w-7xl mx-auto w-full">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 p-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Faculty Console: <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Dr. {firstName}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm">Live departmental operations, circulars, and faculty assistant actions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/dashboard/upload">
                        <Button className="bg-white text-black hover:bg-zinc-200 font-semibold px-6 h-11 rounded-2xl shadow-lg transition-all active:scale-95 flex gap-2 text-sm">
                            <Plus className="w-4 h-4" /> Upload Circular
                        </Button>
                    </Link>
                    <Link to="/dashboard/chat">
                        <Button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 h-11 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex gap-2 text-sm">
                            <Sparkles className="w-4 h-4" /> Faculty Assistant
                        </Button>
                    </Link>
                </div>
            </header>

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
                            <div className={cn('p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]', m.color)}>
                                <m.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none bg-white/[0.03] px-2 py-1 rounded-md">{m.change}</span>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-1">{m.label}</p>
                            <h3 className="text-2xl font-extrabold text-white break-words">{m.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/[0.08] rounded-[2rem] p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-orange-400" /> Departmental Circulars
                            </h3>
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/dashboard/documents')}
                                className="text-[10px] font-black tracking-widest uppercase text-zinc-500 hover:text-orange-400 transition-colors h-auto p-0"
                            >
                                Archive
                            </Button>
                        </div>

                        {circulars.length === 0 ? (
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-zinc-500">
                                No circular documents found in your scope.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {circulars.map((c, i) => (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                        className="group p-5 bg-zinc-900/70 border border-white/[0.08] rounded-2xl hover:bg-zinc-900/90 hover:border-white/[0.14] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div
                                                className={cn(
                                                    'w-12 h-12 rounded-xl border flex items-center justify-center transition-colors',
                                                    c.urgency === 'high'
                                                        ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                                        : 'bg-orange-500/10 border-orange-500/20 text-orange-500',
                                                )}
                                            >
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors truncate">{c.title}</h4>
                                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                                                    {c.tag} - {c.dateLabel}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openChatWithPrefill(`Acknowledge and summarize this circular for faculty: ${c.title}`)}
                                            className="text-zinc-600 group-hover:text-orange-400 transition-colors font-bold text-xs uppercase tracking-widest"
                                        >
                                            Acknowledge <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-zinc-950 border border-white/[0.08] rounded-[2.5rem] p-8 mt-4 group relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                                <ShieldCheck className="w-10 h-10 text-orange-500" />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h3 className="text-2xl font-black text-white leading-tight">University Policy Assistant</h3>
                                <p className="text-zinc-500 text-sm max-w-sm">Ask me to summarize current faculty notices, deadlines, and policy updates from your live documents.</p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                                    <Link to="/dashboard/chat" state={{ prefill: 'Summarize the latest faculty policy updates from uploaded circulars.' }}>
                                        <Button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold h-12 px-8 rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm">
                                            Open Policy Chat
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/[0.08] rounded-[2rem] p-6 space-y-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-400" /> Faculty Agenda
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
                            Department Calendar <ChevronRight className="w-3 h-3 ml-2 group-hover/cal:text-orange-400 transition-colors" />
                        </Button>
                    </div>

                    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/[0.08] rounded-[2rem] p-6">
                        <h4 className="text-sm font-bold text-white mb-4">Quick Assist</h4>
                        <div className="space-y-3">
                            {[
                                'Show pending faculty circular approvals.',
                                'List urgent notices from last 7 days.',
                            ].map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => openChatWithPrefill(prompt)}
                                    className="w-full p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] text-left text-[11px] text-zinc-300 hover:border-orange-500/25 hover:bg-orange-500/5 transition-all"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
