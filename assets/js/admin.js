/* RSAMDIO Admin Panel - Firebase Integration */
(function() {
  // Get Firebase instances from shared config
  const { db, auth } = initializeFirebase();
  
  if (!db || !auth) {
    console.error('Firebase not initialized. Please check your configuration.');
    return;
  }

  // DOM Elements
  const loginScreen = document.getElementById('loginScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginSuccess = document.getElementById('loginSuccess');
  const sendLinkBtn = document.getElementById('sendLinkBtn');
  const sendLinkText = document.getElementById('sendLinkText');
  const sendLinkSpinner = document.getElementById('sendLinkSpinner');
  const logoutBtn = document.getElementById('logoutBtn');
  const applicationsTableBody = document.getElementById('applicationsTableBody');
  const statusFilter = document.getElementById('statusFilter');
  const roleFilter = document.getElementById('roleFilter');
  const searchInput = document.getElementById('searchInput');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportBtn = document.getElementById('exportBtn');
  const resultsCount = document.getElementById('resultsCount');
  const mobileCardsContainer = document.getElementById('mobileCardsContainer');

  // State
  let expandedRows = new Set(); // Track expanded row IDs
  let applications = [];
  // Get the current page URL for magic link redirect
  const getActionCodeSettings = () => ({
    // URL you want to redirect back to after email verification
    url: window.location.origin + window.location.pathname,
    handleCodeInApp: true
  });

  // Check authentication state
  auth.onAuthStateChanged((user) => {
    if (user) {
      showDashboard();
      loadApplications();
    } else {
      showLogin();
      // Check if this is a magic link callback
      checkMagicLinkCallback();
    }
  });

  // Check if URL contains magic link callback
  function checkMagicLinkCallback() {
    if (auth.isSignInWithEmailLink(window.location.href)) {
      // Get the email from localStorage
      let email = window.localStorage.getItem('emailForSignIn');
      
      if (!email) {
        // User opened the link on a different device - prompt for email
        const inputEmail = prompt('Please enter your email address to complete sign in:');
        if (inputEmail) {
          email = inputEmail.trim();
          window.localStorage.setItem('emailForSignIn', email);
        } else {
          showError('Email is required to complete sign in.');
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      }
      
      // Sign in with the email link
      signInWithEmailLink(email, window.location.href);
    }
  }

  // Sign in with email link
  async function signInWithEmailLink(email, emailLink) {
    try {
      sendLinkBtn.disabled = true;
      sendLinkText.textContent = 'Signing in...';
      sendLinkSpinner.classList.remove('hidden');
      
      await auth.signInWithEmailLink(email, emailLink);
      
      // Clear email from localStorage
      window.localStorage.removeItem('emailForSignIn');
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      loginError.classList.add('hidden');
      loginSuccess.classList.add('hidden');
    } catch (error) {
      console.error('Sign in error:', error);
      showError(error.message || 'Failed to sign in. Please try requesting a new magic link.');
      sendLinkBtn.disabled = false;
      sendLinkText.textContent = 'Send Magic Link';
      sendLinkSpinner.classList.add('hidden');
    }
  }

  // Send magic link
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();

    if (!email) {
      showError('Please enter your email address.');
      return;
    }

    try {
      sendLinkBtn.disabled = true;
      sendLinkText.textContent = 'Sending...';
      sendLinkSpinner.classList.remove('hidden');
      loginError.classList.add('hidden');
      loginSuccess.classList.add('hidden');

      // Save email to localStorage for magic link callback
      window.localStorage.setItem('emailForSignIn', email);

      // Send magic link
      await auth.sendSignInLinkToEmail(email, getActionCodeSettings());
      
      // Show success message
      loginSuccess.classList.remove('hidden');
      sendLinkBtn.disabled = false;
      sendLinkText.textContent = 'Resend Magic Link';
      sendLinkSpinner.classList.add('hidden');
      
      // Clear form
      document.getElementById('adminEmail').value = '';
    } catch (error) {
      console.error('Send link error:', error);
      showError(error.message || 'Failed to send magic link. Please try again.');
      sendLinkBtn.disabled = false;
      sendLinkText.textContent = 'Send Magic Link';
      sendLinkSpinner.classList.add('hidden');
    }
  });

  // Helper function to show error
  function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
    loginSuccess.classList.add('hidden');
  }

  // Logout
  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  });

  // Show/Hide screens
  function showLogin() {
    loginScreen.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
  }

  function showDashboard() {
    loginScreen.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
  }

  // Cache for applications
  let applicationsCache = null;
  let cacheTimestamp = null;
  const CACHE_DURATION = 60000; // 60 seconds cache

  // Load all applications from Firestore (client-side filtering for fast UX)
  async function loadApplications(forceRefresh = false) {
    const now = Date.now();
    
    // Use cache if available and fresh (unless force refresh)
    if (!forceRefresh && applicationsCache && 
        cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      applications = [...applicationsCache];
      renderApplications();
      updateStats();
      return;
    }

    try {
      // Load all applications at once (client-side filtering for instant results)
      const snapshot = await db.collection('nominations')
        .orderBy('createdAt', 'desc')
        .get();
      
      applications = [];
      snapshot.forEach((doc) => {
        applications.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Update cache
      applicationsCache = [...applications];
      cacheTimestamp = now;

      renderApplications();
      updateStats();
    } catch (error) {
      console.error('Error loading applications:', error);
      if (applicationsTableBody) {
        applicationsTableBody.innerHTML = '<tr><td colspan="8" class="error-row">Error loading applications. Please refresh.</td></tr>';
      }
      if (mobileCardsContainer) {
        mobileCardsContainer.innerHTML = '<div class="empty-state"><p>Error loading applications. Please refresh.</p></div>';
      }
    }
  }

  // Filter applications
  function getFilteredApplications() {
    let filtered = [...applications];

    // Status filter
    const statusValue = statusFilter.value;
    if (statusValue) {
      filtered = filtered.filter(app => app.status === statusValue);
    }

    // Role filter
    const roleValue = roleFilter.value;
    if (roleValue) {
      filtered = filtered.filter(app => 
        app.first_preference_role === roleValue || 
        app.second_preference_role === roleValue
      );
    }

    // Search filter
    const searchValue = searchInput.value.toLowerCase().trim();
    if (searchValue) {
      filtered = filtered.filter(app => 
        (app.full_name && app.full_name.toLowerCase().includes(searchValue)) ||
        (app.email && app.email.toLowerCase().includes(searchValue))
      );
    }

    return filtered;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Escape HTML but preserve line breaks as <br> tags
  function escapeHtmlWithBreaks(text) {
    if (!text || text.trim() === '') return '-';
    // First, replace newlines with a placeholder to preserve them
    const withPlaceholder = text.replace(/\n/g, '___NEWLINE___');
    // Escape HTML to prevent XSS
    const div = document.createElement('div');
    div.textContent = withPlaceholder;
    const escaped = div.innerHTML;
    // Replace placeholder with <br> tags (these won't be escaped since we're doing string replacement)
    return escaped.replace(/___NEWLINE___/g, '<br>');
  }

  // Render applications table
  function renderApplications() {
    const filtered = getFilteredApplications();
    
    // Update results count
    if (resultsCount) {
      const count = filtered.length;
      resultsCount.textContent = `${count} ${count === 1 ? 'application' : 'applications'}`;
    }

    if (filtered.length === 0) {
      applicationsTableBody.innerHTML = '<tr><td colspan="8" class="table-loading"><div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>No applications found matching your filters.</p></div></td></tr>';
      return;
    }

    applicationsTableBody.innerHTML = filtered.map(app => {
      const submittedDate = app.createdAt 
        ? new Date(app.createdAt).toLocaleDateString()
        : (app.timestamp ? 'N/A' : 'N/A');
      
      const firstRole = app.first_preference_role === 'Other' && app.first_preference_role_other
        ? `Other: ${escapeHtml(app.first_preference_role_other)}`
        : (app.first_preference_role || '-');
      
      const secondRole = app.second_preference_role === 'Other' && app.second_preference_role_other
        ? `Other: ${escapeHtml(app.second_preference_role_other)}`
        : (app.second_preference_role || '-');

      const isExpanded = expandedRows.has(app.id);
      const expandIcon = isExpanded 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';

      const detailRow = isExpanded ? `
        <tr class="detail-row" data-detail-id="${app.id}">
          <td colspan="8">
            <div class="application-details">
              <div class="detail-section">
                <h3>Personal Information</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>Full Name:</label>
                    <div>${escapeHtml(app.full_name || '-')}</div>
                  </div>
                  <div class="detail-item">
                    <label>Email:</label>
                    <div>${escapeHtml(app.email || '-')}</div>
                  </div>
                  <div class="detail-item">
                    <label>Phone:</label>
                    <div>${escapeHtml(app.phone || '-')}</div>
                  </div>
                  <div class="detail-item">
                    <label>Current Rotaract Club:</label>
                    <div>${escapeHtml(app.current_club || '-')}</div>
                  </div>
                  <div class="detail-item">
                    <label>Rotary International District:</label>
                    <div>${escapeHtml(app.district || '-')}</div>
                  </div>
                  <div class="detail-item">
                    <label>Year of Serving as DRR:</label>
                    <div>${escapeHtml(app.drr_year || '-')}</div>
                  </div>
                  <div class="detail-item">
                    <label>Years in Rotaract:</label>
                    <div>${escapeHtml(app.years_in_rotaract || '-')}</div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3>Role Preferences</h3>
                <div class="detail-grid">
                  <div class="detail-item detail-item--full">
                    <label>1st Preference Role:</label>
                    <div>${firstRole}</div>
                  </div>
                  <div class="detail-item detail-item--full">
                    <label>Vision for 1st Preference Role:</label>
                    <div class="detail-textarea">${escapeHtmlWithBreaks(app.vision_first_role)}</div>
                  </div>
                  <div class="detail-item detail-item--full">
                    <label>2nd Preference Role:</label>
                    <div>${secondRole}</div>
                  </div>
                  <div class="detail-item detail-item--full">
                    <label>Vision for 2nd Preference Role:</label>
                    <div class="detail-textarea">${escapeHtmlWithBreaks(app.vision_second_role)}</div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3>Vision for RSAMDIO 2026-27</h3>
                <div class="detail-item detail-item--full">
                  <div class="detail-textarea">${escapeHtmlWithBreaks(app.vision_rsamdio)}</div>
                </div>
              </div>

              <div class="detail-section">
                <h3>Status Management</h3>
                <div class="status-chips">
                  <button class="status-chip status-chip--pending ${app.status === 'Pending' ? 'status-chip--active' : ''}" 
                          onclick="updateApplicationStatus('${app.id}', 'Pending')" 
                          data-status="Pending">
                    Pending
                  </button>
                  <button class="status-chip status-chip--review ${app.status === 'Under Review' ? 'status-chip--active' : ''}" 
                          onclick="updateApplicationStatus('${app.id}', 'Under Review')" 
                          data-status="Under Review">
                    Under Review
                  </button>
                  <button class="status-chip status-chip--shortlisted ${app.status === 'Shortlisted' ? 'status-chip--active' : ''}" 
                          onclick="updateApplicationStatus('${app.id}', 'Shortlisted')" 
                          data-status="Shortlisted">
                    Shortlisted
                  </button>
                  <button class="status-chip status-chip--selected ${app.status === 'Selected' ? 'status-chip--active' : ''}" 
                          onclick="updateApplicationStatus('${app.id}', 'Selected')" 
                          data-status="Selected">
                    Selected
                  </button>
                  <button class="status-chip status-chip--rejected ${app.status === 'Rejected' ? 'status-chip--active' : ''}" 
                          onclick="updateApplicationStatus('${app.id}', 'Rejected')" 
                          data-status="Rejected">
                    Rejected
                  </button>
                </div>
                <div class="detail-meta">
                  <span>Submitted: ${app.createdAt ? new Date(app.createdAt).toLocaleString() : 'N/A'}</span>
                  ${app.updatedAt ? `<span>Updated: ${app.updatedAt.toDate ? app.updatedAt.toDate().toLocaleString() : new Date(app.updatedAt).toLocaleString()}</span>` : ''}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ` : '';

      return `
        <tr class="application-row ${isExpanded ? 'expanded' : ''}" data-id="${app.id}">
          <td>${escapeHtml(app.full_name || '-')}</td>
          <td>${escapeHtml(app.email || '-')}</td>
          <td>${escapeHtml(app.phone || '-')}</td>
          <td>${firstRole}</td>
          <td>${secondRole}</td>
          <td><span class="status-badge status-badge--${getStatusClass(app.status || 'Pending')}">${app.status || 'Pending'}</span></td>
          <td>${submittedDate}</td>
          <td style="text-align: center;">
            <button class="btn-expand" onclick="toggleApplicationRow('${app.id}')" title="${isExpanded ? 'Collapse' : 'Expand'}">
              ${expandIcon}
            </button>
          </td>
        </tr>
        ${detailRow}
      `;
    }).join('');

    // No need for event listeners - chips handle clicks directly

    // Render mobile cards
    renderMobileCards(filtered);
  }

  // Render mobile cards for small screens
  function renderMobileCards(filtered) {
    if (!mobileCardsContainer) return;

    if (filtered.length === 0) {
      mobileCardsContainer.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>No applications found matching your filters.</p></div>';
      return;
    }

    mobileCardsContainer.innerHTML = filtered.map(app => {
      const submittedDate = app.createdAt 
        ? new Date(app.createdAt).toLocaleDateString()
        : (app.timestamp ? 'N/A' : 'N/A');
      
      const firstRole = app.first_preference_role === 'Other' && app.first_preference_role_other
        ? `Other: ${escapeHtml(app.first_preference_role_other)}`
        : (app.first_preference_role || '-');
      
      const secondRole = app.second_preference_role === 'Other' && app.second_preference_role_other
        ? `Other: ${escapeHtml(app.second_preference_role_other)}`
        : (app.second_preference_role || '-');

      const isExpanded = expandedRows.has(app.id);
      const expandIcon = isExpanded 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

      const detailContent = isExpanded ? `
        <div class="application-details">
          <div class="detail-section">
            <h3>Personal Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Full Name:</label>
                <div>${escapeHtml(app.full_name || '-')}</div>
              </div>
              <div class="detail-item">
                <label>Email:</label>
                <div>${escapeHtml(app.email || '-')}</div>
              </div>
              <div class="detail-item">
                <label>Phone:</label>
                <div>${escapeHtml(app.phone || '-')}</div>
              </div>
              <div class="detail-item">
                <label>Current Rotaract Club:</label>
                <div>${escapeHtml(app.current_club || '-')}</div>
              </div>
              <div class="detail-item">
                <label>Rotary International District:</label>
                <div>${escapeHtml(app.district || '-')}</div>
              </div>
              <div class="detail-item">
                <label>Year of Serving as DRR:</label>
                <div>${escapeHtml(app.drr_year || '-')}</div>
              </div>
              <div class="detail-item">
                <label>Years in Rotaract:</label>
                <div>${escapeHtml(app.years_in_rotaract || '-')}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Role Preferences</h3>
            <div class="detail-grid">
              <div class="detail-item detail-item--full">
                <label>1st Preference Role:</label>
                <div>${firstRole}</div>
              </div>
              <div class="detail-item detail-item--full">
                <label>Vision for 1st Preference Role:</label>
                <div class="detail-textarea">${escapeHtmlWithBreaks(app.vision_first_role)}</div>
              </div>
              <div class="detail-item detail-item--full">
                <label>2nd Preference Role:</label>
                <div>${secondRole}</div>
              </div>
              <div class="detail-item detail-item--full">
                <label>Vision for 2nd Preference Role:</label>
                <div class="detail-textarea">${escapeHtmlWithBreaks(app.vision_second_role)}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Vision for RSAMDIO 2026-27</h3>
            <div class="detail-item detail-item--full">
              <div class="detail-textarea">${escapeHtmlWithBreaks(app.vision_rsamdio)}</div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Status Management</h3>
            <div class="status-chips">
              <button class="status-chip status-chip--pending ${app.status === 'Pending' ? 'status-chip--active' : ''}" 
                      onclick="updateApplicationStatus('${app.id}', 'Pending')" 
                      data-status="Pending">
                Pending
              </button>
              <button class="status-chip status-chip--review ${app.status === 'Under Review' ? 'status-chip--active' : ''}" 
                      onclick="updateApplicationStatus('${app.id}', 'Under Review')" 
                      data-status="Under Review">
                Under Review
              </button>
              <button class="status-chip status-chip--shortlisted ${app.status === 'Shortlisted' ? 'status-chip--active' : ''}" 
                      onclick="updateApplicationStatus('${app.id}', 'Shortlisted')" 
                      data-status="Shortlisted">
                Shortlisted
              </button>
              <button class="status-chip status-chip--selected ${app.status === 'Selected' ? 'status-chip--active' : ''}" 
                      onclick="updateApplicationStatus('${app.id}', 'Selected')" 
                      data-status="Selected">
                Selected
              </button>
              <button class="status-chip status-chip--rejected ${app.status === 'Rejected' ? 'status-chip--active' : ''}" 
                      onclick="updateApplicationStatus('${app.id}', 'Rejected')" 
                      data-status="Rejected">
                Rejected
              </button>
            </div>
            <div class="detail-meta">
              <span>Submitted: ${app.createdAt ? new Date(app.createdAt).toLocaleString() : 'N/A'}</span>
              ${app.updatedAt ? `<span>Updated: ${app.updatedAt.toDate ? app.updatedAt.toDate().toLocaleString() : new Date(app.updatedAt).toLocaleString()}</span>` : ''}
            </div>
          </div>
        </div>
      ` : '';

      return `
        <div class="mobile-card" data-id="${app.id}">
          <div class="mobile-card__header">
            <div class="mobile-card__title">${escapeHtml(app.full_name || '-')}</div>
            <div class="mobile-card__status">
              <span class="status-badge status-badge--${getStatusClass(app.status || 'Pending')}">${app.status || 'Pending'}</span>
            </div>
          </div>
          <div class="mobile-card__info">
            <div class="mobile-card__info-item">
              <div class="mobile-card__info-label">Email</div>
              <div class="mobile-card__info-value">${escapeHtml(app.email || '-')}</div>
            </div>
            <div class="mobile-card__info-item">
              <div class="mobile-card__info-label">Phone</div>
              <div class="mobile-card__info-value">${escapeHtml(app.phone || '-')}</div>
            </div>
            <div class="mobile-card__info-item">
              <div class="mobile-card__info-label">1st Preference</div>
              <div class="mobile-card__info-value">${firstRole}</div>
            </div>
            <div class="mobile-card__info-item">
              <div class="mobile-card__info-label">2nd Preference</div>
              <div class="mobile-card__info-value">${secondRole}</div>
            </div>
            <div class="mobile-card__info-item">
              <div class="mobile-card__info-label">Submitted</div>
              <div class="mobile-card__info-value">${submittedDate}</div>
            </div>
          </div>
          <div class="mobile-card__actions">
            <button class="btn-expand" onclick="toggleApplicationRow('${app.id}')" title="${isExpanded ? 'Collapse' : 'Expand'}">
              ${expandIcon}
            </button>
          </div>
          ${detailContent}
        </div>
      `;
    }).join('');

    // No need for event listeners - chips handle clicks directly
  }

  // Toggle application row expansion (multiple rows can be expanded)
  window.toggleApplicationRow = function(applicationId) {
    const wasExpanded = expandedRows.has(applicationId);
    
    if (wasExpanded) {
      // If already expanded, collapse it
      expandedRows.delete(applicationId);
    } else {
      // Expand this row (allow multiple rows to be expanded)
      expandedRows.add(applicationId);
    }
    
    renderApplications();
    
    // Scroll to the expanded row after rendering
    if (!wasExpanded) {
      setTimeout(() => {
        // Try desktop table row first
        const row = document.querySelector(`tr.application-row[data-id="${applicationId}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Try mobile card
          const card = document.querySelector(`.mobile-card[data-id="${applicationId}"]`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }
  };

  // Update application status
  window.updateApplicationStatus = async function(applicationId, newStatus) {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    // Don't update if it's already the same status
    if (app.status === newStatus) return;

    // Find the clicked chip (works for both desktop and mobile)
    const clickedChip = document.querySelector(`button[data-status="${newStatus}"][onclick*="updateApplicationStatus('${applicationId}'"]`);
    
    // Show loading state on clicked chip
    if (clickedChip) {
      clickedChip.disabled = true;
      clickedChip.classList.add('status-chip--updating');
    }
    
    try {
      await db.collection('nominations').doc(applicationId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update the status in memory
      app.status = newStatus;
      
      // Update cache
      if (applicationsCache) {
        const cachedApp = applicationsCache.find(a => a.id === applicationId);
        if (cachedApp) {
          cachedApp.status = newStatus;
        }
      }
      
      // Preserve expanded state
      const wasExpanded = expandedRows.has(applicationId);
      
      // Update UI directly without re-fetching (saves reads)
      const statusBadge = document.querySelector(`tr[data-id="${applicationId}"] .status-badge`) || 
                          document.querySelector(`.mobile-card[data-id="${applicationId}"] .status-badge`);
      if (statusBadge) {
        statusBadge.textContent = newStatus;
        statusBadge.className = `status-badge status-badge--${getStatusClass(newStatus)} status-updating`;
        setTimeout(() => {
          statusBadge.classList.remove('status-updating');
        }, 600);
      }

      // Update status chips in expanded view
      const allChips = document.querySelectorAll(`button[data-status][onclick*="updateApplicationStatus('${applicationId}'"]`);
      allChips.forEach(chip => {
        chip.classList.remove('status-chip--active');
        const chipStatus = chip.getAttribute('data-status');
        if (chipStatus === newStatus) {
          chip.classList.add('status-chip--active');
        }
      });

      // Update stats without re-fetching
      updateStats();
      
      // Re-render to update chip states (keep expanded view open)
      if (wasExpanded) {
        renderApplications();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      
      // Reset chip on error
      if (clickedChip) {
        clickedChip.classList.remove('status-chip--updating');
        clickedChip.disabled = false;
      }
      
      alert('Error updating status. Please try again.');
    }
  };

  // Get status class for styling
  function getStatusClass(status) {
    const statusMap = {
      'Pending': 'pending',
      'Under Review': 'review',
      'Shortlisted': 'shortlisted',
      'Selected': 'selected',
      'Rejected': 'rejected'
    };
    return statusMap[status] || 'pending';
  }

  // Update stats
  function updateStats() {
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'Pending').length,
      review: applications.filter(app => app.status === 'Under Review').length,
      shortlisted: applications.filter(app => app.status === 'Shortlisted').length,
      selected: applications.filter(app => app.status === 'Selected').length,
      rejected: applications.filter(app => app.status === 'Rejected').length
    };

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statPending').textContent = stats.pending;
    document.getElementById('statReview').textContent = stats.review;
    document.getElementById('statShortlisted').textContent = stats.shortlisted;
    document.getElementById('statSelected').textContent = stats.selected;
    document.getElementById('statRejected').textContent = stats.rejected;
  }


  // Filters - all client-side for instant results
  statusFilter.addEventListener('change', renderApplications);
  roleFilter.addEventListener('change', renderApplications);
  
  // Instant search on each keystroke (client-side filtering)
  searchInput.addEventListener('input', () => {
    renderApplications();
    // Show/hide clear search button
    if (clearSearchBtn) {
      clearSearchBtn.classList.toggle('hidden', !searchInput.value.trim());
    }
  });

  // Clear filters
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      statusFilter.value = '';
      roleFilter.value = '';
      searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
      renderApplications(); // Client-side filtering, instant update
    });
  }

  // Clear search
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      renderApplications();
    });
  }

  // Refresh (force refresh, bypass cache)
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadApplications(true); // Force refresh
      refreshBtn.classList.add('spinning');
      setTimeout(() => refreshBtn.classList.remove('spinning'), 1000);
    });
  }

  // Export (CSV)
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const filtered = getFilteredApplications();
      if (filtered.length === 0) {
        alert('No applications to export.');
        return;
      }
      
      // Create CSV with all form fields
      const headers = [
        'Full Name',
        'Email Address',
        'Phone Number',
        'Current Rotaract Club',
        'Rotary International District',
        'Year of Serving as DRR',
        'Years in Rotaract',
        '1st Preference Role',
        '1st Preference Role (Other)',
        'Vision for 1st Preference Role',
        '2nd Preference Role',
        '2nd Preference Role (Other)',
        'Vision for 2nd Preference Role',
        'Vision for RSAMDIO 2026-27',
        'Status',
        'Submitted Date',
        'Updated Date'
      ];
      
      const rows = filtered.map(app => {
        // Format role preferences
        const firstRole = app.first_preference_role || '';
        const firstRoleOther = (firstRole === 'Other' && app.first_preference_role_other) ? app.first_preference_role_other : '';
        const secondRole = app.second_preference_role || '';
        const secondRoleOther = (secondRole === 'Other' && app.second_preference_role_other) ? app.second_preference_role_other : '';
        
        // Format dates
        const submittedDate = app.createdAt ? new Date(app.createdAt).toLocaleString() : (app.timestamp ? new Date(app.timestamp.seconds * 1000).toLocaleString() : 'N/A');
        const updatedDate = app.updatedAt ? new Date(app.updatedAt.seconds * 1000).toLocaleString() : (app.updatedAt ? new Date(app.updatedAt).toLocaleString() : '');
        
        return [
          app.full_name || '',
          app.email || '',
          app.phone || '',
          app.current_club || '',
          app.district || '',
          app.drr_year || '',
          app.years_in_rotaract || '',
          firstRole,
          firstRoleOther,
          app.vision_first_role || '',
          secondRole,
          secondRoleOther,
          app.vision_second_role || '',
          app.vision_rsamdio || '',
          app.status || 'Pending',
          submittedDate,
          updatedDate
        ];
      });
      
      const csv = [headers, ...rows].map(row => 
        row.map(cell => {
          // Handle multiline text (replace newlines with spaces for CSV)
          const cellValue = String(cell).replace(/\n/g, ' ').replace(/\r/g, '');
          return `"${cellValue.replace(/"/g, '""')}"`;
        }).join(',')
      ).join('\n');
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rsamdio-nominations-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  // Initialize
  if (auth.currentUser) {
    showDashboard();
    loadApplications();
  }
})();

