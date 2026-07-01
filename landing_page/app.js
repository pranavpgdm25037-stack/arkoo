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

  // ============================================================
  // API BASE URL RESOLVER (FOR NETLIFY CROSS-ORIGIN FETCH)
  // ============================================================
  const API_BASE = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? ''
    : 'https://arkoo-u8sx.onrender.com';

  // ============================================================
  // FIREBASE CLIENT INITIALIZATION (FOR PHONE OTP)
  // ============================================================
  let auth = null;
  let recaptchaVerifier = null;
  let confirmationResult = null;

  async function initFirebase() {
    try {
      const res = await fetch(API_BASE + '/api/otp/config');
      const config = await res.json();
      if (!config.apiKey) {
        console.warn("Firebase App API Key is missing. Falling back to Mock Phone OTP.");
        return;
      }
      firebase.initializeApp(config);
      auth = firebase.auth();
      auth.useDeviceLanguage();

      // Create invisible ReCaptcha on the container
      recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // ReCaptcha completed successfully
        }
      });
      console.log("Firebase Phone Auth client initialized successfully.");
    } catch (e) {
      console.error("Firebase init failed: ", e);
    }
  }
  initFirebase();

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
    
    if (progressBar) progressBar.style.width = `${completionPercent}%`;
    if (progressMeter) {
      progressMeter.textContent = `${completionPercent}% Completed`;
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

  // ============================================================
  // OTP STATE
  // ============================================================
  let emailOtpVerified = false;
  let phoneOtpVerified = false;
  let emailResendTimer = null;
  let phoneResendTimer = null;

  // ─── DOM refs ────────────────────────────────────────────────
  const emailField          = document.getElementById('contact-email');
  const phoneField          = document.getElementById('contact-phone');
  const errorContactEmail   = document.getElementById('error-contact-email');
  const errorContactPhone   = document.getElementById('error-contact-phone');

  // Email OTP elements
  const sendEmailOtpBtn     = document.getElementById('send-email-otp-btn');
  const emailOtpRow         = document.getElementById('email-otp-row');
  const emailOtpInput       = document.getElementById('email-otp-input');
  const verifyEmailOtpBtn   = document.getElementById('verify-email-otp-btn');
  const resendEmailOtpBtn   = document.getElementById('resend-email-otp-btn');
  const emailOtpStatus      = document.getElementById('email-otp-status');
  const emailResendTimerEl  = document.getElementById('email-resend-timer');

  // Phone OTP elements
  const sendPhoneOtpBtn     = document.getElementById('send-phone-otp-btn');
  const phoneOtpRow         = document.getElementById('phone-otp-row');
  const phoneOtpInput       = document.getElementById('phone-otp-input');
  const verifyPhoneOtpBtn   = document.getElementById('verify-phone-otp-btn');
  const resendPhoneOtpBtn   = document.getElementById('resend-phone-otp-btn');
  const phoneOtpStatus      = document.getElementById('phone-otp-status');
  const phoneResendTimerEl  = document.getElementById('phone-resend-timer');

  // ─── Countdown helper ────────────────────────────────────────
  function startResendCountdown(timerEl, resendBtn, seconds = 60) {
    if (resendBtn) resendBtn.disabled = true;
    let remaining = seconds;
    if (timerEl) timerEl.textContent = `(${remaining}s)`;
    const interval = setInterval(() => {
      remaining--;
      if (timerEl) timerEl.textContent = `(${remaining}s)`;
      if (remaining <= 0) {
        clearInterval(interval);
        if (resendBtn) resendBtn.disabled = false;
        if (timerEl) timerEl.textContent = '';
      }
    }, 1000);
    return interval;
  }

  // ─── Status message helpers ──────────────────────────────────
  function setOtpStatus(el, msg, type) {
    // type: 'success' | 'error' | 'info'
    const colors = { success: '#10b981', error: '#ef4444', info: '#f59e0b' };
    el.textContent = msg;
    el.style.color = colors[type] || '#94a3b8';
  }

  // ============================================================
  // EMAIL OTP (SMTP BACKEND SERVICE)
  // ============================================================
  async function sendEmailOtp() {
    const email = emailField ? emailField.value.trim() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (errorContactEmail) {
        errorContactEmail.textContent = 'Please enter a valid email address first.';
        errorContactEmail.style.display = 'block';
        errorContactEmail.style.color = '#ef4444';
      }
      return;
    }

    if (sendEmailOtpBtn) {
      sendEmailOtpBtn.textContent = 'Sending...';
      sendEmailOtpBtn.disabled = true;
    }
    if (errorContactEmail) errorContactEmail.style.display = 'none';

    try {
      const res = await fetch(API_BASE + '/api/otp/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (data.success) {
        if (emailOtpRow) emailOtpRow.style.display = 'block';
        if (sendEmailOtpBtn) sendEmailOtpBtn.style.display = 'none';
        setOtpStatus(emailOtpStatus, `✉ OTP sent to ${email}. Check your inbox.`, 'info');
        emailResendTimer = startResendCountdown(emailResendTimerEl, resendEmailOtpBtn, 60);
      } else {
        if (sendEmailOtpBtn) {
          sendEmailOtpBtn.textContent = 'Send Email OTP';
          sendEmailOtpBtn.disabled = false;
        }
        setOtpStatus(emailOtpStatus, data.error || 'Failed to send OTP. Try again.', 'error');
        if (emailOtpRow) emailOtpRow.style.display = 'block';
      }
    } catch (err) {
      if (sendEmailOtpBtn) {
        sendEmailOtpBtn.textContent = 'Send Email OTP';
        sendEmailOtpBtn.disabled = false;
      }
      setOtpStatus(emailOtpStatus, 'Network error. Please try again.', 'error');
      if (emailOtpRow) emailOtpRow.style.display = 'block';
    }
  }

  async function verifyEmailOtp() {
    const email = emailField ? emailField.value.trim() : '';
    const otp = emailOtpInput ? emailOtpInput.value.trim() : '';

    if (!otp || otp.length !== 6) {
      setOtpStatus(emailOtpStatus, 'Please enter the 6-digit OTP.', 'error');
      return;
    }

    if (verifyEmailOtpBtn) {
      verifyEmailOtpBtn.textContent = 'Verifying...';
      verifyEmailOtpBtn.disabled = true;
    }

    try {
      const res = await fetch(API_BASE + '/api/otp/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();

      if (data.success) {
        emailOtpVerified = true;
        setOtpStatus(emailOtpStatus, '✅ Email verified successfully!', 'success');
        if (verifyEmailOtpBtn) verifyEmailOtpBtn.style.display = 'none';
        if (emailOtpInput) {
          emailOtpInput.disabled = true;
          emailOtpInput.style.borderColor = '#10b981';
        }
        if (resendEmailOtpBtn) resendEmailOtpBtn.style.display = 'none';
        if (emailResendTimerEl) emailResendTimerEl.textContent = '';
        if (emailResendTimer) clearInterval(emailResendTimer);
        if (errorContactEmail) errorContactEmail.style.display = 'none';
      } else {
        emailOtpVerified = false;
        setOtpStatus(emailOtpStatus, data.error || 'Incorrect OTP. Try again.', 'error');
        if (verifyEmailOtpBtn) {
          verifyEmailOtpBtn.textContent = 'Verify OTP';
          verifyEmailOtpBtn.disabled = false;
        }
      }
    } catch (err) {
      setOtpStatus(emailOtpStatus, 'Network error. Please try again.', 'error');
      if (verifyEmailOtpBtn) {
        verifyEmailOtpBtn.textContent = 'Verify OTP';
        verifyEmailOtpBtn.disabled = false;
      }
    }
  }

  if (sendEmailOtpBtn) sendEmailOtpBtn.addEventListener('click', sendEmailOtp);
  if (verifyEmailOtpBtn) verifyEmailOtpBtn.addEventListener('click', verifyEmailOtp);
  if (resendEmailOtpBtn) {
    resendEmailOtpBtn.addEventListener('click', () => {
      if (emailResendTimer) clearInterval(emailResendTimer);
      sendEmailOtp();
    });
  }

  // Reset OTP state when email is changed
  if (emailField) {
    emailField.addEventListener('input', () => {
      emailOtpVerified = false;
      if (emailOtpRow) emailOtpRow.style.display = 'none';
      if (sendEmailOtpBtn) {
        sendEmailOtpBtn.style.display = 'inline-block';
        sendEmailOtpBtn.textContent = 'Send Email OTP';
        sendEmailOtpBtn.disabled = false;
      }
      if (emailOtpInput) {
        emailOtpInput.value = '';
        emailOtpInput.disabled = false;
        emailOtpInput.style.borderColor = '';
      }
      if (verifyEmailOtpBtn) {
        verifyEmailOtpBtn.style.display = 'inline-block';
        verifyEmailOtpBtn.textContent = 'Verify OTP';
        verifyEmailOtpBtn.disabled = false;
      }
      if (emailOtpStatus) emailOtpStatus.textContent = '';
      if (errorContactEmail) errorContactEmail.style.display = 'none';
      if (emailResendTimer) clearInterval(emailResendTimer);
      validateField(emailField);
    });
  }

  // ============================================================
  // PHONE OTP
  // ============================================================
  async function sendPhoneOtp() {
    const phone = phoneField ? phoneField.value.trim() : '';
    if (!phone || !/^\+?[0-9]{10,15}$/.test(phone)) {
      if (errorContactPhone) {
        errorContactPhone.textContent = 'Please enter a valid phone number first (with country code e.g. +91).';
        errorContactPhone.style.display = 'block';
        errorContactPhone.style.color = '#ef4444';
      }
      return;
    }

    // Format phone number to have country code prefix (default to +91 if none given)
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = '+91' + phone;
    }

    if (sendPhoneOtpBtn) {
      sendPhoneOtpBtn.textContent = 'Sending...';
      sendPhoneOtpBtn.disabled = true;
    }
    if (errorContactPhone) errorContactPhone.style.display = 'none';

    // Check if Firebase client is ready
    if (auth && recaptchaVerifier) {
      try {
        const result = await auth.signInWithPhoneNumber(formattedPhone, recaptchaVerifier);
        confirmationResult = result;
        if (phoneOtpRow) phoneOtpRow.style.display = 'block';
        if (sendPhoneOtpBtn) sendPhoneOtpBtn.style.display = 'none';
        setOtpStatus(phoneOtpStatus, `📱 OTP sent via SMS to ${formattedPhone}.`, 'info');
        phoneResendTimer = startResendCountdown(phoneResendTimerEl, resendPhoneOtpBtn, 60);
      } catch (err) {
        console.error("Firebase Phone OTP failed, falling back:", err);
        
        // Show specific error messages for developers to debug domains
        if (err.code === 'auth/unauthorized-domain') {
          setOtpStatus(phoneOtpStatus, '⚠️ Domain Unauthorized: Add ' + window.location.hostname + ' to Firebase Auth Authorized Domains.', 'error');
          if (sendPhoneOtpBtn) {
            sendPhoneOtpBtn.textContent = 'Send OTP';
            sendPhoneOtpBtn.disabled = false;
          }
          return;
        }

        // Reset recaptcha
        if (window.grecaptcha && recaptchaVerifier) {
          recaptchaVerifier.clear();
          recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' });
        }
        fallbackSendPhoneOtp(phone);
      }
    } else {
      fallbackSendPhoneOtp(phone);
    }
  }

  async function fallbackSendPhoneOtp(phone) {
    try {
      const res = await fetch(API_BASE + '/api/otp/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();

      if (data.success) {
        if (phoneOtpRow) phoneOtpRow.style.display = 'block';
        if (sendPhoneOtpBtn) sendPhoneOtpBtn.style.display = 'none';
        setOtpStatus(phoneOtpStatus, `📱 OTP sent to ${phone}.`, 'info');
        phoneResendTimer = startResendCountdown(phoneResendTimerEl, resendPhoneOtpBtn, 60);
      } else {
        if (sendPhoneOtpBtn) {
          sendPhoneOtpBtn.textContent = 'Send OTP';
          sendPhoneOtpBtn.disabled = false;
        }
        setOtpStatus(phoneOtpStatus, data.error || 'Failed to send OTP. Try again.', 'error');
        if (phoneOtpRow) phoneOtpRow.style.display = 'block';
      }
    } catch (err) {
      if (sendPhoneOtpBtn) {
        sendPhoneOtpBtn.textContent = 'Send OTP';
        sendPhoneOtpBtn.disabled = false;
      }
      setOtpStatus(phoneOtpStatus, 'Network error. Please try again.', 'error');
      if (phoneOtpRow) phoneOtpRow.style.display = 'block';
    }
  }

  async function verifyPhoneOtp() {
    const phone = phoneField ? phoneField.value.trim() : '';
    const otp = phoneOtpInput ? phoneOtpInput.value.trim() : '';

    if (!otp || otp.length !== 6) {
      setOtpStatus(phoneOtpStatus, 'Please enter the 6-digit OTP.', 'error');
      return;
    }

    if (verifyPhoneOtpBtn) {
      verifyPhoneOtpBtn.textContent = 'Verifying...';
      verifyPhoneOtpBtn.disabled = true;
    }

    if (confirmationResult) {
      // Verify via Firebase client Auth
      try {
        const userCredential = await confirmationResult.confirm(otp);
        console.log("Firebase phone auth confirmed:", userCredential.user);
        phoneOtpVerified = true;
        phoneOtpSuccessActions();
      } catch (err) {
        console.error("Firebase verify failed:", err);
        setOtpStatus(phoneOtpStatus, 'Incorrect OTP. Please try again.', 'error');
        if (verifyPhoneOtpBtn) {
          verifyPhoneOtpBtn.textContent = 'Verify OTP';
          verifyPhoneOtpBtn.disabled = false;
        }
      }
    } else {
      // Fallback backend validation
      try {
        const res = await fetch(API_BASE + '/api/otp/phone/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, otp })
        });
        const data = await res.json();

        if (data.success) {
          phoneOtpVerified = true;
          phoneOtpSuccessActions();
        } else {
          phoneOtpVerified = false;
          setOtpStatus(phoneOtpStatus, data.error || 'Incorrect OTP. Try again.', 'error');
          if (verifyPhoneOtpBtn) {
            verifyPhoneOtpBtn.textContent = 'Verify OTP';
            verifyPhoneOtpBtn.disabled = false;
          }
        }
      } catch (err) {
        setOtpStatus(phoneOtpStatus, 'Network error. Please try again.', 'error');
        if (verifyPhoneOtpBtn) {
          verifyPhoneOtpBtn.textContent = 'Verify OTP';
          verifyPhoneOtpBtn.disabled = false;
        }
      }
    }
  }

  function phoneOtpSuccessActions() {
    setOtpStatus(phoneOtpStatus, '✅ Phone verified successfully!', 'success');
    if (verifyPhoneOtpBtn) verifyPhoneOtpBtn.style.display = 'none';
    if (phoneOtpInput) {
      phoneOtpInput.disabled = true;
      phoneOtpInput.style.borderColor = '#10b981';
    }
    if (resendPhoneOtpBtn) resendPhoneOtpBtn.style.display = 'none';
    if (phoneResendTimerEl) phoneResendTimerEl.textContent = '';
    if (phoneResendTimer) clearInterval(phoneResendTimer);
    if (errorContactPhone) errorContactPhone.style.display = 'none';
  }

  if (sendPhoneOtpBtn) sendPhoneOtpBtn.addEventListener('click', sendPhoneOtp);
  if (verifyPhoneOtpBtn) verifyPhoneOtpBtn.addEventListener('click', verifyPhoneOtp);
  if (resendPhoneOtpBtn) {
    resendPhoneOtpBtn.addEventListener('click', () => {
      if (phoneResendTimer) clearInterval(phoneResendTimer);
      sendPhoneOtp();
    });
  }

  // Reset phone OTP state when phone number is changed
  if (phoneField) {
    phoneField.addEventListener('input', () => {
      // Ensure the phone number starts with +91 and keep it locked
      if (!phoneField.value.startsWith('+91')) {
        phoneField.value = '+91' + phoneField.value.replace(/^\+?9?1?/, '').replace(/\D/g, '');
      }
      
      phoneOtpVerified = false;
      if (phoneOtpRow) phoneOtpRow.style.display = 'none';
      if (sendPhoneOtpBtn) {
        sendPhoneOtpBtn.style.display = 'inline-block';
        sendPhoneOtpBtn.textContent = 'Send OTP';
        sendPhoneOtpBtn.disabled = false;
      }
      if (phoneOtpInput) {
        phoneOtpInput.value = '';
        phoneOtpInput.disabled = false;
        phoneOtpInput.style.borderColor = '';
      }
      if (verifyPhoneOtpBtn) {
        verifyPhoneOtpBtn.style.display = 'inline-block';
        verifyPhoneOtpBtn.textContent = 'Verify OTP';
        verifyPhoneOtpBtn.disabled = false;
      }
      if (phoneOtpStatus) phoneOtpStatus.textContent = '';
      if (errorContactPhone) errorContactPhone.style.display = 'none';
      if (phoneResendTimer) clearInterval(phoneResendTimer);
      validateField(phoneField);
    });
  }

  // ============================================================
  // FIELD VALIDATION
  // ============================================================
  function validateField(field) {
    if (!field) return true;
    const formGroup = field.closest('.form-group');
    if (!formGroup) return true;
    let isValid = field.checkValidity();
    if (isValid) {
      formGroup.classList.remove('invalid');
      updateProgressMeter();
      return true;
    } else {
      formGroup.classList.add('invalid');
      updateProgressMeter();
      return false;
    }
  }

  // Attach listeners to all form fields
  fields.forEach(field => {
    if (!field) return;
    field.addEventListener('input', () => validateField(field));
    field.addEventListener('change', () => validateField(field));
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('focus', () => {
      document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('active-section'));
      const parentSection = field.closest('.form-section');
      if (parentSection) parentSection.classList.add('active-section');
    });
  });

  // ============================================================
  // FORM SUBMISSION
  // ============================================================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideNotification();

    // Validate all fields first
    let formIsValid = true;
    fields.forEach(field => {
      if (!validateField(field)) formIsValid = false;
    });

    if (!formIsValid) {
      showNotification('error', 'Please resolve all highlighted validation errors before submitting.');
      const firstInvalid = document.querySelector('.form-group.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Enforce email OTP verification
    if (!emailOtpVerified) {
      showNotification('error', 'Please verify your email address with OTP before submitting.');
      const emailGroup = document.getElementById('group-email');
      if (emailGroup) emailGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Enforce phone OTP verification
    if (!phoneOtpVerified) {
      showNotification('error', 'Please verify your phone number with OTP before submitting.');
      const phoneGroup = document.getElementById('group-phone');
      if (phoneGroup) phoneGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtnText.textContent = 'Transmitting Data...';
    showNotification('loading', 'Securely encapsulating data & routing request to gateway...');

    // Build payload
    const nameVal = document.getElementById('contact-name').value.trim();
    const phoneVal = document.getElementById('contact-phone').value.trim();
    const emailVal = document.getElementById('contact-email').value.trim();
    let typeVal = document.getElementById('project-type').value;
    if (typeVal === 'Other') typeVal = document.getElementById('custom-project-type').value.trim();
    const locationVal = document.getElementById('project-location').value.trim();
    const areaVal = document.getElementById('project-area').value.trim();
    const budgetVal = document.getElementById('project-budget').value;
    const timelineVal = document.getElementById('project-timeline').value;
    const requirementsVal = document.getElementById('project-requirements').value.trim();

    let combinedRequirements = `Project Type: ${typeVal}\nLocation: ${locationVal}\nArea: ${areaVal} Sq. Ft.\nBudget: ${budgetVal}\nTimeline: ${timelineVal}`;
    if (requirementsVal) combinedRequirements += `\n\nAdditional Comments: ${requirementsVal}`;

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
      const response = await fetch(API_BASE + '/api/lms/leads/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();

        if (result.message && (result.message.includes("already exists") || result.message.includes("duplicate"))) {
          showNotification('error', 'Lead registration skipped: This phone number or email address is already registered in our system.');
          submitBtn.disabled = false;
          submitBtnText.textContent = 'Submit Enquiry & Request Quote';
          return;
        }

        showNotification('success', 'Enquiry submitted successfully! A confirmation email has been sent to your inbox.');
        form.reset();
        updateProgressMeter();
        emailOtpVerified = false;
        phoneOtpVerified = false;
        fields.forEach(field => {
          const formGroup = field && field.closest('.form-group');
          if (formGroup) formGroup.classList.remove('invalid');
        });

        setTimeout(() => {
          window.location.href = 'https://www.arkooprebuild.com';
        }, 1200);
      } else {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }
    } catch (error) {
      console.error('Lead Transmission Pipeline Exception:', error);
      showNotification('error', 'Technical submission failed. Please verify your internet connection or contact us at arkooprebuild.com/contact.html');
      submitBtn.disabled = false;
      submitBtnText.textContent = 'Submit Enquiry & Request Quote';
    }
  });
});
