import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchCRM } from '@/lib/api';

export function useDashboardSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching, error } = useQuery({
    queryKey: ['dashboard', 'search', debouncedQuery],
    queryFn: () => searchCRM(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });

  return {
    query,
    setQuery,
    results: data ?? null,
    isSearching: isFetching,
    hasQuery: debouncedQuery.length >= 2,
    error,
  };
}
