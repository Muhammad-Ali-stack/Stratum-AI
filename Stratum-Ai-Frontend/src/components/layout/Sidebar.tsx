import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, Settings, LogOut, GitBranch, Database } from 'lucide-react';
import StratumLogo from '@/components/shared/StratumLogo';
import StatusDot from '@/components/shared/StatusDot';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useMe, useLogout } from '@/hooks/useAuth';
import { useConnections } from '@/contexts/ConnectionContext';
import { CRM_LABELS } from '@/types';
import type { CRMProvider } from '@/types';

const NAV_LINKS = [
  { to: '/chat',     label: 'AI Chat',    icon: MessageSquare   },
  { to: '/dashboard',label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/records',  label: 'Records',    icon: Database        },
  { to: '/pipeline', label: 'Pipeline',   icon: GitBranch       },
  { to: '/settings', label: 'Settings',   icon: Settings        },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: me } = useMe();
  const logoutMutation = useLogout();
  const { connections } = useConnections();

  return (
    <aside
      className="flex flex-col border-r shrink-0"
      style={{
        width: 240,
        background: 'var(--bg-card)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <StratumLogo size="sm" />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Button
              key={to}
              variant="ghost"
              size="sm"
              className={`w-full justify-start gap-2.5 ${active ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => navigate(to)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Button>
          );
        })}
      </nav>

      <div className="p-3 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
        {connections.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider px-2" style={{ color: 'var(--text-muted)' }}>
              Connected CRMs
            </p>
            {connections.map((p: CRMProvider) => (
              <div key={p} className="flex items-center gap-2 px-2 py-1">
                <StatusDot connected size="xs" />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{CRM_LABELS[p]}</span>
              </div>
            ))}
          </div>
        )}
        <Separator />
        <div className="flex items-center gap-2 px-1">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {me?.email?.slice(0, 2).toUpperCase() ?? 'U'}
          </div>
          <span className="text-xs text-muted-foreground truncate flex-1">{me?.email}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
