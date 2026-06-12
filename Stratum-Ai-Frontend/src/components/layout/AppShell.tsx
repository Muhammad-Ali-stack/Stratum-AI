import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
