import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AIProvider } from '@/types';

interface AIProviderNodeData {
  provider?: AIProvider;
  [key: string]: unknown;
}

const PROVIDER_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  groq: {
    label: 'Groq',
    color: '#FACC15',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28">
        <polygon points="13,2 4,14 12,14 11,22 20,10 12,10" fill="#FACC15" />
      </svg>
    ),
  },
  gemini: {
    label: 'Google Gemini',
    color: '#4285F4',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28">
        <defs>
          <linearGradient id="gem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="100%" stopColor="#EA4335" />
          </linearGradient>
        </defs>
        <path
          d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
          fill="url(#gem-grad)"
        />
      </svg>
    ),
  },
  copilot: {
    label: 'Copilot / Azure',
    color: '#6B7280',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"
          fill="currentColor"
          className="text-muted-foreground"
        />
      </svg>
    ),
  },
};

export default function AIProviderNode({ data }: NodeProps) {
  const d = data as AIProviderNodeData;
  const cfg = PROVIDER_CONFIG[d.provider ?? 'groq'] ?? PROVIDER_CONFIG.groq;

  return (
    <div
      style={{
        width: 160,
        background: 'var(--bg-card)',
        border: `2px solid #F97316`,
        borderRadius: 16,
        padding: '14px 12px',
        boxShadow: '0 8px 32px rgba(249,115,22,0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: 18,
          border: '2px solid transparent',
          background: 'conic-gradient(from 0deg, #F97316, #FB923C, #F97316)',
          animation: 'rotate-gradient 4s linear infinite',
          opacity: 0.3,
          zIndex: 0,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-2">
        {cfg.icon}
        <div className="text-center">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{cfg.label}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI Provider</p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ right: -7, background: '#F97316' }}
      />
    </div>
  );
}
