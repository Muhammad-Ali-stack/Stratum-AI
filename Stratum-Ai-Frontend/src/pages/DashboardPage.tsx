import { useNavigate, Link } from 'react-router-dom';
import {
  RefreshCw,
  TrendingUp,
  Users,
  Target,
  Trophy,
  AlertCircle,
  Loader2,
  CloudOff,
  Calendar,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import AppShell from '@/components/layout/AppShell';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import DashboardSearch from '@/components/DashboardSearch';
import { useDashboardStats, DASHBOARD_QUERY_KEY } from '@/hooks/useDashboard';
import { useQueryClient } from '@tanstack/react-query';
import type { DashboardStats } from '../types/shared';

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const PRIORITY_COLORS: Record<string, string> = {
  High: '#EF4444',
  Normal: '#3B82F6',
  Low: '#94A3B8',
};

const STAGE_COLORS = ['#3B82F6','#6366F1','#8B5CF6','#A855F7','#D946EF','#EC4899','#F97316','#F59E0B','#10B981'];

function StatCard({
  title, value, icon: Icon, sub, loading, color = '#3B82F6',
}: {
  title: string; value: string; icon: React.ElementType; sub?: string; loading?: boolean; color?: string;
}) {
  return (
    <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-28 mt-1" />
            ) : (
              <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
            )}
            {sub && !loading && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
          </div>
          <div className="p-2 rounded-xl" style={{ background: color + '18' }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, dataUpdatedAt } = useDashboardStats();
  const qc = useQueryClient();

  const isConnected = data && 'connected' in data && data.connected === true;
  const stats = isConnected ? (data as DashboardStats) : null;
  const maxStageValue = stats ? Math.max(...stats.byStage.map((s) => s.value), 1) : 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

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
              <h1 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
              {dataUpdatedAt > 0 && (
                <span className="text-xs hidden lg:block" style={{ color: 'var(--text-muted)' }}>
                  Updated {timeAgo(new Date(dataUpdatedAt).toISOString())}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <DashboardSearch />
              </div>
              <ThemeToggle />
              <NotificationBell />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => void qc.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6" style={{ background: 'var(--bg-primary)' }}>

            {error && (
              <div className="mb-6 flex items-center gap-2 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error.message}
              </div>
            )}

            {!isLoading && data && !isConnected && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-card)' }}>
                  <CloudOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-display text-lg font-semibold">No CRM connected</p>
                  <p className="text-sm text-muted-foreground mt-1">Connect a CRM in the integration flow to see your data here.</p>
                </div>
                <Button onClick={() => navigate('/connect')} style={{ background: '#3B82F6' }} className="text-white">
                  Connect CRM
                </Button>
              </div>
            )}

            {isLoading && !stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                      <CardContent className="p-5">
                        <Skeleton className="h-4 w-20 mb-3" />
                        <Skeleton className="h-8 w-28" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {stats && (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-7xl">

                {/* KPI cards */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Pipeline" value={formatCurrency(stats.pipelineValue)} icon={TrendingUp} sub={`${stats.openOpportunities} open opportunities`} color="#3B82F6" />
                  <StatCard title="Open Opportunities" value={stats.openOpportunities.toString()} icon={Target} sub={`Across ${stats.byStage.length} stage${stats.byStage.length !== 1 ? 's' : ''}`} color="#8B5CF6" />
                  <StatCard title="New Leads (MTD)" value={stats.newLeadsThisMonth.toString()} icon={Users} sub="This calendar month" color="#10B981" />
                  <StatCard
                    title="Win Rate"
                    value={stats.winRate !== null ? `${stats.winRate}%` : '—'}
                    icon={Trophy}
                    sub="Closed won vs lost (QTD)"
                    color={stats.winRate === null ? '#64748B' : stats.winRate >= 60 ? '#10B981' : stats.winRate >= 40 ? '#F59E0B' : '#EF4444'}
                  />
                </motion.div>

                {/* Pipeline by Stage + Closing Soon */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold font-display" style={{ color: 'var(--text-primary)' }}>Pipeline by Stage</CardTitle>
                      <CardDescription className="text-xs" style={{ color: 'var(--text-muted)' }}>Open opportunities — value and count per stage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {stats.byStage.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No open opportunities</p>
                      ) : (
                        stats.byStage.map((row, idx) => {
                          const pct = Math.round((row.value / maxStageValue) * 100);
                          const color = STAGE_COLORS[idx % STAGE_COLORS.length];
                          return (
                            <div key={row.stage} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{row.stage}</span>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span style={{ color: 'var(--text-muted)' }}>{row.count} opp{row.count !== 1 ? 's' : ''}</span>
                                  <span className="font-semibold w-16 text-right" style={{ color: 'var(--text-primary)' }}>{formatCurrency(row.value)}</span>
                                </div>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>

                  {/* Closing Soon */}
                  <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold font-display flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                        Closing This Month
                      </CardTitle>
                      <CardDescription className="text-xs" style={{ color: 'var(--text-muted)' }}>Opportunities with close date this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats.closingSoon.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">None this month</p>
                      ) : (
                        <div className="space-y-3">
                          {stats.closingSoon.map((opp) => (
                            <div key={opp.id} className="flex flex-col gap-0.5 py-2 border-b border-border last:border-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium leading-tight truncate" style={{ color: 'var(--text-primary)' }}>{opp.name}</p>
                                <span className="text-xs font-semibold shrink-0" style={{ color: '#3B82F6' }}>
                                  {opp.amount !== null ? formatCurrency(opp.amount) : '—'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {opp.account && <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{opp.account}</span>}
                                <span className="text-[11px] ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>{formatDate(opp.closeDate)}</span>
                              </div>
                              <Badge variant="outline" className="self-start text-[10px] h-4 px-1.5 mt-0.5">{opp.stage}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Recent Activity + Cases */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold font-display flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Activity className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                        Recent Activity
                      </CardTitle>
                      <CardDescription className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 10 tasks in your org</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats.recentActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No recent tasks found</p>
                      ) : (
                        <div>
                          {stats.recentActivity.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ background: 'var(--border-subtle)' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{task.subject || 'Untitled task'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{task.status}</span>
                                  {task.date && <>
                                    <span style={{ color: 'var(--border-subtle)' }}>·</span>
                                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatDate(task.date)}</span>
                                  </>}
                                </div>
                              </div>
                              <span className="text-[11px] font-medium shrink-0" style={{ color: PRIORITY_COLORS[task.priority] ?? 'var(--text-muted)' }}>
                                {task.priority}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cases by Status */}
                  <Card style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold font-display" style={{ color: 'var(--text-primary)' }}>Cases by Status</CardTitle>
                      <CardDescription className="text-xs" style={{ color: 'var(--text-muted)' }}>Open support cases grouped by status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats.casesByStatus.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No cases found</p>
                      ) : (
                        <div className="space-y-2">
                          {(() => {
                            const maxCases = Math.max(...stats.casesByStatus.map((c) => c.count), 1);
                            const totalCases = stats.casesByStatus.reduce((s, c) => s + c.count, 0);
                            return stats.casesByStatus.map((c, idx) => {
                              const pct = Math.round((c.count / maxCases) * 100);
                              return (
                                <div key={c.status} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.status}</span>
                                    <div className="flex items-center gap-2">
                                      <span style={{ color: 'var(--text-muted)' }}>{Math.round((c.count / totalCases) * 100)}%</span>
                                      <span className="font-semibold w-8 text-right" style={{ color: 'var(--text-primary)' }}>{c.count}</span>
                                    </div>
                                  </div>
                                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                                    <motion.div
                                      className="h-full rounded-full"
                                      style={{ background: '#F97316' }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.04 }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                      <Separator className="my-4" />
                      <Button asChild variant="outline" size="sm" className="w-full text-xs">
                        <Link to="/chat">
                          <MessageSquare className="w-3.5 h-3.5 mr-2" />
                          Ask AI about your cases
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Partial-data warnings */}
                {Object.values(stats.errors).some(Boolean) && (
                  <motion.div variants={itemVariants}>
                    <div className="flex items-start gap-2 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>Some data could not be loaded from your CRM. The dashboard may be incomplete.</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </main>
        </div>
      </AppShell>
    </TooltipProvider>
  );
}
