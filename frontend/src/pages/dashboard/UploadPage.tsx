import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Select from '@radix-ui/react-select';
import {
    AlertCircle,
    Check,
    ChevronDown,
    CloudUpload,
    FileText,
    Loader2,
    Pencil,
    Search,
    Shield,
    Sparkles,
    Tag,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { documentsApi, type DocumentResponse } from '@/lib/api';

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';
type DocAudience = 'student' | 'faculty' | 'admin' | 'public';

interface QueuedFile {
    file: File;
    name: string;
    size: string;
    status: UploadStatus;
    error?: string;
}

const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const getFileExtension = (filename: string) => filename.split('.').pop()?.toLowerCase() || '';

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SelectItem = ({ value, label }: { value: string; label: string }) => (
    <Select.Item
        value={value}
        className="relative flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none data-[highlighted]:bg-white/5 data-[highlighted]:text-white"
    >
        <Select.ItemText>{label}</Select.ItemText>
        <Select.ItemIndicator className="inline-flex items-center justify-center text-orange-300">
            <Check className="h-4 w-4" />
        </Select.ItemIndicator>
    </Select.Item>
);

const getDefaultAudience = (role?: string): DocAudience => {
    if (role === 'admin') return 'public';
    if (role === 'faculty') return 'student';
    return 'public';
};

const getAudienceOptions = (role?: string) => {
    if (role === 'admin') {
        return [
            { value: 'public' as const, label: 'Public', hint: 'Visible to everyone on campus' },
            { value: 'student' as const, label: 'Student', hint: 'Only student-facing answers can use this' },
            { value: 'faculty' as const, label: 'Faculty', hint: 'Only faculty-facing answers can use this' },
            { value: 'admin' as const, label: 'Admin', hint: 'Restricted to admin workflows' },
        ];
    }

    if (role === 'faculty') {
        return [
            { value: 'student' as const, label: 'Student', hint: 'Course material and notes for students' },
            { value: 'faculty' as const, label: 'Faculty', hint: 'Internal faculty-only material' },
            { value: 'public' as const, label: 'Public', hint: 'Campus-wide announcements and policies' },
        ];
    }

    return [];
};

const UploadPage = () => {
    const { token, user } = useAuthStore();
    const { showToast } = useToastStore();
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<QueuedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [department, setDepartment] = useState(user?.department || '');
    const [course, setCourse] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [docType, setDocType] = useState<DocAudience>(getDefaultAudience(user?.role));
    const [uploadMode, setUploadMode] = useState<'batch' | 'single'>('batch');
    const [refreshKey, setRefreshKey] = useState(0);

    const audienceOptions = getAudienceOptions(user?.role);
    const canUpload = user?.role === 'admin' || user?.role === 'faculty';
    const isAdmin = user?.role === 'admin';
    const parsedTags = tagsInput
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .filter((tag, index, arr) => arr.indexOf(tag) === index);

    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [docsTotal, setDocsTotal] = useState(0);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [docSearch, setDocSearch] = useState('');
    const [docFilter, setDocFilter] = useState<'all' | DocAudience>('all');
    const [editingDoc, setEditingDoc] = useState<DocumentResponse | null>(null);
    const [editDocType, setEditDocType] = useState<DocAudience>('public');
    const [editDepartment, setEditDepartment] = useState('');
    const [editCourse, setEditCourse] = useState('');
    const [editTags, setEditTags] = useState('');
    const [editVisibility, setEditVisibility] = useState(true);

    const switchUploadMode = (mode: 'batch' | 'single') => {
        if (isUploading) return;
        setUploadMode(mode);
        // Avoid confusion when switching modes.
        setFiles([]);
        setProgress(0);
        setDragActive(false);
    };

    const filteredDocuments = documents.filter((doc) => {
        const q = docSearch.trim().toLowerCase();
        if (!q) return true;
        return (
            doc.filename.toLowerCase().includes(q) ||
            doc.doc_type.toLowerCase().includes(q) ||
            (doc.department || '').toLowerCase().includes(q) ||
            (doc.course || '').toLowerCase().includes(q) ||
            (doc.tags || []).some((t) => String(t).toLowerCase().includes(q))
        );
    });

    useEffect(() => {
        if (user?.department && !department) {
            setDepartment(user.department);
        }

        const allowedValues = new Set(getAudienceOptions(user?.role).map((option) => option.value));
        if (allowedValues.size && !allowedValues.has(docType)) {
            setDocType(getDefaultAudience(user?.role));
        }
    }, [department, docType, user?.department, user?.role]);

    useEffect(() => {
        if (!token || !isAdmin) return;
        let cancelled = false;

        const load = async () => {
            setIsLoadingDocs(true);
            try {
                const res = await documentsApi.list(token, {
                    page: 1,
                    per_page: 50,
                    doc_type: docFilter === 'all' ? undefined : docFilter,
                });
                if (cancelled) return;
                setDocuments(res.documents || []);
                setDocsTotal(res.total || 0);
            } catch (err) {
                if (!cancelled) {
                    setDocuments([]);
                    setDocsTotal(0);
                }
            } finally {
                if (!cancelled) setIsLoadingDocs(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [token, isAdmin, docFilter, refreshKey]);

    const queueIncomingFiles = useCallback(
        (incomingFiles: File[]) => {
            const existingKeys = new Set(files.map((entry) => `${entry.file.name}-${entry.file.size}-${entry.file.lastModified}`));
            const nextFiles: QueuedFile[] = [];

            for (const file of incomingFiles) {
                const key = `${file.name}-${file.size}-${file.lastModified}`;
                const extension = getFileExtension(file.name);

                if (existingKeys.has(key)) {
                    showToast(`${file.name} is already in the queue.`);
                    continue;
                }

                if (!SUPPORTED_EXTENSIONS.includes(extension)) {
                    showToast(`${file.name} is not supported. Use PDF, DOCX, TXT, or MD.`);
                    continue;
                }

                if (file.size > MAX_FILE_SIZE_BYTES) {
                    showToast(`${file.name} is larger than 25 MB.`);
                    continue;
                }

                existingKeys.add(key);
                nextFiles.push({
                    file,
                    name: file.name,
                    size: formatSize(file.size),
                    status: 'pending',
                });
            }

            if (nextFiles.length) {
                setFiles((prev) => [...prev, ...nextFiles]);
            }
        },
        [files, showToast]
    );

    const uploadSingleImmediate = useCallback(async (file: File) => {
        if (!token || !canUpload || isUploading) return;

        const extension = getFileExtension(file.name);
        if (!SUPPORTED_EXTENSIONS.includes(extension)) {
            showToast(`${file.name} is not supported. Use PDF, DOCX, TXT, or MD.`);
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            showToast(`${file.name} is larger than 25 MB.`);
            return;
        }

        const queued: QueuedFile = {
            file,
            name: file.name,
            size: formatSize(file.size),
            status: 'uploading',
        };

        setFiles([queued]);
        setIsUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('doc_type', docType);
        formData.append('department', department.trim());
        formData.append('course', course.trim());
        formData.append('tags', JSON.stringify(parsedTags));
        formData.append(
            'metadata',
            JSON.stringify({
                audience: docType,
                uploader_role: user?.role || 'unknown',
                mime_type: file.type || 'application/octet-stream',
                extension,
                upload_mode: 'single',
            })
        );

        try {
            await documentsApi.upload(token, formData);
            setFiles([{ ...queued, status: 'done' }]);
            setProgress(100);
            showToast('Uploaded 1 document successfully.', 'success');
            setRefreshKey((k) => k + 1);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Upload failed';
            setFiles([{ ...queued, status: 'error', error: message }]);
            showToast(message);
        } finally {
            setIsUploading(false);
        }
    }, [token, canUpload, isUploading, docType, department, course, parsedTags, user?.role, showToast]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files?.length) {
                const incoming = Array.from(e.dataTransfer.files);
                if (uploadMode === 'single') {
                    const first = incoming[0];
                    if (first) uploadSingleImmediate(first);
                } else {
                    queueIncomingFiles(incoming);
                }
            }
        },
        [queueIncomingFiles, uploadMode, uploadSingleImmediate]
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const incoming = Array.from(e.target.files);
            if (uploadMode === 'single') {
                const first = incoming[0];
                if (first) uploadSingleImmediate(first);
            } else {
                queueIncomingFiles(incoming);
            }
            e.target.value = '';
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const statusIcon = (status: UploadStatus) => {
        switch (status) {
            case 'uploading':
                return <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />;
            case 'done':
                return <Check className="w-3.5 h-3.5 text-emerald-400" />;
            case 'error':
                return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
            default:
                return null;
        }
    };

    const pendingCount = files.filter((file) => file.status !== 'done').length;

    const formatTimestamp = (raw?: string) => {
        if (!raw) return '-';
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) return raw;
        return parsed.toLocaleString();
    };

    const handleUploadAll = async () => {
        if (!files.length || isUploading || !token || !canUpload) return;

        setIsUploading(true);
        setProgress(0);

        let completed = 0;
        const total = files.filter((file) => file.status !== 'done').length || files.length;

        for (let i = 0; i < files.length; i++) {
            const fileObj = files[i];
            if (fileObj.status === 'done') continue;

            setFiles((prev) =>
                prev.map((file, idx) => (idx === i ? { ...file, status: 'uploading', error: undefined } : file))
            );

            const formData = new FormData();
            formData.append('file', fileObj.file);
            formData.append('doc_type', docType);
            formData.append('department', department.trim());
            formData.append('course', course.trim());
            formData.append('tags', JSON.stringify(parsedTags));
            formData.append(
                'metadata',
                JSON.stringify({
                    audience: docType,
                    uploader_role: user?.role || 'unknown',
                    mime_type: fileObj.file.type || 'application/octet-stream',
                    extension: getFileExtension(fileObj.file.name),
                })
            );

            try {
                await documentsApi.upload(token, formData);
                completed += 1;
                setProgress(Math.round((completed / total) * 100));
                setFiles((prev) => prev.map((file, idx) => (idx === i ? { ...file, status: 'done' } : file)));
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Upload failed';
                setFiles((prev) =>
                    prev.map((file, idx) => (idx === i ? { ...file, status: 'error', error: message } : file))
                );
            }
        }

        setIsUploading(false);

        if (completed > 0) {
            showToast(`Uploaded ${completed} document${completed > 1 ? 's' : ''} successfully.`, 'success');
            setRefreshKey((k) => k + 1);
        }
    };

    const openEditDocument = (doc: DocumentResponse) => {
        setEditingDoc(doc);
        setEditDocType((doc.doc_type as DocAudience) || 'public');
        setEditDepartment(doc.department || '');
        setEditCourse(doc.course || '');
        setEditTags((doc.tags || []).join(', '));
        setEditVisibility(Boolean(doc.visibility));
    };

    const closeEditDocument = () => {
        setEditingDoc(null);
        setEditTags('');
        setEditDepartment('');
        setEditCourse('');
        setEditVisibility(true);
    };

    const saveDocumentEdits = async () => {
        if (!token || !editingDoc) return;
        try {
            const tags = editTags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);

            await documentsApi.update(token, editingDoc.id, {
                doc_type: editDocType,
                department: editDepartment.trim(),
                course: editCourse.trim(),
                tags,
                visibility: editVisibility,
            });

            showToast('Document updated.', 'success');
            closeEditDocument();
            setRefreshKey((k) => k + 1);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to update document');
        }
    };

    const deleteDocument = async (doc: DocumentResponse) => {
        if (!token) return;
        const ok = window.confirm(`Delete "${doc.filename}"? This cannot be undone.`);
        if (!ok) return;
        try {
            await documentsApi.delete(token, doc.id);
            showToast('Document deleted.', 'success');
            setRefreshKey((k) => k + 1);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to delete document');
        }
    };

    if (!canUpload) {
        return (
            <div className="p-5 md:p-8 w-full">
                <div className="max-w-3xl mx-auto rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 text-center shadow-[0_0_60px_-24px_rgba(249,115,22,0.28)]">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
                        <Shield className="h-6 w-6 text-orange-400" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white">Upload access is restricted</h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                        Students can query documents, but only faculty and admins can add institutional content to the
                        knowledge base.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 md:p-8 w-full">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto w-full space-y-6 pb-24"
            >
                <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_32%),linear-gradient(180deg,rgba(24,24,27,0.92),rgba(9,9,11,0.96))] p-6 sm:p-8 shadow-[0_0_70px_-30px_rgba(249,115,22,0.35)]">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                Document Ingestion
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                Upload content with proper routing, tags, and structure
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                                Every file you upload here is routed by audience, pushed into the document pipeline, and
                                prepared for retrieval in chat.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Formats</div>
                                <div className="mt-1 text-sm font-semibold text-white">PDF, DOCX, TXT, MD</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Limit</div>
                                <div className="mt-1 text-sm font-semibold text-white">25 MB each</div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 col-span-2 sm:col-span-1">
                                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Uploader</div>
                                <div className="mt-1 text-sm font-semibold capitalize text-white">{user?.role}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-white/10 bg-zinc-950/90 p-5 sm:p-6">
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`group relative overflow-hidden rounded-[1.75rem] border p-8 text-center transition-all duration-300 ${dragActive
                                ? 'border-orange-500 bg-orange-500/6 shadow-[0_0_40px_-16px_rgba(249,115,22,0.28)]'
                                : 'border-white/10 bg-white/[0.02] hover:border-orange-500/30 hover:bg-white/[0.03]'}`}
                        >
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_transparent_45%)]" />
                            <input
                                type="file"
                                multiple={uploadMode === 'batch'}
                                accept=".pdf,.docx,.txt,.md"
                                onChange={handleFileSelect}
                                className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
                            />
                            <div className="relative z-10 space-y-4">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 transition-transform duration-300 group-hover:scale-105">
                                    <CloudUpload className="h-6 w-6 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold tracking-tight text-white">
                                        {uploadMode === 'single' ? 'Drop a file here or click to browse' : 'Drop files here or click to browse'}
                                    </p>
                                    <p className="mt-2 text-sm text-zinc-500">
                                        Supported: PDF, DOCX, TXT, MD. Max 25 MB per file.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {uploadMode === 'single' && (
                            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                                Tip: set routing controls below first, then pick a file to upload instantly.
                            </div>
                        )}

                        {files.length > 0 && (
                            <div className="mt-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                                        {uploadMode === 'single' ? 'Selected File' : 'Queued Files'}
                                    </span>
                                    <span className="text-xs text-zinc-400">{files.length} selected</span>
                                </div>

                                <div className="space-y-2">
                                    {files.map((file, index) => (
                                        <motion.div
                                            key={`${file.name}-${index}`}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`rounded-2xl border px-4 py-3 ${file.status === 'uploading'
                                                ? 'border-orange-500/40 bg-orange-500/[0.04]'
                                                : 'border-white/10 bg-white/[0.02]'}`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
                                                        <FileText className="h-4 w-4 text-orange-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-semibold text-white">{file.name}</div>
                                                        <div className="mt-1 text-xs text-zinc-500">{file.size}</div>
                                                        {file.error && <div className="mt-2 text-xs text-red-400">{file.error}</div>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {statusIcon(file.status)}
                                                    {uploadMode === 'batch' && (
                                                        <button
                                                            onClick={() => removeFile(index)}
                                                            disabled={file.status === 'uploading'}
                                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {isUploading && (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                        <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                                            <span>Uploading and indexing documents</span>
                                            <span className="font-semibold text-white">{progress}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-zinc-950/90 p-5 sm:p-6">
                        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-white">Routing Controls</h2>
                                <p className="mt-2 text-sm leading-6 text-zinc-400">
                                    Choose who can retrieve the document and add metadata that helps the RAG pipeline keep
                                    results accurate.
                                </p>
                            </div>

                            <div className="flex flex-col items-start gap-2 sm:items-end">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Upload mode</div>
                                <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                                    <button
                                        type="button"
                                        onClick={() => switchUploadMode('batch')}
                                        disabled={isUploading}
                                        className={`h-9 rounded-xl px-4 text-xs font-semibold transition-all disabled:opacity-40 ${uploadMode === 'batch'
                                            ? 'bg-orange-500/15 text-orange-200 border border-orange-500/20'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'}`}
                                    >
                                        Batch
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => switchUploadMode('single')}
                                        disabled={isUploading}
                                        className={`h-9 rounded-xl px-4 text-xs font-semibold transition-all disabled:opacity-40 ${uploadMode === 'single'
                                            ? 'bg-orange-500/15 text-orange-200 border border-orange-500/20'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'}`}
                                    >
                                        Single
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <label className="block">
                                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                    Audience
                                </span>
                                <Select.Root value={docType} onValueChange={(value) => setDocType(value as DocAudience)}>
                                    <Select.Trigger
                                        className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-orange-500/40"
                                        aria-label="Audience"
                                    >
                                        <Select.Value />
                                        <Select.Icon className="text-zinc-500">
                                            <ChevronDown className="h-4 w-4" />
                                        </Select.Icon>
                                    </Select.Trigger>
                                    <Select.Portal>
                                        <Select.Content
                                            position="popper"
                                            sideOffset={8}
                                            className="z-[120] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60"
                                        >
                                            <Select.Viewport className="p-2">
                                                {audienceOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value} label={option.label} />
                                                ))}
                                            </Select.Viewport>
                                        </Select.Content>
                                    </Select.Portal>
                                </Select.Root>
                                <p className="mt-2 text-xs text-zinc-500">
                                    {audienceOptions.find((option) => option.value === docType)?.hint}
                                </p>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                    Department
                                </span>
                                <input
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="Computer Science"
                                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-orange-500/40"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                    Course / Collection
                                </span>
                                <input
                                    value={course}
                                    onChange={(e) => setCourse(e.target.value)}
                                    placeholder="CS301 or Admissions 2026"
                                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-orange-500/40"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                    Tags
                                </span>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-orange-500/40">
                                    <input
                                        value={tagsInput}
                                        onChange={(e) => setTagsInput(e.target.value)}
                                        placeholder="syllabus, semester-1, deadlines"
                                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                                    />
                                    {parsedTags.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {parsedTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-300"
                                                >
                                                    <Tag className="h-3 w-3" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </label>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                    Upload Routing Summary
                                </div>
                                <div className="mt-3 space-y-2 text-sm text-zinc-300">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-zinc-500">Audience</span>
                                        <span className="capitalize text-white">{docType}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-zinc-500">Department</span>
                                        <span className="text-white">{department || 'Not set'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-zinc-500">Course</span>
                                        <span className="text-white">{course || 'General'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-zinc-500">Tags</span>
                                        <span className="text-right text-white">{parsedTags.length ? parsedTags.join(', ') : 'Auto + manual'}</span>
                                    </div>
                                </div>
                            </div>

                            {uploadMode === 'batch' ? (
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleUploadAll}
                                        disabled={!files.length || isUploading}
                                        className="h-10 rounded-xl bg-orange-600 px-4 text-xs font-semibold text-white shadow-[0_0_28px_-16px_rgba(249,115,22,0.65)] transition-all hover:bg-orange-500 disabled:opacity-40"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Upload
                                                {pendingCount > 0 ? (
                                                    <span className="ml-2 text-[11px] text-white/80">({pendingCount})</span>
                                                ) : null}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-zinc-500">
                                    Single mode uploads immediately after you select a file.
                                </div>
                            )}
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/90 p-5 sm:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold tracking-tight text-white">Document Library</h2>
                                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                                        Browse uploaded documents. Edit routing metadata or delete documents when needed.
                                    </p>
                                </div>

                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                                    <div className="relative w-full sm:w-[320px]">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                        <input
                                            value={docSearch}
                                            onChange={(e) => setDocSearch(e.target.value)}
                                            placeholder="Search filename, tags, department..."
                                            className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm text-white outline-none transition focus:border-orange-500/40"
                                        />
                                    </div>

                                    <Select.Root value={docFilter} onValueChange={(value) => setDocFilter(value as any)}>
                                        <Select.Trigger
                                            className="flex h-10 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition focus:border-orange-500/40 sm:w-[200px]"
                                            aria-label="Filter"
                                        >
                                            <Select.Value />
                                            <Select.Icon className="text-zinc-500">
                                                <ChevronDown className="h-4 w-4" />
                                            </Select.Icon>
                                        </Select.Trigger>
                                        <Select.Portal>
                                            <Select.Content
                                                position="popper"
                                                sideOffset={8}
                                                className="z-[120] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60"
                                            >
                                                <Select.Viewport className="p-2">
                                                    <SelectItem value="all" label="All audiences" />
                                                    <SelectItem value="public" label="Public" />
                                                    <SelectItem value="student" label="Student" />
                                                    <SelectItem value="faculty" label="Faculty" />
                                                    <SelectItem value="admin" label="Admin" />
                                                </Select.Viewport>
                                            </Select.Content>
                                        </Select.Portal>
                                    </Select.Root>
                                </div>
                            </div>

                            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                                        Documents
                                    </div>
                                    <div className="text-xs text-zinc-400">{docsTotal.toLocaleString()} total</div>
                                </div>

                                {isLoadingDocs && (
                                    <div className="px-5 py-6 text-sm text-zinc-500">Loading documents...</div>
                                )}

                                {!isLoadingDocs && filteredDocuments.length === 0 && (
                                    <div className="px-5 py-10 text-center">
                                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">
                                            <FileText className="h-5 w-5 text-orange-400" />
                                        </div>
                                        <div className="text-sm font-semibold text-white">No documents found</div>
                                        <div className="mt-2 text-xs text-zinc-500">Try clearing the filter or search query.</div>
                                    </div>
                                )}

                                {!isLoadingDocs && filteredDocuments.length > 0 && (
                                    <div className="divide-y divide-white/[0.05]">
                                        {filteredDocuments.map((doc) => (
                                            <div key={doc.id} className="px-5 py-4">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                                                                <FileText className="h-4 w-4 text-zinc-300" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-semibold text-white">{doc.filename}</div>
                                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                                                                    <Badge className="border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-200 capitalize">
                                                                        {doc.doc_type}
                                                                    </Badge>
                                                                    {doc.department ? (
                                                                        <Badge className="border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-300">
                                                                            {doc.department}
                                                                        </Badge>
                                                                    ) : null}
                                                                    {doc.course ? (
                                                                        <Badge className="border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-300">
                                                                            {doc.course}
                                                                        </Badge>
                                                                    ) : null}
                                                                    <span className="text-zinc-600">{doc.visibility ? 'Visible' : 'Hidden'}</span>
                                                                    <span className="text-zinc-700">•</span>
                                                                    <span className="text-zinc-600">{formatTimestamp(doc.uploaded_at || doc.created_at)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {doc.tags?.length ? (
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {doc.tags.slice(0, 6).map((t) => (
                                                                    <span
                                                                        key={t}
                                                                        className="inline-flex items-center gap-1 rounded-full border border-orange-500/15 bg-orange-500/5 px-2.5 py-1 text-[11px] font-medium text-orange-200"
                                                                    >
                                                                        <Tag className="h-3 w-3" />
                                                                        {t}
                                                                    </span>
                                                                ))}
                                                                {doc.tags.length > 6 ? (
                                                                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400">
                                                                        +{doc.tags.length - 6}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="flex items-center justify-end gap-2 sm:pt-1">
                                                        <Button
                                                            type="button"
                                                            variant="glass"
                                                            size="sm"
                                                            onClick={() => openEditDocument(doc)}
                                                            className="h-9 rounded-xl px-4 text-[11px] font-semibold normal-case tracking-normal"
                                                        >
                                                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="glass"
                                                            size="sm"
                                                            onClick={() => deleteDocument(doc)}
                                                            className="h-9 rounded-xl px-4 text-[11px] font-semibold normal-case tracking-normal text-red-200 hover:bg-red-500/10 hover:border-red-500/30 hover:text-white"
                                                        >
                                                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {editingDoc && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                            onClick={closeEditDocument}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/60"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                                            Edit Document
                                        </div>
                                        <div className="mt-2 truncate text-lg font-bold text-white">{editingDoc.filename}</div>
                                        <div className="mt-1 text-[11px] text-zinc-600">ID: {editingDoc.id}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeEditDocument}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <label className="block sm:col-span-2">
                                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                            Audience
                                        </span>
                                        <Select.Root value={editDocType} onValueChange={(value) => setEditDocType(value as DocAudience)}>
                                            <Select.Trigger
                                                className="flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-orange-500/40"
                                                aria-label="Audience"
                                            >
                                                <Select.Value />
                                                <Select.Icon className="text-zinc-500">
                                                    <ChevronDown className="h-4 w-4" />
                                                </Select.Icon>
                                            </Select.Trigger>
                                            <Select.Portal>
                                                <Select.Content
                                                    position="popper"
                                                    sideOffset={8}
                                                    className="z-[220] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60"
                                                >
                                                    <Select.Viewport className="p-2">
                                                        <SelectItem value="public" label="Public" />
                                                        <SelectItem value="student" label="Student" />
                                                        <SelectItem value="faculty" label="Faculty" />
                                                        <SelectItem value="admin" label="Admin" />
                                                    </Select.Viewport>
                                                </Select.Content>
                                            </Select.Portal>
                                        </Select.Root>
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                            Department
                                        </span>
                                        <input
                                            value={editDepartment}
                                            onChange={(e) => setEditDepartment(e.target.value)}
                                            placeholder="Computer Science"
                                            className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-orange-500/40"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                            Course / Collection
                                        </span>
                                        <input
                                            value={editCourse}
                                            onChange={(e) => setEditCourse(e.target.value)}
                                            placeholder="CS301 or Admissions 2026"
                                            className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-orange-500/40"
                                        />
                                    </label>

                                    <label className="block sm:col-span-2">
                                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                                            Tags
                                        </span>
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-orange-500/40">
                                            <input
                                                value={editTags}
                                                onChange={(e) => setEditTags(e.target.value)}
                                                placeholder="comma-separated tags"
                                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                                            />
                                        </div>
                                    </label>

                                    <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:col-span-2">
                                        <div>
                                            <div className="text-sm font-semibold text-white">Visibility</div>
                                            <div className="text-xs text-zinc-500">Hide a document without deleting it.</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditVisibility((v) => !v)}
                                            className={`h-9 w-16 rounded-full border p-1 transition-colors ${editVisibility
                                                ? 'border-emerald-500/30 bg-emerald-500/15'
                                                : 'border-white/10 bg-white/[0.03]'}`}
                                        >
                                            <motion.div
                                                initial={false}
                                                animate={{ x: editVisibility ? 28 : 0 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                                className={`h-7 w-7 rounded-full ${editVisibility ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                                            />
                                        </button>
                                    </label>
                                </div>

                                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="glass"
                                        onClick={closeEditDocument}
                                        className="h-10 rounded-xl px-4 text-xs font-semibold normal-case tracking-normal"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={saveDocumentEdits}
                                        className="h-10 rounded-xl bg-orange-600 px-4 text-xs font-semibold text-white transition-all hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Save changes
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default UploadPage;
