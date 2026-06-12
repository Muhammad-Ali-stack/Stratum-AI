import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getUserSettings, updateUserSettings } from '../services/supabaseService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const ALLOWED_GROQ_MODELS = [
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
] as const;

const updateSettingsSchema = z.object({
  preferred_ai_model: z.enum(ALLOWED_GROQ_MODELS).optional(),
  show_api_transparency: z.boolean().optional(),
  notify_daily_digest: z.boolean().optional(),
});

router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const settings = await getUserSettings(sub);
      if (!settings) throw new AppError(404, 'Settings not found');
      res.json({ success: true, data: { settings, availableModels: ALLOWED_GROQ_MODELS } });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/',
  requireAuth,
  validate(updateSettingsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sub } = (req as AuthenticatedRequest).user;
      const updates = req.body as z.infer<typeof updateSettingsSchema>;
      if (Object.keys(updates).length === 0) throw new AppError(400, 'No settings to update');
      const settings = await updateUserSettings(sub, updates);
      res.json({ success: true, data: { settings } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
