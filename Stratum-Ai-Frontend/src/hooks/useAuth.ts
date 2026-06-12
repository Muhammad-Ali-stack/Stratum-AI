import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getMe, login, logout, register } from '@/lib/api';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useMe() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      register(email, password),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.clear();
      navigate('/');
    },
  });
}
