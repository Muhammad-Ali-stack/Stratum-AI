import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { CRMProvider } from '@/types';

interface ConnectionContextValue {
  connections: CRMProvider[];
  addConnection: (provider: CRMProvider) => void;
  removeConnection: (provider: CRMProvider) => void;
  isConnected: (provider: CRMProvider) => boolean;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

const STORAGE_KEY = 'stratum-connections';

function loadConnections(): CRMProvider[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as CRMProvider[];
  } catch {}
  return [];
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<CRMProvider[]>(loadConnections);

  const persist = (list: CRMProvider[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
  };

  const addConnection = useCallback((provider: CRMProvider) => {
    setConnections((prev) => {
      if (prev.includes(provider)) return prev;
      const next = [...prev, provider];
      persist(next);
      return next;
    });
  }, []);

  const removeConnection = useCallback((provider: CRMProvider) => {
    setConnections((prev) => {
      const next = prev.filter((p) => p !== provider);
      persist(next);
      return next;
    });
  }, []);

  const isConnected = useCallback(
    (provider: CRMProvider) => connections.includes(provider),
    [connections],
  );

  return (
    <ConnectionContext.Provider value={{ connections, addConnection, removeConnection, isConnected }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnections() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnections must be used inside ConnectionProvider');
  return ctx;
}
