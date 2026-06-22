import React, { useState, useEffect } from 'react';
import '../landing.css';

export default function LandingPage() {
  const [projectType, setProjectType] = useState('PEB Structure');
  const [customProjectType, setCustomProjectType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
  const [completionPercent, setCompletionPercent] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    area: '',
    budget: '',
    timeline: '',
    requirements: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    let requiredCount = 7; // name, phone, email, type, location, area, budget, timeline = 8. (Type is always set, timeline is required)
    if (projectType === 'Other') requiredCount = 8;
    
    let completedCount = 0;
    if (formData.name.trim().length >= 2) completedCount++;
    if (/^\+?[0-9]{10,15}$/.test(formData.phone)) completedCount++;
    if (formData.email.includes('@')) completedCount++;
    if (formData.location.trim().length >= 2) completedCount++;
    if (parseInt(formData.area) > 0) completedCount++;
    if (formData.budget !== '') completedCount++;
    if (formData.timeline !== '') completedCount++;
    
    if (projectType === 'Other') {
      if (customProjectType.trim().length >= 3) completedCount++;
    }

    const percent = Math.round((completedCount / requiredCount) * 100);
    setCompletionPercent(percent > 100 ? 100 : percent);
  }, [formData, projectType, customProjectType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    // Basic Validation Check
    if (completionPercent < 100) {
      setNotification({ type: 'error', message: 'Please resolve all highlighted technical specification validation errors before transmitting.' });
      return;
    }

    setIsLoading(true);
    setNotification({ type: 'loading', message: 'Securely encapsulating data & routing request to gateway...' });

    let typeVal = projectType === 'Other' ? customProjectType : projectType;
    let combinedRequirements = `Project Type: ${typeVal}\nLocation: ${formData.location}\nArea: ${formData.area} Sq. Ft.\nBudget: ${formData.budget}\nTimeline: ${formData.timeline}`;
    if (formData.requirements) {
      combinedRequirements += `\n\nAdditional Comments: ${formData.requirements}`;
    }

    const payload = {
      fullName: formData.name,
      phone: formData.phone,
      email: formData.email,
      leadSource: "Landing Page",
      source: "Landing Page",
      projectType: typeVal,
      projectLocation: formData.location,
      projectAreaSqft: parseInt(formData.area) || 0,
      estimatedBudget: formData.budget,
      completionTimeline: formData.timeline,
      requirements: combinedRequirements,
      project: {
        type: typeVal,
        location: formData.location,
        area: parseInt(formData.area) || 0,
        budget: formData.budget,
        completionTime: formData.timeline
      }
    };

    try {
      // Point to relative API endpoint since both run on same domain/port in production
      const apiEndpoint = '/api/lms/leads/ingest';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.message && (result.message.includes("already exists") || result.message.includes("duplicate"))) {
          setNotification({ type: 'error', message: 'Lead registration skipped: This phone number or email address is already registered in our system.' });
          setIsLoading(false);
          return;
        }

        // Trigger Netlify Serverless Function to send SMTP email securely
        fetch('/.netlify/functions/send-lead-email', {
          method: 'POST',
          body: JSON.stringify({
            customerName: formData.name,
            phoneNumber: formData.phone,
            emailAddress: formData.email,
            projectLocation: formData.location,
            projectType: typeVal,
            projectAreaSqft: parseInt(formData.area) || 0,
            estimatedBudget: formData.budget,
            completionTimeline: formData.timeline,
            leadSource: "Landing Page",
            requirements: combinedRequirements
          })
        }).catch(err => console.error("SMTP Function error:", err));

        setNotification({ type: 'success', message: 'Enquiry ingested successfully! Redirecting to contact desk details page...' });
        
        setFormData({ name: '', phone: '', email: '', location: '', area: '', budget: '', timeline: '', requirements: '' });
        setProjectType('PEB Structure');
        setCustomProjectType('');
        
        setTimeout(() => {
          window.location.href = 'https://www.arkooprebuild.com';
        }, 2200);

      } else {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }
    } catch (error) {
      console.error('Lead Transmission Pipeline Exception:', error);
      setNotification({ type: 'error', message: 'Technical ingestion failed. Please verify internet connection or contact us directly at arkooprebuild.com/contact.html.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-wrapper">
      <div className="industrial-bg-grid"></div>
      <div className="glow-sphere orange-glow"></div>
      <div className="glow-sphere blue-glow"></div>

      <div className="network-nodes-bg">
        <svg className="nodes-svg" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 150 Q 200 80 450 220 T 800 150" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" fill="none" />
          <path d="M950 120 Q 1100 280 1150 480" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" fill="none" />
          <path d="M100 580 Q 250 620 400 520 T 700 680" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" fill="none" />
          <path d="M800 680 Q 980 580 1120 620" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" fill="none" />
          
          <path d="M450 220 L 700 680" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          <path d="M800 150 L 950 120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          
          <circle cx="450" cy="220" r="4" className="pulse-node" />
          <circle cx="800" cy="150" r="3" className="pulse-node-slow" />
          <circle cx="950" cy="120" r="4" className="pulse-node" />
          <circle cx="400" cy="520" r="3" className="pulse-node-slow" />
          <circle cx="800" cy="680" r="4" className="pulse-node" />
        </svg>
        
        <div className="tech-metric metric-top-left">
          <span className="metric-dot amber"></span>
          <div className="metric-info">
            <span className="metric-name">PEB Engine</span>
            <span className="metric-val">20.945</span>
          </div>
        </div>
        
        <div className="tech-metric metric-top-right">
          <span className="metric-dot blue"></span>
          <div className="metric-info">
            <span className="metric-name">LMS Ingest</span>
            <span className="metric-val">2.945</span>
          </div>
        </div>
        
        <div className="tech-metric metric-bottom-left">
          <span className="metric-dot blue"></span>
          <div className="metric-info">
            <span className="metric-name">BIM Analysis</span>
            <span className="metric-val">19.346</span>
          </div>
        </div>
        
        <div className="tech-metric metric-bottom-right">
          <span className="metric-dot amber"></span>
          <div className="metric-info">
            <span className="metric-name">Telemetry</span>
            <span className="metric-val">440</span>
          </div>
        </div>

        <div className="light-beams">
          <div className="beam beam-1"></div>
          <div className="beam beam-2"></div>
          <div className="beam beam-3"></div>
          <div className="beam beam-4"></div>
        </div>
      </div>

      <main className="page-container">
        <header className="main-header">
          <div className="logo-area">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--color-amber)" />
              <path d="M2 17L12 22L22 17" stroke="var(--color-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="var(--color-slate-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="brand-text">
              <span className="brand-main">ARKOO</span>
              <span className="brand-sub">PREBUILD</span>
            </div>
          </div>
          <div className="header-badge">
            <span className="badge-dot"></span>
            <span className="badge-label">Enterprise Lead Ingestion V2</span>
          </div>
        </header>

        <section className="hero-section">
          <h1 className="hero-title">High-Performance Pre-Engineered Buildings</h1>
          <p className="hero-subtitle">
            Accelerate your industrial deployment. Submit your project requirements to receive a comprehensive PEB structural layout, feasibility assessment, and technical cost proposal from Arkoo Prebuild's engineering division.
          </p>
        </section>

        <article className="enquiry-card">
          <div className="card-header">
            <div className="card-title-row">
              <h2 className="card-title">Technical Project Specification Form</h2>
              <span className="progress-text" style={completionPercent === 100 ? { borderColor: 'var(--color-green)', color: 'var(--color-green)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)' } : {}}>
                {completionPercent}% Completed
              </span>
            </div>
            <p className="card-desc">Please complete all fields to transmit your query directly to our sales engineering gateway.</p>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${completionPercent}%` }}></div>
            </div>
          </div>

          <form id="peb-enquiry-form" noValidate autoComplete="off" onSubmit={handleSubmit}>
            
            <fieldset className="form-section">
              <legend className="section-legend">
                <span className="legend-number">01</span>
                <span className="legend-text">Contact Profile</span>
              </legend>
              
              <div className="form-grid-2col">
                <div className={`form-group ${formData.name !== '' && formData.name.length < 2 ? 'invalid' : ''}`}>
                  <label htmlFor="contact-name" className="form-label">
                    Full Name <span className="required-indicator">*</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </span>
                    <input 
                      type="text" 
                      id="contact-name" 
                      name="name" 
                      className="form-control" 
                      placeholder="Enter your first & last name" 
                      required 
                      minLength={2}
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="error-message">
                    Please enter your full name (minimum 2 characters).
                  </div>
                </div>

                <div className={`form-group ${formData.phone !== '' && !/^\+?[0-9]{10,15}$/.test(formData.phone) ? 'invalid' : ''}`}>
                  <label htmlFor="contact-phone" className="form-label">
                    Contact Number <span className="required-indicator">*</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </span>
                    <input 
                      type="tel" 
                      id="contact-phone" 
                      name="phone" 
                      className="form-control" 
                      placeholder="Enter digits (e.g. +1234567890)" 
                      required 
                      pattern="^\+?[0-9]{10,15}$"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="error-message">
                    Please enter a valid phone number (10 to 15 digits, digits only, optional '+' prefix).
                  </div>
                </div>
              </div>

              <div className={`form-group ${formData.email !== '' && !formData.email.includes('@') ? 'invalid' : ''}`}>
                <label htmlFor="contact-email" className="form-label">
                  Corporate Email <span className="required-indicator">*</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </span>
                  <input 
                    type="email" 
                    id="contact-email" 
                    name="email" 
                    className="form-control" 
                    placeholder="you@company.com" 
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="error-message">
                  Please enter a valid corporate email address.
                </div>
              </div>
            </fieldset>

            <fieldset className="form-section">
              <legend className="section-legend">
                <span className="legend-number">02</span>
                <span className="legend-text">Project Details</span>
              </legend>
              
              <div className="form-grid-2col">
                <div className="form-group">
                  <label htmlFor="project-type" className="form-label">
                    Project Type <span className="required-indicator">*</span>
                  </label>
                  <div className="select-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M4 10V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6"></path><path d="M12 4v16"></path></svg>
                    </span>
                    <select 
                      id="project-type" 
                      className="form-control select-control" 
                      required
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                    >
                      <option value="" disabled>Select project type...</option>
                      <option value="PEB Structure">PEB Structure (Standard)</option>
                      <option value="PEB Warehouse">PEB Warehouse</option>
                      <option value="Industrial Shed">Industrial Shed</option>
                      <option value="Commercial Space">Commercial Space</option>
                      <option value="Interior Design">Interior Design</option>
                      <option value="Other">Other (Write on own)</option>
                    </select>
                    <span className="select-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </div>
                </div>

                {projectType === 'Other' && (
                  <div className={`form-group ${customProjectType !== '' && customProjectType.length < 3 ? 'invalid' : ''}`} style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="custom-project-type" className="form-label">
                      Custom Project Type <span className="required-indicator">*</span>
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </span>
                      <input 
                        type="text" 
                        id="custom-project-type" 
                        className="form-control" 
                        placeholder="Enter your custom project type" 
                        minLength={3}
                        required
                        value={customProjectType}
                        onChange={(e) => setCustomProjectType(e.target.value)}
                      />
                    </div>
                    <div className="error-message">
                      Please enter your custom project type (minimum 3 characters).
                    </div>
                  </div>
                )}

                <div className={`form-group ${formData.location !== '' && formData.location.length < 2 ? 'invalid' : ''}`}>
                  <label htmlFor="project-location" className="form-label">
                    Project Location <span className="required-indicator">*</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </span>
                    <input 
                      type="text" 
                      id="project-location" 
                      name="location" 
                      className="form-control" 
                      placeholder="E.g. Pune, Goa, Nagpur" 
                      required 
                      minLength={2}
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="error-message">
                    Please enter the project location (minimum 2 characters).
                  </div>
                </div>
              </div>

              <div className="form-grid-2col" style={{ marginTop: '1.5rem' }}>
                <div className={`form-group ${formData.area !== '' && parseInt(formData.area) <= 0 ? 'invalid' : ''}`}>
                  <label htmlFor="project-area" className="form-label">
                    Project Area (Sq. Ft.) <span className="required-indicator">*</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
                    </span>
                    <input 
                      type="number" 
                      id="project-area" 
                      name="area" 
                      className="form-control" 
                      placeholder="E.g. 5000" 
                      required 
                      min="1"
                      value={formData.area}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="error-message">
                    Please enter a valid positive project area in square feet.
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="project-budget" className="form-label">
                    Project Budget <span className="required-indicator">*</span>
                  </label>
                  <div className="select-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17" y1="5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </span>
                    <select 
                      id="project-budget" 
                      name="budget" 
                      className="form-control select-control" 
                      required
                      value={formData.budget}
                      onChange={handleInputChange}
                    >
                      <option value="" disabled>Select budget range...</option>
                      <option value="Under 15 Lakhs">Under 15 Lakhs</option>
                      <option value="15 - 30 Lakhs">15 - 30 Lakhs</option>
                      <option value="30 - 50 Lakhs">30 - 50 Lakhs</option>
                      <option value="50 Lakhs - 1 Crore">50 Lakhs - 1 Crore</option>
                      <option value="1 - 2 Crores">1 - 2 Crores</option>
                      <option value="Above 2 Crores">Above 2 Crores</option>
                    </select>
                    <span className="select-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </div>
                  <div className="error-message">
                    Please select a project budget range.
                  </div>
                </div>
              </div>

              <div className="form-grid-2col" style={{ marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="project-timeline" className="form-label">
                    Completion Time of Project <span className="required-indicator">*</span>
                  </label>
                  <div className="select-wrapper">
                    <span className="input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </span>
                    <select 
                      id="project-timeline" 
                      name="timeline" 
                      className="form-control select-control" 
                      required
                      value={formData.timeline}
                      onChange={handleInputChange}
                    >
                      <option value="" disabled>Select completion time...</option>
                      <option value="Immediate / Urgent">Immediate / Urgent</option>
                      <option value="1 - 3 Months">1 - 3 Months</option>
                      <option value="3 - 6 Months">3 - 6 Months</option>
                      <option value="6+ Months">6+ Months</option>
                    </select>
                    <span className="select-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </div>
                  <div className="error-message">
                    Please select an expected completion timeline.
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="project-requirements" className="form-label">
                    Additional Details / Comments
                  </label>
                  <div className="input-wrapper">
                    <textarea 
                      id="project-requirements" 
                      name="requirements" 
                      className="form-control" 
                      placeholder="Mention any custom specifications, e.g. double height, crane, mezzanine, etc. (optional)" 
                      rows={4}
                      style={{ resize: 'vertical', minHeight: '48px', paddingTop: '12px', paddingLeft: '15px', height: '3rem' }}
                      value={formData.requirements}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>
              </div>
            </fieldset>

            {notification && (
              <div className={`notification-banner ${notification.type}`} role="alert" aria-live="polite" style={{ display: 'block' }}>
                <div className="notification-content">
                  {notification.type === 'loading' && (
                    <svg className="notification-icon animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {notification.type === 'success' && (
                    <svg className="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg className="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  )}
                  <span className="notification-text">{notification.message}</span>
                </div>
              </div>
            )}

            <button type="submit" className="submit-button" disabled={isLoading}>
              <span className="btn-text">{isLoading ? 'Transmitting Data...' : 'Submit Enquiry & Request Quote'}</span>
              <span className="btn-shine"></span>
            </button>

          </form>
        </article>

        <footer className="main-footer">
          <p>© 2026 Arkoo Prebuild. All technical schematics & industrial design processes are proprietary trademarks.</p>
        </footer>
      </main>
    </div>
  );
}
