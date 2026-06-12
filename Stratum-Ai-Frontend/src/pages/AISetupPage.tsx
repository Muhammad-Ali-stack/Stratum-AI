import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, ExternalLink, ArrowLeft } from 'lucide-react';
import TopNav from '@/components/layout/TopNav';
import StratumLogo from '@/components/shared/StratumLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/useToast';
import type { AIProvider } from '@/types';

interface ProviderOption {
  id: AIProvider;
  label: string;
  sublabel: string;
  badge: string;
  placeholder: string;
  helpText: string;
  helpUrl: string;
  icon: React.ReactNode;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'groq',
    label: 'Groq',
    sublabel: 'Ultra-fast LLaMA inference — best for speed',
    badge: 'Free tier available',
    placeholder: 'gsk_...',
    helpText: 'Get your free API key at console.groq.com/keys',
    helpUrl: 'https://console.groq.com/keys',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28">
        <polygon points="13,2 4,14 12,14 11,22 20,10 12,10" fill="#FACC15" />
      </svg>
    ),
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    sublabel: 'Powerful multimodal AI from Google DeepMind',
    badge: 'Best for reasoning',
    placeholder: 'AIza...',
    helpText: 'Get your key at aistudio.google.com/app/apikey',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28">
        <defs>
          <linearGradient id="gem-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="100%" stopColor="#EA4335" />
          </linearGradient>
        </defs>
        <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" fill="url(#gem-g)" />
      </svg>
    ),
  },
  {
    id: 'copilot',
    label: 'Copilot / Azure OpenAI',
    sublabel: 'GitHub Copilot or Azure-hosted OpenAI models',
    badge: 'Enterprise ready',
    placeholder: 'Your Azure OpenAI key or GitHub token',
    helpText: 'Find your Azure OpenAI key in Azure Portal → Cognitive Services',
    helpUrl: 'https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.CognitiveServices%2Faccounts',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z" fill="currentColor" className="text-muted-foreground" />
      </svg>
    ),
  },
];

export default function AISetupPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AIProvider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const selectedProvider = PROVIDERS.find((p) => p.id === selected);

  const handleSave = () => {
    if (!selected) { setError('Please select an AI provider'); return; }
    if (!apiKey.trim()) { setError('Please enter your API key'); return; }
    setError('');
    try {
      sessionStorage.setItem('stratum-ai-config', JSON.stringify({ provider: selected, apiKey: apiKey.trim() }));
      navigate('/ai-connect');
    } catch {
      toast({ title: 'Failed to save config', variant: 'destructive' });
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-mesh" style={{ paddingTop: 56 }}>
        <TopNav activeStep={2} />

        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <StratumLogo size="sm" iconOnly />
            <div>
              <h1 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Configure AI Provider</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Choose how Stratum AI thinks</p>
            </div>
          </div>

          <Alert className="mb-6 border-blue-500/30 bg-blue-500/5">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-sm font-semibold">Your key stays private</AlertTitle>
            <AlertDescription className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              API keys are stored only in your browser session memory and sent directly to your chosen AI provider.
              Stratum AI servers never receive or store your key. Keys are cleared when you close this tab.
              For teams, set <code className="bg-muted px-1 rounded text-[10px]">VITE_AI_API_KEY</code> in your .env file instead.
            </AlertDescription>
          </Alert>

          <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <CardHeader className="pb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Choose a provider</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelected(p.id); setError(''); }}
                  className="w-full text-left rounded-xl p-3 border transition-all"
                  style={{
                    borderColor: selected === p.id ? '#3B82F6' : 'var(--border-subtle)',
                    background: selected === p.id ? 'rgba(59,130,246,0.05)' : 'transparent',
                    borderWidth: selected === p.id ? 2 : 1,
                    outline: 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {p.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.label}</span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-green-500 border-green-500/30">{p.badge}</Badge>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.sublabel}</p>
                    </div>
                    {selected === p.id && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {selected && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="api-key" className="text-sm">API Key</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground cursor-help border border-border rounded-full w-4 h-4 flex items-center justify-center">?</span>
                      </TooltipTrigger>
                      <TooltipContent>This key authenticates with your chosen AI provider</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showKey ? 'text' : 'password'}
                      placeholder={selectedProvider?.placeholder ?? ''}
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {selectedProvider && (
                    <a href={selectedProvider.helpUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                      {selectedProvider.helpText} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
              )}

              <Button
                className="w-full mt-2 text-white"
                style={{ background: '#3B82F6' }}
                onClick={handleSave}
              >
                Save &amp; Continue →
              </Button>

              <button
                type="button"
                onClick={() => navigate('/connect')}
                className="w-full text-xs text-center hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                <ArrowLeft className="w-3 h-3 inline mr-1" />
                Back to CRM connections
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
