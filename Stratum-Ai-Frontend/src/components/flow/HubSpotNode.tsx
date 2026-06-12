import { Handle, Position, type NodeProps } from '@xyflow/react';
import ConnectionBadge from '@/components/shared/ConnectionBadge';

interface HubSpotNodeData {
  connected?: boolean;
  [key: string]: unknown;
}

export default function HubSpotNode({ data }: NodeProps) {
  const d = data as HubSpotNodeData;

  return (
    <div
      style={{
        width: 160,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid #FF7A59',
        borderRadius: 16,
        padding: '14px 12px',
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 48 48" width="40" height="40">
          <circle cx="24" cy="24" r="10" fill="#FF7A59" />
          <rect x="21" y="4" width="6" height="12" rx="3" fill="#FF7A59" />
          <rect x="21" y="32" width="6" height="12" rx="3" fill="#FF7A59" />
          <rect x="4" y="21" width="12" height="6" rx="3" fill="#FF7A59" />
          <rect x="32" y="21" width="12" height="6" rx="3" fill="#FF7A59" />
        </svg>
        <div className="text-center">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>HubSpot</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CRM</p>
        </div>
        <ConnectionBadge connected={!!d.connected} />
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ left: -7 }}
      />
    </div>
  );
}
