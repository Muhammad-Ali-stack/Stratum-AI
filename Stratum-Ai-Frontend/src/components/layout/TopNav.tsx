import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, User } from 'lucide-react';
import StratumLogo from '@/components/shared/StratumLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMe, useLogout } from '@/hooks/useAuth';

type Step = 1 | 2 | 3;

interface TopNavProps {
  activeStep?: Step;
}

const STEPS = [
  { n: 1, label: 'Connect CRM' },
  { n: 2, label: 'Setup AI' },
  { n: 3, label: 'Go Live' },
] as const;

export default function TopNav({ activeStep }: TopNavProps) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const logoutMutation = useLogout();
  const initials = me?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b"
      style={{
        background: 'rgba(30,41,59,0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <StratumLogo size="sm" />

      {activeStep && (
        <div className="flex items-center gap-2">
          {STEPS.map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className="w-8 h-px"
                  style={{ background: n <= activeStep ? '#3B82F6' : 'var(--border-subtle)' }}
                />
              )}
              <div className="flex items-center gap-1.5">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: n === activeStep ? '#3B82F6' : n < activeStep ? '#10B981' : 'var(--bg-card)',
                    color: n <= activeStep ? 'white' : 'var(--text-muted)',
                    border: n > activeStep ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  {n < activeStep ? '✓' : n}
                </span>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: n === activeStep ? '#F8FAFC' : 'var(--text-muted)' }}
                >
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary/20 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground truncate">{me?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="w-3.5 h-3.5 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutMutation.mutate()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
