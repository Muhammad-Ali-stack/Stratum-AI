import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSalesforceStatus,
  getSalesforceConnectUrl,
  disconnectSalesforce,
} from '@/lib/api';

export const SF_STATUS_QUERY_KEY = ['salesforce', 'status'] as const;

export function useSalesforceStatus() {
  return useQuery({
    queryKey: SF_STATUS_QUERY_KEY,
    queryFn: getSalesforceStatus,
    staleTime: 60_000,
  });
}

export function useConnectSalesforce() {
  return useMutation({
    mutationFn: async () => {
      const url = await getSalesforceConnectUrl();
      window.location.href = url;
    },
  });
}

export function useDisconnectSalesforce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disconnectSalesforce,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SF_STATUS_QUERY_KEY });
    },
  });
}
