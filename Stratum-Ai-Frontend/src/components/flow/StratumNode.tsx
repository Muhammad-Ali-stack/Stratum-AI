import { Handle, Position, type NodeProps } from '@xyflow/react';
import StratumLogo from '@/components/shared/StratumLogo';

export default function StratumNode(_props: NodeProps) {
  return (
    <div
      className="stratum-node-pulse relative rounded-2xl shadow-lg"
      style={{
        width: 180,
        background: 'var(--bg-card)',
        border: '2px solid #3B82F6',
        boxShadow: '0 8px 32px rgba(59,130,246,0.2)',
        padding: '16px 12px',
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <StratumLogo size="sm" iconOnly />
        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Stratum AI
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="top"
        style={{ top: '25%', right: -7 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="mid"
        style={{ top: '50%', right: -7 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="bot"
        style={{ top: '75%', right: -7 }}
      />
    </div>
  );
}
