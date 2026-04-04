/* Copyright (c) 2026 XynaxDev
 * Contact: akashkumar.cs27@gmail.com
 */

import { FileText, X, Paperclip } from 'lucide-react';
import { type DocumentPreviewResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

function buildDocumentBody(previewDoc: DocumentPreviewResponse) {
    if (previewDoc.notice_message?.trim()) {
        return previewDoc.notice_message.trim();
    }
    if (previewDoc.chunks?.length) {
        return previewDoc.chunks
            .slice()
            .sort((a, b) => a.chunk_index - b.chunk_index)
            .map((chunk) => chunk.content?.trim() || '')
            .filter(Boolean)
            .join('\n\n');
    }
    return '';
}

export function DocumentPreviewModal({
    previewDoc,
    isLoading,
    onClose,
    onOpenAttachment,
    isAttachmentLoading = false,
}: {
    previewDoc: DocumentPreviewResponse | null;
    isLoading?: boolean;
    onClose: () => void;
    onOpenAttachment?: () => void;
    isAttachmentLoading?: boolean;
}) {
    if (!previewDoc) return null;

    const documentBody = buildDocumentBody(previewDoc);
    const paragraphs = documentBody
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean);

    return (
        <div className="fixed inset-0 z-[180] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-5xl rounded-[28px] border border-white/[0.12] bg-[#0b0c10] shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.08] flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-2">
                            <FileText className="w-3.5 h-3.5 text-orange-400" />
                            Document View
                        </div>
                        <p className="text-base font-bold text-white truncate">
                            {previewDoc.notice_title || previewDoc.filename}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">
                            {previewDoc.course || 'General'} · {previewDoc.department || 'No department'} · {previewDoc.doc_type}
                        </p>
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

                <div className="px-4 py-4 bg-[#090a0d]">
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-[68vh] w-full rounded-[22px]" />
                        </div>
                    ) : (
                        <div className="max-h-[78vh] overflow-y-auto rounded-[22px] border border-white/[0.08] bg-[#111214] p-4">
                            <div className="mx-auto max-w-[820px] min-h-[68vh] rounded-[24px] bg-white text-zinc-900 shadow-[0_20px_60px_rgba(0,0,0,0.35)] px-6 py-8 sm:px-10">
                                <div className="border-b border-zinc-200 pb-5 mb-6">
                                    <h2 className="text-2xl font-black tracking-tight text-zinc-900">
                                        {previewDoc.notice_title || previewDoc.filename}
                                    </h2>
                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
                                        <span>Type: {previewDoc.doc_type}</span>
                                        <span>Course: {previewDoc.course || 'General'}</span>
                                        <span>Department: {previewDoc.department || 'Not specified'}</span>
                                    </div>
                                </div>

                                {paragraphs.length > 0 ? (
                                    <div className="space-y-4 text-[15px] leading-7 text-zinc-800">
                                        {paragraphs.map((paragraph, index) => (
                                            <p key={`${previewDoc.id}-paragraph-${index}`} className="whitespace-pre-wrap break-words">
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-6 text-sm text-zinc-600">
                                        Original file text preview is not available for this document yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {previewDoc.attachment_document_id && onOpenAttachment && (
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={onOpenAttachment}
                                className="h-10 px-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/15 text-xs font-semibold text-cyan-200 inline-flex items-center gap-2"
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                                {isAttachmentLoading
                                    ? 'Opening attachment...'
                                    : previewDoc.attachment_filename
                                        ? `Open Attachment: ${previewDoc.attachment_filename}`
                                        : 'Open Attachment'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
