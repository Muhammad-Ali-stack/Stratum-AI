import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, User, Users, Building2, CloudOff, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useDashboardSearch } from '@/hooks/useDashboardSearch';
import type { SearchLead, SearchContact, SearchAccount } from '../types/shared';

type ResultItem =
  | { kind: 'lead'; data: SearchLead }
  | { kind: 'contact'; data: SearchContact }
  | { kind: 'account'; data: SearchAccount };

const BADGE_STYLES = {
  lead: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  contact: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  account: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const SECTION_ICONS = {
  lead: Users,
  contact: User,
  account: Building2,
};

function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/30 text-primary rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function ResultRow({
  item,
  isActive,
  query,
  onSelect,
}: {
  item: ResultItem;
  isActive: boolean;
  query: string;
  onSelect: (item: ResultItem) => void;
}) {
  const Icon = SECTION_ICONS[item.kind];
  const badgeClass = BADGE_STYLES[item.kind];

  let primary = '';
  let secondary = '';

  if (item.kind === 'lead') {
    primary = item.data.name;
    secondary = [item.data.company, item.data.email].filter(Boolean).join(' · ');
  } else if (item.kind === 'contact') {
    primary = item.data.name;
    secondary = [item.data.title, item.data.account, item.data.email].filter(Boolean).join(' · ');
  } else {
    primary = item.data.name;
    secondary = [item.data.industry, item.data.type].filter(Boolean).join(' · ');
  }

  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        isActive ? 'bg-zinc-700/60 text-zinc-100' : 'text-zinc-300 hover:bg-zinc-800/60'
      }`}
      onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
    >
      <div className={`p-1.5 rounded-md bg-zinc-800 shrink-0 ${isActive ? 'bg-zinc-700' : ''}`}>
        <Icon className="w-3 h-3 text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{highlight(primary, query)}</p>
        {secondary && <p className="text-xs text-zinc-500 truncate mt-0.5">{secondary}</p>}
      </div>
      <Badge variant="outline" className={`text-[10px] h-4 px-1.5 border shrink-0 ${badgeClass}`}>
        {item.kind}
      </Badge>
    </button>
  );
}

export default function DashboardSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { query, setQuery, results, isSearching, hasQuery } = useDashboardSearch();

  const allItems: ResultItem[] = [
    ...(results?.leads ?? []).map((d): ResultItem => ({ kind: 'lead', data: d })),
    ...(results?.contacts ?? []).map((d): ResultItem => ({ kind: 'contact', data: d })),
    ...(results?.accounts ?? []).map((d): ResultItem => ({ kind: 'account', data: d })),
  ];

  const isOpen = open && (hasQuery || query.length > 0);

  const handleSelect = useCallback((item: ResultItem) => {
    let prompt = '';
    if (item.kind === 'lead') {
      prompt = `Tell me about lead ${item.data.name}${item.data.company ? ` from ${item.data.company}` : ''}`;
    } else if (item.kind === 'contact') {
      prompt = `Tell me about contact ${item.data.name}${item.data.account ? ` at ${item.data.account}` : ''}`;
    } else {
      prompt = `Give me a summary of account ${item.data.name}`;
    }
    setOpen(false);
    setQuery('');
    navigate('/chat', { state: { prefillMessage: prompt } });
  }, [navigate, setQuery]);

  useEffect(() => {
    setActiveIdx(-1);
  }, [results]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setQuery]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      const item = allItems[activeIdx];
      if (item) handleSelect(item);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      {/* Input */}
      <div
        className={`flex items-center gap-2 px-3 h-9 rounded-lg border transition-colors bg-zinc-900 ${
          open ? 'border-zinc-600 ring-1 ring-zinc-600/50' : 'border-zinc-800 hover:border-zinc-700'
        }`}
      >
        {isSearching ? (
          <Loader2 className="w-3.5 h-3.5 text-zinc-500 shrink-0 animate-spin" />
        ) : (
          <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search leads, contacts, accounts…"
          className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none min-w-0"
        />
        {query ? (
          <button
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus(); }}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-0.5 shrink-0">
            <kbd className="flex items-center gap-0.5 px-1 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-[10px] text-zinc-500">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-md shadow-2xl overflow-hidden"
          >
            {/* Not connected */}
            {results && !results.connected && (
              <div className="flex items-center gap-3 px-4 py-5 text-zinc-500">
                <CloudOff className="w-4 h-4 shrink-0" />
                <p className="text-sm">Connect Salesforce to search your CRM data</p>
              </div>
            )}

            {/* Waiting for 2+ chars */}
            {!hasQuery && query.length > 0 && (
              <p className="px-4 py-3 text-xs text-zinc-600">Type at least 2 characters to search…</p>
            )}

            {/* Loading */}
            {hasQuery && isSearching && allItems.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-4 text-zinc-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching Salesforce…
              </div>
            )}

            {/* No results */}
            {hasQuery && !isSearching && results && results.total === 0 && (
              <p className="px-4 py-4 text-sm text-zinc-500">
                No results for <span className="text-zinc-300 font-medium">"{query}"</span>
              </p>
            )}

            {/* Results */}
            {allItems.length > 0 && (
              <div className="py-1 max-h-[420px] overflow-y-auto">
                {(['lead', 'contact', 'account'] as const).map((kind) => {
                  const group = allItems.filter((i) => i.kind === kind);
                  if (!group.length) return null;
                  const Icon = SECTION_ICONS[kind];
                  const labels = { lead: 'Leads', contact: 'Contacts', account: 'Accounts' };
                  return (
                    <div key={kind}>
                      <div className="flex items-center gap-2 px-4 py-1.5">
                        <Icon className="w-3 h-3 text-zinc-600" />
                        <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                          {labels[kind]}
                        </span>
                      </div>
                      {group.map((item, localIdx) => {
                        const globalIdx = allItems.indexOf(item);
                        return (
                          <ResultRow
                            key={item.data.id}
                            item={item}
                            isActive={globalIdx === activeIdx}
                            query={query}
                            onSelect={handleSelect}
                          />
                        );
                      })}
                    </div>
                  );
                })}

                <div className="px-4 py-2 border-t border-zinc-800 mt-1">
                  <p className="text-[11px] text-zinc-600">
                    ↑↓ navigate · ↵ ask AI · Esc close
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
