import { useState } from 'react';
import { CheckCircle2, XCircle, Edit3, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCreateRecord, useUpdateRecord } from '@/hooks/useRecordMutation';
import { toast } from '@/hooks/useToast';
import { useNotifications } from '@/contexts/NotificationContext';
import type { PendingAction } from '../../types/shared';

interface Props {
  pendingAction: PendingAction;
}

const OBJECT_COLORS: Record<string, string> = {
  Lead: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Contact: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  Opportunity: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Account: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  Task: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  Case: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function MutationConfirmCard({ pendingAction }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(pendingAction.fields).map(([k, v]) => [k, String(v ?? '')]),
    ),
  );
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resultMsg, setResultMsg] = useState('');

  const createMutation = useCreateRecord();
  const updateMutation = useUpdateRecord();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const { addNotification } = useNotifications();

  const objectColor = OBJECT_COLORS[pendingAction.object] ?? 'bg-zinc-800/50 text-zinc-300 border-zinc-700';

  async function handleConfirm() {
    const fields = isEditing
      ? Object.fromEntries(Object.entries(editedFields).filter(([, v]) => v.trim() !== ''))
      : pendingAction.fields;

    try {
      if (pendingAction.type === 'create') {
        const result = await createMutation.mutateAsync({ objectType: pendingAction.object, fields });
        const msg = result.message ?? `${pendingAction.object} created (ID: ${result.id})`;
        setStatus('success');
        setResultMsg(msg);
        toast({ title: `${pendingAction.object} created`, description: `Record ID: ${result.id}` });
        addNotification({
          type: 'created',
          object: pendingAction.object,
          recordId: result.id,
          message: msg,
        });
      } else {
        if (!pendingAction.recordId) throw new Error('No record ID for update');
        const result = await updateMutation.mutateAsync({ objectType: pendingAction.object, recordId: pendingAction.recordId, fields });
        const msg = result.message ?? `${pendingAction.object} updated`;
        setStatus('success');
        setResultMsg(msg);
        toast({ title: `${pendingAction.object} updated` });
        addNotification({
          type: 'updated',
          object: pendingAction.object,
          recordId: pendingAction.recordId,
          message: msg,
        });
      }
    } catch (err) {
      setStatus('error');
      setResultMsg(err instanceof Error ? err.message : 'Request failed. Please try again.');
      toast({ title: 'Action failed', description: resultMsg, variant: 'destructive' });
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 flex items-center gap-3"
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="text-sm text-emerald-300">{resultMsg}</p>
      </motion.div>
    );
  }

  if (status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-center gap-3"
      >
        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <p className="text-sm text-red-300">{resultMsg}</p>
          <button
            className="text-xs text-muted-foreground hover:text-foreground mt-1 underline underline-offset-2"
            onClick={() => setStatus('idle')}
          >
            Try again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-2 rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-foreground">
            Confirm {pendingAction.type === 'create' ? 'Create' : 'Update'}
          </span>
          <Badge className={`text-[10px] border h-4 px-1.5 ${objectColor}`}>
            {pendingAction.object}
          </Badge>
          {pendingAction.recordId && (
            <span className="text-[10px] text-muted-foreground font-mono">{pendingAction.recordId}</span>
          )}
        </div>
        <button
          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          onClick={() => setIsEditing((v) => !v)}
        >
          <Edit3 className="w-3 h-3" />
          {isEditing ? 'Done editing' : 'Edit fields'}
        </button>
      </div>

      {/* Fields */}
      <div className="px-4 py-3 space-y-2">
        {isEditing ? (
          <div className="space-y-2">
            {Object.entries(editedFields).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[120px_1fr] items-center gap-2">
                <Label className="text-xs text-muted-foreground text-right pr-2">{key}</Label>
                <Input
                  value={value}
                  onChange={(e) => setEditedFields((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="h-7 text-xs"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(pendingAction.fields).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[120px_1fr] gap-2 text-xs">
                <span className="text-muted-foreground text-right pr-2 truncate">{key}</span>
                <span className="text-foreground font-medium truncate">{String(value ?? '—')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-border bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => setStatus('error')}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => void handleConfirm()}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          {pendingAction.type === 'create' ? 'Create record' : 'Update record'}
        </Button>
      </div>
    </motion.div>
  );
}
