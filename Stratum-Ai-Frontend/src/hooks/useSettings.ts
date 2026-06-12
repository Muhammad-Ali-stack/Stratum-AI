import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '@/lib/api';
import type { UserSettings } from '../types/shared';

export const SETTINGS_QUERY_KEY = ['settings'] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: getSettings,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Pick<UserSettings, 'preferred_ai_model' | 'show_api_transparency'>>) =>
      updateSettings(updates),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
}
