import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  GitBranch,
  CloudOff,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppShell from '@/components/layout/AppShell';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import { usePipeline, PIPELINE_QUERY_KEY } from '@/hooks/usePipeline';
import { useQueryClient } from '@tanstack/react-query';
import { StageColumnNode } from '@/components/pipeline/StageColumnNode';
import { useThemeContext } from '@/contexts/ThemeContext';
import type { PipelineStage } from '../types/shared';

const nodeTypes = { stageColumn: StageColumnNode };

const NODE_WIDTH = 272;
const NODE_GAP = 48;
const NODE_STRIDE = NODE_WIDTH + NODE_GAP;

function buildNodesAndEdges(stages: PipelineStage[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = stages.map((stage, i) => ({
    id: `stage-${i}`,
    type: 'stageColumn',
    position: { x: i * NODE_STRIDE, y: 0 },
    data: {
      stage,
      colorIndex: i,
      isFirst: i === 0,
      isLast: i === stages.length - 1,
    },
    draggable: false,
    selectable: false,
  }));

  const edges: Edge[] = stages.slice(0, -1).map((_, i) => ({
    id: `edge-${i}`,
    source: `stage-${i}`,
    target: `stage-${i + 1}`,
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'rgba(59,130,246,0.5)', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'rgba(59,130,246,0.7)',
      width: 16,
      height: 16,
    },
  }));

  return { nodes, edges };
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export default function PipelinePage() {
  const navigate = useNavigate();
  const { data: pipelineData, isLoading } = usePipeline();
  const qc = useQueryClient();
  const { theme } = useThemeContext();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (pipelineData && 'stages' in pipelineData) {
      const { nodes: n, edges: e } = buildNodesAndEdges(pipelineData.stages);
      setNodes(n);
      setEdges(e);
    }
  }, [pipelineData, setNodes, setEdges]);

  const handleRefresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: PIPELINE_QUERY_KEY });
  }, [qc]);

  const isConnected = pipelineData && 'connected' in pipelineData && pipelineData.connected === true;
  const pipelineStats = isConnected ? pipelineData : null;

  return (
    <TooltipProvider>
      <AppShell>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header
            className="flex items-center justify-between px-6 h-14 border-b shrink-0"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-3">
              <h1 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>Pipeline</h1>
              {pipelineStats && (
                <div className="hidden md:flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <span className="text-muted-foreground">Pipeline</span>
                    <span className="font-bold" style={{ color: '#3B82F6' }}>{formatCurrency(pipelineStats.totalPipelineValue)}</span>
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{pipelineStats.totalOpportunities} open deals</Badge>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh pipeline</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(4px)' }}>
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
                  <p className="text-sm text-muted-foreground">Loading pipeline...</p>
                </div>
              </div>
            )}

            {!isLoading && !isConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)' }}>
                  <CloudOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-display text-lg font-semibold">No CRM connected</p>
                  <p className="text-sm text-muted-foreground mt-1">Connect your CRM in the integration flow to visualize your pipeline.</p>
                </div>
                <Button onClick={() => navigate('/connect')} className="text-white" style={{ background: '#3B82F6' }}>
                  Connect CRM
                </Button>
              </div>
            )}

            {!isLoading && isConnected && nodes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                <GitBranch className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">No open opportunities in your pipeline</p>
              </div>
            )}

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
              colorMode={theme === 'dark' ? 'dark' : 'light'}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnScroll
              zoomOnScroll={false}
              zoomOnDoubleClick={false}
              style={{ background: 'var(--bg-primary)' }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.5}
                color={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}
              />
              <Controls className="!bg-card !border-border !rounded-lg !shadow-lg" showInteractive={false} />
              <MiniMap
                nodeColor={(node) => {
                  const idx = (node.data as { colorIndex?: number })?.colorIndex ?? 0;
                  const colors = ['#3B82F6','#6366F1','#8B5CF6','#A855F7','#D946EF','#EC4899','#F97316','#F59E0B','#10B981','#EF4444'];
                  return colors[idx % colors.length] ?? '#3B82F6';
                }}
                className="!bg-card !border-border !rounded-lg"
                maskColor={theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'}
              />
            </ReactFlow>
          </div>
        </div>
      </AppShell>
    </TooltipProvider>
  );
}
