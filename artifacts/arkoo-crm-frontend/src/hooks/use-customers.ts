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
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) {
        console.error("Customers query error:", customersError);
        throw customersError;
      }
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
        
      if (projectsError) {
        console.error("Projects query error:", projectsError);
      }
      
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, rawData');
        
      if (leadsError) {
        console.error("Leads query error:", leadsError);
      }

      // Parse JSON contact info and join
      return (customersData || []).map(c => {
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
        
        const customerProjects = projectsData?.filter(p => p.customer_id === c.id) || [];
        const relatedLead = leadsData?.find(l => l.id === c.lead_id);
        
        return {
          id: c.id,
          name: c.name,
          email,
          phone,
          address: c.address,
          created_at: c.created_at,
          projects: customerProjects,
          rawData: relatedLead?.rawData || {}
        };
      });
    }
  });
}
