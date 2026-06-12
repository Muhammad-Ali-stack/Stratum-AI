import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2, Plus, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNotifications, type AppNotification } from '@/contexts/NotificationContext';

const OBJECT_COLORS: Record<string, string> = {
  Lead: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Contact: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  Opportunity: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Account: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Task: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Case: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const TYPE_ICONS: Record<string, { icon: typeof Plus; color: string }> = {
  created: { icon: Plus, color: 'text-emerald-400' },
  updated: { icon: RefreshCw, color: 'text-blue-400' },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifItem({ n, onDismiss }: { n: AppNotification; onDismiss: (id: string) => void }) {
  const objColor = OBJECT_COLORS[n.object] ?? 'bg-zinc-800/50 text-zinc-300 border-zinc-700';
  const typeInfo = TYPE_ICONS[n.type] ?? TYPE_ICONS.updated;
  const TypeIcon = typeInfo.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative px-4 py-3 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/20 transition-colors ${
        !n.read ? 'bg-zinc-800/10' : ''
      }`}
    >
      {!n.read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
      )}
      <div className="flex items-start gap-3 pl-2">
        <div className={`mt-0.5 p-1.5 rounded-md border ${objColor} shrink-0`}>
          <TypeIcon className={`w-3 h-3 ${typeInfo.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${objColor}`}>
              {n.object}
            </span>
            <span className={`text-[10px] font-medium capitalize ${typeInfo.color}`}>{n.type}</span>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed">{n.message}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">{timeAgo(n.timestamp)}</p>
        </div>
        <button
          onClick={() => onDismiss(n.id)}
          className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors p-0.5 rounded"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllRead, dismiss, clearAll } = useNotifications();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      setTimeout(markAllRead, 300);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative h-8 w-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-200">Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors px-1.5 py-1 rounded hover:bg-zinc-800"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-red-400 transition-colors px-1.5 py-1 rounded hover:bg-zinc-800"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Feed */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800/60 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-400">No notifications yet</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      Record changes will appear here
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <NotifItem key={n.id} n={n} onDismiss={dismiss} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
