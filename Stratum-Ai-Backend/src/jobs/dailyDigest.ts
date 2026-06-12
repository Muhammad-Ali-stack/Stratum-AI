import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { isSupabaseConfigured } from '../config/index.js';
import { querySalesforce } from '../services/salesforceService.js';
import { getSalesforceConnection } from '../services/supabaseService.js';
import { sendDailyDigest, type DigestData } from '../services/emailService.js';

const DIGEST_CRON = process.env['DIGEST_CRON_SCHEDULE'] ?? '0 8 * * *'; // 8 AM UTC daily

async function fetchDigestDataForUser(userId: string): Promise<Omit<DigestData, 'userEmail' | 'generatedAt'> | null> {
  const connection = await getSalesforceConnection(userId);
  if (!connection) return null;

  const today = new Date().toISOString().split('T')[0]!;
  const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0]!;
  const sevenDaysFromNow = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0]!;

  const [oppsResult, leadsResult, tasksResult] = await Promise.allSettled([
    querySalesforce(
      userId,
      `SELECT Id, Name, Amount, CloseDate, StageName FROM Opportunity WHERE IsClosed = false ORDER BY Amount DESC NULLS LAST LIMIT 200`,
    ),
    querySalesforce(
      userId,
      `SELECT COUNT() FROM Lead WHERE CreatedDate >= ${sevenDaysAgo}T00:00:00Z AND IsConverted = false`,
    ),
    querySalesforce(
      userId,
      `SELECT Id, Subject, ActivityDate, Status FROM Task WHERE ActivityDate < ${today} AND IsClosed = false ORDER BY ActivityDate ASC LIMIT 20`,
    ),
  ]);

  const opps = oppsResult.status === 'fulfilled'
    ? oppsResult.value.records as Array<{ Id: string; Name: string; Amount: number | null; CloseDate: string; StageName: string }>
    : [];

  const pipelineValue = opps.reduce((s, o) => s + (o.Amount ?? 0), 0);
  const openOpportunities = opps.length;

  const closingThisWeek = opps
    .filter((o) => o.CloseDate >= today && o.CloseDate <= sevenDaysFromNow)
    .slice(0, 10)
    .map((o) => ({ name: o.Name, amount: o.Amount, closeDate: o.CloseDate, stage: o.StageName }));

  const newLeadsThisWeek = leadsResult.status === 'fulfilled' ? leadsResult.value.totalSize : 0;

  const overdueTasks = tasksResult.status === 'fulfilled'
    ? (tasksResult.value.records as Array<{ Id: string; Subject: string; ActivityDate: string | null; Status: string }>)
        .slice(0, 10)
        .map((t) => ({ subject: t.Subject, dueDate: t.ActivityDate, status: t.Status }))
    : [];

  return { pipelineValue, openOpportunities, newLeadsThisWeek, closingThisWeek, overdueTasks };
}

async function runDailyDigest(): Promise<void> {
  if (!isSupabaseConfigured()) {
    logger.warn('Supabase not configured — skipping daily digest job');
    return;
  }

  logger.info('Running daily digest job');
  const start = Date.now();

  try {
    const { data: usersWithDigest, error } = await supabaseAdmin
      .from('user_settings')
      .select('user_id, users(email)')
      .eq('notify_daily_digest', true);

    if (error) {
      logger.error({ error }, 'Failed to fetch digest subscribers');
      return;
    }

    if (!usersWithDigest?.length) {
      logger.info('No users subscribed to daily digest');
      return;
    }

    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      usersWithDigest.map(async (row: { user_id: string; users: { email: string } | null }) => {
        const email = row.users?.email;
        if (!email) return;

        try {
          const data = await fetchDigestDataForUser(row.user_id);
          if (!data) return;

          await sendDailyDigest({
            ...data,
            userEmail: email,
            generatedAt: new Date().toISOString(),
          });
          sent++;
        } catch (err) {
          logger.error({ err, userId: row.user_id }, 'Digest failed for user');
          failed++;
        }
      }),
    );

    logger.info({ sent, failed, durationMs: Date.now() - start }, 'Daily digest job complete');
  } catch (err) {
    logger.error({ err }, 'Daily digest job crashed');
  }
}

export function startDailyDigestJob(): void {
  if (!cron.validate(DIGEST_CRON)) {
    logger.error({ schedule: DIGEST_CRON }, 'Invalid DIGEST_CRON_SCHEDULE — daily digest not started');
    return;
  }

  cron.schedule(DIGEST_CRON, () => { void runDailyDigest(); }, { timezone: 'UTC' });
  logger.info({ schedule: DIGEST_CRON }, 'Daily digest cron job scheduled');
}

export { runDailyDigest };
