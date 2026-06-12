import { Router, Request, Response } from 'express';
import { isSupabaseConfigured, isSalesforceConfigured, isGroqConfigured, isGeminiConfigured } from '../config/index.js';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const configured = {
    supabase: isSupabaseConfigured(),
    salesforce: isSalesforceConfigured(),
    groq: isGroqConfigured(),
    gemini: isGeminiConfigured(),
  };

  let dbStatus: 'ok' | 'unconfigured' | 'degraded' = 'unconfigured';

  if (configured.supabase) {
    try {
      const { supabaseAdmin } = await import('../lib/supabase.js');
      await supabaseAdmin.from('users').select('id').limit(1);
      dbStatus = 'ok';
    } catch {
      dbStatus = 'degraded';
    }
  }

  const allConfigured = Object.values(configured).every(Boolean);

  res.status(200).json({
    status: allConfigured && dbStatus === 'ok' ? 'ok' : 'partial',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
      ...configured,
    },
  });
});

export default router;
