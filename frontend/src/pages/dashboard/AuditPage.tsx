import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, Filter, Clock, Activity, Download, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuditLog {
    id: string;
    event: string;
    user: string;
    role: string;
    timestamp: string;
    ip: string;
    type: 'auth' | 'upload' | 'admin' | 'query' | 'system';
    status: 'success' | 'warning' | 'error';
    details: string;
}

const INITIAL_LOGS: AuditLog[] = [
    { id: '1', event: 'Successful Login', user: 'admin@unigpt.edu', role: 'admin', timestamp: '2024-03-15T09:30:00Z', ip: '192.168.1.100', type: 'auth', status: 'success', details: 'Google OAuth login from Windows/Chrome.' },
    { id: '2', event: 'Document Uploaded', user: 'dr.smith@unigpt.edu', role: 'faculty', timestamp: '2024-03-15T09:15:00Z', ip: '142.250.190.46', type: 'upload', status: 'success', details: 'Uploaded CS301_Syllabus.pdf (2.4MB)' },
    { id: '3', event: 'Failed Login Attempt', user: 'unknown@unigpt.edu', role: 'unknown', timestamp: '2024-03-15T09:10:00Z', ip: 'Unknown', type: 'auth', status: 'error', details: 'Invalid credentials. 3rd attempt.' },
    { id: '4', event: 'User Role Changed', user: 'admin@unigpt.edu', role: 'admin', timestamp: '2024-03-15T08:45:00Z', ip: '192.168.1.100', type: 'admin', status: 'warning', details: 'Changed john.doe role from Student to Faculty.' },
    { id: '5', event: 'High Volume Queries', user: 'system', role: 'system', timestamp: '2024-03-15T08:00:00Z', ip: 'Internal', type: 'system', status: 'warning', details: 'Spike in API requests detected (+400%).' },
    { id: '6', event: 'Query Processed', user: 'student1@unigpt.edu', role: 'student', timestamp: '2024-03-15T07:30:00Z', ip: '192.168.1.150', type: 'query', status: 'success', details: 'Query: "When is the CS101 final?" - Latency: 1.2s' },
];

const AuditPage = () => {
    const [logs, setLogs] = useState<AuditLog[]>(INITIAL_LOGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 6;

    const typeColors: Record<string, string> = {
        auth: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        upload: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        admin: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        query: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        system: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const statusIcons: Record<string, React.ReactNode> = {
        success: <div className="w-2 h-2 rounded-full bg-emerald-500" />,
        warning: <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />,
        error: <div className="w-2 h-2 rounded-full bg-red-500" />,
    };

    const filtered = logs.filter(log => {
        const matchesSearch = log.event.toLowerCase().includes(searchQuery.toLowerCase()) || log.user.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || log.type === filterType;
        return matchesSearch && matchesType;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterType]);

    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className="p-5 md:p-8 space-y-5 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-orange-400" /> System Audit Logs
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1">Immutable record of system events, access, and changes.</p>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                    <Button
                        onClick={() => {
                            const csv = ['Type,Event,User,Role,IP,Time,Status,Details', ...filtered.map(l => `${l.type},${l.event},${l.user},${l.role},${l.ip},${l.timestamp},${l.status},"${l.details}"`)].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = 'audit-logs.csv'; a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="h-10 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-semibold tracking-[0.18em] uppercase transition-all hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.97]"
                    >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                    </Button>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center gap-3 bg-zinc-900/40 border border-white/[0.06] p-4 rounded-xl">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text" placeholder="Search events or users..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs outline-none focus:border-orange-500/30 placeholder:text-zinc-600"
                    />
                </div>
                <div className="h-6 w-px bg-white/10 hidden sm:block" />
                <div className="flex gap-2 flex-wrap">
                    {['all', 'auth', 'upload', 'admin', 'system', 'query'].map(t => (
                        <button
                            key={t} onClick={() => setFilterType(t)}
                            className={`h-8 px-3 rounded-lg text-[11px] font-semibold capitalize transition-all flex items-center gap-1.5 border active:scale-95 ${filterType === t ? 'bg-orange-500/15 text-orange-400 border-orange-500/20' : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15]'}`}
                        >
                            {t !== 'all' && <div className={`w-1.5 h-1.5 rounded-full ${typeColors[t]?.split(' ')[0] || ''}`} />}
                            {t}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Log Table */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 overflow-hidden divide-y divide-white/[0.04]">
                <div className="hidden sm:grid grid-cols-[80px_1fr_1fr_140px_160px_30px] gap-4 px-6 py-3 border-b border-white/[0.1] text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>Type</span><span>Event</span><span>User</span><span>IP Address</span><span>Time</span><span></span>
                </div>
                {paginated.map((log) => (
                    <div key={log.id} className="group flex flex-col hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                        <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_1fr_140px_160px_30px] gap-2 sm:gap-4 items-center px-6 py-4">
                            <Badge className={`text-[9px] font-semibold px-2 py-0.5 border ${typeColors[log.type]} w-fit`}>{log.type}</Badge>

                            <div className="flex items-center gap-3 min-w-0">
                                {statusIcons[log.status]}
                                <span className="text-xs font-semibold text-white truncate">{log.event}</span>
                            </div>

                            <div className="min-w-0">
                                <div className="text-xs text-zinc-300 truncate">{log.user}</div>
                                <div className="text-[10px] text-zinc-600 capitalize">{log.role}</div>
                            </div>

                            <div className="text-[10px] text-zinc-500 font-mono hidden sm:block">{log.ip}</div>

                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 hidden sm:flex">
                                <Clock className="w-3 h-3" /> {formatTime(log.timestamp)}
                            </div>

                            <ChevronRight className={`w-4 h-4 text-zinc-600 transition-transform ${expandedLog === log.id ? 'rotate-90 text-orange-400' : ''}`} />
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                            {expandedLog === log.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="px-6 py-4 bg-black/20 border-t border-white/[0.02] grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">Log ID</span>
                                            <span className="text-xs text-zinc-300 font-mono">{log.id}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">Event Details</span>
                                            <span className="text-xs text-zinc-300 leading-relaxed">{log.details}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="py-12 text-center text-zinc-600 text-xs">No audit logs match criteria.</div>
                )}
            </motion.div>

            {/* Pagination */}
            {filtered.length > 0 && (
                <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-500">
                    <span>
                        Showing{' '}
                        <span className="text-zinc-300">
                            {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                            {'–'}
                            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                        </span>{' '}
                        of <span className="text-zinc-300">{filtered.length}</span> events
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-7 px-2 rounded-lg border border-white/[0.08] bg-white/[0.02] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/[0.08] text-xs font-medium"
                        >
                            Prev
                        </button>
                        {Array.from({ length: totalPages }).map((_, idx) => {
                            const page = idx + 1;
                            const active = page === currentPage;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-7 min-w-[28px] px-2 rounded-lg text-xs font-semibold transition-colors ${
                                        active
                                            ? 'bg-orange-600 text-white'
                                            : 'border border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.08]'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-7 px-2 rounded-lg border border-white/[0.08] bg-white/[0.02] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/[0.08] text-xs font-medium"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditPage;
