import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import TopNav from '@/components/layout/TopNav';
import StratumNode from '@/components/flow/StratumNode';
import SalesforceNode from '@/components/flow/SalesforceNode';
import HubSpotNode from '@/components/flow/HubSpotNode';
import ServiceNowNode from '@/components/flow/ServiceNowNode';
import AIProviderNode from '@/components/flow/AIProviderNode';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useConnections } from '@/contexts/ConnectionContext';
import { CRM_LABELS } from '@/types';
import type { CRMProvider, AIProvider } from '@/types';

const NODE_TYPES = {
  stratum: StratumNode,
  salesforce: SalesforceNode,
  hubspot: HubSpotNode,
  servicenow: ServiceNowNode,
  aiProvider: AIProviderNode,
};

const CRM_COLORS: Record<CRMProvider, string> = {
  salesforce: '#00A1E0',
  hubspot: '#FF7A59',
  servicenow: '#62D84E',
};

export default function AIConnectionPage() {
  const navigate = useNavigate();
  const { connections } = useConnections();

  const aiConfig = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('stratum-ai-config');
      return raw ? (JSON.parse(raw) as { provider: AIProvider; apiKey: string }) : null;
    } catch { return null; }
  }, []);

  const aiProvider = aiConfig?.provider ?? 'groq';

  const { nodes, edges } = useMemo(() => {
    const crmList = connections.length > 0 ? connections : (['salesforce'] as CRMProvider[]);
    const startY = 200 - ((crmList.length - 1) * 70);

    const ns: Node[] = [
      { id: 'ai-provider', type: 'aiProvider', position: { x: 80, y: 200 }, data: { provider: aiProvider } },
      { id: 'stratum', type: 'stratum', position: { x: 380, y: 200 }, data: {} },
      ...crmList.map((p, i) => ({
        id: p,
        type: p,
        position: { x: 680, y: startY + i * 140 },
        data: { connected: true },
      })),
    ];

    const es: Edge[] = [
      {
        id: 'ai-stratum',
        source: 'ai-provider',
        sourceHandle: 'out',
        target: 'stratum',
        targetHandle: 'mid',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#F97316', strokeWidth: 3 },
      },
      ...crmList.map((p, i) => ({
        id: `stratum-${p}`,
        source: 'stratum',
        sourceHandle: i === 0 ? 'top' : i === 1 ? 'mid' : 'bot',
        target: p,
        targetHandle: 'in',
        type: 'smoothstep',
        animated: true,
        style: { stroke: CRM_COLORS[p], strokeWidth: 2.5 },
      })),
    ];

    return { nodes: ns, edges: es };
  }, [connections, aiProvider]);

  const allRows = [
    { label: 'AI Provider → Stratum AI', active: !!aiConfig },
    ...connections.map((p) => ({ label: `Stratum AI → ${CRM_LABELS[p]}`, active: true })),
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)', paddingTop: 56 }}>
      <TopNav activeStep={3} />

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          style={{ background: 'var(--bg-primary)' }}
        >
          <Background variant={BackgroundVariant.Dots} color="var(--border-subtle)" gap={20} size={1} />
        </ReactFlow>

        {/* Status overlay */}
        <div className="absolute top-6 right-6 z-10 w-64">
          <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold text-sm font-display" style={{ color: 'var(--text-primary)' }}>
                  Connection Status
                </span>
              </div>
              <div className="space-y-2">
                {allRows.map(({ label, active }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 px-1.5 shrink-0 ${active ? 'text-green-500 border-green-500/30 bg-green-500/10' : 'text-muted-foreground'}`}
                    >
                      {active ? '✓ Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Button
              onClick={() => navigate('/chat')}
              size="lg"
              className="gap-2 text-white font-semibold px-8 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #F97316)' }}
            >
              <MessageSquare className="w-5 h-5" />
              Launch AI Chat →
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
