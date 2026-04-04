/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import VerifyEmail from '@/pages/auth/VerifyEmail';
import AuthCallback from '@/pages/auth/AuthCallback';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudentDashboard from '@/pages/dashboard/StudentDashboard';
import FacultyDashboard from '@/pages/dashboard/FacultyDashboard';
import FacultyTimetablePage from '@/pages/dashboard/FacultyTimetablePage';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import ChatPage from '@/pages/dashboard/ChatPage';
import CoursesPage from '@/pages/dashboard/CoursesPage';
import UsersPage from '@/pages/dashboard/UsersPage';
import AuditPage from '@/pages/dashboard/AuditPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';
import ProfilePage from '@/pages/dashboard/ProfilePage';
import UploadPage from '@/pages/dashboard/UploadPage';
import NotificationsPage from '@/pages/dashboard/NotificationsPage';
import NoticesPage from '@/pages/dashboard/NoticesPage';
import FacultyProfilePage from '@/pages/dashboard/FacultyProfilePage';
import FacultyDirectoryPage from '@/pages/dashboard/FacultyDirectoryPage';
import DeanAppealsPage from '@/pages/dashboard/DeanAppealsPage';
import AuthLayout from '@/components/layout/AuthLayout';
import SmoothScroll from '@/components/layout/SmoothScroll';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const academicDomain = (import.meta.env.VITE_ACADEMIC_EMAIL_DOMAIN || '').toLowerCase();
const isAcademicEmail = (email?: string) => (email || '').trim().toLowerCase().endsWith(`@${academicDomain}`);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<'student' | 'faculty' | 'admin'>;
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth/login" replace />;
  const role = String(user.role || 'student').toLowerCase() as 'student' | 'faculty' | 'admin';
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function DashboardHome() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth/login" replace />;
  switch (user.role) {
    case 'admin': return <AdminDashboard />;
    case 'faculty': return <FacultyDashboard />;
    default: return <StudentDashboard />;
  }
}

export default function App() {
  const { setSession, clearSession, token, isInitializing, finishInitializing } = useAuthStore();
  const lastSyncedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const hardSyncProfile = async () => {
      try {
        const user = await authApi.getMe(token);
        if (cancelled) return;
        setSession(token, user);
      } catch {
        if (cancelled) return;
        clearSession();
      }
    };

    hardSyncProfile();
    return () => {
      cancelled = true;
    };
  }, [token, setSession, clearSession]);

  useEffect(() => {
    const syncSessionToBackend = async (session: any, fallbackName: string) => {
      if (!session?.access_token) return;
      if (lastSyncedTokenRef.current === session.access_token) return;

      try {
        const user = await authApi.getMe(session.access_token);
        setSession(session.access_token, user);
      } catch (err) {
        console.warn('Session sync failed, using metadata fallback:', err);
        setSession(session.access_token, {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || fallbackName,
          role: (session.user.user_metadata?.role as any) || 'student',
          academic_verified: isAcademicEmail(session.user.email || ''),
          identity_provider: session.user.app_metadata?.provider || session.user.app_metadata?.providers?.[0] || 'email',
        });
      } finally {
        lastSyncedTokenRef.current = session.access_token;
      }
    };

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncSessionToBackend(session, 'User');
      } else {
        lastSyncedTokenRef.current = null;
      }
      finishInitializing();
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Event:', event);
      if (session?.access_token) {
        await syncSessionToBackend(session, 'Google User');
      } else if (event === 'SIGNED_OUT') {
        lastSyncedTokenRef.current = null;
        clearSession();
      }
      finishInitializing();
    });

    return () => subscription.unsubscribe();
  }, [setSession, clearSession, finishInitializing]);

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center animate-pulse">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
          <div className="absolute -inset-4 bg-orange-500/5 blur-2xl rounded-full" />
        </div>
        <p className="text-zinc-500 font-medium animate-pulse">Initializing UnivGPT...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <SmoothScroll>
        <ToastProvider />
        <div className="dark">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />

            <Route element={<AuthLayout><Outlet /></AuthLayout>}>
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
            </Route>

            {/* OAuth Callback */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="chat" element={<ChatPage />} />
              <Route
                path="courses"
                element={
                  <RoleRoute allowedRoles={['student', 'admin']}>
                    <CoursesPage />
                  </RoleRoute>
                }
              />
              <Route
                path="documents"
                element={
                  <RoleRoute allowedRoles={['admin', 'faculty']}>
                    <UploadPage />
                  </RoleRoute>
                }
              />
              <Route
                path="upload"
                element={
                  <RoleRoute allowedRoles={['admin', 'faculty']}>
                    <UploadPage />
                  </RoleRoute>
                }
              />
              <Route
                path="notices"
                element={
                  <RoleRoute allowedRoles={['admin', 'faculty']}>
                    <NoticesPage />
                  </RoleRoute>
                }
              />
              <Route
                path="timetable"
                element={
                  <RoleRoute allowedRoles={['faculty']}>
                    <FacultyTimetablePage />
                  </RoleRoute>
                }
              />
              <Route
                path="users"
                element={
                  <RoleRoute allowedRoles={['admin']}>
                    <UsersPage />
                  </RoleRoute>
                }
              />
              <Route
                path="audit"
                element={
                  <RoleRoute allowedRoles={['admin']}>
                    <AuditPage />
                  </RoleRoute>
                }
              />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route
                path="faculty"
                element={
                  <RoleRoute allowedRoles={['student']}>
                    <FacultyDirectoryPage />
                  </RoleRoute>
                }
              />
              <Route
                path="faculty/:id"
                element={
                  <RoleRoute allowedRoles={['student']}>
                    <FacultyProfilePage />
                  </RoleRoute>
                }
              />
              <Route
                path="dean"
                element={
                  <RoleRoute allowedRoles={['admin']}>
                    <DeanAppealsPage />
                  </RoleRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </SmoothScroll>
    </BrowserRouter>
  );
}


