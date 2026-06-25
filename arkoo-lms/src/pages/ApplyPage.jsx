import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ApplyPage() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('id');
  
  const [formData, setFormData] = useState({
    projectType: 'web_app',
    budget: '',
    timeline: '',
    description: '',
    goals: ''
  });
  const [status, setStatus] = useState('idle');
  const [leadValid, setLeadValid] = useState(null);

  useEffect(() => {
    async function checkLead() {
      if (!leadId) {
        setLeadValid(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('leads')
        .select('id, status')
        .eq('id', leadId)
        .single();
        
      if (error || !data || data.status === 'form_submitted') {
        setLeadValid(false);
      } else {
        setLeadValid(true);
      }
    }
    
    checkLead();
  }, [leadId]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      // 1. Update Supabase
      const { error } = await supabase
        .from('leads')
        .update({ 
          apply_answers: formData,
          status: 'form_submitted'
        })
        .eq('id', leadId);
        
      if (error) throw error;
      
      // 2. Call Netlify Function to score lead via Claude
      fetch('/api/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadId,
          answers: formData
        })
      }).catch(err => console.error("Error triggering score:", err));
      // We don't await the score function so the user isn't kept waiting
      
      setStatus('success');
    } catch (err) {
      console.error('Error submitting application:', err);
      setStatus('error');
    }
  };

  if (leadValid === null) {
    return (
      <div className="fullscreen-loader">
        <div className="spinner"></div>
        <p>Verifying application link...</p>
      </div>
    );
  }

  if (leadValid === false) {
    return (
      <div className="page-container flex-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="glass-container" style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ color: '#ef4444', fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 className="heading-2">Invalid or Expired Link</h2>
          <p className="text-muted">This application link is invalid or has already been submitted. Please contact support if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex-center" style={{ minHeight: 'calc(100vh - 80px)', padding: '2rem 1.5rem' }}>
      <div className="glass-container animate-fade-in" style={{ width: '100%', maxWidth: '700px' }}>
        <h1 className="heading-1">Project Application</h1>
        <p className="text-muted" style={{ marginBottom: '2.5rem' }}>
          Please provide details about your project so we can better understand your needs.
        </p>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem', fontSize: '2.5rem'
            }}>🎉</div>
            <h2 className="heading-2">Application Submitted!</h2>
            <p className="text-muted">Thank you for providing the details. Our team will review your application and get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="projectType">Project Type</label>
              <select 
                id="projectType" name="projectType" className="form-select" 
                value={formData.projectType} onChange={handleChange} required
              >
                <option value="web_app">Web Application</option>
                <option value="mobile_app">Mobile Application</option>
                <option value="website">Website Redesign / Landing Page</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="budget">Estimated Budget</label>
                <select 
                  id="budget" name="budget" className="form-select" 
                  value={formData.budget} onChange={handleChange} required
                >
                  <option value="" disabled>Select a range</option>
                  <option value="under_5k">Under $5,000</option>
                  <option value="5k_15k">$5,000 - $15,000</option>
                  <option value="15k_50k">$15,000 - $50,000</option>
                  <option value="50k_plus">$50,000+</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="timeline">Desired Timeline</label>
                <select 
                  id="timeline" name="timeline" className="form-select" 
                  value={formData.timeline} onChange={handleChange} required
                >
                  <option value="" disabled>Select a timeline</option>
                  <option value="asap">ASAP (Less than 1 month)</option>
                  <option value="1_3_months">1 - 3 months</option>
                  <option value="3_6_months">3 - 6 months</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="description">Project Description</label>
              <textarea 
                id="description" name="description" className="form-textarea" 
                value={formData.description} onChange={handleChange} required 
                placeholder="Describe your project, the problem you're solving, and your target audience..."
                style={{ minHeight: '150px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="goals">Key Goals & Metrics for Success</label>
              <textarea 
                id="goals" name="goals" className="form-textarea" 
                value={formData.goals} onChange={handleChange} required 
                placeholder="What does success look like for this project?"
                style={{ minHeight: '100px' }}
              />
            </div>

            {status === 'error' && (
              <p style={{ color: '#ef4444', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                There was an error submitting your application. Please try again.
              </p>
            )}
            
            <button type="submit" className="btn btn-primary" disabled={status === 'submitting'} style={{ marginTop: '1rem' }}>
              {status === 'submitting' ? (
                <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span> Submitting...</>
              ) : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
