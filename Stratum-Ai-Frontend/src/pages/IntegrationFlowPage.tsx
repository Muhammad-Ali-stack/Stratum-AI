import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, ExternalLink } from 'lucide-react';
import TopNav from '@/components/layout/TopNav';
import StratumNode from '@/components/flow/StratumNode';
import SalesforceNode from '@/components/flow/SalesforceNode';
import HubSpotNode from '@/components/flow/HubSpotNode';
import ServiceNowNode from '@/components/flow/ServiceNowNode';
import StatusDot from '@/components/shared/StatusDot';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/useToast';
import { useConnections } from '@/contexts/ConnectionContext';
import { api } from '@/lib/api';
import type { CRMProvider } from '@/types';
import { CRM_LABELS } from '@/types';

const NODE_TYPES = {
  stratum: StratumNode,
  salesforce: SalesforceNode,
  hubspot: HubSpotNode,
  servicenow: ServiceNowNode,
};

const INITIAL_NODES: Node[] = [
  { id: 'stratum', type: 'stratum', position: { x: 300, y: 200 }, data: {} },
  { id: 'salesforce', type: 'salesforce', position: { x: 650, y: 80 }, data: { connected: false } },
  { id: 'hubspot', type: 'hubspot', position: { x: 650, y: 220 }, data: { connected: false } },
  { id: 'servicenow', type: 'servicenow', position: { x: 650, y: 360 }, data: { connected: false } },
];

type DialogType = CRMProvider | null;

interface SFCreds { clientId: string; clientSecret: string; instanceUrl: string; username: string; password: string; }
interface HSCreds { clientId: string; clientSecret: string; redirectUri: string; }
interface SNowCreds { instanceUrl: string; username: string; password: string; clientId: string; clientSecret: string; }

