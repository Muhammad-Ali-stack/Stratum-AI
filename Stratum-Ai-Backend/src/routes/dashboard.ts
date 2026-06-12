import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { querySalesforce } from '../services/salesforceService.js';
import { getSalesforceConnection } from '../services/supabaseService.js';
import { logger } from '../lib/logger.js';

const router = Router();

interface StageRow { StageName: string; Amount: number | null; }
interface OppRow {
  Id: string; Name: string; Amount: number | null;
  CloseDate: string; StageName: string;
  Account?: { Name: string } | null;
}
interface TaskRow { Id: string; Subject: string; Status: string; Priority: string; ActivityDate: string | null; }
interface CaseRow { Status: string; }
interface LeadCountRow { expr0: number; }

router.get(
  '/stats',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sub: userId } = (req as AuthenticatedRequest).user;
    const start = Date.now();

    try {
      const connection = await getSalesforceConnection(userId);

      if (!connection) {
        res.json({ success: true, data: { connected: false } });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const firstOfMonth = `${today.slice(0, 7)}-01`;
      const firstOfLastQuarter = (() => {
        const d = new Date();
        const q = Math.floor(d.getMonth() / 3);
        const qStart = q * 3;
        return `${d.getFullYear()}-${String(qStart + 1).padStart(2, '0')}-01`;
      })();

      const [oppsResult, newLeadsResult, winLossResult, tasksResult, casesResult] = await Promise.allSettled([
        querySalesforce(
          userId,
          `SELECT Id, Name, Amount, CloseDate, StageName, Account.Name
           FROM Opportunity
           WHERE IsClosed = false
           ORDER BY Amount DESC NULLS LAST
           LIMIT 200`,
        ),
        querySalesforce(
          userId,
          `SELECT COUNT() FROM Lead WHERE CreatedDate >= ${firstOfMonth}T00:00:00Z AND IsConverted = false`,
        ),
        querySalesforce(
          userId,
          `SELECT StageName, COUNT(Id) total FROM Opportunity
           WHERE (StageName = 'Closed Won' OR StageName = 'Closed Lost')
           AND CloseDate >= ${firstOfLastQuarter}
           GROUP BY StageName`,
        ),
        querySalesforce(
          userId,
          `SELECT Id, Subject, Status, Priority, ActivityDate
           FROM Task
           ORDER BY CreatedDate DESC
           LIMIT 10`,
        ),
        querySalesforce(
          userId,
          `SELECT Status, COUNT(Id) total FROM Case GROUP BY Status ORDER BY COUNT(Id) DESC LIMIT 8`,
        ),
      ]);

      const openOpps = oppsResult.status === 'fulfilled' ? (oppsResult.value.records as OppRow[]) : [];
      const newLeads = newLeadsResult.status === 'fulfilled' ? newLeadsResult.value.totalSize : 0;
      const winLossRecords = winLossResult.status === 'fulfilled'
        ? (winLossResult.value.records as Array<{ StageName: string; total: number }>)
        : [];
      const tasks = tasksResult.status === 'fulfilled' ? (tasksResult.value.records as TaskRow[]) : [];
      const cases = casesResult.status === 'fulfilled'
        ? (casesResult.value.records as Array<{ Status: string; total: number }>)
        : [];

      const pipelineValue = openOpps.reduce((sum, o) => sum + (o.Amount ?? 0), 0);
      const openOpportunitiesCount = openOpps.length;

      const stageMap = new Map<string, { count: number; value: number }>();
      for (const opp of openOpps) {
        const s = stageMap.get(opp.StageName) ?? { count: 0, value: 0 };
        s.count += 1;
        s.value += opp.Amount ?? 0;
        stageMap.set(opp.StageName, s);
      }
      const byStage = Array.from(stageMap.entries())
        .map(([stage, { count, value }]) => ({ stage, count, value }))
        .sort((a, b) => b.value - a.value);

      const closingSoon = openOpps
        .filter((o) => o.CloseDate && o.CloseDate >= today && o.CloseDate <= `${today.slice(0, 7)}-31`)
        .slice(0, 8)
        .map((o) => ({
          id: o.Id,
          name: o.Name,
          amount: o.Amount,
          closeDate: o.CloseDate,
          stage: o.StageName,
          account: o.Account?.Name ?? null,
        }));

      const won = winLossRecords.find((r) => r.StageName === 'Closed Won')?.total ?? 0;
      const lost = winLossRecords.find((r) => r.StageName === 'Closed Lost')?.total ?? 0;
      const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

      const recentActivity = tasks.map((t) => ({
        id: t.Id,
        subject: t.Subject,
        status: t.Status,
        priority: t.Priority,
        date: t.ActivityDate,
      }));

      const casesByStatus = cases.map((c) => ({
        status: c.Status,
        count: Number(c.total),
      }));

      logger.info({ userId, durationMs: Date.now() - start }, 'Dashboard stats fetched');

      res.json({
        success: true,
        data: {
          connected: true,
          pipelineValue,
          openOpportunities: openOpportunitiesCount,
          newLeadsThisMonth: newLeads,
          winRate,
          byStage,
          closingSoon,
          recentActivity,
          casesByStatus,
          lastRefreshed: new Date().toISOString(),
          errors: {
            opps: oppsResult.status === 'rejected' ? String(oppsResult.reason) : null,
            leads: newLeadsResult.status === 'rejected' ? String(newLeadsResult.reason) : null,
            tasks: tasksResult.status === 'rejected' ? String(tasksResult.reason) : null,
            cases: casesResult.status === 'rejected' ? String(casesResult.reason) : null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

interface LeadSearchRow { Id: string; FirstName: string | null; LastName: string; Company: string | null; Email: string | null; Status: string; }
interface ContactSearchRow { Id: string; FirstName: string | null; LastName: string; Email: string | null; Title: string | null; Account?: { Name: string } | null; }
interface AccountSearchRow { Id: string; Name: string; Type: string | null; Industry: string | null; AnnualRevenue: number | null; }

router.get(
  '/search',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sub: userId } = (req as AuthenticatedRequest).user;
    const q = String(req.query['q'] ?? '').trim();

    if (!q || q.length < 2) {
      res.status(400).json({ success: false, error: 'Query must be at least 2 characters' });
      return;
    }

    try {
      const connection = await getSalesforceConnection(userId);
      if (!connection) {
        res.json({ success: true, data: { connected: false, leads: [], contacts: [], accounts: [], total: 0 } });
        return;
      }

      const safe = q.replace(/'/g, "\\'").replace(/%/g, '\\%').replace(/_/g, '\\_');
      const like = `'%${safe}%'`;

      const [leadsRes, contactsRes, accountsRes] = await Promise.allSettled([
        querySalesforce(
          userId,
          `SELECT Id, FirstName, LastName, Company, Email, Status FROM Lead WHERE IsConverted = false AND (FirstName LIKE ${like} OR LastName LIKE ${like} OR Company LIKE ${like} OR Email LIKE ${like}) LIMIT 8`,
        ),
        querySalesforce(
          userId,
          `SELECT Id, FirstName, LastName, Email, Title, Account.Name FROM Contact WHERE (FirstName LIKE ${like} OR LastName LIKE ${like} OR Email LIKE ${like}) LIMIT 8`,
        ),
        querySalesforce(
          userId,
          `SELECT Id, Name, Type, Industry, AnnualRevenue FROM Account WHERE Name LIKE ${like} LIMIT 8`,
        ),
      ]);

      const leads = leadsRes.status === 'fulfilled'
        ? (leadsRes.value.records as LeadSearchRow[]).map((r) => ({
            id: r.Id,
            name: [r.FirstName, r.LastName].filter(Boolean).join(' '),
            company: r.Company,
            email: r.Email,
            status: r.Status,
          }))
        : [];

      const contacts = contactsRes.status === 'fulfilled'
        ? (contactsRes.value.records as ContactSearchRow[]).map((r) => ({
            id: r.Id,
            name: [r.FirstName, r.LastName].filter(Boolean).join(' '),
            email: r.Email,
            title: r.Title,
            account: r.Account?.Name ?? null,
          }))
        : [];

      const accounts = accountsRes.status === 'fulfilled'
        ? (accountsRes.value.records as AccountSearchRow[]).map((r) => ({
            id: r.Id,
            name: r.Name,
            type: r.Type,
            industry: r.Industry,
            annualRevenue: r.AnnualRevenue,
          }))
        : [];

      res.json({
        success: true,
        data: {
          connected: true,
          leads,
          contacts,
          accounts,
          total: leads.length + contacts.length + accounts.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── Pipeline view ──────────────────────────────────────────────────────────────

interface PipelineOppRow {
  Id: string;
  Name: string;
  Amount: number | null;
  CloseDate: string;
  StageName: string;
  Probability: number | null;
  Account?: { Name: string } | null;
}

const STAGE_ORDER = [
  'Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition',
  'Id. Decision Makers', 'Perception Analysis', 'Proposal/Price Quote',
  'Negotiation/Review', 'Closed Won', 'Closed Lost',
];

router.get(
  '/pipeline',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sub: userId } = (req as AuthenticatedRequest).user;
    try {
      const connection = await getSalesforceConnection(userId);
      if (!connection) {
        res.json({ success: true, data: { connected: false } });
        return;
      }

      const result = await querySalesforce(
        userId,
        `SELECT Id, Name, Amount, CloseDate, StageName, Probability, Account.Name
         FROM Opportunity WHERE IsClosed = false
         ORDER BY Amount DESC NULLS LAST LIMIT 200`,
      );

      const opps = result.records as unknown as PipelineOppRow[];
      const stageMap = new Map<string, { name: string; count: number; totalValue: number; opportunities: unknown[] }>();

      for (const opp of opps) {
        if (!stageMap.has(opp.StageName)) {
          stageMap.set(opp.StageName, { name: opp.StageName, count: 0, totalValue: 0, opportunities: [] });
        }
        const stage = stageMap.get(opp.StageName)!;
        stage.count++;
        stage.totalValue += opp.Amount ?? 0;
        stage.opportunities.push({
          id: opp.Id,
          name: opp.Name,
          account: opp.Account?.Name ?? null,
          amount: opp.Amount,
          closeDate: opp.CloseDate,
          probability: opp.Probability ?? null,
          stage: opp.StageName,
        });
      }

      const stages = Array.from(stageMap.values()).sort((a, b) => {
        const ai = STAGE_ORDER.indexOf(a.name);
        const bi = STAGE_ORDER.indexOf(b.name);
        if (ai === -1 && bi === -1) return b.totalValue - a.totalValue;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

      res.json({
        success: true,
        data: {
          connected: true,
          stages,
          totalPipelineValue: stages.reduce((s, st) => s + st.totalValue, 0),
          totalOpportunities: opps.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
