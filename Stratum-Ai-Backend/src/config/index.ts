import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

// Try every plausible location for .env so the app works regardless of
// how it is started (from repo root, from inside backend/, via --prefix, etc.)
const candidatePaths = [
  resolve(process.cwd(), '.env'),           // cwd = repo root  (most common)
  resolve(process.cwd(), '../.env'),        // cwd = backend/
  resolve(__dir, '../../../.env'),          // tsx: backend/src/config → root
  resolve(__dir, '../../../../.env'),       // compiled: backend/dist/config → root
  resolve(__dir, '../../.env'),            // fallback: backend/src → backend/
];

let loadedFrom: string | null = null;
for (const p of candidatePaths) {
  if (existsSync(p)) {
    dotenvConfig({ path: p, override: false });
    loadedFrom = p;
    break;
  }
}

if (!loadedFrom) {
  process.stderr.write(
    '\n[config] WARNING: No .env file found. ' +
    'Copy .env.example to .env at the project root and fill in your values.\n' +
    `Searched:\n${candidatePaths.map((p) => `  • ${p}`).join('\n')}\n\n`,
  );
} else if (process.env.NODE_ENV !== 'test') {
  process.stdout.write(`[config] Loaded env from: ${loadedFrom}\n`);
}

const DEV_JWT_SECRET = '2Jnm08qvcduVedprvnfmVQCR2yjgj0zpF19nN9bH2Y4l5mBgJkgnX+ohN0GHOaRp';
const DEV_ENCRYPTION_KEY = '383ea0f5298ad76e764b20f0d9e44a6817671f878953f0e003bf4e26845a7f0b';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  JWT_SECRET: z.string().default(DEV_JWT_SECRET),
  ENCRYPTION_KEY: z.string().default(DEV_ENCRYPTION_KEY),

  SALESFORCE_CLIENT_ID: z.string().default(''),
  SALESFORCE_CLIENT_SECRET: z.string().default(''),
  SALESFORCE_REDIRECT_URI: z.string().default('http://localhost:3001/api/salesforce/callback'),

  GROQ_API_KEY: z.string().default(''),
  GEMINI_API_KEY: z.string().default(''),

  SUPABASE_URL: z.string().default(''),
  SUPABASE_ANON_KEY: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),

  CORS_ORIGIN: z.string().default('http://localhost:5000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(60),

  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default(''),
  DIGEST_CRON_SCHEDULE: z.string().default('0 8 * * *'),
});

export type AppConfig = z.infer<typeof envSchema>;

function loadConfig(): AppConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    process.stderr.write(`\n[config] Invalid environment variables:\n${formatted}\n\n`);
    process.exit(1);
  }

  const cfg = result.data;

  if (cfg.NODE_ENV === 'production') {
    const required = [
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'SALESFORCE_CLIENT_ID',
      'SALESFORCE_CLIENT_SECRET',
      'GROQ_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ] as const;

    const missing = required.filter((k) => !cfg[k]);
    if (missing.length > 0) {
      process.stderr.write(`\n[config] Missing required production env vars: ${missing.join(', ')}\n\n`);
      process.exit(1);
    }
  }

  return cfg;
}

export const config = loadConfig();

export function isSalesforceConfigured(): boolean {
  return !!(config.SALESFORCE_CLIENT_ID && config.SALESFORCE_CLIENT_SECRET);
}

export function isGroqConfigured(): boolean {
  return !!config.GROQ_API_KEY;
}

export function isGeminiConfigured(): boolean {
  return !!config.GEMINI_API_KEY;
}

export function isSupabaseConfigured(): boolean {
  return !!(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY);
}
