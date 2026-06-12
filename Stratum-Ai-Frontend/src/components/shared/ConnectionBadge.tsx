import { Badge } from '@/components/ui/badge';
import StatusDot from './StatusDot';

interface ConnectionBadgeProps {
  connected: boolean;
  className?: string;
}

export default function ConnectionBadge({ connected, className = '' }: ConnectionBadgeProps) {
  return (
    <Badge
      variant={connected ? 'secondary' : 'outline'}
      className={`gap-1.5 text-xs ${connected ? 'text-green-600 dark:text-green-400 border-green-500/30 bg-green-500/10' : 'text-muted-foreground'} ${className}`}
    >
      <StatusDot connected={connected} size="xs" />
      {connected ? 'Connected' : 'Not Connected'}
    </Badge>
  );
}
