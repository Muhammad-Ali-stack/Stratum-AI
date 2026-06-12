import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { PipelineStage } from '../../types/shared';

interface StageNodeData {
  stage: PipelineStage;
  colorIndex: number;
  isFirst: boolean;
  isLast: boolean;
}

const STAGE_PALETTES = [
  { ring: 'ring-blue-500/40',    header: 'bg-blue-500/10',    title: 'text-blue-400',    dot: 'bg-blue-500',    amount: 'text-blue-400'    },
  { ring: 'ring-indigo-500/40',  header: 'bg-indigo-500/10',  title: 'text-indigo-400',  dot: 'bg-indigo-500',  amount: 'text-indigo-400'  },
  { ring: 'ring-violet-500/40',  header: 'bg-violet-500/10',  title: 'text-violet-400',  dot: 'bg-violet-500',  amount: 'text-violet-400'  },
  { ring: 'ring-purple-500/40',  header: 'bg-purple-500/10',  title: 'text-purple-400',  dot: 'bg-purple-500',  amount: 'text-purple-400'  },
  { ring: 'ring-fuchsia-500/40', header: 'bg-fuchsia-500/10', title: 'text-fuchsia-400', dot: 'bg-fuchsia-500', amount: 'text-fuchsia-400' },
  { ring: 'ring-pink-500/40',    header: 'bg-pink-500/10',    title: 'text-pink-400',    dot: 'bg-pink-500',    amount: 'text-pink-400'    },
  { ring: 'ring-orange-500/40',  header: 'bg-orange-500/10',  title: 'text-orange-400',  dot: 'bg-orange-500',  amount: 'text-orange-400'  },
  { ring: 'ring-amber-500/40',   header: 'bg-amber-500/10',   title: 'text-amber-400',   dot: 'bg-amber-500',   amount: 'text-amber-400'   },
  { ring: 'ring-emerald-500/40', header: 'bg-emerald-500/10', title: 'text-emerald-400', dot: 'bg-emerald-500', amount: 'text-emerald-400' },
  { ring: 'ring-red-500/40',     header: 'bg-red-500/10',     title: 'text-red-400',     dot: 'bg-red-500',     amount: 'text-red-400'     },
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function StageColumnNode({ data }: NodeProps) {
  const { stage, colorIndex, isFirst, isLast } = data as unknown as StageNodeData;
  const palette = STAGE_PALETTES[colorIndex % STAGE_PALETTES.length]!;

  return (
    <div
      style={{ width: 272 }}
      className={`rounded-xl border border-border bg-card ring-1 ${palette.ring} shadow-lg overflow-hidden`}
    >
      {!isFirst && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !border-2 !border-border !bg-background"
        />
      )}

      {/* Stage header */}
      <div className={`${palette.header} px-4 py-3 border-b border-border`}>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${palette.dot} shrink-0`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${palette.title} truncate`}>
            {stage.name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{stage.count} deal{stage.count !== 1 ? 's' : ''}</span>
          <span className={`text-sm font-bold ${palette.amount}`}>
            {formatCurrency(stage.totalValue)}
          </span>
        </div>
      </div>

      {/* Opportunity cards */}
      <div className="p-2 space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
        {stage.opportunities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No opportunities</p>
        ) : (
          stage.opportunities.slice(0, 8).map((opp) => (
            <div
              key={opp.id}
              className="rounded-lg bg-background border border-border px-3 py-2.5 hover:border-primary/40 transition-colors cursor-default group"
            >
              <p className="text-xs font-medium leading-snug text-foreground truncate group-hover:text-primary transition-colors">
                {opp.name}
              </p>
              {opp.account && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{opp.account}</p>
              )}
              <div className="flex items-center justify-between mt-1.5 gap-2">
                <span className={`text-xs font-semibold ${palette.amount}`}>
                  {opp.amount !== null ? formatCurrency(opp.amount) : '—'}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {opp.closeDate ? formatDate(opp.closeDate) : '—'}
                </span>
              </div>
              {opp.probability !== null && (
                <div className="mt-1.5">
                  <div className="h-0.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${palette.dot} opacity-70`}
                      style={{ width: `${opp.probability}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {stage.opportunities.length > 8 && (
          <p className="text-[11px] text-muted-foreground text-center py-1">
            +{stage.opportunities.length - 8} more
          </p>
        )}
      </div>

      {!isLast && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !border-2 !border-border !bg-background"
        />
      )}
    </div>
  );
}
