# Stratum AI — Backend

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

REST API for Stratum AI — the enterprise-grade AI assistant that connects to your CRM platforms (Salesforce, HubSpot, ServiceNow) and lets you query, create, and update records in natural language.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        STRATUM AI                           │
│                                                             │
│   stratum-ai-frontend          stratum-ai-backend           │
│   ┌──────────────────┐         ┌──────────────────────┐    │
│   │  React + Vite    │  HTTPS  │  Express + TypeScript │    │
│   │  Tailwind CSS    │ ──────► │  JWT Auth             │    │
│   │  React Flow      │         │  Pino Logger          │    │
│   │  shadcn/ui       │         │  Zod Validation       │    │
│   └──────────────────┘         └──────────┬───────────┘    │
│                                            │                 │
│                          ┌─────────────────┼──────────────┐ │
│                          │                 │              │ │
│                   ┌──────▼──────┐  ┌───────▼──────┐      │ │
│                   │  Supabase   │  │  Salesforce  │      │ │
│                   │ (PostgreSQL)│  │  REST API    │      │ │
│                   │  Auth/Sessions│  │  OAuth 2.0  │      │ │
│                   └─────────────┘  └──────────────┘      │ │
│                                                            │ │
│                   ┌─────────────┐  ┌────────────────┐    │ │
│                   │  Groq API   │  │  Gemini API    │    │ │
│                   │  (Primary)  │  │  (Fallback)    │    │ │
│                   └─────────────┘  └────────────────┘    │ │
│                                                            │ │
└────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Node.js 22+
- A [Supabase](https://supabase.com) project (free tier works)
- A Salesforce Connected App with OAuth enabled
- A [Groq](https://console.groq.com/keys) API key
- (Optional) A [Google Gemini](https://aistudio.google.com/app/apikey) API key for fallback

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/stratum-ai-backend.git
cd stratum-ai-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in all required values
```

### 3. Initialise the database

Run `supabase_schema.sql` once in your Supabase project's SQL Editor.

### 4. Start development server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | API port (default: `3001`) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (min 32 chars) |
| `ENCRYPTION_KEY` | Yes | 64-char hex string for AES-256-GCM token encryption |
| `SALESFORCE_CLIENT_ID` | Yes | Consumer Key from Salesforce Connected App |
| `SALESFORCE_CLIENT_SECRET` | Yes | Consumer Secret from Salesforce Connected App |
| `SALESFORCE_REDIRECT_URI` | Yes | OAuth callback URL (must match Connected App) |
| `GROQ_API_KEY` | Yes | Groq API key (primary AI provider) |
| `GEMINI_API_KEY` | No | Google Gemini key (fallback AI provider) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (keep secret) |
| `CORS_ORIGIN` | Yes | Frontend origin (`http://localhost:5000` in dev) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: `60000`) |
| `RATE_LIMIT_MAX` | No | Max requests per window (default: `60`) |
| `SMTP_HOST` | No | SMTP server for digest emails |
| `SMTP_PORT` | No | SMTP port (default: `587`) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password or API key |
| `SMTP_FROM` | No | From address for digest emails |
| `DIGEST_CRON_SCHEDULE` | No | Cron schedule for daily digest (default: `0 8 * * *`) |

---

## API Reference

All authenticated endpoints require the header:
```
Authorization: Bearer <jwt_token>
```

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness + readiness check |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/logout` | Invalidate session |
| `GET` | `/api/auth/me` | Get current user |

### Salesforce

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/salesforce/connect` | Initiate OAuth flow |
| `GET` | `/api/salesforce/callback` | OAuth callback handler |
| `GET` | `/api/salesforce/status` | Connection status |
| `DELETE` | `/api/salesforce/disconnect` | Remove connection |

### Chat

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Send message, get AI response |
| `GET` | `/api/chat/conversations` | List conversations |
| `GET` | `/api/chat/conversations/:id/messages` | Get messages |
| `DELETE` | `/api/chat/conversations/:id` | Delete conversation |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard` | Pipeline stats, KPIs |
| `GET` | `/api/dashboard/search?q=` | Search records |

### Records

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/salesforce/records/:object` | List SF records |
| `POST` | `/api/salesforce/records/:object` | Create SF record |
| `PATCH` | `/api/salesforce/records/:object/:id` | Update SF record |

### Settings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/settings` | Get user settings |
| `PATCH` | `/api/settings` | Update settings |

---

## Project Structure

```
src/
├── config/         # Typed env config with Zod validation
├── jobs/           # Scheduled jobs (daily digest)
├── lib/            # Shared utilities (logger, crypto, supabase client)
├── middleware/     # Auth, error handling, rate limiting, validation
├── routes/         # Express route handlers
├── services/       # Business logic (AI, Salesforce, Supabase, email)
└── types/          # Shared TypeScript types
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run typecheck` | Run tsc without emitting |

---

## Security

- All Salesforce tokens encrypted at rest with AES-256-GCM
- JWT tokens signed with strong secret, short expiry
- Helmet.js for HTTP security headers
- CORS restricted to configured origin
- Rate limiting on all endpoints
- Zod validation on all request bodies
- No secrets in logs (pino redaction)
- Service role key never exposed to frontend
