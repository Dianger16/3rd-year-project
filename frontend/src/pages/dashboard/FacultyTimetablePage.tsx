/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpenCheck, Building2, CalendarDays, Clock3, MapPin, TimerReset } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type TimetableSlot = {
    day: string;
    start: string;
    end: string;
    course: string;
    room: string;
    type: string;
};

const WEEKLY_TIMETABLE: TimetableSlot[] = [
    { day: 'Mon', start: '09:00', end: '10:00', course: 'CS301 Data Structures', room: 'Room RL-301', type: 'Lecture' },
    { day: 'Mon', start: '14:00', end: '15:00', course: 'AI405 Applied ML', room: 'Lab ML-2', type: 'Lab' },
    { day: 'Tue', start: '11:00', end: '12:00', course: 'CS402 DBMS', room: 'Room RL-204', type: 'Lecture' },
    { day: 'Wed', start: '10:00', end: '11:00', course: 'CS301 Data Structures', room: 'Room RL-301', type: 'Tutorial' },
    { day: 'Thu', start: '13:00', end: '14:00', course: 'AI405 Applied ML', room: 'Lab ML-2', type: 'Lab' },
    { day: 'Fri', start: '12:00', end: '13:00', course: 'CS402 DBMS', room: 'Room RL-204', type: 'Lecture' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const normalizeDisplayName = (fullName?: string | null) => {
    const raw = String(fullName || '').trim();
    if (!raw) return 'Faculty';
    const stripped = raw.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '').trim();
    return stripped || 'Faculty';
};

const groupByDay = (slots: TimetableSlot[]) =>
    DAYS.map((day) => ({
        day,
        slots: slots.filter((slot) => slot.day === day),
    })).filter((item) => item.slots.length > 0);

const slotMinutes = (slot: TimetableSlot) => {
    const [hour, minute] = slot.start.split(':').map(Number);
    return hour * 60 + minute;
};

const buildRows = (slots: TimetableSlot[]) =>
    [...slots]
        .sort((a, b) => slotMinutes(a) - slotMinutes(b))
        .map((slot) => ({ key: `${slot.start}-${slot.end}`, start: slot.start, end: slot.end }))
        .filter((row, index, arr) => arr.findIndex((item) => item.key === row.key) === index);

export default function FacultyTimetablePage() {
    const { user } = useAuthStore();
    const displayName = normalizeDisplayName(user?.full_name);
    const grouped = useMemo(() => groupByDay(WEEKLY_TIMETABLE), []);
    const rows = useMemo(() => buildRows(WEEKLY_TIMETABLE), []);
    const slotMap = useMemo(() => {
        const map = new Map<string, TimetableSlot>();
        WEEKLY_TIMETABLE.forEach((slot) => {
            map.set(`${slot.day}-${slot.start}-${slot.end}`, slot);
        });
        return map;
    }, []);

    const summary = useMemo(() => {
        const labSessions = WEEKLY_TIMETABLE.filter((slot) => slot.type.toLowerCase() === 'lab').length;
        const rooms = new Set(WEEKLY_TIMETABLE.map((slot) => slot.room)).size;
        return [
            { label: 'Weekly Sessions', value: WEEKLY_TIMETABLE.length, hint: 'Scheduled teaching blocks', icon: CalendarDays },
            { label: 'Lab Periods', value: labSessions, hint: 'Hands-on practical sessions', icon: BookOpenCheck },
            { label: 'Rooms In Rotation', value: rooms, hint: 'Labs and classrooms mapped', icon: Building2 },
        ];
    }, []);

    return (
        <div className="h-full overflow-y-auto p-6 md:p-8 w-full">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-slate-900/80 p-6">
                    <div className="absolute -top-20 right-6 w-64 h-64 bg-cyan-400/10 blur-[90px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-16 left-8 w-56 h-56 bg-orange-500/10 blur-[90px] rounded-full pointer-events-none" />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                <CalendarDays className="w-3.5 h-3.5 text-orange-400" /> Faculty Timetable
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                                Weekly Schedule for <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">{displayName}</span>
                            </h1>
                            <p className="text-zinc-400 text-sm max-w-2xl">
                                A responsive weekly teaching board with period lanes, room mapping, and a real classroom-calendar feel.
                            </p>
                        </div>
                        <Link to="/dashboard">
                            <Button variant="outline" className="h-11 rounded-2xl px-5 text-zinc-200 border-white/15 hover:text-white text-sm">
                                Back To Faculty Dashboard
                            </Button>
                        </Link>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {summary.map((item, idx) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5"
                        >
                            <div className="mb-3 inline-flex rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 text-orange-400">
                                <item.icon className="h-5 w-5" />
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
                            <div className="mt-2 text-3xl font-black text-white">{item.value}</div>
                            <p className="mt-2 text-xs text-zinc-500">{item.hint}</p>
                        </motion.div>
                    ))}
                </section>

                <section className="rounded-3xl border border-white/[0.08] bg-zinc-900/45 p-4 sm:p-5 lg:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Weekly Teaching Board</h2>
                            <p className="mt-1 text-sm text-zinc-400">Desktop gets a timetable grid. Mobile gets a swipeable kanban of day cards.</p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-zinc-300">
                            <TimerReset className="h-4 w-4 text-orange-400" />
                            Week calendar
                        </div>
                    </div>

                    <div className="hidden lg:block overflow-x-auto">
                        <div className="min-w-[980px] rounded-2xl border border-white/[0.08] bg-black/20">
                            <div className="grid grid-cols-[120px_repeat(7,minmax(0,1fr))] border-b border-white/[0.08] bg-white/[0.02]">
                                <div className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Period</div>
                                {DAYS.map((day) => (
                                    <div key={day} className="px-4 py-4 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {rows.map((row) => (
                                <div key={row.key} className="grid grid-cols-[120px_repeat(7,minmax(0,1fr))] border-b border-white/[0.05] last:border-b-0">
                                    <div className="px-4 py-5 border-r border-white/[0.05] bg-white/[0.02]">
                                        <div className="text-sm font-bold text-white">{row.start}</div>
                                        <div className="mt-1 text-xs text-zinc-500">{row.end}</div>
                                    </div>
                                    {DAYS.map((day) => {
                                        const slot = slotMap.get(`${day}-${row.start}-${row.end}`);
                                        return (
                                            <div key={`${day}-${row.key}`} className="min-h-[138px] border-r border-white/[0.05] last:border-r-0 p-3">
                                                {slot ? (
                                                    <div className="h-full rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-3 shadow-[0_0_0_1px_rgba(251,146,60,0.06)]">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <span className="inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">
                                                                {slot.type}
                                                            </span>
                                                            <span className="text-[11px] font-semibold text-zinc-300">{slot.start}-{slot.end}</span>
                                                        </div>
                                                        <div className="mt-3 text-sm font-bold leading-5 text-white">{slot.course}</div>
                                                        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                                                            <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                                                            <span>{slot.room}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] text-[11px] uppercase tracking-[0.18em] text-zinc-700">
                                                        Free
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:hidden">
                        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                            {grouped.map((group, idx) => (
                                <motion.section
                                    key={group.day}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="min-w-[280px] sm:min-w-[340px] snap-start rounded-2xl border border-white/[0.08] bg-black/25 p-4"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                                            <Clock3 className="w-4 h-4 text-orange-400" /> {group.day}
                                        </h3>
                                        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{group.slots.length} sessions</span>
                                    </div>
                                    <div className="space-y-3">
                                        {group.slots.map((slot) => (
                                            <div key={`${slot.day}-${slot.start}-${slot.course}`} className="rounded-2xl border border-white/[0.06] bg-zinc-950/70 p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">
                                                        {slot.type}
                                                    </span>
                                                    <span className="text-xs font-semibold text-zinc-300">{slot.start} - {slot.end}</span>
                                                </div>
                                                <p className="mt-3 text-sm font-bold text-white">{slot.course}</p>
                                                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {slot.room}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.section>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
