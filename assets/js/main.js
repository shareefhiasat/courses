import {
  signUp,
  signIn,
  signOutUser,
  resetPassword,
  sendEmailLink,
  completeEmailLinkSignIn,
  onAuthChange,
  saveProgress,
  getProgress,
  getPublicActivities,
  subscribeAnnouncements,
  manageUserPresence,
  db
} from '../../firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
import { t } from './localization.js';

// --- STATE MANAGEMENT ---
document.addEventListener('DOMContentLoaded', () => {
  let state = {
    currentUser: null,
    lang: localStorage.getItem('lang') || 'en',
    activities: [],
    allowlist: { allowedEmails: [], adminEmails: [] },
    userProgress: {},
    authMode: 'login', // 'login' | 'signup'
  };

  // --- LOADING OVERLAY ---
  function ensureLoading() {
    let o = document.getElementById('global-loading');
    if (!o) {
      o = document.createElement('div');
      o.id = 'global-loading';
      Object.assign(o.style, {
        position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.35)',
        display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 99998
      });
      const spinner = document.createElement('div');
      Object.assign(spinner.style, {
        width: '54px', height: '54px', border: '6px solid #fff', borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.9s linear infinite'
      });
      const style = document.createElement('style');
      style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      o.appendChild(spinner);
      document.body.appendChild(style);
      document.body.appendChild(o);
    }
    return o;
  }
  function showLoading(show) {
    const o = ensureLoading();
    o.style.display = show ? 'flex' : 'none';
  }

  // --- UTILS ---
  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'style' && typeof v === 'object') {
        Object.assign(node.style, v);
      } else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.substring(2), v);
      } else if (v !== undefined && v !== null) {
        node.setAttribute(k, v);
      }
    });
    children.flat().forEach(child => {
      if (child instanceof Node) node.appendChild(child);
      else if (child !== null && child !== undefined) node.appendChild(document.createTextNode(String(child)));
    });
    return node;
  };

  // Lightweight toast (mirrors admin.js styling)
  function showToast(msg, type = 'info') {
    let host = document.getElementById('toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toast-host';
      Object.assign(host.style, { position: 'fixed', top: '16px', right: '16px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px' });
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.textContent = String(msg || '');
    Object.assign(t.style, { background: type === 'success' ? '#198754' : type === 'error' ? '#dc3545' : '#0d6efd', color: '#fff', padding: '10px 14px', borderRadius: '8px', boxShadow: '0 6px 18px rgba(0,0,0,0.2)', fontWeight: 600 });
    host.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // --- RENDER FUNCTIONS ---
  function render() {
    console.log('[App] Rendering UI with state:', { hasUser: !!state.currentUser, lang: state.lang });
    applyLanguage();
    renderAuthBar();
    renderActivities();
  }

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.body.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    const translations = {
      'main-title': { en: 'Learning Hub', ar: 'مركز تعلم' },
      'main-subtitle': { en: 'Interactive exercises and games for mastering programming concepts', ar: 'تمارين وألعاب تفاعلية لإتقان مفاهيم البرمجة' },
    };
    Object.keys(translations).forEach(id => {
      const element = document.getElementById(id);
      if (element) element.textContent = translations[id][state.lang];
    });
  }

  function renderAuthBar() {
    const nav = document.getElementById('main-nav');
    const bell = document.getElementById('notification-bell');
    if (!authMount || !inboxBtn) return;

    authMount.innerHTML = ''; // Clear previous state
    authMount.style.display = 'flex';
    authMount.style.alignItems = 'center';
    authMount.style.flexWrap = 'wrap';
    // Center when logged out; push to right when logged in (set below)
    authMount.style.justifyContent = 'center';

    if (state.currentUser) {
      inboxBtn.style.display = 'flex';
      console.log('[AuthBar] Logged in UI');
      
      // Show navigation when logged in
      if (nav) nav.style.display = 'block';
      if (bell) bell.style.display = 'inline-block';
      
      // Inline quick links (Dashboard, Admin when applicable)
      const quickLinks = el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginRight: '8px' } },
        el('a', { href: 'dashboard.html', style: { textDecoration: 'none' } },
          el('button', { style: { padding: '8px 12px', border: 'none', borderRadius: '6px', background: '#0d6efd', color: '#fff', cursor: 'pointer' } }, 'Dashboard')
        ),
        (state.allowlist.adminEmails?.map(e=>e.toLowerCase()).includes(state.currentUser.email?.toLowerCase()||'')) ?
          el('span', { style: { padding: '6px 10px', borderRadius: '999px', background: '#6f42c1', color: '#fff', fontWeight: '700' } }, 'Admin') : null
      );

      // Push the logged-in controls to the far right on wide screens
      authMount.style.justifyContent = 'flex-end';
      authMount.appendChild(quickLinks);
      
      // User avatar with dropdown menu
      const avatarContainer = el('div', { style: { position: 'relative', display: 'inline-block' } });
      const avatar = el('div', { 
        style: {
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: '600',
          cursor: 'pointer',
          marginRight: '8px'
        },
        title: state.currentUser.email
      }, (state.currentUser.displayName || state.currentUser.email || 'U').charAt(0).toUpperCase());
      
      const menu = el('div', { 
        style: {
          display: 'none',
          position: 'absolute',
          top: '45px',
          right: '0',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '220px',
          zIndex: '1000',
          padding: '8px 0'
        }
      });
      
      const userInfo = el('div', { style: { padding: '8px 12px', borderBottom: '1px solid #eee' } },
        el('div', { style: { fontWeight: '600', marginBottom: '4px' } }, state.currentUser.displayName || state.currentUser.email?.split('@')[0] || 'User'),
        el('div', { style: { fontSize: '0.85rem', color: '#666' } }, state.currentUser.email)
      );
      
      const logoutBtn = el('button', { 
        style: {
          width: '100%',
          textAlign: 'left',
          padding: '8px 12px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: '#dc3545',
          fontWeight: '600'
        },
        onclick: () => signOutUser()
      }, t('signout', state.lang));
      
      // Menu entries
      const linksInMenu = el('div', { style: { padding: '6px 12px', borderBottom: '1px solid #eee' } },
        el('a', { href: 'admin.html', style: { display: (state.allowlist.adminEmails?.map(e=>e.toLowerCase()).includes(state.currentUser.email?.toLowerCase()||'')) ? 'inline-block' : 'none', color: '#6f42c1', fontWeight: '700' } }, 'Admin Panel')
      );

      menu.append(userInfo, linksInMenu, logoutBtn);
      avatarContainer.append(avatar, menu);
      
      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' || !menu.style.display ? 'block' : 'none';
      });
      
      document.addEventListener('click', () => menu.style.display = 'none');
      
      authMount.appendChild(avatarContainer);
    } else {
      console.log('[AuthBar] Logged OUT UI');
      inboxBtn.style.display = 'none';

      // Hide navigation when logged out
      if (nav) nav.style.display = 'none';
      if (bell) bell.style.display = 'none';

      // Mode toggle
      const toggleWrap = el('div', { style: { display: 'flex', gap: '6px', marginRight: '8px', background: '#f1f3f5', borderRadius: '8px', padding: '4px' } },
        el('button', { style: btnSegStyle(() => state.authMode === 'login'), onclick: () => { state.authMode = 'login'; renderAuthBar(); } }, 'Login'),
        el('button', { style: btnSegStyle(() => state.authMode === 'signup'), onclick: () => { state.authMode = 'signup'; renderAuthBar(); } }, 'Sign Up')
      );

      const emailInput = el('input', { 
        type: 'email', 
        placeholder: t('email', state.lang),
        style: {
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          minWidth: '220px',
          marginRight: '8px'
        }
      });
      
      const passwordInput = el('input', { 
        type: 'password', 
        placeholder: t('password', state.lang),
        style: {
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          minWidth: '160px',
          marginRight: '8px'
        }
      });
      
      const confirmInput = el('input', { 
        type: 'password', 
        placeholder: t('confirmPassword', state.lang),
        style: {
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          minWidth: '160px',
          marginRight: '8px',
          display: state.authMode === 'signup' ? 'inline-block' : 'none'
        }
      });

      // Submit on Enter in any auth input
      const submitIfEnter = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAuth(state.authMode, emailInput.value, passwordInput.value, confirmInput.value);
        }
      };
      emailInput.addEventListener('keydown', submitIfEnter);
      passwordInput.addEventListener('keydown', submitIfEnter);
      confirmInput.addEventListener('keydown', submitIfEnter);
      
      const submitBtn = el('button', { 
        style: {
          padding: '8px 12px',
          border: 'none',
          borderRadius: '6px',
          background: '#0d6efd',
          color: '#fff',
          cursor: 'pointer',
          marginRight: '8px'
        },
        onclick: () => handleAuth(state.authMode, emailInput.value, passwordInput.value, confirmInput.value)
      }, state.authMode === 'login' ? t('login', state.lang) : t('signup', state.lang));

      const resetBtn = el('button', {
        style: {
          padding: '8px 12px',
          border: 'none',
          borderRadius: '6px',
          background: '#6c757d',
          color: '#fff',
          cursor: 'pointer',
          marginRight: '8px'
        },
        onclick: async () => {
          const msgEl = document.querySelector('#auth-controls span');
          try {
            await resetPassword(emailInput.value);
            if (msgEl) msgEl.textContent = t('emailLinkSent', state.lang);
          } catch (e) {
            if (msgEl) msgEl.textContent = String(e);
          }
        }
      }, t('resetPassword', state.lang));
      
      const msg = el('span', { 
        style: { 
          marginLeft: '8px', 
          opacity: '0.8', 
          minWidth: '220px',
          color: '#dc3545'
        } 
      });
      
      // Only show Reset Password in Login mode
      if (state.authMode === 'login') {
        authMount.append(toggleWrap, emailInput, passwordInput, confirmInput, submitBtn, resetBtn, msg);
      } else {
        authMount.append(toggleWrap, emailInput, passwordInput, confirmInput, submitBtn, msg);
      }
      console.log('[AuthBar] Inputs appended:', authMount.children.length);
    }
  }

  function btnSegStyle(activeFn) {
    const active = activeFn();
    return {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '6px',
      background: active ? '#fff' : 'transparent',
      color: active ? '#0d6efd' : '#495057',
      fontWeight: active ? '700' : '600',
      cursor: 'pointer'
    };
  }

  function renderActivities() {
    const pythonContainer = document.getElementById('python-activities');
    if (pythonContainer) {
        pythonContainer.innerHTML = '';
        state.activities.filter(a => a.course === 'python').forEach(act => {
            const title = state.lang === 'ar' ? act.title_ar : act.title_en;
            pythonContainer.appendChild(el('div', { class: 'timeline-item' }, title));
        });
    }
  }

  // --- EVENT HANDLERS & LOGIC ---
  async function handleAuth(mode, email, password, confirmPassword) {
    const msgEl = document.querySelector('#auth-controls span');
    
    if (!email || !password) {
      if (msgEl) msgEl.textContent = t('fillRequiredFields', state.lang);
      return;
    }
    
    // Show loading overlay during network operations
    showLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await signIn(email, password);
      } else {
        if (password !== confirmPassword) {
          if (msgEl) msgEl.textContent = t('passwordsNotMatch', state.lang);
          return;
        }
        res = await signUp(email, password);
      }

      if (res.success) {
        showToast(mode === 'login' ? t('loggedIn', state.lang) : t('accountCreated', state.lang), 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
      } else {
        const err = typeof res.error === 'string' ? res.error : 'Authentication error';
        showToast(err, 'error');
        if (msgEl) msgEl.textContent = '';
      }
    } catch (e) {
      console.error('Auth error', e);
      showToast(e?.message || 'Authentication error', 'error');
    } finally {
      showLoading(false);
    }
  }

  function setupListeners() {
    const langSelect = document.getElementById('lang-select');
    langSelect.value = state.lang;
    langSelect.addEventListener('change', (e) => {
      state.lang = e.target.value;
      localStorage.setItem('lang', state.lang);
      render(); // Re-render the entire UI
    });
  }

  // --- INITIALIZATION ---
  async function init() {
    setupListeners();

    // Load activities from Firestore (no more client allowlist)
    try {
      const activitiesRes = await getPublicActivities();
      if (activitiesRes.success && activitiesRes.items.length > 0) {
        state.activities = activitiesRes.items;
      } else {
        // Fallback to JSON file
        const jsonRes = await fetch('data/activities.json');
        const jsonData = await jsonRes.json();
        state.activities = jsonData.activities || [];
      }
    } catch (error) {
      console.log('Firestore activities failed, using JSON fallback');
      try {
        const jsonRes = await fetch('data/activities.json');
        const jsonData = await jsonRes.json();
        state.activities = jsonData.activities || [];
      } catch (e) {
        console.error('Error loading activities:', e);
        state.activities = [];
      }
    }

    // Show loader until we get first auth state
    showLoading(true);

    // Setup auth listener
    onAuthChange(async (user) => {
      state.currentUser = user;
      if (user) {
        try {
          const progressRes = await getProgress();
          if (progressRes.success) state.userProgress = progressRes.progress || {};
          // Fetch user data to get enrolled classes for announcements
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const enrolledClasses = userDoc.exists() ? userDoc.data().enrolledClasses || [] : [];

          // Start announcements subscription now that user is logged in
          startAnnouncements(enrolledClasses);
          manageUserPresence(); // Start presence management
        } catch (error) {
          console.error('Error loading progress:', error);
        }
      } else {
        state.userProgress = {};
        stopAnnouncements();
      }
      render();
      showLoading(false);
    });

    // Setup inbox
    setupInbox();
    // Do not render before auth is ready (to avoid flicker)

    // Expose debug helpers
    window.__appDebug = {
      state,
      forceLoggedOutUI: () => { state.currentUser = null; render(); },
      forceLoggedInUI: (email = 'debug@example.com') => { state.currentUser = { email }; render(); }
    };
    
    // Backward-compatible navigation handler used by legacy onclick="showSection()" links
    const sectionRoutes = {
      activities: 'index.html',
      myprogress: 'progress.html',
      chat: 'chat.html',
      leaderboard: 'leaderboard.html',
      announcements: 'index.html#inbox',
      admin: 'dashboard.html'
    };
    window.showSection = (name) => {
      try {
        const key = String(name || '').toLowerCase().replace(/\s+/g, '');
        const target = sectionRoutes[key] || 'index.html';
        window.location.href = target;
      } catch (e) {
        console.warn('showSection fallback error', e);
      }
    };
    console.log('[App] Debug helpers available on window.__appDebug');
  }

  let unsubscribeAnnouncements = null;
  function startAnnouncements() {
    const list = document.getElementById('inbox-items');
    const countEl = document.getElementById('inbox-count');
    if (unsubscribeAnnouncements) unsubscribeAnnouncements();
    try {
      unsubscribeAnnouncements = subscribeAnnouncements((items) => {
        if (countEl) countEl.textContent = String(items.length);
        if (list) {
          list.innerHTML = '';
          items.forEach(a => {
            const item = el('div', { style: { borderBottom: '1px solid #eee', padding: '8px 0' } },
              el('div', { style: { fontWeight: '600' } }, a.title || 'Announcement'),
              a.html ? (() => { const d = document.createElement('div'); d.innerHTML = a.html; return d; })() : null,
              a.link ? el('a', { href: a.link, target: '_blank' }, t('open', state.lang)) : null
            );
            list.appendChild(item);
          });
        }
      });
    } catch (e) {
      console.error('Announcements subscribe failed', e);
    }
  }
  function stopAnnouncements() {
    if (typeof unsubscribeAnnouncements === 'function') {
      try { unsubscribeAnnouncements(); } catch {}
      unsubscribeAnnouncements = null;
    }
  }

  function setupInbox() {
    const btn = document.getElementById('inbox-btn');
    const panel = document.getElementById('inbox-panel');
    const list = document.getElementById('inbox-items');
    const countEl = document.getElementById('inbox-count');
    const closeBtn = document.getElementById('inbox-close');
    
    if (!btn || !panel) return;
    
    btn.addEventListener('click', () => {
      const open = panel.style.display === 'none' || panel.style.display === '';
      panel.style.display = open ? 'block' : 'none';
      // Position based on language (LTR: left, RTL: right)
      if (open) {
        if (state.lang === 'ar') {
          panel.style.left = '';
          panel.style.right = '12px';
        } else {
          panel.style.right = '';
          panel.style.left = '12px';
        }
      }
    });
    
    closeBtn?.addEventListener('click', () => panel.style.display = 'none');

    // Subscription now starts only after login via startAnnouncements()
  }

  init();
});
