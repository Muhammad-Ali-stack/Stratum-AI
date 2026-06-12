# Stratum AI — Frontend

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss&logoColor=white)
![React Flow](https://img.shields.io/badge/React_Flow-12-FF0072)
![License](https://img.shields.io/badge/license-MIT-blue)

React frontend for Stratum AI — enterprise AI assistant for CRM platforms. Features a visual flow builder (React Flow) for connecting integrations, and a ChatGPT-style interface for natural language CRM queries.

---

## Features

- **Visual Integration Flow** — React Flow canvas to connect Salesforce, HubSpot, ServiceNow nodes
- **AI Chat Interface** — Natural language queries against live CRM data
- **Dashboard** — Pipeline KPIs, opportunity stages, recent activity
- **Pipeline View** — Kanban-style opportunity board
- **Settings** — AI model selection, notification preferences
- **Dark mode** — Full dark/light theme support
- **Fully responsive** — Mobile-first design

---

## Prerequisites

- Node.js 22+
- `stratum-ai-backend` running locally or deployed

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/stratum-ai-frontend.git
cd stratum-ai-frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Set VITE_API_URL to your backend URL
```

### 3. Start development server

```bash
npm run dev
```

App available at `http://localhost:5000`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend API URL (default: `http://localhost:3001`) |

---

## Project Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui base components
│   ├── chat/        # Chat message components
│   ├── flow/        # React Flow nodes and edges
│   ├── landing/     # Landing page sections
│   └── layout/      # Shell, sidebar, nav
├── contexts/        # React contexts (theme, notifications)
├── hooks/           # Custom React hooks (auth, chat, pipeline, etc.)
├── lib/             # Axios client, React Query config, utils
├── pages/           # Route-level page components
├── types/           # Shared TypeScript types (mirrored from backend)
└── styles/          # Global CSS
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | Run tsc without emitting |

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@xyflow/react` | Visual flow builder (React Flow v12) |
| `@tanstack/react-query` | Server state management |
| `react-router-dom` | Client-side routing |
| `framer-motion` | Animations |
| `shadcn/ui` + Radix UI | Accessible UI components |
| `tailwindcss` | Utility-first styling |
| `react-markdown` | Render AI markdown responses |
| `axios` | HTTP client with interceptors |

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Marketing page with AgentForce comparison |
| `/login` | Login | JWT authentication |
| `/register` | Register | New account |
| `/dashboard` | Dashboard | CRM KPIs and activity feed |
| `/chat` | Chat | AI conversation interface |
| `/pipeline` | Pipeline | React Flow opportunity board |
| `/settings` | Settings | AI model, connections, notifications |