export default function IntegrationFlowPage() {
  const navigate = useNavigate();
  const { connections, addConnection, isConnected } = useConnections();
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [pendingTarget, setPendingTarget] = useState<DialogType>(null);
  const [connecting, setConnecting] = useState(false);

  const [sfCreds, setSfCreds] = useState<SFCreds>({ clientId: '', clientSecret: '', instanceUrl: '', username: '', password: '' });
  const [hsCreds, setHsCreds] = useState<HSCreds>({ clientId: '', clientSecret: '', redirectUri: '' });
  const [snowCreds, setSnowCreds] = useState<SNowCreds>({ instanceUrl: '', username: '', password: '', clientId: '', clientSecret: '' });

  const onConnect = useCallback((params: Connection) => {
    const target = params.target as CRMProvider | null;
    if (target && ['salesforce', 'hubspot', 'servicenow'].includes(target)) {
      setPendingTarget(target as CRMProvider);
    }
  }, []);

  const markConnected = (provider: CRMProvider) => {
    addConnection(provider);
    setNodes((nds) =>
      nds.map((n) => (n.id === provider ? { ...n, data: { ...n.data, connected: true } } : n)),
    );
    const handleId = provider === 'salesforce' ? 'top' : provider === 'hubspot' ? 'mid' : 'bot';
    const colors: Record<CRMProvider, string> = { salesforce: '#00A1E0', hubspot: '#FF7A59', servicenow: '#62D84E' };
    setEdges((eds) =>
      addEdge(
        {
          id: `stratum-${provider}`,
          source: 'stratum',
          sourceHandle: handleId,
          target: provider,
          targetHandle: 'in',
          type: 'smoothstep',
          animated: true,
          style: { stroke: `${colors[provider]}`, strokeWidth: 2.5 },
        },
        eds,
      ),
    );
  };

  const handleConnect = async (provider: CRMProvider, credentials: Record<string, string>) => {
    setConnecting(true);
    try {
      await api.post('/integrations/connect', { provider, credentials });
      markConnected(provider);
      toast({ title: `✓ ${CRM_LABELS[provider]} connected successfully` });
      setPendingTarget(null);
    } catch (err) {
      toast({
        title: `Failed to connect ${CRM_LABELS[provider]}`,
        description: err instanceof Error ? err.message : 'Check your credentials and try again',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  const connectedCount = connections.length;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <TopNav activeStep={1} />

      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: 56 }}>
        {/* Sidebar */}
        <aside
          className="flex flex-col border-r overflow-y-auto"
          style={{ width: 280, background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Available CRMs
            </p>
            {(['salesforce', 'hubspot', 'servicenow'] as CRMProvider[]).map((p) => (
              <Card key={p} className="p-3 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card-hover)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusDot connected={isConnected(p)} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{CRM_LABELS[p]}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {isConnected(p) ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <p className="text-[11px] mt-1.5 pl-4" style={{ color: 'var(--text-muted)' }}>
                  Draw a line from Stratum AI to connect
                </p>
              </Card>
            ))}

            <Separator className="my-2" />

            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Instructions
            </p>
            <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: 'var(--text-secondary)' }}>
              <li>Find Stratum AI in the canvas</li>
              <li>Drag from its edge handle to a CRM node</li>
              <li>Enter your credentials in the popup</li>
              <li>Repeat for each CRM you want to connect</li>
            </ol>

            {connectedCount > 0 && (
              <>
                <Separator className="my-2" />
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  Active Connections
                </p>
                {connections.map((p) => (
                  <div key={p} className="flex items-center gap-2 px-1 py-0.5">
                    <StatusDot connected size="xs" />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{CRM_LABELS[p]}</span>
                    <Badge className="ml-auto text-[10px] h-4 px-1.5 bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            fitView
            snapToGrid
            snapGrid={[10, 10]}
            style={{ background: 'var(--bg-primary)' }}
          >
            <Background variant={BackgroundVariant.Dots} color="var(--border-subtle)" gap={20} size={1} />
            <MiniMap
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              nodeColor="var(--border-subtle)"
              maskColor="rgba(0,0,0,0.2)"
            />
            <Controls />
          </ReactFlow>

          {/* Bottom bar */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t"
            style={{
              background: 'rgba(30,41,59,0.85)',
              backdropFilter: 'blur(12px)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Badge variant="outline" className="gap-1.5">
              <StatusDot connected={connectedCount > 0} size="xs" />
              {connectedCount} / 3 CRMs connected
            </Badge>
            <Button
              disabled={connectedCount === 0}
              onClick={() => navigate('/ai-setup')}
              style={{ background: '#3B82F6' }}
              className="text-white hover:opacity-90"
            >
              Continue to AI Setup →
            </Button>
          </div>
        </div>
      </div>

      {/* Salesforce Dialog */}
      <Dialog open={pendingTarget === 'salesforce'} onOpenChange={(o) => !o && setPendingTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg viewBox="0 0 60 40" width="28" height="20"><path d="M15 30 Q5 30 5 20 Q5 10 15 10 Q17 4 25 4 Q30 1 36 6 Q40 2 46 6 Q55 6 55 16 Q55 26 46 28 Q44 34 36 34 Q28 35 24 30 Z" fill="#00A1E0" /></svg>
              Connect Salesforce
            </DialogTitle>
            <DialogDescription>Enter your Salesforce Connected App credentials</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {([
              ['clientId', 'Client ID', '3MVG9...'],
              ['clientSecret', 'Client Secret', 'your client secret'],
              ['instanceUrl', 'Instance URL', 'https://yourorg.my.salesforce.com'],
              ['username', 'Username', 'you@company.com'],
              ['password', 'Password', '••••••••'],
            ] as [keyof SFCreds, string, string][]).map(([field, label, ph]) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={`sf-${field}`}>{label}</Label>
                <Input
                  id={`sf-${field}`}
                  type={field === 'password' || field === 'clientSecret' ? 'password' : 'text'}
                  placeholder={ph}
                  value={sfCreds[field]}
                  onChange={(e) => setSfCreds((p) => ({ ...p, [field]: e.target.value }))}
                />
              </div>
            ))}
            <a href="https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm" target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
              How to create a Salesforce Connected App <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTarget(null)}>Cancel</Button>
            <Button disabled={connecting} onClick={() => void handleConnect('salesforce', sfCreds as unknown as Record<string, string>)} style={{ background: '#3B82F6' }} className="text-white">
              {connecting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Connecting...</> : 'Connect Salesforce'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HubSpot Dialog */}
      <Dialog open={pendingTarget === 'hubspot'} onOpenChange={(o) => !o && setPendingTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg viewBox="0 0 48 48" width="20" height="20"><circle cx="24" cy="24" r="10" fill="#FF7A59" /><rect x="21" y="4" width="6" height="12" rx="3" fill="#FF7A59" /><rect x="21" y="32" width="6" height="12" rx="3" fill="#FF7A59" /><rect x="4" y="21" width="12" height="6" rx="3" fill="#FF7A59" /><rect x="32" y="21" width="12" height="6" rx="3" fill="#FF7A59" /></svg>
              Connect HubSpot
            </DialogTitle>
            <DialogDescription>Enter your HubSpot app credentials</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {([
              ['clientId', 'Client ID', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
              ['clientSecret', 'Client Secret', 'your client secret'],
              ['redirectUri', 'Redirect URI', 'https://yourapp.com/oauth/hubspot/callback'],
            ] as [keyof HSCreds, string, string][]).map(([field, label, ph]) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={`hs-${field}`}>{label}</Label>
                <Input id={`hs-${field}`} type={field === 'clientSecret' ? 'password' : 'text'} placeholder={ph} value={hsCreds[field]} onChange={(e) => setHsCreds((p) => ({ ...p, [field]: e.target.value }))} />
              </div>
            ))}
            <a href="https://developers.hubspot.com/docs/api/oauth-quickstart-guide" target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
              Get credentials from HubSpot Developer Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTarget(null)}>Cancel</Button>
            <Button disabled={connecting} onClick={() => void handleConnect('hubspot', hsCreds as unknown as Record<string, string>)} style={{ background: '#FF7A59' }} className="text-white">
              {connecting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Connecting...</> : 'Connect HubSpot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ServiceNow Dialog */}
      <Dialog open={pendingTarget === 'servicenow'} onOpenChange={(o) => !o && setPendingTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg viewBox="0 0 48 48" width="20" height="20"><polygon points="24,4 44,14 44,34 24,44 4,34 4,14" fill="#62D84E" /></svg>
              Connect ServiceNow
            </DialogTitle>
            <DialogDescription>Enter your ServiceNow instance credentials</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {([
              ['instanceUrl', 'Instance URL', 'https://yourinstance.service-now.com'],
              ['username', 'Username', 'admin'],
              ['password', 'Password', '••••••••'],
              ['clientId', 'Client ID (optional)', ''],
              ['clientSecret', 'Client Secret (optional)', ''],
            ] as [keyof SNowCreds, string, string][]).map(([field, label, ph]) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={`sn-${field}`}>{label}</Label>
                <Input id={`sn-${field}`} type={field === 'password' || field === 'clientSecret' ? 'password' : 'text'} placeholder={ph} value={snowCreds[field]} onChange={(e) => setSnowCreds((p) => ({ ...p, [field]: e.target.value }))} />
              </div>
            ))}
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Find your ServiceNow instance URL in your admin console</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTarget(null)}>Cancel</Button>
            <Button disabled={connecting} onClick={() => void handleConnect('servicenow', snowCreds as unknown as Record<string, string>)} style={{ background: '#62D84E' }} className="text-white">
              {connecting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Connecting...</> : 'Connect ServiceNow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
