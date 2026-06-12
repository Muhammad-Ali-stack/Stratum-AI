import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteConversation,
  updateConversationTitle,
} from '@/lib/api';
import type { ChatResponse, Conversation, Message } from '../types/shared';

export const CONVERSATIONS_QUERY_KEY = ['chat', 'conversations'] as const;
export const messagesQueryKey = (id: string) => ['chat', 'messages', id] as const;

export function useConversations() {
  return useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: getConversations,
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: messagesQueryKey(conversationId ?? ''),
    queryFn: () => getMessages(conversationId!),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, conversationId }: { content: string; conversationId?: string }) =>
      sendMessage(content, conversationId),
    onSuccess: (data: ChatResponse) => {
      const convId = data.conversation.id;
      void qc.invalidateQueries({ queryKey: messagesQueryKey(convId) });
      void qc.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export function useUpdateConversationTitle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateConversationTitle(id, title),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export function useOptimisticSendMessage(conversationId: string | null) {
  const qc = useQueryClient();
  const sendMutation = useSendMessage();

  const send = async (content: string): Promise<ChatResponse> => {
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId ?? 'new',
      role: 'user',
      content,
      metadata: {},
      created_at: new Date().toISOString(),
    };

    if (conversationId) {
      qc.setQueryData<Message[]>(messagesQueryKey(conversationId), (old) =>
        old ? [...old, tempUserMsg] : [tempUserMsg],
      );
    }

    const result = await sendMutation.mutateAsync({ content, conversationId: conversationId ?? undefined });
    return result;
  };

  return { send, isPending: sendMutation.isPending, error: sendMutation.error };
}
