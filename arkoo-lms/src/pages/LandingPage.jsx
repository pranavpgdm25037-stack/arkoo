import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState('idle');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      // 1. Save to Supabase
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          status: 'new'
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // 2. Call Netlify Function to send email
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email
        })
      });
      
      if (!response.ok) {
        console.error('Failed to trigger email function');
      }

      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      console.error('Error submitting form:', err);
      setStatus('error');
    }
  };

  return (
    <div className="page-container flex-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="glass-container animate-fade-in" style={{ width: '100%', maxWidth: '600px' }}>
        <h1 className="heading-1" style={{ textAlign: 'center' }}>Arkoo LMS</h1>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Tell us a little about your project, and we'll send you an application form.
        </p>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '50%', 
              backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', fontSize: '1.5rem'
            }}>✓</div>
            <h2 className="heading-2">Request Received!</h2>
            <p className="text-muted">We've sent an application link to your email. Please check your inbox.</p>
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => setStatus('idle')}>
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input 
                type="text" id="name" name="name" className="form-input" 
                value={formData.name} onChange={handleChange} required 
                placeholder="John Doe"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input 
                type="email" id="email" name="email" className="form-input" 
                value={formData.email} onChange={handleChange} required 
                placeholder="john@example.com"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number (Optional)</label>
              <input 
                type="tel" id="phone" name="phone" className="form-input" 
                value={formData.phone} onChange={handleChange} 
                placeholder="+1 (555) 000-0000"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="message">Brief Message</label>
              <textarea 
                id="message" name="message" className="form-textarea" 
                value={formData.message} onChange={handleChange} required 
                placeholder="How can we help you?"
              />
            </div>

            {status === 'error' && (
              <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                There was an error submitting your request. Please try again.
              </p>
            )}
            
            <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
              {status === 'submitting' ? (
                <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span> Submitting...</>
              ) : 'Get Started'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
