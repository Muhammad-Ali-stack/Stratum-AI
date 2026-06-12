import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Eye, BarChart3, Check, X, MessageSquare, GitBranch, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StratumLogo from '@/components/shared/StratumLogo';
import ThemeToggle from '@/components/ThemeToggle';

const features = [
  {
    icon: Zap,
    title: 'Any AI, Any CRM',
    description:
      'Connect Salesforce, HubSpot, or ServiceNow. Choose Groq, Gemini, or Azure OpenAI as your brain. Mix and match freely.',
    color: '#3B82F6',
  },
  {
    icon: BarChart3,
    title: 'Dramatically Cheaper',
    description:
      'Groq and Gemini free tiers cover most usage. Stop paying AgentForce enterprise pricing for basic queries.',
    color: '#10B981',
  },
  {
    icon: Shield,
    title: 'Connect in 2 Minutes',
    description:
      'OAuth 2.0 for Salesforce & HubSpot. API key for ServiceNow. No admin setup, no package installs, no IT tickets.',
    color: '#F97316',
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    description:
      'Every response shows which CRM API was called, what query ran, and which AI model answered. No black boxes.',
    color: '#3B82F6',
  },
];

const comparisonData = [
  { feature: 'AI model choice', stratum: true, agentforce: false },
  { feature: 'HubSpot + ServiceNow support', stratum: true, agentforce: false },
  { feature: 'Free tier available', stratum: true, agentforce: false },
  { feature: 'Setup in under 5 minutes', stratum: true, agentforce: false },
  { feature: 'API call transparency', stratum: true, agentforce: false },
  { feature: 'Read CRM records', stratum: true, agentforce: true },
  { feature: 'Create records via chat', stratum: true, agentforce: true },
  { feature: 'Update records via chat', stratum: true, agentforce: true },
  { feature: 'Summarize pipeline', stratum: true, agentforce: true },
];

const exampleQueries = [
  'Show open opportunities closing this quarter',
  'Create a lead for Sarah Chen at Anthropic',
  'Summarize all high-priority HubSpot tickets',
  'How many ServiceNow cases are open?',
  'Mark TechFlow opportunity as Closed Won',
  'Find leads created in the last 30 days',
];

const appPages = [
  { icon: MessageSquare, label: 'AI Chat', color: '#3B82F6', desc: 'Ask anything in plain English' },
  { icon: LayoutDashboard, label: 'Dashboard', color: '#10B981', desc: 'Live CRM KPI analytics' },
  { icon: GitBranch, label: 'Pipeline', color: '#F97316', desc: 'Visual deal-flow canvas' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <StratumLogo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-white" style={{ background: '#3B82F6' }}>
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative bg-mesh overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto relative z-10"
        >
          <Badge variant="secondary" className="mb-6 text-xs tracking-wider uppercase">
            Intelligent CRM Platform
          </Badge>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
            Chat with your
            <br />
            <span style={{ color: '#3B82F6' }}>CRM data.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
            Connect Salesforce, HubSpot, or ServiceNow. Ask questions in plain English.
            Create, update, and summarize records — no API knowledge required.
          </p>
          <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
            {['Salesforce', 'HubSpot', 'ServiceNow'].map((crm, i) => (
              <Badge
                key={crm}
                variant="outline"
                className="gap-1.5 text-xs"
                style={{ borderColor: ['#00A1E0', '#FF7A59', '#62D84E'][i] + '40', color: ['#00A1E0', '#FF7A59', '#62D84E'][i] }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ['#00A1E0', '#FF7A59', '#62D84E'][i] }} />
                {crm}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register">
              <Button size="lg" className="gap-2 h-12 px-8 text-base text-white font-semibold" style={{ background: '#3B82F6' }}>
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                Sign in
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* App preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-20 max-w-2xl mx-auto relative z-10"
        >
          <div
            className="rounded-2xl border p-4 shadow-2xl"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-3 h-3 rounded-full bg-destructive/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs text-muted-foreground">Stratum AI Chat</span>
            </div>
            <div className="space-y-3 text-left">
              {[
                { role: 'user', text: 'Show open opportunities closing this quarter' },
                { role: 'assistant', text: 'Found 12 open opportunities totaling $847,500. Top deals: Acme Corp ($120k, Proposal), TechFlow ($98k, Negotiation)...' },
                { role: 'user', text: 'Create a lead for Sarah Chen at Anthropic' },
                { role: 'assistant', text: 'Done ✓ Lead created for Sarah Chen at Anthropic in Salesforce. Would you like to set a follow-up task?' },
              ].map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: 'linear-gradient(135deg,#3B82F6,#10B981)' }}
                    >
                      S
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${
                      msg.role === 'user' ? 'text-white' : 'bg-muted text-foreground'
                    }`}
                    style={msg.role === 'user' ? { background: '#3B82F6' } : {}}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* App pages overview */}
      <section className="py-16 px-6 border-y border-border/40" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">Included in every plan</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Everything you need in one platform</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {appPages.map(({ icon: Icon, label, color, desc }) => (
              <Card key={label} className="border text-center py-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
                <CardContent className="p-0 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: color + '18' }}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div>
                    <p className="font-semibold font-display" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Why Stratum AI over AgentForce?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Enterprise features without enterprise pricing or setup complexity.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border-subtle)' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: 'var(--bg-card)' }}>
                  <th className="text-left py-4 px-6 text-muted-foreground font-medium text-sm border-b border-border">Feature</th>
                  <th className="py-4 px-6 text-center border-b border-border">
                    <StratumLogo size="sm" iconOnly />
                  </th>
                  <th className="py-4 px-6 text-center border-b border-border">
                    <span className="font-bold text-sm text-muted-foreground">AgentForce</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-muted/20 transition-colors" style={{ background: i % 2 === 0 ? undefined : 'var(--bg-card)' }}>
                    <td className="py-3.5 px-6 text-sm">{row.feature}</td>
                    <td className="py-3.5 px-6 text-center">
                      {row.stratum ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-destructive/60 mx-auto" />}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {row.agentforce ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-destructive/60 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Example queries */}
      <section className="py-24 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">What you can ask</h2>
            <p className="text-muted-foreground text-lg">Plain English. Real CRM actions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exampleQueries.map((query, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <Card className="hover:border-primary/40 transition-colors cursor-default" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: '#3B82F6' }} />
                    <p className="text-sm text-muted-foreground leading-relaxed">{query}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Card className="h-full" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                    <CardHeader className="pb-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: feat.color + '18' }}>
                        <Icon className="w-5 h-5" style={{ color: feat.color }} />
                      </div>
                      <CardTitle className="font-display text-lg">{feat.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">{feat.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-mesh">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-6">Ready to talk to your CRM?</h2>
          <p className="text-muted-foreground text-lg mb-10">Connect your CRM and start chatting in under 2 minutes.</p>
          <Link to="/register">
            <Button size="lg" className="gap-2 h-12 px-10 text-base text-white font-semibold" style={{ background: 'linear-gradient(135deg,#3B82F6,#F97316)' }}>
              Get started for free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <StratumLogo size="sm" />
          <p className="text-sm text-muted-foreground">AI-powered CRM assistant for enterprise sales teams.</p>
          <div className="flex items-center gap-4">
            <Link to="/login"><Button variant="ghost" size="sm" className="text-muted-foreground">Sign in</Button></Link>
            <Link to="/register"><Button size="sm" className="text-white" style={{ background: '#3B82F6' }}>Get started</Button></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
