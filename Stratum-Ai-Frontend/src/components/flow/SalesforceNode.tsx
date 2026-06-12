import { Handle, Position, type NodeProps } from '@xyflow/react';
import ConnectionBadge from '@/components/shared/ConnectionBadge';

interface SalesforceNodeData {
  connected?: boolean;
  [key: string]: unknown;
}

export default function SalesforceNode({ data }: NodeProps) {
  const d = data as SalesforceNodeData;

  return (
    <div
      style={{
        width: 160,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '14px 12px',
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 60 40" width="48" height="32">
          <path
            d="M15 30 Q5 30 5 20 Q5 10 15 10 Q17 4 25 4 Q30 1 36 6 Q40 2 46 6 Q55 6 55 16 Q55 26 46 28 Q44 34 36 34 Q28 35 24 30 Z"
            fill="#00A1E0"
          />
        </svg>
        <div className="text-center">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Salesforce</p>
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
