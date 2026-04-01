import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi, type CourseDirectoryItem, type FacultySummary } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

export default function FacultyProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const { showToast } = useToastStore();
    const [faculty, setFaculty] = useState<FacultySummary | null>(null);
    const [courses, setCourses] = useState<CourseDirectoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const [res, courseRes] = await Promise.all([
                    authApi.getFacultyDirectory(token, 30),
                    authApi.getCourseDirectory(token, 45),
                ]);
                if (!active) return;
                const found = (res.faculty || []).find((f) => f.id === id) || null;
                setFaculty(found);
                if (found) {
                    setCourses((courseRes.courses || []).filter((course) => (course.faculty_ids || []).includes(found.id)));
                } else {
                    setCourses([]);
                }
            } catch (err: any) {
                if (!active) return;
                showToast(err?.message || 'Unable to load faculty profile.', 'error');
                setFaculty(null);
                setCourses([]);
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [id, token, showToast]);

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto p-6 md:p-8 pb-24 space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="h-10 px-4 rounded-xl border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.06] text-sm text-white inline-flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/95 via-zinc-900/75 to-black p-6"
                >
                    {loading ? (
                        <p className="text-sm text-zinc-500">Loading faculty profile...</p>
                    ) : !faculty ? (
                        <p className="text-sm text-zinc-500">Faculty profile not found.</p>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                    <UserCircle className="w-7 h-7 text-orange-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white tracking-tight">{faculty.full_name}</h1>
                                    <p className="text-xs text-zinc-500 mt-1">Faculty Member</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                    <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Email</p>
                                    <p className="text-sm text-white font-medium mt-1 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-zinc-500" /> {faculty.email || 'Not provided'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                    <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Department</p>
                                    <p className="text-sm text-white font-medium mt-1 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-zinc-500" /> {faculty.department || 'Not set'}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Courses Assigned</p>
                                {courses.length === 0 ? (
                                    <p className="text-sm text-zinc-500">No mapped courses found yet.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {courses.map((course) => (
                                            <span
                                                key={course.id}
                                                className="text-xs text-white bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1"
                                            >
                                                {course.code}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
