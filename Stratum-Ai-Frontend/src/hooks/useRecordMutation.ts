import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PIPELINE_QUERY_KEY } from './usePipeline';
import { DASHBOARD_QUERY_KEY } from './useDashboard';

const api = axios.create({ withCredentials: true });

interface CreatePayload {
  objectType: string;
  fields: Record<string, unknown>;
}

interface UpdatePayload {
  objectType: string;
  recordId: string;
  fields: Record<string, unknown>;
}

interface MutationResult {
  id: string;
  objectType: string;
  message: string;
}

export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation<MutationResult, Error, CreatePayload>({
    mutationFn: async ({ objectType, fields }) => {
      const { data } = await api.post<{ success: boolean; data: MutationResult }>(
        '/api/salesforce/records',
        { objectType, fields },
      );
      if (!data.success) throw new Error('Failed to create record');
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PIPELINE_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });
}

export function useUpdateRecord() {
  const qc = useQueryClient();
  return useMutation<MutationResult, Error, UpdatePayload>({
    mutationFn: async ({ objectType, recordId, fields }) => {
      const { data } = await api.patch<{ success: boolean; data: MutationResult }>(
        `/api/salesforce/records/${objectType}/${recordId}`,
        { fields },
      );
      if (!data.success) throw new Error('Failed to update record');
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PIPELINE_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });
}
