/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

import { createPortal } from 'react-dom';
import { Bell, Clock3, Paperclip, X } from 'lucide-react';
import { type DocumentPreviewResponse } from '@/lib/api';

const formatDate = (value?: string | null) => {
    if (!value) return 'Unknown time';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'Unknown time';
    return dt.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export function NoticePreviewModal({
    isOpen,
    previewDoc,
    isLoading,
    pendingTitle,
    pendingSubtitle,
    onClose,
    onOpenAttachment,
    isAttachmentLoading = false,
}: {
    isOpen: boolean;
    previewDoc: DocumentPreviewResponse | null;
    isLoading?: boolean;
    pendingTitle?: string;
    pendingSubtitle?: string;
    onClose: () => void;
    onOpenAttachment?: () => void;
    isAttachmentLoading?: boolean;
}) {
    if (!isOpen) return null;

    const title = previewDoc?.notice_title || previewDoc?.filename || pendingTitle || 'Loading notice...';
    const subtitle = previewDoc
        ? `${previewDoc.course || 'General'} · ${previewDoc.department || 'No department'} · ${previewDoc.doc_type}`
        : pendingSubtitle || 'Preparing notice view...';
    const message = previewDoc?.notice_message?.trim() || '';

    const modalContent = (
        <div className="fixed inset-0 z-[180] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-hidden">
            <div className="w-full max-w-5xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] rounded-[28px] border border-white/[0.12] bg-[#0b0c10] shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-white/[0.08] flex items-start justify-between gap-3 sticky top-0 z-20 bg-[#0b0c10]/95 backdrop-blur-xl">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-2">
                            <Bell className="w-3.5 h-3.5 text-orange-400" />
                            Notice View
                        </div>
                        <p className="text-base font-bold text-white truncate">{title}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">{subtitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-3 rounded-xl border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.08] text-xs text-white inline-flex items-center gap-1.5"
                    >
                        <X className="w-3.5 h-3.5" />
                        Close
                    </button>
                </div>

                <div className="px-4 py-4 bg-[#090a0d] overflow-y-auto">
                    {isLoading ? (
                        <div className="rounded-[22px] border border-white/[0.08] bg-[#111214] min-h-[60vh] flex flex-col items-center justify-center gap-3">
                            <div className="relative w-9 h-9">
                                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400 animate-spin" />
                            </div>
                            <p className="text-sm font-semibold text-white">Loading notice...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-[22px] border border-orange-500/20 bg-gradient-to-r from-[#201108] via-[#161117] to-[#0b1226] p-5">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-orange-300 font-bold mb-2">Notice Summary</div>
                                <div className="text-white text-lg font-extrabold">{title}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-zinc-300">
                                    <span>{previewDoc?.course || 'General'}</span>
                                    <span>{previewDoc?.department || 'No department'}</span>
                                    <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{formatDate(previewDoc?.uploaded_at)}</span>
                                </div>
                            </div>

                            <div className="rounded-[22px] border border-white/[0.08] bg-[#111214] p-5">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-bold mb-3">Message</div>
                                <div className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-200">
                                    {message || 'This notice does not include additional message content.'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-[22px] border border-white/[0.08] bg-[#111214] p-5">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-bold mb-3">Scope</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                                            <div className="text-[11px] text-zinc-500 mb-2">Course</div>
                                            <div className="text-sm font-semibold text-white">{previewDoc?.course || 'General'}</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                                            <div className="text-[11px] text-zinc-500 mb-2">Department</div>
                                            <div className="text-sm font-semibold text-white">{previewDoc?.department || 'Not specified'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[22px] border border-white/[0.08] bg-[#111214] p-5">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-bold mb-3">Attachment</div>
                                    {previewDoc?.attachment_document_id ? (
                                        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                                            <div className="inline-flex items-center gap-2 text-cyan-200 text-sm font-semibold">
                                                <Paperclip className="w-4 h-4" />
                                                {previewDoc.attachment_filename || 'Attached document'}
                                            </div>
                                            <p className="text-[12px] text-zinc-400 mt-2">
                                                Open the attached document in the document viewer.
                                            </p>
                                            {onOpenAttachment && (
                                                <button
                                                    type="button"
                                                    onClick={onOpenAttachment}
                                                    className="mt-4 h-10 px-4 rounded-xl border border-cyan-500/30 bg-cyan-500/15 hover:bg-cyan-500/20 text-xs font-semibold text-cyan-100 inline-flex items-center gap-2"
                                                >
                                                    <Paperclip className="w-3.5 h-3.5" />
                                                    {isAttachmentLoading ? 'Opening attachment...' : 'Open Attachment'}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-zinc-500">
                                            No attachment was included with this notice.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

