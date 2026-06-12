import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/lib/api';

export const DASHBOARD_QUERY_KEY = ['dashboard', 'stats'] as const;

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: getDashboardStats,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
}
