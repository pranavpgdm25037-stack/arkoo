import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Helper to flat-map Supabase data to match the UI expected shape
const mapLeadData = (leadData: any) => {
  return {
    id: leadData.id,
    name: leadData.name || 'Unknown',
    email: leadData.email || 'N/A',
    phone: leadData.phone || 'N/A',
    source: leadData.source,
    status: leadData.status,
    ai_score: leadData.ai_score,
    ai_label: leadData.ai_label,
    assigned_to: leadData.assigned_to,
    created_at: leadData.created_at,
    updated_at: leadData.updated_at,
    location: leadData.location,
    project_type: leadData.project_type
  };
};

export function useListLeads(queryParams: any, options: any) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('public-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['leads', queryParams],
    queryFn: async () => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryParams),
      });
      
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      return data.map(mapLeadData);
    },
    ...options,
  });
}

export function useListLandingLeads(options?: any) {
  return useQuery({
    queryKey: ['landing-leads'],
    queryFn: async () => {
      const response = await fetch('/api/leads/landing');
      if (!response.ok) throw new Error('Failed to fetch landing leads');
      return await response.json();
    },
    ...options,
  });
}

export function useGetLeadsStats(options?: any) {
  return useQuery<any>({
    queryKey: ['leads-stats'],
    queryFn: async () => {
      const response = await fetch('/api/leads/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    },
    ...options,
  });
}

export function useGetLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${id}`);
      if (!response.ok) throw new Error('Failed to fetch lead details');
      const data = await response.json();
      return mapLeadData(data);
    }
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update lead');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    }
  });
}
