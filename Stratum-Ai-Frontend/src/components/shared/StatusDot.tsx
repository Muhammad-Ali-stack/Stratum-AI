interface StatusDotProps {
  connected: boolean;
  size?: 'xs' | 'sm';
  className?: string;
}

export default function StatusDot({ connected, size = 'sm', className = '' }: StatusDotProps) {
  const dim = size === 'xs' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${dim} ${connected ? 'bg-green-500' : 'bg-muted-foreground/40'} ${className}`}
      aria-label={connected ? 'Connected' : 'Not connected'}
    />
  );
}
