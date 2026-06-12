import { Router, Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../lib/logger.js';
import { isSalesforceConfigured } from '../config/index.js';
import {
  buildOAuthUrl,
  exchangeCodeForTokens,
  storeSalesforceConnection,
} from '../services/salesforceService.js';
import {
  getSalesforceConnection,
  deleteSalesforceConnection,
} from '../services/supabaseService.js';
import { config } from '../config/index.js';

const router = Router();

const callbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

const oauthStates = new Map<string, { userId: string; expiresAt: number }>();

function cleanExpiredStates(): void {
  const now = Date.now();
  for (const [key, value] of oauthStates.entries()) {
    if (value.expiresAt < now) oauthStates.delete(key);
  }
}

router.get(
  '/connect',
  requireAuth,
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!isSalesforceConfigured()) {
        throw new AppError(
          503,
          'Salesforce is not configured. Please add SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET to your environment.',
        );
      }
      cleanExpiredStates();
      const req = _req as AuthenticatedRequest;
      const state = randomBytes(32).toString('hex');
      oauthStates.set(state, { userId: req.user.sub, expiresAt: Date.now() + 10 * 60 * 1000 });
      const url = buildOAuthUrl(state);
      res.json({ success: true, data: { url } });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/callback',
  validate(callbackSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state } = req.query as z.infer<typeof callbackSchema>;
      const stateData = oauthStates.get(state);

      if (!stateData || stateData.expiresAt < Date.now()) {
        oauthStates.delete(state);
        throw new AppError(400, 'Invalid or expired OAuth state. Please try connecting again.');
      }

      oauthStates.delete(state);
      const tokens = await exchangeCodeForTokens(code);
      await storeSalesforceConnection(stateData.userId, tokens);
      logger.info({ userId: stateData.userId }, 'Salesforce connected successfully');

      res.redirect(`${config.CORS_ORIGIN}/settings?sf_connected=true`);
    } catch (err) {
      logger.error({ err }, 'Salesforce OAuth callback failed');
      res.redirect(`${config.CORS_ORIGIN}/settings?sf_error=true`);
      next(err);
    }
  },
);

router.get(
  '/status',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;

      if (!isSalesforceConfigured()) {
        res.json({
          success: true,
          data: { connected: false, connection: null, configured: false },
        });
        return;
      }

      const connection = await getSalesforceConnection(sub);
      res.json({ success: true, data: { connected: !!connection, connection: connection ?? null, configured: true } });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/disconnect',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      await deleteSalesforceConnection(sub);
      logger.info({ userId: sub }, 'Salesforce disconnected');
      res.json({ success: true, message: 'Salesforce disconnected successfully' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
