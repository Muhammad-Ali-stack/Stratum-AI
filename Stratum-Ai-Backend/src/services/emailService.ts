import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

export interface DigestData {
  userEmail: string;
  pipelineValue: number;
  openOpportunities: number;
  newLeadsThisWeek: number;
  closingThisWeek: Array<{ name: string; amount: number | null; closeDate: string; stage: string }>;
  overdueTasks: Array<{ subject: string; dueDate: string | null; status: string }>;
  generatedAt: string;
}

function isEmailConfigured(): boolean {
  return !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
}

function createTransport() {
  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT ?? 587),
    secure: Number(config.SMTP_PORT ?? 587) === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    connectionTimeout: 10_000,
  });
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function buildHtml(data: DigestData): string {
  const date = new Date(data.generatedAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const closingRows = data.closingThisWeek.length
    ? data.closingThisWeek.map((o) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E4E4E7;font-size:13px;color:#18181b;">${o.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E4E4E7;font-size:13px;color:#3B82F6;font-weight:600;">${o.amount !== null ? formatCurrency(o.amount) : '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E4E4E7;font-size:13px;color:#52525b;">${o.closeDate}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E4E4E7;font-size:13px;color:#71717a;">${o.stage}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:16px 12px;color:#a1a1aa;font-size:13px;text-align:center;">No opportunities closing this week</td></tr>`;

  const taskRows = data.overdueTasks.length
    ? data.overdueTasks.map((t) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E4E4E7;font-size:13px;color:#18181b;">${t.subject}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E4E4E7;font-size:13px;color:#EF4444;">${t.dueDate ?? 'No date'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E4E4E7;font-size:13px;color:#71717a;">${t.status}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding:16px 12px;color:#a1a1aa;font-size:13px;text-align:center;">No overdue tasks</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stratum AI Daily Digest</title></head>
<body style="margin:0;padding:0;background:#F8F8F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8F5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#09090b;border-radius:12px 12px 0 0;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="display:inline-flex;align-items:center;gap:10px;">
                  <div style="width:32px;height:32px;background:#3B82F6;border-radius:8px;display:inline-block;line-height:32px;text-align:center;font-size:18px;">⚡</div>
                  <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Stratum AI</span>
                </div>
                <p style="color:#a1a1aa;margin:6px 0 0;font-size:13px;">Daily Digest · ${date}</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Stat Cards -->
        <tr><td style="background:#ffffff;padding:24px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="33%" style="padding-right:8px;">
                <div style="background:#F4F4F5;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:700;color:#3B82F6;">${formatCurrency(data.pipelineValue)}</div>
                  <div style="font-size:11px;color:#71717a;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Total Pipeline</div>
                </div>
              </td>
              <td width="33%" style="padding:0 4px;">
                <div style="background:#F4F4F5;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:700;color:#18181b;">${data.openOpportunities}</div>
                  <div style="font-size:11px;color:#71717a;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Open Opps</div>
                </div>
              </td>
              <td width="33%" style="padding-left:8px;">
                <div style="background:#F4F4F5;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:700;color:#10B981;">${data.newLeadsThisWeek}</div>
                  <div style="font-size:11px;color:#71717a;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">New Leads (7d)</div>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Closing This Week -->
        <tr><td style="background:#ffffff;padding:24px 32px 0;">
          <p style="font-size:14px;font-weight:600;color:#18181b;margin:0 0 12px;">Closing This Week</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E7;border-radius:8px;overflow:hidden;">
            <tr style="background:#F9F9F9;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Name</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Close Date</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Stage</th>
            </tr>
            ${closingRows}
          </table>
        </td></tr>

        <!-- Overdue Tasks -->
        <tr><td style="background:#ffffff;padding:20px 32px 0;">
          <p style="font-size:14px;font-weight:600;color:#18181b;margin:0 0 12px;">Overdue Tasks</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E7;border-radius:8px;overflow:hidden;">
            <tr style="background:#F9F9F9;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Subject</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Due Date</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Status</th>
            </tr>
            ${taskRows}
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#ffffff;border-radius:0 0 12px 12px;padding:24px 32px;border-top:1px solid #E4E4E7;margin-top:24px;">
          <p style="color:#a1a1aa;font-size:12px;margin:0;text-align:center;">
            You're receiving this because daily digest is enabled in your Stratum AI account.<br>
            <a href="#" style="color:#3B82F6;text-decoration:none;">Manage notification settings</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendDailyDigest(data: DigestData): Promise<void> {
  if (!isEmailConfigured()) {
    logger.warn({ email: data.userEmail }, 'SMTP not configured — skipping digest email');
    return;
  }

  const transport = createTransport();
  const subject = `Stratum AI Digest · ${formatCurrency(data.pipelineValue)} pipeline · ${data.closingThisWeek.length} closing this week`;

  try {
    const info = await transport.sendMail({
      from: `"Stratum AI" <${config.SMTP_FROM ?? config.SMTP_USER}>`,
      to: data.userEmail,
      subject,
      html: buildHtml(data),
    });
    logger.info({ email: data.userEmail, messageId: info.messageId }, 'Daily digest sent');
  } catch (err) {
    logger.error({ err, email: data.userEmail }, 'Failed to send daily digest');
    throw err;
  }
}
