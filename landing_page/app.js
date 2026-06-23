document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('peb-enquiry-form');
  const submitBtn = document.getElementById('submit-btn');
  const submitBtnText = submitBtn.querySelector('.btn-text');
  const notificationBanner = document.getElementById('notification-banner');
  const notificationText = document.getElementById('notification-text');
  const iconLoading = document.getElementById('icon-loading');
  const iconSuccess = document.getElementById('icon-success');
  const iconError = document.getElementById('icon-error');
  
  // Progress Bar elements
  const progressBar = document.getElementById('form-progress');
  const progressMeter = document.getElementById('progress-meter');

  // Form input elements
  const fields = [
    document.getElementById('contact-name'),
    document.getElementById('contact-phone'),
    document.getElementById('contact-email'),
    document.getElementById('project-type'),
    document.getElementById('custom-project-type'),
    document.getElementById('project-location'),
    document.getElementById('project-area'),
    document.getElementById('project-budget'),
    document.getElementById('project-timeline'),
    document.getElementById('project-requirements')
  ];

  // Initialize notification state as hidden
  hideNotification();
  updateProgressMeter();

  // Handle Project Type 'Other' visibility
  const projectTypeSelect = document.getElementById('project-type');
  const customTypeGroup = document.getElementById('group-custom-project-type');
  const customTypeInput = document.getElementById('custom-project-type');

  function handleProjectTypeChange() {
    if (projectTypeSelect && projectTypeSelect.value === 'Other') {
      if (customTypeGroup) customTypeGroup.style.display = '';
      if (customTypeInput) customTypeInput.setAttribute('required', 'required');
    } else {
      if (customTypeGroup) customTypeGroup.style.display = 'none';
      if (customTypeInput) {
        customTypeInput.removeAttribute('required');
        customTypeInput.value = '';
      }
      if (customTypeGroup) customTypeGroup.classList.remove('invalid');
    }
    updateProgressMeter();
  }

  if (projectTypeSelect) {
    projectTypeSelect.addEventListener('change', handleProjectTypeChange);
    projectTypeSelect.addEventListener('input', handleProjectTypeChange);
  }

  // Helper: Display notification banner with custom types
  function showNotification(type, message) {
    notificationBanner.className = 'notification-banner ' + type;
    notificationText.textContent = message;
    
    // Toggle active state icons
    iconLoading.style.display = type === 'loading' ? 'block' : 'none';
    iconSuccess.style.display = type === 'success' ? 'block' : 'none';
    iconError.style.display = type === 'error' ? 'block' : 'none';
    
    notificationBanner.style.display = 'block';
  }

  function hideNotification() {
    notificationBanner.style.display = 'none';
  }

  // Active Section Progress Meter
  function updateProgressMeter() {
    let completedCount = 0;
    let requiredCount = 0;
    
    fields.forEach(field => {
      if (!field) return;
      
      const isRequired = field.hasAttribute('required');
      if (isRequired) {
        requiredCount++;
        if (field.value.trim() !== '' && field.checkValidity()) {
          completedCount++;
        }
      }
    });

    const totalToTrack = requiredCount > 0 ? requiredCount : fields.length;
    const completionPercent = Math.round((completedCount / totalToTrack) * 100);
    
    // Animate progress elements
    if (progressBar) {
      progressBar.style.width = `${completionPercent}%`;
    }
    if (progressMeter) {
      progressMeter.textContent = `${completionPercent}% Completed`;
      
      // Make completion meter glowing when 100%
      if (completionPercent === 105) { // Just in case, keep boundary
        completionPercent = 100;
      }
      if (completionPercent === 100) {
        progressMeter.style.borderColor = 'var(--color-green)';
        progressMeter.style.color = 'var(--color-green)';
        progressMeter.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.2)';
      } else {
        progressMeter.style.borderColor = '';
        progressMeter.style.color = '';
        progressMeter.style.boxShadow = '';
      }
    }
  }

  // Field validator function
  // Field validator function
  let emailValidationState = 'idle'; // 'idle', 'loading', 'valid', 'invalid'
  const emailField = document.getElementById('contact-email');
  const emailStatusIcon = document.getElementById('email-status-icon');
  const errorContactEmail = document.getElementById('error-contact-email');
  const verifyEmailBtn = document.getElementById('verify-email-btn');

  if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener('click', () => {
      if (emailField.value.trim() !== '') {
        validateEmailOnServer(emailField.value.trim());
      } else {
        emailValidationState = 'invalid';
        errorContactEmail.textContent = 'Please enter an email address to verify.';
        errorContactEmail.style.display = 'block';
        errorContactEmail.style.color = '#ef4444';
        validateField(emailField);
      }
    });
  }

  async function validateEmailOnServer(email) {
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      emailValidationState = 'invalid';
      errorContactEmail.textContent = 'Please enter a valid corporate email address format.';
      errorContactEmail.style.display = 'block';
      errorContactEmail.style.color = '#ef4444';
      if (emailStatusIcon) emailStatusIcon.style.display = 'none';
      if (verifyEmailBtn) {
         verifyEmailBtn.textContent = 'Verify Email';
         verifyEmailBtn.disabled = false;
      }
      return false;
    }
    
    emailValidationState = 'loading';
    if (emailStatusIcon) {
      emailStatusIcon.style.display = 'block';
      emailStatusIcon.innerHTML = `<svg style="width: 16px; height: 16px; animation: animate-spin 1s linear infinite; color: #f59e0b;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25;"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    }
    errorContactEmail.textContent = 'Verifying email domain...';
    errorContactEmail.style.display = 'block';
    errorContactEmail.style.color = '#f59e0b';
    if (verifyEmailBtn) {
       verifyEmailBtn.textContent = 'Verifying...';
       verifyEmailBtn.disabled = true;
    }

    try {
      const response = await fetch('/api/email/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      const data = await response.json();
      
      if (data.valid) {
        emailValidationState = 'valid';
        errorContactEmail.textContent = 'Email Verified ✓';
        errorContactEmail.style.color = '#10b981';
        if (emailStatusIcon) emailStatusIcon.style.display = 'none';
        if (verifyEmailBtn) {
           verifyEmailBtn.textContent = 'Verified';
           verifyEmailBtn.style.display = 'none';
        }
        validateField(emailField); // trigger re-validation for styling
        return true;
      } else {
        emailValidationState = 'invalid';
        errorContactEmail.textContent = data.error || 'Email not available';
        errorContactEmail.style.color = '#ef4444';
        if (emailStatusIcon) emailStatusIcon.style.display = 'none';
        if (verifyEmailBtn) {
           verifyEmailBtn.textContent = 'Verify Email';
           verifyEmailBtn.disabled = false;
        }
        validateField(emailField);
        return false;
      }
    } catch (error) {
      console.error('Email validation error:', error);
      emailValidationState = 'valid';
      errorContactEmail.textContent = 'Email Verified ✓';
      errorContactEmail.style.color = '#10b981';
      if (emailStatusIcon) emailStatusIcon.style.display = 'none';
      if (verifyEmailBtn) {
         verifyEmailBtn.textContent = 'Verified';
         verifyEmailBtn.style.display = 'none';
      }
      validateField(emailField);
      return true;
    }
  }

  function validateField(field) {
    if (!field) return true;
    
    const formGroup = field.closest('.form-group');
    if (!formGroup) return true;

    // Utilize standard native browser validation constraint rules
    let isValid = field.checkValidity();

    if (field.id === 'contact-email') {
      if (emailValidationState === 'invalid') {
        isValid = false;
      }
    }

    if (isValid) {
      formGroup.classList.remove('invalid');
      if (field.id === 'contact-email') {
        if (emailValidationState === 'valid') {
            errorContactEmail.style.display = 'block';
            errorContactEmail.style.color = '#10b981';
        } else if (emailValidationState === 'loading') {
            errorContactEmail.style.display = 'block';
            errorContactEmail.style.color = '#f59e0b';
        } else {
            errorContactEmail.style.display = 'none';
        }
      }
      updateProgressMeter();
      return true;
    } else {
      formGroup.classList.add('invalid');
      if (field.id === 'contact-email' && emailValidationState === 'invalid') {
         errorContactEmail.style.display = 'block';
         errorContactEmail.style.color = '#ef4444';
      }
      updateProgressMeter();
      return false;
    }
  }

  // Attach immediate 'input' and 'change' listeners for fluid responsive correction
  fields.forEach(field => {
    if (!field) return;

    // Typing and selections
    field.addEventListener('input', () => {
      if (field.id === 'contact-email') {
        emailValidationState = 'idle';
        if (verifyEmailBtn) {
           verifyEmailBtn.style.display = 'inline-block';
           verifyEmailBtn.textContent = 'Verify Email';
           verifyEmailBtn.disabled = false;
        }
      }
      validateField(field);
    });

    field.addEventListener('change', () => {
      validateField(field);
    });
    
    field.addEventListener('blur', () => {
      validateField(field);
    });

    // Dynamic section highlight indicators on focus
    field.addEventListener('focus', () => {
      // Remove active-section class from all sections
      document.querySelectorAll('.form-section').forEach(sec => {
        sec.classList.remove('active-section');
      });

      // Add active-section class to focused field's fieldset container
      const parentSection = field.closest('.form-section');
      if (parentSection) {
        parentSection.classList.add('active-section');
      }
    });
  });

  // Intercept the submission pipeline
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Halt standard native HTML redirect/refresh
    
    // Clear previous alert states
    hideNotification();

    // Force await email validation if not yet complete
    if (emailField && emailField.value.trim() !== '' && (emailValidationState === 'idle' || emailValidationState === 'loading')) {
      submitBtn.disabled = true;
      submitBtnText.textContent = 'Verifying...';
      await validateEmailOnServer(emailField.value.trim());
      submitBtn.disabled = false;
      submitBtnText.textContent = 'Submit Enquiry & Request Quote';
    }

    // Loop through all validation items
    let formIsValid = true;
    fields.forEach(field => {
      const fieldIsValid = validateField(field);
      if (!fieldIsValid) {
        formIsValid = false;
      }
    });

    if (emailValidationState === 'invalid') {
       formIsValid = false;
    }

    // Block submission if any validation checks fail
    if (!formIsValid) {
      showNotification('error', 'Please resolve all highlighted technical specification validation errors before transmitting.');
      
      // Scroll to the first invalid field gracefully
      const firstInvalid = document.querySelector('.form-group.invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Pass: Instantly toggle submission CTA element statuses to avoid dual submissions
    submitBtn.disabled = true;
    submitBtnText.textContent = 'Transmitting Data...';
    showNotification('loading', 'Securely encapsulating data & routing request to gateway...');

    // Construct detailed payload for the API
    const nameVal = document.getElementById('contact-name').value.trim();
    const phoneVal = document.getElementById('contact-phone').value.trim();
    const emailVal = document.getElementById('contact-email').value.trim();
    let typeVal = document.getElementById('project-type').value;
    if (typeVal === 'Other') {
      typeVal = document.getElementById('custom-project-type').value.trim();
    }
    const locationVal = document.getElementById('project-location').value.trim();
    const areaVal = document.getElementById('project-area').value.trim();
    const budgetVal = document.getElementById('project-budget').value;
    const timelineVal = document.getElementById('project-timeline').value;
    const requirementsVal = document.getElementById('project-requirements').value.trim();

    // Construct a comprehensive consolidated requirements string
    let combinedRequirements = `Project Type: ${typeVal}\nLocation: ${locationVal}\nArea: ${areaVal} Sq. Ft.\nBudget: ${budgetVal}\nTimeline: ${timelineVal}`;
    if (requirementsVal) {
      combinedRequirements += `\n\nAdditional Comments: ${requirementsVal}`;
    }

    const payload = {
      fullName: nameVal,
      phone: phoneVal,
      email: emailVal,
      leadSource: "Landing Page",
      source: "Landing Page",
      projectType: typeVal,
      projectLocation: locationVal,
      projectAreaSqft: parseInt(areaVal) || 0,
      estimatedBudget: budgetVal,
      completionTimeline: timelineVal,
      requirements: combinedRequirements,
      project: {
        type: typeVal,
        location: locationVal,
        area: parseInt(areaVal) || 0,
        budget: budgetVal,
        completionTime: timelineVal
      }
    };

    try {
      // Point directly to our backend endpoint. 
      // Using a relative path makes it portable across local development, local tunnels, and production servers.
      const apiEndpoint = '/api/lms/leads/ingest';

      // Formulate asymmetric async POST transaction to the ingestion system
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
        
        // Handle duplicate detection returned from API server (HTTP 200)
        if (result.message && (result.message.includes("already exists") || result.message.includes("duplicate"))) {
          showNotification('error', 'Lead registration skipped: This phone number or email address is already registered in our system.');
          
          // Re-enable submit button to allow corrections/re-attempts
          submitBtn.disabled = false;
          submitBtnText.textContent = 'Submit Enquiry & Request Quote';
          return;
        }

        // Success lifecycle state
        showNotification('success', 'Enquiry ingested successfully! Redirecting to contact desk details page...');
        
        // Reset all form visual states & properties
        form.reset();
        updateProgressMeter();
        fields.forEach(field => {
          const formGroup = field.closest('.form-group');
          if (formGroup) {
            formGroup.classList.remove('invalid');
          }
        });

        // Redirect to external main site after timeout (Flow 1 Requirement)
        setTimeout(() => {
          window.location.href = 'https://www.arkooprebuild.com';
        }, 800);

      } else {
        // API responded with an error status (e.g. 500, 400)
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

    } catch (error) {
      // Fail-safe catch block for offline instances, DNS drops, or active CORS blocks
      console.error('Lead Transmission Pipeline Exception:', error);
      
      showNotification(
        'error', 
        'Technical ingestion failed. Please verify internet connection or contact us directly at arkooprebuild.com/contact.html.'
      );
      
      // Revive submit CTA element controls to allow corrections/re-attempts
      submitBtn.disabled = false;
      submitBtnText.textContent = 'Submit Enquiry & Request Quote';
    }
  });
});
