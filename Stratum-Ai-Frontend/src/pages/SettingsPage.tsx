import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Loader2, CheckCircle2, XCircle, ExternalLink, Mail, Zap, Link2, Unlink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useMe } from '@/hooks/useAuth';
import AppShell from '@/components/layout/AppShell';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import { useSalesforceStatus, useConnectSalesforce, useDisconnectSalesforce } from '@/hooks/useSalesforce';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useConnections } from '@/contexts/ConnectionContext';
import { toast } from '@/hooks/useToast';
import { CRM_LABELS } from '@/types';
import type { CRMProvider } from '@/types';

const MODEL_LABELS: Record<string, string> = {
  'llama3-70b-8192': 'Llama 3 70B (Recommended)',
  'llama3-8b-8192': 'Llama 3 8B (Fastest)',
  'mixtral-8x7b-32768': 'Mixtral 8x7B (Long context)',
  'gemma2-9b-it': 'Gemma 2 9B',
};

const CRM_COLORS: Record<CRMProvider, string> = {
  salesforce: '#00A1E0',
  hubspot: '#FF7A59',
  servicenow: '#62D84E',
};

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const { data: me } = useMe();
  const { data: sfStatus, isLoading: sfLoading } = useSalesforceStatus();
  const { data: settingsData, isLoading: settingsLoading } = useSettings();
  const connectMutation = useConnectSalesforce();
  const disconnectMutation = useDisconnectSalesforce();
  const updateSettingsMutation = useUpdateSettings();
  const { connections, removeConnection } = useConnections();

  const aiConfig = (() => {
    try {
      const raw = sessionStorage.getItem('stratum-ai-config');
      return raw ? JSON.parse(raw) as { provider: string; apiKey: string } : null;
    } catch { return null; }
  })();

  useEffect(() => {
    if (searchParams.get('sf_connected') === 'true') {
      toast({ title: 'Salesforce connected', description: 'Your org is now linked to Stratum AI.' });
    }
    if (searchParams.get('sf_error') === 'true') {
      toast({ title: 'Connection failed', description: 'Please try again.', variant: 'destructive' });
    }
  }, [searchParams]);

  const handleModelChange = async (model: string) => {
    try {
      await updateSettingsMutation.mutateAsync({ preferred_ai_model: model });
      toast({ title: 'AI model updated' });
    } catch {
      toast({ title: 'Failed to update model', variant: 'destructive' });
    }
  };

  const handleTransparencyToggle = async (value: boolean) => {
    try { await updateSettingsMutation.mutateAsync({ show_api_transparency: value }); }
    catch { toast({ title: 'Failed to update setting', variant: 'destructive' }); }
  };

  const handleDigestToggle = async (value: boolean) => {
    try {
      await updateSettingsMutation.mutateAsync({ notify_daily_digest: value } as never);
      toast({ title: value ? 'Daily digest enabled' : 'Daily digest disabled' });
    } catch { toast({ title: 'Failed to update setting', variant: 'destructive' }); }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 h-14 border-b shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <h1 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: 'var(--bg-primary)' }}>
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

            {/* Account */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <CardHeader>
                  <CardTitle className="font-display">Account</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white shrink-0" style={{ background: '#3B82F6' }}>
                      {me?.email?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{me?.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Member since {me?.created_at ? new Date(me.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CRM Connections */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
              <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <CardHeader>
                  <CardTitle className="font-display">CRM Connections</CardTitle>
                  <CardDescription>Manage your connected CRM platforms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(['salesforce', 'hubspot', 'servicenow'] as CRMProvider[]).map((p) => {
                    const connected = connections.includes(p);
                    return (
                      <div key={p} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: connected ? CRM_COLORS[p] + '30' : 'var(--border-subtle)', background: connected ? CRM_COLORS[p] + '08' : 'transparent' }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: connected ? '#10B981' : 'var(--border-subtle)' }} />
                        <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{CRM_LABELS[p]}</span>
                        {connected ? (
                          <div className="flex items-center gap-2">
                            <Badge className="text-[10px] h-5 px-1.5 bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeConnection(p)}>
                              <Unlink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5" onClick={() => void (window.location.href = '/connect')}>
                            <Link2 className="w-3 h-3" />
                            Connect
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {connections.length === 0 && (
                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs border-dashed" onClick={() => void (window.location.href = '/connect')}>
                      <Zap className="w-3.5 h-3.5" />
                      Go to Integration Setup
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Config */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <CardHeader>
                  <CardTitle className="font-display">AI Configuration</CardTitle>
                  <CardDescription>Your active AI provider and session key</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiConfig ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: '#F97316' + '30', background: '#F97316' + '08' }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#10B981' }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {aiConfig.provider.charAt(0).toUpperCase() + aiConfig.provider.slice(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">Session key active · {aiConfig.apiKey.slice(0, 8)}•••</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => void (window.location.href = '/ai-setup')}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
                      <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-sm text-muted-foreground flex-1">No AI provider configured for this session</p>
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5" onClick={() => void (window.location.href = '/ai-setup')}>
                        <Zap className="w-3 h-3" />
                        Setup
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Salesforce OAuth (legacy) */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <CardHeader>
                  <CardTitle className="font-display">Salesforce OAuth</CardTitle>
                  <CardDescription>Legacy Salesforce OAuth connection (for read/write API access)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sfLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking connection...
                    </div>
                  ) : sfStatus?.connected ? (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Connected</p>
                          {sfStatus.connection?.instance_url && (
                            <a href={sfStatus.connection.instance_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 truncate">
                              {sfStatus.connection.instance_url}
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">Active</Badge>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                            Disconnect Salesforce
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect Salesforce?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove your Salesforce OAuth connection. You can reconnect at any time.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => disconnectMutation.mutate()} className="bg-destructive text-destructive-foreground">Disconnect</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                        <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                        <p className="text-sm text-muted-foreground">No Salesforce org connected via OAuth</p>
                      </div>
                      <Button onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending} className="gap-2 text-white" style={{ background: '#00A1E0' }}>
                        {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Connect via OAuth
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Model */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <CardHeader>
                  <CardTitle className="font-display">AI Model</CardTitle>
                  <CardDescription>Choose which model powers your CRM conversations.</CardDescription>
                </CardHeader>
                <CardContent>
                  {settingsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading settings...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="ai-model">Primary AI Model</Label>
                      <Select
                        value={settingsData?.settings.preferred_ai_model ?? 'llama3-70b-8192'}
                        onValueChange={(v) => void handleModelChange(v)}
                        disabled={updateSettingsMutation.isPending}
                      >
                        <SelectTrigger id="ai-model" className="w-full md:w-72">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {(settingsData?.availableModels ?? []).map((model) => (
                            <SelectItem key={model} value={model}>{MODEL_LABELS[model] ?? model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Groq models are blazing fast. Gemini 1.5 Flash is used as automatic fallback.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Transparency */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <CardHeader>
                  <CardTitle className="font-display">Transparency</CardTitle>
                  <CardDescription>Control what metadata is shown alongside AI responses.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="transparency-toggle" className="text-sm font-medium">Show API transparency</Label>
                      <p className="text-xs text-muted-foreground">Display which CRM object, operation, and AI model was used per response.</p>
                    </div>
                    <Switch
                      id="transparency-toggle"
                      checked={settingsData?.settings.show_api_transparency ?? true}
                      onCheckedChange={(v) => void handleTransparencyToggle(v)}
                      disabled={updateSettingsMutation.isPending || settingsLoading}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="font-display">Notifications</CardTitle>
                  </div>
                  <CardDescription>Receive a daily email digest of your CRM pipeline, closing opportunities, and overdue tasks.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="digest-toggle" className="text-sm font-medium">Daily digest email</Label>
                      <p className="text-xs text-muted-foreground">Sent at 8 AM UTC. Requires SMTP configured.</p>
                    </div>
                    <Switch
                      id="digest-toggle"
                      checked={settingsData?.settings.notify_daily_digest ?? false}
                      onCheckedChange={(v) => void handleDigestToggle(v)}
                      disabled={updateSettingsMutation.isPending || settingsLoading}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </main>
      </div>
    </AppShell>
  );
}
