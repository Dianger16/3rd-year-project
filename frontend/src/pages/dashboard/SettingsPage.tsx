import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, User, Mail, Shield, Bell, Eye, Trash2, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useNavigate } from 'react-router-dom';

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`w-11 h-[24px] rounded-full p-[3px] transition-colors ${checked ? 'bg-orange-500' : 'bg-zinc-700'}`}
        >
            <motion.div
                initial={false}
                animate={{ x: checked ? 18 : 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="w-4 h-4 rounded-full bg-white"
            />
        </button>
    );
}

const SettingsPage = () => {
    const { user, logout } = useAuthStore();
    const { showToast } = useToastStore();
    const navigate = useNavigate();

    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false,
        reducedMotion: false,
        twoFactorAuth: false,
        dataSharing: true,
    });
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const toggle = (key: keyof typeof settings) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLogout = () => {
        logout();
        navigate('/auth/login');
    };

    const handleSave = () => {
        showToast('Settings updated locally.', 'success');
    };

    const handleDeleteAccount = () => {
        if (deleteConfirmText !== 'DELETE') return;
        logout();
        navigate('/auth/login');
    };

    return (
        <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-400" /> Settings
                </h1>
                <p className="text-xs text-zinc-500 mt-1">Account details, preferences, and security.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-6 space-y-6"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Account</div>
                            <div className="mt-3 flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] shrink-0">
                                    <User className="w-4 h-4 text-zinc-200" />
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-lg font-bold text-white">{user?.full_name || 'User'}</div>
                                    <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400 min-w-0">
                                        <Mail className="w-4 h-4 text-zinc-600 shrink-0" />
                                        <span className="truncate">{user?.email || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Badge className="w-fit capitalize bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
                            {user?.role || 'student'}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Department</div>
                            <div className="mt-1 text-sm font-semibold text-white">{user?.department || '-'}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Identity</div>
                            <div className="mt-1 text-sm font-semibold text-white">{user?.identity_provider || 'email'}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Academic Verified</div>
                            <div className="mt-1 text-sm font-semibold text-white">{user?.academic_verified ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">User ID</div>
                            <div className="mt-1 truncate font-mono text-xs text-zinc-300">{user?.id || '-'}</div>
                        </div>
                    </div>

                    {!user?.academic_verified && (
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-100 flex gap-3">
                            <Shield className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
                            <div>
                                <div className="font-semibold">Query access may be restricted</div>
                                <div className="mt-1 text-amber-100/80">
                                    Sign in with your college email (Microsoft) to unlock document queries.
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Notifications</div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-white">Email alerts</div>
                                    <div className="text-xs text-zinc-500">Daily summaries and security notices.</div>
                                </div>
                                <Toggle checked={settings.emailNotifications} onChange={() => toggle('emailNotifications')} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-white">Push notifications</div>
                                    <div className="text-xs text-zinc-500">Real-time campus updates.</div>
                                </div>
                                <Toggle checked={settings.pushNotifications} onChange={() => toggle('pushNotifications')} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-white">Marketing updates</div>
                                    <div className="text-xs text-zinc-500">Newsletters and events.</div>
                                </div>
                                <Toggle checked={settings.marketingEmails} onChange={() => toggle('marketingEmails')} />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Security & Privacy</div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-white">Two-factor authentication</div>
                                    <div className="text-xs text-zinc-500">Extra security on sign-in.</div>
                                </div>
                                <Toggle checked={settings.twoFactorAuth} onChange={() => toggle('twoFactorAuth')} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-white">Data sharing</div>
                                    <div className="text-xs text-zinc-500">Anonymous usage analytics.</div>
                                </div>
                                <Toggle checked={settings.dataSharing} onChange={() => toggle('dataSharing')} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-white">Reduced motion</div>
                                    <div className="text-xs text-zinc-500">Minimize UI animations.</div>
                                </div>
                                <Toggle checked={settings.reducedMotion} onChange={() => toggle('reducedMotion')} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <Button
                            type="button"
                            variant="glass"
                            className="h-10 rounded-xl px-4 text-xs font-semibold normal-case tracking-normal text-zinc-200 hover:text-white hover:bg-white/[0.04]"
                            onClick={() => navigate('/dashboard/profile')}
                        >
                            <User className="w-4 h-4 mr-2" />
                            Open Profile
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Save changes
                        </Button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl border border-white/[0.06] bg-zinc-900/50 p-6 space-y-4"
                >
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Session</div>
                    <div className="text-sm font-semibold text-white">Sign out</div>
                    <p className="text-xs text-zinc-500 leading-5">
                        Logs you out of this device. You can sign back in anytime.
                    </p>
                    <Button
                        type="button"
                        onClick={handleLogout}
                        className="h-10 w-full rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>

                    <div className="pt-4 border-t border-white/[0.06]">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Danger Zone</div>
                        <div className="mt-3 text-sm font-semibold text-red-400">Delete account</div>
                        <p className="text-xs text-zinc-500 leading-5 mt-1">
                            Permanently remove your account and all data. This cannot be undone.
                        </p>
                        <Button
                            type="button"
                            onClick={() => setShowDeleteDialog(true)}
                            className="mt-4 h-10 w-full rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98]"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete account
                        </Button>
                    </div>
                </motion.div>
            </div>

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
                            initial={{ scale: 0.96, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.96, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-5"
                        >
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Delete your account?</h3>
                                    <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                                        This action is permanent. Type DELETE to confirm.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium block mb-1.5">
                                    Type DELETE to confirm
                                </label>
                                <input
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full h-10 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white outline-none focus:border-red-500/30 placeholder:text-zinc-700 font-mono tracking-wider"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}
                                    variant="glass"
                                    className="flex-1 h-10 rounded-xl text-xs font-semibold normal-case tracking-normal text-zinc-200 hover:text-white hover:bg-white/[0.04]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== 'DELETE'}
                                    className="flex-1 h-10 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98]"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete forever
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
