import { Handle, Position, type NodeProps } from '@xyflow/react';
import ConnectionBadge from '@/components/shared/ConnectionBadge';

interface ServiceNowNodeData {
  connected?: boolean;
  [key: string]: unknown;
}

export default function ServiceNowNode({ data }: NodeProps) {
  const d = data as ServiceNowNodeData;

  return (
    <div
      style={{
        width: 160,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid #62D84E',
        borderRadius: 16,
        padding: '14px 12px',
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 48 48" width="40" height="40">
          <polygon points="24,4 44,14 44,34 24,44 4,34 4,14" fill="#62D84E" />
          <text x="24" y="28" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">NOW</text>
        </svg>
        <div className="text-center">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>ServiceNow</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ITSM</p>
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
