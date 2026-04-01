import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    CheckCircle2,
    ArrowUpRight,
    Sparkles,
    Wallet,
    Bell,
    MapPin,
    Info,
    ChevronRight,
    BookOpen,
    Layers,
    FileText,
    Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { authApi, documentsApi, type DocumentResponse, type UserExportData } from '@/lib/api';

type DashboardNotice = {
    id: string;
    title: string;
    tag: string;
    dateLabel: string;
    priority: 'high' | 'medium' | 'low';
};

const toShortDate = (value?: string) => {
    if (!value) return 'Unknown date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Unknown date';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const toRelativeTime = (value?: string) => {
    if (!value) return 'Recently';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Recently';
    const diffMs = Date.now() - parsed.getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

const isNoticeDoc = (doc: DocumentResponse) => {
    const name = (doc.filename || '').toLowerCase();
    const tags = (doc.tags || []).map((tag) => tag.toLowerCase());
    return (
        name.includes('notice') ||
        name.includes('announcement') ||
        name.includes('circular') ||
        tags.includes('notice') ||
        tags.includes('announcement') ||
        tags.includes('circular')
    );
};

const mapNotice = (doc: DocumentResponse): DashboardNotice => {
    const tags = (doc.tags || []).map((tag) => tag.toLowerCase());
    const highPriority = tags.includes('urgent') || tags.includes('important');
    const mediumPriority = tags.includes('deadline') || tags.includes('event');

    return {
        id: doc.id,
        title: doc.filename,
        tag: doc.doc_type || 'document',
        dateLabel: toRelativeTime(doc.uploaded_at || doc.created_at),
        priority: highPriority ? 'high' : mediumPriority ? 'medium' : 'low',
    };
};

export default function StudentDashboard() {
    const { user, token } = useAuthStore();
    const navigate = useNavigate();
    const firstName = user?.full_name?.split(' ')[0] || 'Student';

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

    const notices = useMemo(() => {
        return documents
            .filter(isNoticeDoc)
            .sort((a, b) => {
                const da = new Date(a.uploaded_at || a.created_at || '').getTime() || 0;
                const db = new Date(b.uploaded_at || b.created_at || '').getTime() || 0;
                return db - da;
            })
            .slice(0, 4)
            .map(mapNotice);
    }, [documents]);

    const openChatWithPrefill = (prefill: string) => {
        navigate('/dashboard/chat', { state: { prefill } });
    };

    const openCampusBoard = () => {
        navigate('/dashboard/documents');
    };

    const openNotice = (title: string) => {
        openChatWithPrefill(`Summarize this notice and tell me key deadlines: ${title}`);
    };

    const metrics = [
        {
            label: 'Attendance Target',
            value: '75%',
            hint: 'Minimum policy threshold',
            icon: CheckCircle2,
            color: 'text-green-500',
        },
        {
            label: 'Query Count',
            value: exportData ? String(exportData.queries) : '--',
            hint: 'From your account history',
            icon: Activity,
            color: 'text-orange-500',
        },
        {
            label: 'Accessible Docs',
            value: exportData ? String(exportData.documents) : '--',
            hint: 'Role-based document access',
            icon: FileText,
            color: 'text-blue-400',
        },
        {
            label: 'Profile Semester',
            value: user?.semester || 'Not set',
            hint: user?.program || 'Program not set',
            icon: Layers,
            color: 'text-purple-400',
        },
    ];

    return (
        <div className="p-6 md:p-8 space-y-7 pb-20 overflow-y-auto h-full max-w-7xl mx-auto w-full">
            <header className="rounded-3xl border border-white/[0.08] bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/40 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div className="space-y-1.5">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                            Student Portal: <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">{firstName}</span>
                        </h1>
                        <p className="text-zinc-500 text-sm max-w-xl">
                            Your live academic workspace with notices, course updates, and assistant actions.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link to="/dashboard/chat">
                            <Button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 h-11 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex gap-2 text-sm">
                                <Sparkles className="w-4 h-4" /> Ask University Assistant
                            </Button>
                        </Link>
                        <Link to="/dashboard/courses">
                            <Button variant="outline" className="h-11 rounded-2xl px-5 text-zinc-200 border-white/15 hover:text-white">
                                <BookOpen className="w-4 h-4 mr-2" /> Open Courses
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-2xl border border-white/[0.08] bg-zinc-900/55 p-5 hover:border-white/[0.16] transition-all"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={cn('p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]', item.color)}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700" />
                        </div>
                        <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-1">{item.label}</p>
                        <h3 className="text-2xl font-extrabold text-white leading-none">{item.value}</h3>
                        <p className="text-[11px] text-zinc-600 mt-2">{item.hint}</p>
                    </motion.div>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/50 p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Bell className="w-4 h-4 text-orange-400" /> Official Notices
                            </h3>
                            <Button
                                variant="ghost"
                                onClick={openCampusBoard}
                                className="text-[10px] font-black tracking-widest uppercase text-zinc-500 hover:text-orange-400 h-auto p-0"
                            >
                                Campus Board
                            </Button>
                        </div>

                        {notices.length === 0 ? (
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-zinc-500">
                                No notice documents found in your current database scope.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notices.map((notice) => (
                                    <div
                                        key={notice.id}
                                        className="group flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/[0.06] hover:border-white/[0.14] transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={cn(
                                                    'w-9 h-9 rounded-xl border flex items-center justify-center',
                                                    notice.priority === 'high'
                                                        ? 'bg-red-500/10 border-red-500/25 text-red-400'
                                                        : notice.priority === 'medium'
                                                            ? 'bg-orange-500/10 border-orange-500/25 text-orange-400'
                                                            : 'bg-blue-500/10 border-blue-500/25 text-blue-400',
                                                )}
                                            >
                                                <Info className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-semibold text-white truncate">{notice.title}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">{notice.tag}</span>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                                    <span className="text-[10px] text-zinc-500">{notice.dateLabel}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openNotice(notice.title)}
                                            className="text-zinc-600 hover:text-orange-400 uppercase text-[10px] font-bold tracking-widest"
                                        >
                                            View <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-r from-zinc-900 to-black p-6 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/5 blur-[80px] rounded-full" />
                        <div className="relative z-10 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4 text-orange-400" />
                                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Campus Explorer</span>
                                </div>
                                <h3 className="text-2xl font-black text-white leading-tight">Need policy or campus help?</h3>
                                <p className="text-zinc-400 text-sm mt-2 max-w-lg">
                                    Ask about rules, facilities, deadlines, and route-specific notices instantly.
                                </p>
                            </div>
                            <Link to="/dashboard/chat" state={{ prefill: 'Show me the latest student notices with deadlines and categories.' }}>
                                <Button className="bg-white text-black hover:bg-zinc-200 h-12 px-7 rounded-xl font-semibold transition-all shadow-xl shadow-black/20 text-sm">
                                    Ask Assistant
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/50 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-400" /> Upcoming Focus
                            </h3>
                            <span className="text-[10px] font-bold text-zinc-600">{toShortDate(exportData?.exportDate)}</span>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
                                <p className="text-zinc-500 uppercase tracking-wider text-[10px]">Program</p>
                                <p className="text-white font-semibold mt-1">{user?.program || 'Not set'}</p>
                            </div>
                            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
                                <p className="text-zinc-500 uppercase tracking-wider text-[10px]">Semester & Section</p>
                                <p className="text-white font-semibold mt-1">
                                    {user?.semester || 'NA'} / {user?.section || 'NA'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
                                <p className="text-zinc-500 uppercase tracking-wider text-[10px]">Role Access</p>
                                <p className="text-white font-semibold mt-1 capitalize">{user?.role || 'student'}</p>
                            </div>
                        </div>

                        <Link to="/dashboard/courses" className="block mt-4">
                            <Button variant="outline" className="w-full border-white/[0.12] bg-white/[0.03] text-zinc-300 hover:text-white rounded-xl h-11 font-semibold text-xs group">
                                View Course Directory
                                <ChevronRight className="w-4 h-4 ml-2 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                            </Button>
                        </Link>
                    </div>

                    <div className="rounded-3xl border border-orange-500/20 bg-orange-600/[0.06] p-5 text-center">
                        <Wallet className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                        <h4 className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-1.5">Data Sync</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                            Dashboard stats are generated from your live profile, notice documents, and query history.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
