import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen, Search, Filter,
    Building2, Clock,
    ChevronRight, LayoutGrid, List,
    Download, UserCircle, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface CourseAdmin {
    id: string;
    code: string;
    title: string;
    hod: string;
    office: string;
    attendanceThreshold: string;
    category: string;
    syllabusUrl: string;
    nextClass: string;
}

export default function CoursesPage() {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const courses: CourseAdmin[] = [
        {
            id: '1',
            code: 'CS301',
            title: 'Advanced Algorithms',
            hod: 'Dr. Priya Sharma',
            office: 'Block-A, Room 402',
            attendanceThreshold: '75%',
            category: 'Computer Science',
            syllabusUrl: '#',
            nextClass: 'Mon, 10:00 AM',
        },
        {
            id: '2',
            code: 'MATH201',
            title: 'Discrete Mathematics',
            hod: 'Dr. Robert Chen',
            office: 'Block-C, Room 105',
            attendanceThreshold: '75%',
            category: 'Mathematics',
            syllabusUrl: '#',
            nextClass: 'Tue, 09:00 AM',
        },
        {
            id: '3',
            code: 'AI402',
            title: 'Machine Learning',
            hod: 'Dr. Priya Sharma',
            office: 'Block-A, Room 402',
            attendanceThreshold: '75%',
            category: 'Artificial Intelligence',
            syllabusUrl: '#',
            nextClass: 'Wed, 02:00 PM',
        }
    ];

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openInChat = (course: CourseAdmin, mode: 'syllabus' | 'details') => {
        const prefill =
            mode === 'syllabus'
                ? `Share the latest syllabus highlights for ${course.code} ${course.title}.`
                : `Give me full academic details for ${course.code} ${course.title}, including schedule and faculty.`;
        navigate('/dashboard/chat', { state: { prefill } });
    };

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-6 md:p-8 space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 to-zinc-900/40 p-5 md:p-6">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Curriculum Directory
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Find administrative details, instructor offices, and official syllabus copies.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
                        <button
                            onClick={() => setView('grid')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                view === 'grid' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                view === 'list' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search course or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500/30 focus:bg-white/[0.05] transition-all"
                    />
                </div>
                    <Button
                        variant="outline"
                        onClick={() => setSearchQuery('')}
                        className="h-12 px-6 border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:text-white rounded-2xl flex items-center gap-2 font-semibold text-xs"
                    >
                        <Filter className="w-4 h-4" />
                        ALL SEMESTERS
                    </Button>
            </div>

            {/* Courses View */}
            {view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course, idx) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative bg-white/[0.02] border border-white/[0.06] rounded-[2rem] overflow-hidden hover:border-orange-500/30 transition-all p-7 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-zinc-500 tracking-widest uppercase">
                                    {course.code}
                                </span>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors leading-tight">{course.title}</h3>
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{course.category}</p>
                            </div>

                            {/* Logistics Grid */}
                            <div className="grid grid-cols-1 gap-4 pt-6 border-t border-white/[0.04] mb-8">
                                <div className="flex items-center gap-3">
                                    <UserCircle className="w-4 h-4 text-zinc-600" />
                                    <div>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider leading-none mb-1">Lead Faculty</p>
                                        <p className="text-xs font-bold text-zinc-300">{course.hod}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-zinc-600" />
                                    <div>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider leading-none mb-1">Office Location</p>
                                        <p className="text-xs font-bold text-zinc-300">{course.office}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-zinc-600" />
                                    <div>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider leading-none mb-1">Next Slot</p>
                                        <p className="text-xs font-bold text-zinc-300">{course.nextClass}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto flex gap-2">
                                <Button
                                    onClick={() => openInChat(course, 'syllabus')}
                                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06] h-12 rounded-xl text-xs font-semibold transition-all group/btn"
                                >
                                    <Download className="w-4 h-4 mr-2 text-zinc-500 group-hover/btn:text-orange-400 transition-colors" />
                                    SYLLABUS
                                </Button>
                                <Button
                                    size="icon"
                                    onClick={() => openInChat(course, 'details')}
                                    className="w-12 h-12 bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2rem] overflow-hidden">
                    {filteredCourses.map((course) => (
                        <div key={course.id} className="p-6 flex items-center justify-between border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white">{course.title}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">{course.code}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{course.hod}</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => openInChat(course, 'details')}
                                className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 font-semibold text-[10px] uppercase tracking-widest"
                            >
                                Details
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}
