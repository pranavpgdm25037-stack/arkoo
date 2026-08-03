import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useListCustomers() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('public-customers-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      
      return data.map((c: any) => {
        let email = 'N/A';
        let phone = 'N/A';
        try {
          if (typeof c.contact_info === 'string') {
            const parsed = JSON.parse(c.contact_info);
            email = parsed.email || 'N/A';
            phone = parsed.phone || 'N/A';
          } else if (c.contact_info) {
            email = c.contact_info.email || 'N/A';
            phone = c.contact_info.phone || 'N/A';
          }
        } catch (e) {}
        
        return {
          id: c.id,
          name: c.name,
          email,
          phone,
          address: c.address,
          created_at: c.created_at,
          projects: c.projects || [],
          rawData: c.rawData || {}
        };
      });
    }
  });
}
