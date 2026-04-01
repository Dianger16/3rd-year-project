import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Trash2, Edit2, X, UserPlus, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface UserRow {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'faculty' | 'admin';
    department: string;
    joined: string;
    status: 'active' | 'inactive';
}

const INITIAL_USERS: UserRow[] = [
    { id: '1', name: 'Akash Kumar', email: 'student@unigpt.edu', role: 'student', department: 'Computer Science', joined: '2024-01-15', status: 'active' },
    { id: '2', name: 'Dr. Priya Sharma', email: 'faculty@unigpt.edu', role: 'faculty', department: 'Computer Science', joined: '2023-08-20', status: 'active' },
    { id: '3', name: 'Admin User', email: 'admin@unigpt.edu', role: 'admin', department: 'Administration', joined: '2023-01-01', status: 'active' },
    { id: '4', name: 'Rahul Verma', email: 'rahul@university.edu', role: 'student', department: 'Mathematics', joined: '2024-02-10', status: 'active' },
    { id: '5', name: 'Sneha Patel', email: 'sneha@university.edu', role: 'student', department: 'Physics', joined: '2024-03-01', status: 'inactive' },
    { id: '6', name: 'Dr. Amit Roy', email: 'amit.roy@university.edu', role: 'faculty', department: 'Electronics', joined: '2023-06-15', status: 'active' },
];

const UsersPage = () => {
    const [users, setUsers] = useState<UserRow[]>(INITIAL_USERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formRole, setFormRole] = useState<'student' | 'faculty' | 'admin'>('student');
    const [formDept, setFormDept] = useState('');

    const roleColors: Record<string, string> = {
        student: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        faculty: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        admin: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    };

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.includes(searchQuery.toLowerCase())
    );

    const openAddModal = () => {
        setFormName(''); setFormEmail(''); setFormRole('student'); setFormDept('');
        setEditingUser(null);
        setShowAddModal(true);
    };

    const openEditModal = (u: UserRow) => {
        setFormName(u.name); setFormEmail(u.email); setFormRole(u.role); setFormDept(u.department);
        setEditingUser(u);
        setShowAddModal(true);
    };

    const handleSave = () => {
        if (!formName.trim() || !formEmail.trim()) return;
        if (editingUser) {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name: formName, email: formEmail, role: formRole, department: formDept } : u));
        } else {
            const newUser: UserRow = {
                id: Date.now().toString(),
                name: formName, email: formEmail, role: formRole, department: formDept,
                joined: new Date().toISOString().split('T')[0], status: 'active',
            };
            setUsers(prev => [newUser, ...prev]);
        }
        setShowAddModal(false);
    };

    const handleDelete = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        setDeleteConfirm(null);
    };

    const toggleStatus = (id: string) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    };

    const stats = [
        { label: 'Total Users', value: users.length, color: 'text-white' },
        { label: 'Students', value: users.filter(u => u.role === 'student').length, color: 'text-blue-400' },
        { label: 'Faculty', value: users.filter(u => u.role === 'faculty').length, color: 'text-amber-400' },
        { label: 'Active', value: users.filter(u => u.status === 'active').length, color: 'text-emerald-400' },
    ];

    return (
        <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-400" /> User Management
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1">{filtered.length} users found</p>
                </div>
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
                    <div className="relative group/search">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within/search:text-orange-400 transition-colors" />
                        <input
                            type="text" placeholder="Search users..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 w-full sm:w-64 pl-9 pr-4 rounded-xl border border-white/[0.08] bg-white/[0.03] focus:border-orange-500/30 focus:bg-white/[0.05] outline-none text-xs placeholder:text-zinc-700 transition-all font-medium"
                        />
                    </div>
                    <Button onClick={openAddModal} className="h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold px-5 transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(s => (
                    <div key={s.label} className="p-3 sm:p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] text-center transition-all">
                        <div className={`text-lg sm:text-xl font-extrabold ${s.color}`}>{s.value}</div>
                        <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_1fr_80px_80px_90px_70px] gap-3 px-5 py-3 border-b border-white/[0.06] text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>User</span><span>Department</span><span>Role</span><span>Status</span><span>Joined</span><span>Actions</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                    {filtered.map((u, i) => (
                        <motion.div
                            key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_80px_90px_70px] gap-2 sm:gap-3 items-center px-5 py-3 hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-bold text-orange-400">{u.name.charAt(0)}</span>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-medium text-white truncate">{u.name}</div>
                                    <div className="text-[10px] text-zinc-600 truncate">{u.email}</div>
                                </div>
                            </div>
                            <span className="text-xs text-zinc-400 truncate">{u.department}</span>
                            <Badge className={`text-[9px] font-semibold px-2 py-0.5 border capitalize w-fit ${roleColors[u.role]}`}>{u.role}</Badge>
                            <button onClick={() => toggleStatus(u.id)} className="flex items-center gap-1.5 w-fit cursor-pointer group">
                                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${u.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                                <span className="text-[10px] text-zinc-500 capitalize group-hover:text-white transition-colors">{u.status}</span>
                            </button>
                            <span className="text-[10px] text-zinc-600">{new Date(u.joined).toLocaleDateString()}</span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => openEditModal(u)} className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-zinc-600 hover:text-orange-400 transition-colors">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => setDeleteConfirm(u.id)} className="w-7 h-7 rounded-md hover:bg-red-500/10 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-500"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">Full Name</label>
                                    <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs outline-none focus:border-orange-500/30" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">Email</label>
                                    <input value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs outline-none focus:border-orange-500/30" placeholder="john@university.edu" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">Role</label>
                                    <div className="flex gap-2">
                                        {(['student', 'faculty', 'admin'] as const).map(r => (
                                            <button key={r} onClick={() => setFormRole(r)} className={`flex-1 h-9 rounded-lg text-xs font-semibold capitalize border transition-all ${formRole === r ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-white/[0.02] text-zinc-500 border-white/[0.06] hover:border-white/[0.12]'}`}>{r}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1">Department</label>
                                    <input value={formDept} onChange={e => setFormDept(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs outline-none focus:border-orange-500/30" placeholder="Computer Science" />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button onClick={() => setShowAddModal(false)} variant="glass" className="flex-1 h-9 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all active:scale-95">Cancel</Button>
                                <Button onClick={handleSave} className="flex-1 h-9 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-95">
                                    <Check className="w-3 h-3 mr-1" /> {editingUser ? 'Update' : 'Add User'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center space-y-4">
                            <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Delete User?</h3>
                                <p className="text-xs text-zinc-500 mt-1">This action cannot be undone.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => setDeleteConfirm(null)} variant="glass" className="flex-1 h-9 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all active:scale-95">Cancel</Button>
                                <Button onClick={() => handleDelete(deleteConfirm)} className="flex-1 h-9 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 transition-all hover:shadow-lg hover:shadow-red-500/20 active:scale-95">Delete</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UsersPage;
