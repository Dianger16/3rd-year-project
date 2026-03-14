import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Edit2, X, Check, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminUser } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const roleColors: Record<string, string> = {
    student: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    faculty: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    admin: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const formatDate = (raw?: string | null) => {
    if (!raw) return '-';
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleDateString();
};

const UsersPage = () => {
    const { token } = useAuthStore();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'faculty' | 'admin'>('all');

    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formName, setFormName] = useState('');
    const [formRole, setFormRole] = useState<'student' | 'faculty' | 'admin'>('student');
    const [formDept, setFormDept] = useState('');

    useEffect(() => {
        if (!token) return;
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            try {
                const res = await adminApi.getUsers(token, { page: 1, per_page: 200 });
                if (cancelled) return;
                setUsers(res.users || []);
                setTotal(res.total || 0);
            } catch {
                if (!cancelled) {
                    setUsers([]);
                    setTotal(0);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [token, refreshKey]);

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return users
            .filter((u) => (roleFilter === 'all' ? true : u.role === roleFilter))
            .filter((u) => {
                if (!q) return true;
                return (
                    (u.full_name || '').toLowerCase().includes(q) ||
                    (u.email || '').toLowerCase().includes(q) ||
                    (u.department || '').toLowerCase().includes(q) ||
                    (u.role || '').toLowerCase().includes(q)
                );
            });
    }, [users, searchQuery, roleFilter]);

    const stats = useMemo(() => {
        const totalUsers = users.length;
        const students = users.filter((u) => u.role === 'student').length;
        const faculty = users.filter((u) => u.role === 'faculty').length;
        const admins = users.filter((u) => u.role === 'admin').length;
        return [
            { label: 'Total Users', value: totalUsers, color: 'text-white' },
            { label: 'Students', value: students, color: 'text-blue-400' },
            { label: 'Faculty', value: faculty, color: 'text-amber-400' },
            { label: 'Admins', value: admins, color: 'text-orange-400' },
        ];
    }, [users]);

    const openEditModal = (u: AdminUser) => {
        setEditingUser(u);
        setFormName(u.full_name || '');
        setFormRole(u.role);
        setFormDept(u.department || '');
    };

    const closeEditModal = () => {
        if (isSaving) return;
        setEditingUser(null);
        setFormName('');
        setFormDept('');
        setFormRole('student');
    };

    const handleSave = async () => {
        if (!token || !editingUser) return;
        setIsSaving(true);
        try {
            const res = await adminApi.updateUser(token, editingUser.id, {
                full_name: formName.trim(),
                role: formRole,
                department: formDept.trim(),
            });

            setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? res.user : u)));
            closeEditModal();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-400" /> User Management
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1">
                        {isLoading ? 'Loading users...' : `${filtered.length.toLocaleString()} shown - ${total.toLocaleString()} total`}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="glass"
                    className="h-10 rounded-xl px-4 text-xs font-semibold normal-case tracking-normal text-zinc-200 hover:text-white"
                    onClick={() => setRefreshKey((k) => k + 1)}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{s.label}</div>
                        <div className={`mt-1 text-lg font-extrabold tracking-tight ${s.color}`}>{s.value.toLocaleString()}</div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-[360px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-zinc-600" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, department..."
                            className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm text-white outline-none transition focus:border-orange-500/40"
                        />
                    </div>
                    <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                        {(['all', 'student', 'faculty', 'admin'] as const).map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRoleFilter(r)}
                                className={`h-9 rounded-xl px-4 text-xs font-semibold transition-all ${roleFilter === r
                                    ? 'bg-orange-500/15 text-orange-200 border border-orange-500/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'}`}
                            >
                                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-white/[0.05]">
                    {isLoading && (
                        <div className="px-5 py-10 text-sm text-zinc-500 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
                        </div>
                    )}

                    {!isLoading && filtered.length === 0 && (
                        <div className="px-5 py-12 text-center">
                            <div className="text-sm font-semibold text-white">No users found</div>
                            <div className="mt-2 text-xs text-zinc-500">Try a different search or filter.</div>
                        </div>
                    )}

                    {!isLoading && filtered.map((u) => (
                        <div key={u.id} className="px-5 py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="truncate text-sm font-semibold text-white">{u.full_name || 'User'}</div>
                                        <Badge className={`text-[9px] font-semibold px-2 py-0.5 border ${roleColors[u.role] || roleColors.student}`}>
                                            {u.role}
                                        </Badge>
                                        {u.academic_verified ? (
                                            <Badge className="text-[9px] font-semibold px-2 py-0.5 border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                verified
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <div className="mt-1 text-xs text-zinc-500 truncate">{u.email}</div>
                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                                        {u.department ? (
                                            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                                                {u.department}
                                            </span>
                                        ) : null}
                                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                                            Joined {formatDate(u.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="glass"
                                        size="sm"
                                        className="h-9 rounded-xl px-4 text-[11px] font-semibold normal-case tracking-normal"
                                        onClick={() => openEditModal(u)}
                                    >
                                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={closeEditModal}
                    >
                        <motion.div
                            initial={{ scale: 0.96, y: 18 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.96, y: 18 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Edit User</div>
                                    <div className="mt-2 truncate text-lg font-bold text-white">{editingUser.email}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="w-9 h-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">Full Name</label>
                                    <input
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white outline-none focus:border-orange-500/30"
                                        placeholder="Full name"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">Role</label>
                                    <div className="flex gap-2">
                                        {(['student', 'faculty', 'admin'] as const).map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setFormRole(r)}
                                                disabled={isSaving}
                                                className={`flex-1 h-10 rounded-xl text-xs font-semibold capitalize border transition-all disabled:opacity-40 ${formRole === r
                                                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                    : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:border-white/[0.12] hover:text-white'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">Department</label>
                                    <input
                                        value={formDept}
                                        onChange={(e) => setFormDept(e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white outline-none focus:border-orange-500/30"
                                        placeholder="Department"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    onClick={closeEditModal}
                                    variant="glass"
                                    className="flex-1 h-10 rounded-xl text-xs font-semibold normal-case tracking-normal"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSave}
                                    className="flex-1 h-10 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"
                                    disabled={isSaving || !formName.trim()}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                    Save
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UsersPage;

