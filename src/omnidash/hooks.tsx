import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchSettings, updateSettings } from './api';
import { OMNIDASH_ADMIN_ALLOWLIST, OMNIDASH_FLAG, OmniDashSettings } from './types';

export function useAdminAccess() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['omnidash-role', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const allowlistHit = OMNIDASH_ADMIN_ALLOWLIST.includes((user.email || '').toLowerCase());
      if (allowlistHit) return true;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.role === 'admin';
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    isAdmin: !!data,
    loading: isLoading,
    error,
    featureEnabled: OMNIDASH_FLAG,
  };
}

export function useOmniDashSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<OmniDashSettings>({
    queryKey: ['omnidash-settings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('User not found');
      return fetchSettings(user.id);
    },
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<OmniDashSettings>) => {
      if (!user) throw new Error('User not found');
      return updateSettings(user.id, patch);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['omnidash-settings', user?.id], data);
    },
  });

  return { ...query, updateSettings: mutation.mutateAsync, updating: mutation.isPending };
}

