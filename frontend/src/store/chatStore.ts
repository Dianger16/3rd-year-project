/**
 * Chat Store (Zustand)
 * Manages chat conversations, messages, and agent interactions.
 */

import { create } from 'zustand';
import { agentApi, type ConversationResponse, type SourceCitation, type ModerationMeta } from '@/lib/api';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    sources?: SourceCitation[];
    roleBadge?: string;
    rationale?: string;
    moderation?: ModerationMeta;
    timestamp: string;
}

interface ChatState {
    conversations: ConversationResponse[];
    currentConversationId: string | null;
    messages: ChatMessage[];
    isQuerying: boolean;
    error: string | null;

    sendQuery: (token: string, query: string, context?: { dept?: string; course?: string }) => Promise<void>;
    loadHistory: (token: string) => Promise<void>;
    loadConversation: (token: string, id: string) => Promise<void>;
    newConversation: () => void;
    clearError: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
    conversations: [],
    currentConversationId: null,
    messages: [],
    isQuerying: false,
    error: null,

    sendQuery: async (token, query, context) => {
        const state = get();
        const userMessage: ChatMessage = {
            role: 'user',
            content: query,
            timestamp: new Date().toISOString(),
        };
        set({ messages: [...state.messages, userMessage], isQuerying: true, error: null });

        try {
            const res = await agentApi.query(token, {
                query,
                context,
                conversation_id: state.currentConversationId || undefined,
            });

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: res.answer,
                sources: res.sources,
                roleBadge: res.role_badge,
                rationale: res.rationale,
                moderation: res.moderation,
                timestamp: new Date().toISOString(),
            };

            set({
                messages: [...get().messages, assistantMessage],
                currentConversationId: res.conversation_id,
                isQuerying: false,
            });
        } catch (err: unknown) {
            set({ error: (err as Error).message || 'Query failed', isQuerying: false });
        }
    },

    loadHistory: async (token) => {
        try {
            const res = await agentApi.getHistory(token);
            set({ conversations: res.conversations });
        } catch (err: unknown) {
            set({ error: (err as Error).message });
        }
    },

    loadConversation: async (token, id) => {
        try {
            const res = await agentApi.getConversation(token, id);
            const messages: ChatMessage[] = (res.messages || []).map((m: Record<string, unknown>) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content as string,
                sources: m.sources as SourceCitation[],
                timestamp: new Date().toISOString(),
            }));
            set({ currentConversationId: id, messages });
        } catch (err: unknown) {
            set({ error: (err as Error).message });
        }
    },

    newConversation: () => {
        set({ currentConversationId: null, messages: [], error: null });
    },

    clearError: () => set({ error: null }),
}));
