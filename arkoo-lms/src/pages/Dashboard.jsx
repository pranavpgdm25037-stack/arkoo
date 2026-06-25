import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeads();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('leads_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        handleRealtimeChange(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeChange = (payload) => {
    if (payload.eventType === 'INSERT') {
      setLeads((prev) => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setLeads((prev) => prev.map((lead) => lead.id === payload.new.id ? payload.new : lead));
    } else if (payload.eventType === 'DELETE') {
      setLeads((prev) => prev.filter((lead) => lead.id !== payload.old.id));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="badge badge-new">New</span>;
      case 'form_pending':
        return <span className="badge badge-pending">Form Pending</span>;
      case 'form_submitted':
        return <span className="badge badge-submitted">Form Submitted</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getScoreDisplay = (score) => {
    if (score === null || score === undefined) return <span className="text-muted">-</span>;
    
    let colorClass = 'score-high';
    if (score < 5) colorClass = 'score-low';
    else if (score >= 5 && score <= 7) colorClass = 'score-med';

    return <div className={`score-badge ${colorClass}`}>{score}</div>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="fullscreen-loader">
        <div className="spinner"></div>
        <p>Loading your leads...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="heading-1" style={{ marginBottom: 0 }}>Lead Dashboard</h1>
        <div className="text-muted">
          Total Leads: <span style={{ color: 'white', fontWeight: 600 }}>{leads.length}</span>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '0.5rem', marginBottom: '1.5rem', color: '#fca5a5' }}>
          Error: {error}
        </div>
      )}

      {leads.length === 0 ? (
        <div className="glass-container dashboard-empty">
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📥</div>
          <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>No leads yet</h2>
          <p>When someone fills out your contact form, they will appear here in real-time.</p>
        </div>
      ) : (
        <div className="table-container animate-fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name / Email</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>AI Score</th>
                <th>AI Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ whiteSpace: 'nowrap' }} className="text-muted">
                    {formatDate(lead.created_at)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{lead.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                      <a href={`mailto:${lead.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {lead.email}
                      </a>
                    </div>
                  </td>
                  <td>{getStatusBadge(lead.status)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex-center">
                      {getScoreDisplay(lead.ai_score)}
                    </div>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    {lead.ai_reasoning ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={lead.ai_reasoning}>
                        {lead.ai_reasoning}
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>Pending evaluation</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
