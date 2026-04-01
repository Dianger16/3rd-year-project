import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Check, AlertCircle, CloudUpload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

import { documentsApi } from '@/lib/api';

const UploadPage = () => {
    const { token, user } = useAuthStore();
    const { showToast } = useToastStore();
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<{ file: File; name: string; size: string; status: 'pending' | 'uploading' | 'done' | 'error' }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) {
            const newFiles = Array.from(e.dataTransfer.files).map(f => ({
                file: f,
                name: f.name,
                size: formatSize(f.size),
                status: 'pending' as const,
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const newFiles = Array.from(e.target.files).map(f => ({
                file: f,
                name: f.name,
                size: formatSize(f.size),
                status: 'pending' as const,
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case 'uploading':
                return <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />;
            case 'done': return <Check className="w-3.5 h-3.5 text-emerald-400" />;
            case 'error': return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
            default: return null;
        }
    };

    const handleUploadAll = async () => {
        if (!files.length || isUploading || !token) return;

        setIsUploading(true);
        setProgress(0);

        let completed = 0;
        const total = files.length;

        for (let i = 0; i < files.length; i++) {
            const fileObj = files[i];
            if (fileObj.status === 'done') {
                completed++;
                continue;
            }

            setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));

            const formData = new FormData();
            formData.append('file', fileObj.file);
            formData.append('doc_type', user?.role === 'admin' ? 'admin' : 'faculty');
            formData.append('department', user?.department || '');
            formData.append('course', 'General'); // Default for now

            try {
                await documentsApi.upload(token, formData);

                setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f));
                completed++;
                setProgress(Math.round((completed / total) * 100));
            } catch (error) {
                console.error('Upload error:', error);
                setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
            }
        }

        setIsUploading(false);
        if (completed === total) {
            showToast("Upload complete! Documents are now ready.", "success");
        }
    };

    return (
        <div className="p-6 sm:p-8 md:p-10 w-full">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full">
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-orange-400" />
                    </div>
                    Upload Documents
                </h1>
                <p className="text-xs text-zinc-500 mb-8 max-w-md">Upload course materials, syllabi, and resources for students to query. Support for PDF, DOC, and more.</p>

                {/* Drop Zone - Minimal & Refined */}
                <div className="w-full">
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative rounded-[1.5rem] border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer group ${dragActive ? 'border-orange-500 bg-orange-500/5 shadow-[0_0_40px_-12px_rgba(249,115,22,0.2)]' : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.15] hover:shadow-xl'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.01] to-transparent pointer-events-none" />
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.pptx"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                        />
                        <div className="relative z-10 space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:bg-orange-500/15">
                                <CloudUpload className="w-6 h-6 text-orange-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white tracking-tight">Drag & drop files here</p>
                                <p className="text-[10px] text-zinc-500 font-medium tracking-wide">maximum 25MB per file — PDF, DOCX, TXT accepted</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="mt-4 space-y-2 w-full">
                        <span className="text-xs font-bold text-white">{files.length} file{files.length > 1 ? 's' : ''} selected</span>
                        {files.map((file, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/[0.06] ${file.status === 'uploading' ? 'shadow-[0_0_20px_rgba(249,115,22,0.15)] border-orange-500/40' : ''}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                                        <FileText className="w-3.5 h-3.5 text-orange-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-medium text-white truncate">{file.name}</div>
                                        <div className="text-[10px] text-zinc-600">{file.size}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {statusIcon(file.status)}
                                    <button onClick={() => removeFile(i)} className="w-6 h-6 rounded-md hover:bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                        {/* Upload progress bar */}
                        {isUploading && (
                            <div className="mt-3 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                                    <span>Uploading documents...</span>
                                    <span className="text-zinc-300 font-semibold">{progress}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400"
                                    />
                                </div>
                            </div>
                        )}
                        <Button
                            onClick={handleUploadAll}
                            disabled={!files.length || isUploading}
                            className="w-full mt-4 rounded-xl h-10 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white text-xs font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload {files.length} file{files.length > 1 ? 's' : ''}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </motion.div>

        </div>
    );
};

export default UploadPage;
