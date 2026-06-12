import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, RefreshCw, ExternalLink, MessageSquare, ChevronUp, ChevronDown,
  Users, Building2, Briefcase, UserPlus, Filter, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import AppShell from '@/components/layout/AppShell';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import { useRecords } from '@/hooks/useRecords';
import type { RecordObjectType, CRMRecord } from '@/hooks/useRecords';
import { useQueryClient } from '@tanstack/react-query';
import type { CRMProvider } from '@/types';

const CRM_COLORS: Record<CRMProvider, { bg: string; text: string; dot: string }> = {
  salesforce: { bg: '#00A1E010', text: '#00A1E0', dot: '#00A1E0' },
  hubspot:    { bg: '#FF7A5910', text: '#FF7A59', dot: '#FF7A59' },
  servicenow: { bg: '#62D84E10', text: '#3BAF31', dot: '#62D84E' },
};

const STAGE_COLORS: Record<string, string> = {
  'Closed Won':              '#10B981',
  'Closed Lost':             '#EF4444',
  'Negotiation/Review':      '#F97316',
  'Proposal/Price Quote':    '#3B82F6',
  'Value Proposition':       '#6366F1',
  'Id. Decision Makers':     '#8B5CF6',
  'Qualification':           '#F59E0B',
  'Needs Analysis':          '#EC4899',
};

const STATUS_COLORS: Record<string, string> = {
  'New':       '#3B82F6',
  'Working':   '#F97316',
  'Nurturing': '#8B5CF6',
  'Converted': '#10B981',
  'Unqualified':'#EF4444',
};

const TABS: { value: RecordObjectType; label: string; icon: React.ElementType }[] = [
  { value: 'leads',         label: 'Leads',         icon: UserPlus    },
  { value: 'contacts',      label: 'Contacts',      icon: Users       },
  { value: 'accounts',      label: 'Accounts',      icon: Building2   },
  { value: 'opportunities', label: 'Opportunities', icon: Briefcase   },
];

type SortDir = 'asc' | 'desc';

