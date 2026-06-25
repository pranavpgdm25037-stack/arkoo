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
    ai_score: leadData.ai_score !== undefined ? leadData.ai_score : (leadData.aiScore || 0),
    ai_label: leadData.ai_label || leadData.aiCategory || 'PENDING',
    assigned_to: leadData.assigned_to || leadData.assignedToUserId,
    created_at: leadData.created_at || leadData.createdAt,
    updated_at: leadData.updated_at || leadData.updatedAt,
    location: leadData.location,
    project_type: leadData.project_type,
    notes: leadData.notes || '',
    raw_data: leadData.rawData || null,
    area_sqft: leadData.area_sqft,
    budget: leadData.budget,
    timeline: leadData.timeline
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

export function useGetLead(id: string, options?: any) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`lead-detail-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['lead', String(id)] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${id}`);
      if (!response.ok) throw new Error('Failed to fetch lead details');
      const data = await response.json();
      return mapLeadData(data);
    },
    refetchInterval: 3000,
    ...options,
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

export function useSendFormEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await fetch(`/api/leads/${id}/send-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        let errorMsg = 'Failed to send form email';
        try {
          const data = await response.json();
          if (data.error) errorMsg = data.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }
      return await response.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', String(id)] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    }
  });
}
