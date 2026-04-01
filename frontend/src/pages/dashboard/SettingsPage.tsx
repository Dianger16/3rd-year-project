import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Bell, Shield, Smartphone, Globe, Cloud, Check,
    Trash2, AlertTriangle, Download, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

/* ─── Toggle Switch ─── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`w-10 h-[22px] rounded-full p-[3px] transition-colors duration-200 ${checked ? 'bg-orange-500' : 'bg-zinc-700'}`}
        >
            <motion.div
                initial={false}
                animate={{ x: checked ? 18 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-4 h-4 rounded-full bg-white"
            />
        </button>
    );
}

const SettingsPage = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false,
        reducedMotion: false,
        twoFactorAuth: false,
        dataSharing: true,
    });

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleDeleteAccount = () => {
        if (deleteConfirmText === 'DELETE') {
            logout();
            navigate('/auth/login');
        }
    };

    const handleExportData = () => {
        // Generate dummy data export
        const data = {
            exportDate: new Date().toISOString(),
            profile: { name: 'User', email: 'user@unigpt.edu' },
            queries: 124,
            documents: 38,
            settings: settings,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'unigpt-data-export.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const sections = [
        {
            id: 'notifications', title: 'Notifications', icon: Bell,
            items: [
                { id: 'emailNotifications', label: 'Email Notifications', desc: 'Daily summary and important alerts via email.' },
                { id: 'pushNotifications', label: 'Push Notifications', desc: 'Real-time browser/app notifications.' },
                { id: 'marketingEmails', label: 'Marketing & Updates', desc: 'Events, newsletters, and campus updates.' },
            ]
        },
        {
            id: 'accessibility', title: 'Accessibility', icon: Eye,
            items: [
                { id: 'reducedMotion', label: 'Reduced Motion', desc: 'Minimize UI animations for accessibility.' },
            ]
        },
        {
            id: 'privacy', title: 'Privacy & Security', icon: Shield,
            items: [
                { id: 'twoFactorAuth', label: 'Two-Factor Authentication', desc: 'Extra security with a verification code.' },
                { id: 'dataSharing', label: 'Analytics Sharing', desc: 'Share anonymous usage data to improve the platform.' },
            ]
        },
    ];

    const systemItems = [
        { label: 'Version', value: '1.2.4' },
        { label: 'Cloud Status', value: 'Operational', ok: true },
        { label: 'API Latency', value: '45ms', ok: true },
        { label: 'Sync', value: 'Up to date', ok: true },
    ];

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-1">
                    <Settings className="w-5 h-5 text-orange-400" /> Settings
                </h1>
                <p className="text-xs text-zinc-500 mb-6">Manage preferences, security, and account.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Main Settings */}
                    <div className="md:col-span-2 space-y-5">
                        {sections.map((sec, si) => (
                            <motion.div
                                key={sec.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: si * 0.08 }}
                                className="rounded-2xl bg-zinc-900/40 border border-white/[0.06] overflow-hidden"
                            >
                                <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center gap-2.5">
                                    <sec.icon className="w-4 h-4 text-orange-400" />
                                    <span className="text-sm font-semibold text-white">{sec.title}</span>
                                </div>
                                <div className="divide-y divide-white/[0.04]">
                                    {sec.items.map(item => (
                                        <div key={item.id} className="px-5 py-4 flex items-center justify-between">
                                            <div className="pr-6">
                                                <div className="text-sm font-medium text-white">{item.label}</div>
                                                <div className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</div>
                                            </div>
                                            <Toggle
                                                checked={settings[item.id as keyof typeof settings]}
                                                onChange={() => toggle(item.id as keyof typeof settings)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}

                        {/* Data Export */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl bg-zinc-900/40 border border-white/[0.06] p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Download className="w-4 h-4 text-orange-400" /> Export Your Data
                                    </h3>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">Download all your data as a JSON file.</p>
                                </div>
                                <Button
                                    onClick={handleExportData}
                                    className="h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"
                                >
                                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                                </Button>
                            </div>
                        </motion.div>

                        {/* Danger Zone — Delete Account */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                                        <Trash2 className="w-4 h-4" /> Delete Account
                                    </h3>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
                                </div>
                                <Button
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all hover:shadow-lg hover:shadow-red-500/20 active:scale-95"
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                        {/* Active Sessions */}
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-zinc-900/40 border border-white/[0.06] overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-white/[0.05]">
                                <span className="text-sm font-semibold text-white">Sessions</span>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-white flex items-center gap-1.5">Chrome <Badge className="text-[7px] bg-emerald-500/20 text-emerald-400 border-emerald-500/20 px-1 py-0">Active</Badge></div>
                                        <div className="text-[10px] text-zinc-600">Active now</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-4 h-4 text-zinc-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-white">Mobile Safari</div>
                                        <div className="text-[10px] text-zinc-600">2h ago</div>
                                    </div>
                                </div>
                                <Button
                                    className="w-full mt-2 h-9 rounded-xl text-xs font-bold tracking-wider bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.12] transition-all active:scale-95 uppercase"
                                >
                                    Sign out others
                                </Button>
                            </div>
                        </motion.div>

                        {/* System Status */}
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl bg-zinc-900/40 border border-white/[0.06] overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center justify-between">
                                <span className="text-sm font-semibold text-white flex items-center gap-2"><Cloud className="w-4 h-4 text-zinc-500" /> System</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <div className="p-4 space-y-2.5">
                                {systemItems.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-[11px] text-zinc-500">{item.label}</span>
                                        <div className="flex items-center gap-1">
                                            {item.ok && <Check className="w-3 h-3 text-emerald-500" />}
                                            <span className="text-[11px] font-medium text-white">{item.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <Button
                            className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Delete Account Confirmation Dialog */}
            <AnimatePresence>
                {showDeleteDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                        onClick={() => setShowDeleteDialog(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 12 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 12 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-5"
                        >
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Delete Your Account?</h3>
                                    <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                                        This will permanently delete your account, all your data, queries, and documents. This action <span className="text-red-400 font-semibold">cannot be undone</span>.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1.5">
                                    Type DELETE to confirm
                                </label>
                                <input
                                    value={deleteConfirmText}
                                    onChange={e => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full h-10 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm outline-none focus:border-red-500/30 placeholder:text-zinc-700 font-mono tracking-wider"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}
                                    variant="outline"
                                    className="flex-1 h-10 rounded-xl text-xs font-semibold border-white/10 hover:bg-white/[0.08] hover:border-white/[0.2] transition-all active:scale-[0.98] text-white hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== 'DELETE'}
                                    className="flex-1 h-10 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98]"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Forever
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;