function formatRevenue(v?: number) {
  if (!v) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function formatDate(s?: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function avatarColor(name: string) {
  const colors = ['#3B82F6','#8B5CF6','#F97316','#10B981','#EC4899','#6366F1','#F59E0B','#14B8A6'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return colors[h % colors.length]!;
}

function CRMBadge({ provider }: { provider: CRMProvider }) {
  const c = CRM_COLORS[provider];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.dot}20` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: c.dot }} />
      {provider === 'salesforce' ? 'SF' : provider === 'hubspot' ? 'HS' : 'SN'}
    </span>
  );
}

function ColHeader({
  label, sortKey, currentSort, dir, onSort,
}: {
  label: string; sortKey: string; currentSort: string; dir: SortDir; onSort: (k: string) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <button
      className="flex items-center gap-1 group text-left"
      onClick={() => onSort(sortKey)}
    >
      <span className={`text-[11px] font-semibold uppercase tracking-wider transition-colors ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
        {label}
      </span>
      <span className="text-muted-foreground opacity-50 group-hover:opacity-100">
        {active
          ? dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          : <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-60" />}
      </span>
    </button>
  );
}

function RecordAvatar({ name, size = 8 }: { name: string; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-semibold text-[11px] shrink-0`}
      style={{ background: avatarColor(name), fontSize: size <= 7 ? 10 : 12 }}
    >
      {initials(name)}
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="h-4 w-full" style={{ opacity: 1 - i * 0.12 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function RecordsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<RecordObjectType>('leads');
  const [search, setSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState<CRMProvider | null>(null);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const { data, isLoading } = useRecords(tab);

  const records = useMemo(() => {
    let list = data?.records ?? [];
    if (filterProvider) list = list.filter((r) => r.provider === filterProvider);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.company?.toLowerCase().includes(q) ||
        r.accountName?.toLowerCase().includes(q) ||
        r.stage?.toLowerCase().includes(q) ||
        r.industry?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av: unknown, bv: unknown;
      switch (sortKey) {
        case 'name':       av = a.name;           bv = b.name;           break;
        case 'company':    av = a.company ?? a.accountName ?? ''; bv = b.company ?? b.accountName ?? ''; break;
        case 'amount':     av = a.amount ?? 0;    bv = b.amount ?? 0;    break;
        case 'revenue':    av = a.annualRevenue ?? 0; bv = b.annualRevenue ?? 0; break;
        case 'employees':  av = a.numberOfEmployees ?? 0; bv = b.numberOfEmployees ?? 0; break;
        case 'probability':av = a.probability ?? 0; bv = b.probability ?? 0; break;
        case 'closeDate':  av = a.closeDate ?? ''; bv = b.closeDate ?? ''; break;
        case 'created':    av = a.createdDate ?? ''; bv = b.createdDate ?? ''; break;
        case 'activity':   av = a.lastActivityDate ?? ''; bv = b.lastActivityDate ?? ''; break;
        default:           av = ''; bv = '';
      }
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [data, search, filterProvider, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleAskAI = (rec: CRMRecord) => {
    const queries: Record<RecordObjectType, string> = {
      leads:         `Summarize the lead ${rec.name} from ${rec.company ?? 'their company'} and suggest next steps`,
      contacts:      `What's the latest activity for contact ${rec.name} at ${rec.accountName}?`,
      accounts:      `Give me a summary of the account ${rec.name} and any open opportunities`,
      opportunities: `Summarize the opportunity "${rec.name}" and recommend how to advance it`,
    };
    navigate('/chat', { state: { prefillMessage: queries[tab] } });
  };

  const providers: CRMProvider[] = ['salesforce', 'hubspot', 'servicenow'];
  const providerCounts = useMemo(() => {
    const base = data?.records ?? [];
    return Object.fromEntries(providers.map((p) => [p, base.filter((r) => r.provider === p).length])) as Record<CRMProvider, number>;
  }, [data]);

  const totalCount = data?.total ?? records.length;

  return (
    <TooltipProvider>
      <AppShell>
        <div className="flex flex-col h-full overflow-hidden">

          {/* Page header */}
          <header
            className="flex items-center justify-between px-6 h-14 border-b shrink-0"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-3">
              <h1 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>Records</h1>
              {!isLoading && (
                <Badge variant="secondary" className="text-xs">{totalCount}</Badge>
              )}
              {!data?.connected && !isLoading && (
                <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">Demo data</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-52"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <ThemeToggle />
              <NotificationBell />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => void qc.invalidateQueries({ queryKey: ['records', tab] })}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Toolbar */}
          <div
            className="flex items-center gap-3 px-6 py-2.5 border-b shrink-0 flex-wrap"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <Tabs value={tab} onValueChange={(v) => { setTab(v as RecordObjectType); setSearch(''); setSortKey('name'); setSortDir('asc'); }}>
              <TabsList className="h-8 gap-0.5">
                {TABS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger key={value} value={value} className="text-xs h-7 gap-1.5 px-3">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {providers.map((p) => {
                const c = CRM_COLORS[p];
                const active = filterProvider === p;
                return (
                  <button
                    key={p}
                    onClick={() => setFilterProvider(active ? null : p)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
                    style={active
                      ? { background: c.bg, color: c.text, borderColor: c.dot + '60' }
                      : { background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
                    {p === 'salesforce' ? 'Salesforce' : p === 'hubspot' ? 'HubSpot' : 'ServiceNow'}
                    <span className="opacity-60">({providerCounts[p]})</span>
                  </button>
                );
              })}
              {filterProvider && (
                <button onClick={() => setFilterProvider(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: 'var(--bg-primary)' }}>
            <div className="min-w-[640px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                    {tab === 'leads' && <>
                      <th className="text-left px-4 py-3 w-[260px]"><ColHeader label="Name" sortKey="name" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3"><ColHeader label="Company" sortKey="company" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3"><ColHeader label="Email" sortKey="name" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Source</th>
                      <th className="text-left px-4 py-3"><ColHeader label="Created" sortKey="created" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-right px-4 py-3 w-24" />
                    </>}
                    {tab === 'contacts' && <>
                      <th className="text-left px-4 py-3 w-[240px]"><ColHeader label="Name" sortKey="name" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3">Account</th>
                      <th className="text-left px-4 py-3">Title</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3"><ColHeader label="Last Activity" sortKey="activity" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3">CRM</th>
                      <th className="text-right px-4 py-3 w-24" />
                    </>}
                    {tab === 'accounts' && <>
                      <th className="text-left px-4 py-3 w-[240px]"><ColHeader label="Name" sortKey="name" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3">Industry</th>
                      <th className="text-left px-4 py-3"><ColHeader label="Revenue" sortKey="revenue" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3"><ColHeader label="Employees" sortKey="employees" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3">Website</th>
                      <th className="text-left px-4 py-3">CRM</th>
                      <th className="text-right px-4 py-3 w-24" />
                    </>}
                    {tab === 'opportunities' && <>
                      <th className="text-left px-4 py-3 w-[260px]"><ColHeader label="Name" sortKey="name" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3">Account</th>
                      <th className="text-left px-4 py-3"><ColHeader label="Amount" sortKey="amount" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3">Stage</th>
                      <th className="text-left px-4 py-3"><ColHeader label="Close Date" sortKey="closeDate" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-left px-4 py-3"><ColHeader label="Prob." sortKey="probability" currentSort={sortKey} dir={sortDir} onSort={handleSort} /></th>
                      <th className="text-right px-4 py-3 w-24" />
                    </>}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonRows cols={tab === 'leads' || tab === 'opportunities' ? 7 : 7} />
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                          <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)' }}>
                            {(() => { const { icon: Icon } = TABS.find(t => t.value === tab)!; return <Icon className="w-7 h-7 text-muted-foreground" />; })()}
                          </div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No {tab} found</p>
                          <p className="text-xs text-muted-foreground">
                            {search || filterProvider ? 'Try adjusting your search or filters.' : 'Connect a CRM to see your records here.'}
                          </p>
                          {(search || filterProvider) && (
                            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterProvider(null); }} className="text-xs gap-1">
                              <X className="w-3 h-3" />
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                      {records.map((rec, i) => (
                        <motion.tr
                          key={rec.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18, delay: i * 0.03 }}
                          className="border-b group hover:bg-muted/30 transition-colors"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          {tab === 'leads' && <>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <RecordAvatar name={rec.name} />
                                <div>
                                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{rec.name}</p>
                                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{rec.ownedBy}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{rec.company ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{rec.email ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (STATUS_COLORS[rec.status ?? ''] ?? '#64748B') + '18', color: STATUS_COLORS[rec.status ?? ''] ?? '#64748B' }}>
                                {rec.status ?? '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{rec.leadSource ?? '—'}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(rec.createdDate)}</td>
                          </>}

                          {tab === 'contacts' && <>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <RecordAvatar name={rec.name} />
                                <div>
                                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{rec.name}</p>
                                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{rec.phone ?? ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{rec.accountName ?? '—'}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{rec.title ?? '—'}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{rec.email ?? '—'}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(rec.lastActivityDate)}</td>
                            <td className="px-4 py-3"><CRMBadge provider={rec.provider} /></td>
                          </>}

                          {tab === 'accounts' && <>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <RecordAvatar name={rec.name} />
                                <div>
                                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{rec.name}</p>
                                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{rec.ownedBy}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{rec.industry ?? '—'}</td>
                            <td className="px-4 py-3 text-sm font-medium" style={{ color: '#10B981' }}>{formatRevenue(rec.annualRevenue)}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{rec.numberOfEmployees?.toLocaleString() ?? '—'}</td>
                            <td className="px-4 py-3">
                              {rec.website ? (
                                <a href={`https://${rec.website}`} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:underline" style={{ color: '#3B82F6' }}>
                                  {rec.website}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3"><CRMBadge provider={rec.provider} /></td>
                          </>}

                          {tab === 'opportunities' && <>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <RecordAvatar name={rec.name} />
                                <div>
                                  <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{rec.name}</p>
                                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{rec.ownedBy}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{rec.accountName ?? '—'}</td>
                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#3B82F6' }}>{formatRevenue(rec.amount)}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (STAGE_COLORS[rec.stage ?? ''] ?? '#64748B') + '18', color: STAGE_COLORS[rec.stage ?? ''] ?? '#64748B' }}>
                                {rec.stage ?? '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(rec.closeDate)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${rec.probability ?? 0}%`, background: rec.probability === 100 ? '#10B981' : rec.probability! >= 70 ? '#3B82F6' : rec.probability! >= 40 ? '#F97316' : '#EF4444' }} />
                                </div>
                                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{rec.probability ?? 0}%</span>
                              </div>
                            </td>
                          </>}

                          {/* Row actions — visible on hover */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleAskAI(rec)}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ask AI about this record</TooltipContent>
                              </Tooltip>
                              {rec.crmUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                      onClick={() => window.open(rec.crmUrl, '_blank')}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Open in CRM</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            {!isLoading && records.length > 0 && (
              <div className="px-6 py-3 text-xs text-muted-foreground border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                Showing {records.length} of {totalCount} {tab}
                {(search || filterProvider) && ' · filtered'}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </TooltipProvider>
  );
}
