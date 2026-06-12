import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Send,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useMe } from '@/hooks/useAuth';
import AppShell from '@/components/layout/AppShell';
import MutationConfirmCard from '@/components/chat/MutationConfirmCard';
import {
  useConversations,
  useMessages,
  useOptimisticSendMessage,
  useDeleteConversation,
} from '@/hooks/useChat';
import { useSettings } from '@/hooks/useSettings';
import { toast } from '@/hooks/useToast';
import { useConnections } from '@/contexts/ConnectionContext';
import { CRM_LABELS } from '@/types';
import type { Message, ChatResponse, TransparencyInfo } from '../types/shared';

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showTransparency, setShowTransparency] = useState(true);
  const [pendingTransparency, setPendingTransparency] = useState<TransparencyInfo | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: me } = useMe();
  const { data: conversations } = useConversations();
  const { data: messagesData } = useMessages(selectedConversationId);
  const { data: settingsData } = useSettings();
  const deleteConversationMutation = useDeleteConversation();
  const { send, isPending } = useOptimisticSendMessage(selectedConversationId);
  const { connections } = useConnections();

  const hasConnections = connections.length > 0;

  useEffect(() => {
    const state = location.state as { prefillMessage?: string } | null;
    if (state?.prefillMessage) {
      setInput(state.prefillMessage);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    if (messagesData) setLocalMessages(messagesData);
  }, [messagesData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, isPending]);

  const handleSend = async () => {
    if (!input.trim() || isPending) return;
    const content = input.trim();
    setInput('');

    const tempMsg: Message = {
      id: `temp-user-${Date.now()}`,
      conversation_id: selectedConversationId ?? 'new',
      role: 'user',
      content,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, tempMsg]);

    try {
      const result: ChatResponse = await send(content);
      setSelectedConversationId(result.conversation.id);
      setLocalMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempMsg.id);
        return [
          ...withoutTemp,
          {
            id: result.message.id,
            conversation_id: result.conversation.id,
            role: 'assistant',
            content: result.message.content,
            metadata: result.message.metadata,
            created_at: result.message.created_at,
          },
        ];
      });
      if (result.transparency) setPendingTransparency(result.transparency);
    } catch (err) {
      setLocalMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      toast({
        title: 'Failed to send message',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleNewChat = () => {
    setSelectedConversationId(null);
    setLocalMessages([]);
    setPendingTransparency(null);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversationMutation.mutateAsync(id);
    if (selectedConversationId === id) handleNewChat();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const userInitials = me?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <TooltipProvider>
      <AppShell>
        <div className="flex h-full overflow-hidden">
          {/* Chat sidebar */}
          <aside
            className="w-60 border-r flex flex-col shrink-0"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="p-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 justify-start"
                onClick={handleNewChat}
              >
                <Plus className="w-3.5 h-3.5" />
                New chat
              </Button>
            </div>

            <ScrollArea className="flex-1 px-2 py-2">
              <div className="space-y-0.5">
                {conversations?.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                      selectedConversationId === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      setLocalMessages([]);
                      setPendingTransparency(null);
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className={`text-xs truncate flex-1 transition-colors ${selectedConversationId === conv.id ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {conv.title ?? 'New conversation'}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently deletes this conversation and all its messages.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleDeleteConversation(conv.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
                {(!conversations || conversations.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-6 px-3">No conversations yet. Start a new chat!</p>
                )}
              </div>
            </ScrollArea>

            {connections.length > 0 && (
              <div className="px-3 pb-3 space-y-1.5">
                <Separator className="mb-2" />
                <p className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>
                  Connected CRMs
                </p>
                {connections.map((p) => (
                  <div key={p} className="flex items-center gap-1.5 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-xs text-muted-foreground">{CRM_LABELS[p]}</span>
                  </div>
                ))}
              </div>
            )}

            {!hasConnections && (
              <div className="p-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 justify-start text-xs border-amber-500/30 text-amber-500 hover:text-amber-400"
                  onClick={() => navigate('/connect')}
                >
                  <Zap className="w-3 h-3" />
                  Connect a CRM
                </Button>
              </div>
            )}
          </aside>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selectedConversationId
                    ? (conversations?.find((c) => c.id === selectedConversationId)?.title ?? 'Conversation')
                    : 'New conversation'}
                </span>
                {connections.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {CRM_LABELS[p]}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {settingsData?.settings.show_api_transparency && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowTransparency((v) => !v)}
                      >
                        {showTransparency ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{showTransparency ? 'Hide' : 'Show'} transparency</TooltipContent>
                  </Tooltip>
                )}
                <Badge variant="outline" className="text-xs">
                  {settingsData?.settings.preferred_ai_model ?? 'llama3-70b-8192'}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div ref={scrollRef} className="max-w-3xl mx-auto px-6 py-6 space-y-6">
                {localMessages.length === 0 && !isPending && (
                  <div className="text-center py-20">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                      style={{ background: 'rgba(59,130,246,0.1)' }}
                    >
                      <Zap className="w-7 h-7" style={{ color: '#3B82F6' }} />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                      Ask anything about your CRM
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Try &quot;Show open opportunities this quarter&quot; or &quot;Create a lead for John Smith at Tesla&quot;
                    </p>
                    {!hasConnections && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-6 gap-2"
                        onClick={() => navigate('/connect')}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Connect a CRM first
                      </Button>
                    )}
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {localMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                          <AvatarFallback className="text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#3B82F6,#10B981)' }}>
                            S
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'text-white rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}
                          style={msg.role === 'user' ? { background: '#3B82F6' } : {}}
                        >
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            msg.content
                          )}
                        </div>
                        {msg.role === 'assistant' && showTransparency && msg.metadata?.ai_model && (
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-xs h-5 px-2">{msg.metadata.ai_model}</Badge>
                            {msg.metadata.sf_object && <Badge variant="secondary" className="text-xs h-5 px-2">{msg.metadata.sf_object}</Badge>}
                            {msg.metadata.sf_operation && <Badge variant="secondary" className="text-xs h-5 px-2">{msg.metadata.sf_operation}</Badge>}
                            {msg.metadata.processing_time_ms && <Badge variant="outline" className="text-xs h-5 px-2 text-muted-foreground">{msg.metadata.processing_time_ms}ms</Badge>}
                          </div>
                        )}
                        {msg.role === 'assistant' && msg.metadata?.pending_action && (
                          <MutationConfirmCard pendingAction={msg.metadata.pending_action} />
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{userInitials}</AvatarFallback>
                        </Avatar>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isPending && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#3B82F6,#10B981)' }}>S</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4 shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="max-w-3xl mx-auto flex gap-3">
                <Input
                  placeholder={hasConnections ? 'Ask about your CRM data...' : 'Connect a CRM first to start chatting...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isPending || !hasConnections}
                  className="h-11"
                />
                <Button
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isPending || !hasConnections}
                  size="icon"
                  className="h-11 w-11 shrink-0 text-white"
                  style={{ background: '#3B82F6' }}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Press Enter to send · AI responses may be inaccurate — verify critical changes
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </TooltipProvider>
  );
}
