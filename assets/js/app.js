/* RSAMDIO Nomination Form - Dynamic Renderer with Progress, Storage and Submit */
(function() {
  // Get Firebase instance from shared config
  function getFirebase() {
    const { db } = initializeFirebase();
    return db;
  }

  const QUESTIONS = [
    {
      id: 'intro',
      title: 'Committee Nominations',
      type: 'intro',
      description: 'Thank you for your interest in serving RSA MDIO in RY 2026-27. Please complete this nomination form to apply for a committee role.<br><br><strong>Deadline: 26 April 2026</strong>'
    },
    {
      id: 'full_name',
      title: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your full name',
      hint: 'Please enter your full name.'
    },
    {
      id: 'email',
      title: 'Email Address',
      type: 'text',
      required: true,
      placeholder: 'Enter your email address',
      hint: 'Please enter a valid email address where we can reach you.'
    },
    {
      id: 'phone',
      title: 'Phone Number',
      type: 'text',
      required: true,
      placeholder: 'Enter your phone number',
      hint: 'Please enter your contact phone number.'
    },
    {
      id: 'current_club',
      title: 'Current Rotaract Club',
      type: 'text',
      required: true,
      placeholder: 'Enter your current Rotaract club name',
      hint: 'Please enter the name of your current Rotaract club.'
    },
    {
      id: 'district',
      title: 'Rotary International District',
      type: 'text',
      required: true,
      placeholder: 'Enter your Rotary International district number',
      hint: 'Please enter your Rotary International district number (e.g., 3191).'
    },
    {
      id: 'years_in_rotaract',
      title: 'Years in Rotaract',
      type: 'text',
      required: true,
      placeholder: 'Enter number of years',
      hint: 'Please enter the number of years you have been in Rotaract.'
    },
    {
      id: 'committee',
      title: 'Select the Committee You Are Applying For',
      type: 'radio',
      required: true,
      options: [
        'Design and Visual Communications',
        'Social Media and Outreach',
        'Video & Story Telling',
        'Editorial and Content',
        'Web and Tech',
        'Programs & Operations'
      ],
      hint: 'Choose one committee from the list.'
    },
    {
      id: 'rotaract_journey',
      title: 'Tell Us About Your Rotaract Journey',
      type: 'textarea',
      required: true,
      placeholder: 'Share your Rotaract journey, key milestones, and experiences...',
      hint: 'Briefly describe your Rotaract journey and the experiences that shaped your leadership.'
    },
    {
      id: 'vision_committee',
      title: 'Why Are You a Strong Fit for This Committee?',
      type: 'textarea',
      required: true,
      placeholder: 'Share your vision, skills, and how you will contribute to this committee...',
      hint: 'Tell us what value you will bring and what outcomes you hope to drive.'
    },
    {
      id: 'vision_rsamdio',
      title: 'Vision for RSAMDIO 2026-27',
      type: 'textarea',
      required: true,
      placeholder: 'Share your overall vision for RSAMDIO in RY 2026-27...',
      hint: 'Please share your overall vision and goals, and what can we do in RY 2026-27 for betterment of RSAMDIO.'
    },
    {
      id: 'review',
      title: 'Review & Submit',
      type: 'review',
      description: 'Please review your responses before submitting.'
    }
  ];

  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v || '';
      else if (k === 'for') node.htmlFor = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.substring(2), v);
      else if (k === 'checked' || k === 'selected' || k === 'disabled' || k === 'multiple') { node[k] = !!v; }
      else if (v === false || v == null) { /* skip */ }
      else node.setAttribute(k, v);
    });
    for (const c of children) if (c != null) node.append(c.nodeType ? c : document.createTextNode(String(c)));
    return node;
  };

  // Toast Notification System
  function showToast(type, title, message, duration = 5000) {
    const toast = el('div', { class: `toast toast--${type}` },
      el('div', { class: `toast__icon toast__icon--${type}` }, getToastIcon(type)),
      el('div', { class: 'toast__content' },
        el('div', { class: 'toast__title' }, title),
        el('div', { class: 'toast__message' }, message)
      ),
      el('button', { 
        class: 'toast__close',
        onclick: () => hideToast(toast)
      }, 
        el('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
          el('path', { d: 'M18 6L6 18' }),
          el('path', { d: 'M6 6l12 12' })
        )
      ),
      el('div', { class: 'toast__progress' })
    );

    toastContainer.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast--show');
    });

    // Auto-hide after duration
    if (duration > 0) {
      const progressBar = toast.querySelector('.toast__progress');
      progressBar.style.width = '100%';
      progressBar.style.transitionDuration = `${duration}ms`;
      
      setTimeout(() => {
        hideToast(toast);
      }, duration);
    }

    return toast;
  }

  function hideToast(toast) {
    toast.classList.remove('toast--show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  function getToastIcon(type) {
    const icons = {
      error: el('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        el('circle', { cx: '12', cy: '12', r: '10' }),
        el('line', { x1: '15', y1: '9', x2: '9', y2: '15' }),
        el('line', { x1: '9', y1: '9', x2: '15', y2: '15' })
      ),
      success: el('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        el('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
        el('polyline', { points: '22,4 12,14.01 9,11.01' })
      ),
      warning: el('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        el('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
        el('line', { x1: '12', y1: '9', x2: '12', y2: '13' }),
        el('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
      ),
      info: el('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        el('circle', { cx: '12', cy: '12', r: '10' }),
        el('line', { x1: '12', y1: '16', x2: '12', y2: '12' }),
        el('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' })
      )
    };
    return icons[type] || icons.info;
  }

  const state = {
    index: 0,
    answers: loadFromStorage(),
    isUserScrolling: false,
    lastScrollTime: 0,
  };

  const navEl = document.getElementById('questionNav');
  const navElMobile = document.getElementById('questionNavMobile');
  const rootEl = document.getElementById('questionRoot');
  const progressFill = document.getElementById('progressFill');
  const backgroundFill = document.getElementById('backgroundFill');
  const toastContainer = document.getElementById('toastContainer');
  const btnBack = document.getElementById('btnBack');
  const btnNext = document.getElementById('btnNext');
  const btnSubmit = document.getElementById('btnSubmit');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const modal = document.getElementById('successModal');
  const startNewSurvey = document.getElementById('startNewSurvey');

  function loadFromStorage() {
    try { return JSON.parse(localStorage.getItem('rsamdio_nomination_answers') || '{}'); } catch { return {}; }
  }
  function saveToStorage() {
    localStorage.setItem('rsamdio_nomination_answers', JSON.stringify(state.answers));
  }

  function updateProgress() {
    const completed = QUESTIONS.filter(q => q.type !== 'intro' && q.type !== 'review' && !!state.answers[q.id] && (Array.isArray(state.answers[q.id]) ? state.answers[q.id].length > 0 : true)).length;
    const totalQuestions = QUESTIONS.filter(q => q.type !== 'intro' && q.type !== 'review').length;
    const percent = Math.round((completed / totalQuestions) * 100);
    progressFill.style.width = percent + '%';
    
    // Update background fill from bottom to top
    if (backgroundFill) {
      backgroundFill.style.height = percent + '%';
    }
    
    btnSubmit.classList.toggle('hidden', QUESTIONS[state.index].type !== 'review');
    btnNext.classList.toggle('hidden', QUESTIONS[state.index].type === 'review' || state.index >= QUESTIONS.length - 1);
    btnBack.disabled = state.index === 0;
  }

  function buildNavInto(container) {
    container.innerHTML = '';
    QUESTIONS.forEach((q, i) => {
      const completed = q.type === 'intro' ? state.index > 0 : (!!state.answers[q.id] && (Array.isArray(state.answers[q.id]) ? state.answers[q.id].length > 0 : true));
      const item = el('a', { href: '#', class: 'question-nav__item ' + (i === state.index ? 'question-nav__item--current ' : '') + (completed ? 'question-nav__item--completed' : ''), 'data-index': i, onclick: (e) => { e.preventDefault(); goTo(i); } },
        el('span', { class: 'question-nav__number' }, i + 1),
        el('div', { class: 'question-nav__text' }, q.title),
        el('span', { class: 'question-nav__status' }, completed ? 'Done' : 'Pending')
      );
      container.appendChild(item);
    });
  }

  function renderNav() {
    if (navEl) buildNavInto(navEl);
    if (navElMobile) buildNavInto(navElMobile);
    
    // Ensure mobile navigation is visible on mobile screens
    if (window.innerWidth <= 900 && navElMobile) {
      navElMobile.style.display = 'flex';
    }
    
    // Don't auto-scroll during option selection, only during navigation
  }

  function scrollToCurrentQuestion() {
    const container = (window.innerWidth > 900 ? navEl : (navElMobile || navEl));
    const currentItem = container ? container.querySelector('.question-nav__item--current') : null;
    if (currentItem) {
      // For desktop (vertical layout)
      if (window.innerWidth > 900) {
        currentItem.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      } else {
        // For mobile (horizontal layout) - only scroll navigation, not page
        // Only scroll if user isn't actively scrolling
        if (!state.isUserScrolling) {
          currentItem.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    }
  }

  function scrollMainContentToTop() {
    // Only scroll main content to top on desktop screens
    if (window.innerWidth > 900) {
      const mainElement = document.querySelector('.main');
      
      // Scroll the main element to top if it's scrollable
      if (mainElement && mainElement.scrollTop > 0) {
        mainElement.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  }

  function renderQuestion() {
    const q = QUESTIONS[state.index];
    rootEl.innerHTML = '';
    
    // Create consistent header structure for all questions
    // For intro, allow HTML in description (for links)
    let descriptionEl;
    if (q.type === 'intro' && q.description) {
      const div = document.createElement('div');
      div.className = 'question__subtitle';
      div.innerHTML = q.description;
      descriptionEl = div;
    } else {
      descriptionEl = el('p', { class: 'question__subtitle' }, q.type === 'intro' ? q.description : '');
    }
    
    const header = el('div', { class: 'question__header' },
      el('h2', { class: 'question__title' }, q.title, q.required ? el('span', { class: 'question__required' }, '*') : ''),
      // Always create both subtitle and hint elements, but conditionally populate them
      descriptionEl,
      el('p', { class: 'question__hint' }, q.hint ? q.hint : '')
    );
    const optionsWrap = el('div', { class: 'question__options' });

    const current = state.answers[q.id];
    if (q.type === 'intro') {
      const start = el('button', { class: 'btn btn--primary', onclick: (e) => { e.preventDefault(); goTo(1); } }, 'Start Nomination Form');
      const viewRoles = el('a', { 
        href: '/committees', 
        class: 'btn btn--secondary btn--roles-link',
        onclick: (e) => { e.stopPropagation(); }
      }, 
        'View all Roles and Responsibilities',
        el('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', class: 'btn__icon' },
          el('path', { d: 'M5 12h14M12 5l7 7-7 7' })
        )
      );
      optionsWrap.append(start, viewRoles);
    } else if (q.type === 'text') {
      const inputType = q.id === 'email' ? 'email' : (q.id === 'phone' ? 'tel' : 'text');
      const input = el('input', { 
        class: 'text-input', 
        type: inputType, 
        id: q.id, 
        name: q.id, 
        placeholder: q.placeholder || '', 
        value: current || '',
        oninput: () => { state.answers[q.id] = input.value; saveToStorage(); updateProgress(); renderNav(); }
      });
      if (q.id === 'years_in_rotaract') {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
      }
      optionsWrap.append(input);
    } else if (q.type === 'textarea') {
      const textarea = el('textarea', { 
        class: 'text-input', 
        id: q.id, 
        name: q.id, 
        placeholder: q.placeholder || '', 
        rows: 4,
        oninput: () => { state.answers[q.id] = textarea.value; saveToStorage(); updateProgress(); renderNav(); }
      });
      if (current) textarea.value = current;
      optionsWrap.append(textarea);
    } else if (q.type === 'review') {
      const reviewItems = [
        [QUESTIONS.find(q => q.id === 'full_name').title, state.answers.full_name || '-'],
        [QUESTIONS.find(q => q.id === 'email').title, state.answers.email || '-'],
        [QUESTIONS.find(q => q.id === 'phone').title, state.answers.phone || '-'],
        [QUESTIONS.find(q => q.id === 'current_club').title, state.answers.current_club || '-'],
        [QUESTIONS.find(q => q.id === 'district').title, state.answers.district || '-'],
        [QUESTIONS.find(q => q.id === 'years_in_rotaract').title, state.answers.years_in_rotaract || '-'],
        [QUESTIONS.find(q => q.id === 'committee').title, state.answers.committee || '-'],
        [QUESTIONS.find(q => q.id === 'rotaract_journey').title, state.answers.rotaract_journey || '-'],
        [QUESTIONS.find(q => q.id === 'vision_committee').title, state.answers.vision_committee || '-'],
        [QUESTIONS.find(q => q.id === 'vision_rsamdio').title, state.answers.vision_rsamdio || '-']
      ];
      
      // Add full-width class for review section
      optionsWrap.classList.add('review-container');
      
      const reviewList = el('div', { class: 'review-list' });
      reviewItems.forEach(([key, value]) => {
        const item = el('div', { class: 'review-item' },
          el('strong', { class: 'review-key' }, key + ': '),
          // Special handling for textarea content to preserve line breaks
          (key === QUESTIONS.find(q => q.id === 'rotaract_journey').title || 
           key === QUESTIONS.find(q => q.id === 'vision_committee').title ||
           key === QUESTIONS.find(q => q.id === 'vision_rsamdio').title)
            ? el('div', { class: 'review-value review-value--textarea' }, value)
            : el('span', { class: 'review-value' }, value)
        );
        reviewList.append(item);
      });
      optionsWrap.append(reviewList);
    } else if (q.type === 'radio') {
      // For district number, render compact grid
      if (q.id === 'district_number') {
        optionsWrap.classList.add('grid');
      }
      // For committee selection, render full-width options
      if (q.id === 'committee') {
        optionsWrap.classList.add('grid', 'grid--full');
      }
      
      // Determine if there is an existing custom (other) value persisted
      const hasOption = new Set((q.options || []));
      let currentOtherValue = state.answers[`${q.id}_other`] || '';
      const isOtherSelected = current === 'Other' || (currentOtherValue && !hasOption.has(current));
      
      q.options.forEach((opt, i) => {
        const id = `${q.id}_${i}`;
        const isChecked = opt === 'Other' ? isOtherSelected : (current === opt);
        const onChange = () => {
          if (opt === 'Other') {
            state.answers[q.id] = 'Other';
            const otherInputWrap = document.getElementById(`${q.id}_other_wrap`);
            if (otherInputWrap) {
              otherInputWrap.style.display = 'block';
              const otherInput = document.getElementById(`${q.id}_other_input`);
              if (otherInput) {
                otherInput.focus();
                // If there's already a value, keep it
                if (currentOtherValue) {
                  state.answers[`${q.id}_other`] = currentOtherValue;
                }
              }
            }
          } else {
            state.answers[q.id] = opt;
            // Clear other value if switching away from Other
            if (state.answers[`${q.id}_other`]) {
              state.answers[`${q.id}_other`] = '';
            }
            const otherInputWrap = document.getElementById(`${q.id}_other_wrap`);
            if (otherInputWrap) {
              otherInputWrap.style.display = 'none';
            }
          }
          saveToStorage();
          updateProgress();
          renderNav();
        };
        optionsWrap.append(
          el('div', { class: 'option' },
            el('input', { class: 'option__input', type: 'radio', id, name: q.id, value: opt, checked: isChecked, onchange: onChange }),
            el('label', { class: 'option__label', for: id }, opt)
          )
        );
      });
      
      // Render an "Other (please specify)" option with an inline text input when enabled
      if (q.otherText) {
        const otherInput = el('input', {
          class: 'text-input',
          type: 'text',
          id: `${q.id}_other_input`,
          name: `${q.id}_other`,
          placeholder: 'Please specify...',
          value: currentOtherValue || '',
          oninput: () => {
            const newVal = otherInput.value.trim();
            if (newVal) {
              state.answers[q.id] = 'Other';
              state.answers[`${q.id}_other`] = newVal;
              // Update the radio button state
              const otherRadio = document.querySelector(`input[name="${q.id}"][value="Other"]`);
              if (otherRadio) {
                otherRadio.checked = true;
              }
            } else {
              state.answers[`${q.id}_other`] = '';
            }
            saveToStorage();
            updateProgress();
            renderNav();
          }
        });

        // Wrap input for show/hide control
        const otherInputWrap = el('div', { id: `${q.id}_other_wrap` }, otherInput);
        if (!isOtherSelected) {
          otherInputWrap.style.display = 'none';
        }

        optionsWrap.append(otherInputWrap);
      }
    } else if (q.type === 'select') {
      const select = el('select', { class: 'text-input', id: q.id, onchange: () => { 
        state.answers[q.id] = select.value; 
        saveToStorage(); 
        updateProgress(); 
        renderNav();
        // Show/hide "Other" input if needed
        if (q.otherText) {
          const otherInputWrap = document.getElementById(`${q.id}_other_wrap`);
          if (otherInputWrap) {
            otherInputWrap.style.display = select.value === 'Other' ? 'block' : 'none';
            if (select.value !== 'Other') {
              const otherInput = document.getElementById(`${q.id}_other_input`);
              if (otherInput) {
                otherInput.value = '';
                state.answers[`${q.id}_other`] = '';
                saveToStorage();
              }
            }
          }
        }
      } });
      select.append(el('option', { value: '' }, 'Select...'));
      q.options.forEach(v => select.append(el('option', { value: v, selected: current === v }, v)));
      optionsWrap.append(select);
      
      // Add "Other" text input if otherText is enabled
      if (q.otherText) {
        const otherInput = el('input', {
          class: 'text-input',
          type: 'text',
          id: `${q.id}_other_input`,
          name: `${q.id}_other`,
          placeholder: 'Please specify...',
          value: state.answers[`${q.id}_other`] || '',
          style: { display: current === 'Other' ? 'block' : 'none', marginTop: '12px' },
          oninput: () => {
            state.answers[`${q.id}_other`] = otherInput.value;
            if (otherInput.value.trim()) {
              state.answers[q.id] = 'Other';
              select.value = 'Other';
            }
            saveToStorage();
            updateProgress();
            renderNav();
          }
        });
        const otherInputWrap = el('div', { id: `${q.id}_other_wrap` }, otherInput);
        optionsWrap.append(otherInputWrap);
      }
    } else if (q.type === 'checkbox') {
      const selected = Array.isArray(current) ? new Set(current) : new Set();
      // Determine if there is an existing custom (other) value persisted
      const hasOption = new Set((q.options || []));
      let currentOtherValue = Array.from(selected).find(v => !hasOption.has(v));
      q.options.forEach((opt, i) => {
        const id = `${q.id}_${i}`;
        const onChange = () => {
          if (checkbox.checked) {
            if (q.max && selected.size >= q.max) {
              checkbox.checked = false; // revert
              showToast('warning', 'Selection Limit', `Please select up to ${q.max} options.`);
              return;
            }
            selected.add(opt);
          } else {
            selected.delete(opt);
          }
          state.answers[q.id] = Array.from(selected);
          saveToStorage();
          updateProgress();
          renderNav();
        };
        const checkbox = el('input', { class: 'option__input', type: 'checkbox', id, name: q.id, value: opt, checked: selected.has(opt), onchange: onChange });
        optionsWrap.append(
          el('div', { class: 'option' },
            checkbox,
            el('label', { class: 'option__label', for: id }, opt)
          )
        );
      });

      // Render an "Other (please specify)" option with an inline text input when enabled
      if (q.otherText) {
        const otherId = `${q.id}_other`;
        const otherCheckbox = el('input', { class: 'option__input', type: 'checkbox', id: otherId, name: q.id });
        const otherLabel = el('label', { class: 'option__label', for: otherId }, 'Other (please specify)');
        const otherInput = el('input', {
          class: 'text-input',
          type: 'text',
          id: `${q.id}_other_input`,
          placeholder: 'Type your answer…',
          value: currentOtherValue || '',
          oninput: () => {
            const newVal = otherInput.value.trim();
            // Remove previous other value if present
            if (currentOtherValue && selected.has(currentOtherValue)) {
              selected.delete(currentOtherValue);
            }
            // Add new value if present and within limit
            if (newVal) {
              const sizeWithoutOther = selected.size;
              if (q.max && sizeWithoutOther >= q.max) {
                // Revert and warn
                otherInput.value = currentOtherValue || '';
                showToast('warning', 'Selection Limit', `Please select up to ${q.max} options.`);
              } else {
                selected.add(newVal);
                currentOtherValue = newVal;
                otherCheckbox.checked = true;
              }
            } else {
              currentOtherValue = '';
              otherCheckbox.checked = false;
              otherInputWrap.style.display = 'none';
            }
            state.answers[q.id] = Array.from(selected);
            saveToStorage();
            updateProgress();
            renderNav();
          }
        });

        // Wrap input for show/hide control
        const otherInputWrap = el('div', {}, otherInput);
        if (!currentOtherValue) {
          otherInputWrap.style.display = 'none';
        }

        // Initialize checkbox state based on existing other value
        if (currentOtherValue) {
          otherCheckbox.checked = true;
          otherInputWrap.style.display = 'block';
        }

        otherCheckbox.onchange = () => {
          if (!otherCheckbox.checked) {
            // Unchecked: remove custom value
            if (currentOtherValue && selected.has(currentOtherValue)) {
              selected.delete(currentOtherValue);
            }
            currentOtherValue = '';
            otherInput.value = '';
            otherInputWrap.style.display = 'none';
          } else {
            // Checked: if there is text, try to add; otherwise focus input
            const newVal = otherInput.value.trim();
            if (newVal) {
              if (q.max && selected.size >= q.max) {
                otherCheckbox.checked = false;
                showToast('warning', 'Selection Limit', `Please select up to ${q.max} options.`);
              } else {
                selected.add(newVal);
                currentOtherValue = newVal;
              }
            } else {
              // Prompt user to type
              otherInputWrap.style.display = 'block';
              otherInput.focus();
            }
          }
          state.answers[q.id] = Array.from(selected);
          saveToStorage();
          updateProgress();
          renderNav();
        };

        // Group the other checkbox/label and input
        const otherGroup = el('div', { class: 'option' },
          otherCheckbox,
          otherLabel,
          // Place input below for clarity
          otherInputWrap
        );
        optionsWrap.append(otherGroup);
      }
    }

    rootEl.append(header, optionsWrap);
  }

  function goTo(i) {
    state.index = Math.max(0, Math.min(QUESTIONS.length - 1, i));
    renderQuestion();
    renderNav();
    updateProgress();
    
    // Scroll main content to top on desktop, and navigation on mobile
    setTimeout(() => {
      scrollToCurrentQuestion();
      scrollMainContentToTop();
    }, window.innerWidth > 900 ? 100 : 200); // Longer delay on mobile to avoid interference
  }

  function next() {
    if (!validateCurrent()) return;
    goTo(state.index + 1);
  }

  function prev() {
    goTo(state.index - 1);
  }

  function validateCurrent() {
    const q = QUESTIONS[state.index];
    const v = state.answers[q.id];
    if (q.required && (v == null || v === '' || (Array.isArray(v) && v.length === 0))) {
      showToast('error', 'Required Question', 'Please answer the required question to continue.');
      return false;
    }
    // Additional validation for checkbox questions with Other text option
    if (q.type === 'checkbox' && q.otherText) {
      const otherCheckbox = document.getElementById(`${q.id}_other`);
      const otherInput = document.getElementById(`${q.id}_other_input`);
      if (otherCheckbox && otherInput && otherCheckbox.checked && otherInput.value.trim() === '') {
        showToast('error', 'Specify Other', "You selected 'Other'. Please specify your response.");
        return false;
      }
    }
    // Additional validation for select questions with Other text option
    if (q.type === 'select' && q.otherText && v === 'Other') {
      const otherInput = document.getElementById(`${q.id}_other_input`);
      if (otherInput && otherInput.value.trim() === '') {
        showToast('error', 'Specify Other', "You selected 'Other'. Please specify your response.");
        return false;
      }
    }
    // Additional validation for radio questions with Other text option
    if (q.type === 'radio' && q.otherText && v === 'Other') {
      const otherInput = document.getElementById(`${q.id}_other_input`);
      if (otherInput && otherInput.value.trim() === '') {
        showToast('error', 'Specify Other', "You selected 'Other'. Please specify your response.");
        return false;
      }
    }
    return true;
  }

  function simulateNetwork(ms = 600) { return new Promise(r => setTimeout(r, ms)); }

  function openModal() { modal.classList.remove('hidden'); }
  function closeModal() { modal.classList.add('hidden'); }

  async function submitAll() {
    // Validate all required
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      const v = state.answers[q.id];
      if (q.required && (v == null || v === '' || (Array.isArray(v) && v.length === 0))) {
        goTo(i);
        showToast('error', 'Incomplete Form', 'Please answer all required questions before submitting.');
        return;
      }
      // Enforce 'Other' text filled when selected on any checkbox question with otherText enabled
      if (q.type === 'checkbox' && q.otherText) {
        const otherCheckbox = document.getElementById(`${q.id}_other`);
        const otherInput = document.getElementById(`${q.id}_other_input`);
        if (otherCheckbox && otherInput && otherCheckbox.checked && otherInput.value.trim() === '') {
          goTo(i);
          showToast('error', 'Specify Other', "You selected 'Other'. Please specify your response.");
          return;
        }
      }
      // Enforce 'Other' text filled when selected on any select question with otherText enabled
      if (q.type === 'select' && q.otherText && v === 'Other') {
        const otherInput = document.getElementById(`${q.id}_other_input`);
        if (otherInput && otherInput.value.trim() === '') {
          goTo(i);
          showToast('error', 'Specify Other', "You selected 'Other'. Please specify your response.");
          return;
        }
      }
      // Enforce 'Other' text filled when selected on any radio question with otherText enabled
      if (q.type === 'radio' && q.otherText && v === 'Other') {
        const otherInput = document.getElementById(`${q.id}_other_input`);
        if (otherInput && otherInput.value.trim() === '') {
          goTo(i);
          showToast('error', 'Specify Other', "You selected 'Other'. Please specify your response.");
          return;
        }
      }
    }

    const submitBtn = document.getElementById('btnSubmit');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    loadingOverlay.classList.remove('hidden');

    try {
      // Get Firebase instance
      const db = getFirebase();
      if (!db) {
        throw new Error('Firebase not initialized. Please check your configuration.');
      }

      // Prepare submission data
      const submissionData = {
        ...state.answers,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      // Submit to Firebase Firestore
      await db.collection('nominations').add(submissionData);
      
      loadingOverlay.classList.add('hidden');
      // Reset button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      showSuccess();
    } catch (error) {
      console.error('Submission error:', error);
      loadingOverlay.classList.add('hidden');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      showToast('error', 'Submission Failed', 'There was an error submitting your nomination. Please try again.');
    }
  }

  function showSuccess() {
    // Show success modal immediately for faster loading
    openModal();
    
    // Show success toast after modal is shown
    setTimeout(() => {
      showToast('success', 'Nomination Submitted!', 'Thank you for your nomination. Your submission has been recorded successfully.', 3000);
    }, 200);
    
    // Clear stored data after successful submission
    localStorage.removeItem('rsamdio_nomination_answers');
  }

  // Events
  btnNext.addEventListener('click', next);
  btnBack.addEventListener('click', prev);
  btnSubmit.addEventListener('click', submitAll);
  
  // Start new survey
  if (startNewSurvey) {
    startNewSurvey.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
      
      // Reset state
      state.index = 0;
      state.answers = {};
      
      // Clear storage
      localStorage.removeItem('rsamdio_nomination_answers');
      
      // Reset submit button state
      const submitBtn = document.getElementById('btnSubmit');
      if (submitBtn) {
        submitBtn.textContent = 'Submit';
        submitBtn.disabled = false;
      }
      
      // Re-render everything
      renderNav();
      renderQuestion();
      updateProgress();
    });
  }

  // Handle window resize for responsive scrolling
  window.addEventListener('resize', () => {
    setTimeout(() => {
      scrollToCurrentQuestion();
      
      // Ensure proper mobile navigation visibility
      if (window.innerWidth <= 900 && navElMobile) {
        navElMobile.style.display = 'flex';
      } else if (window.innerWidth > 900 && navElMobile) {
        navElMobile.style.display = 'none';
      }
    }, 100);
  });

  // Track user scrolling to prevent auto-scroll interference
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    state.isUserScrolling = true;
    state.lastScrollTime = Date.now();
    
    // Clear existing timeout
    clearTimeout(scrollTimeout);
    
    // Reset user scrolling flag after user stops scrolling
    scrollTimeout = setTimeout(() => {
      state.isUserScrolling = false;
    }, 150);
  }, { passive: true });

  // Init
  renderNav();
  renderQuestion();
  updateProgress();
  
  // Ensure proper initial mobile navigation visibility
  if (window.innerWidth <= 900 && navElMobile) {
    navElMobile.style.display = 'flex';
  } else if (window.innerWidth > 900 && navElMobile) {
    navElMobile.style.display = 'none';
  }
})();
