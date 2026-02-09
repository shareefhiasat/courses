import { onAuthChange, getPublicActivities, upsertActivity, deleteActivity, isAdmin, getAllowlistConfig, updateAllowlistRemote } from '../../firebase-config.js';
import { t } from './localization.js';

let currentLang = 'en';

// Toast with localization
function toast(msg, type = 'info') {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    Object.assign(host.style, { position: 'fixed', top: '16px', right: '16px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px' });
    document.body.appendChild(host);
  }
  const toast = document.createElement('div');
  toast.textContent = msg;
  Object.assign(toast.style, { background: type === 'success' ? '#198754' : type === 'error' ? '#dc3545' : '#0d6efd', color: '#fff', padding: '10px 14px', borderRadius: '8px', boxShadow: '0 6px 18px rgba(0,0,0,0.2)', fontWeight: 600 });
  host.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function showSpinner(btn, show = true) {
  if (show) {
    btn.disabled = true;
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    spinner.id = 'btn-spinner';
    btn.insertBefore(spinner, btn.firstChild);
  } else {
    btn.disabled = false;
    const spinner = btn.querySelector('#btn-spinner');
    if (spinner) spinner.remove();
  }
}

function localizePage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key, currentLang);
  });
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
}

async function ensureAuth() {
  const loginForm = document.getElementById('login-form');
  const adminPanel = document.getElementById('admin-panel');

  onAuthChange(async (user) => {
    if (user && await isAdmin()) {
      loginForm?.classList.add('hidden');
      adminPanel?.classList.remove('hidden');
      await loadActivitiesFromFirestore();
      initializeUI();
      toast(t('adminAccessGranted', currentLang), 'success');
    } else {
      loginForm?.classList.remove('hidden');
      adminPanel?.classList.add('hidden');
      if (user) toast(t('notAuthorized', currentLang), 'error');
    }
  });
}

function initializeUI() {
  // Initialize jQuery UI components
  $('.datepicker').datepicker({
    dateFormat: 'yy-mm-dd',
    changeMonth: true,
    changeYear: true
  });
  
  $('.ui-selectmenu').selectmenu();
  
  localizePage();
}

async function loadActivitiesFromFirestore() {
  try {
    const res = await getPublicActivities();
    if (res.success) {
      window.currentData = { activities: res.items };
    } else {
      window.currentData = { activities: [] };
    }
    if (typeof window.renderActivities === 'function') window.renderActivities();
  } catch (e) {
    console.error('Failed to load activities from Firestore', e);
    window.currentData = { activities: [] };
    if (typeof window.renderActivities === 'function') window.renderActivities();
  }
}

// Override saveActivity with Firestore, spinners, and new fields
window.saveActivity = async function saveActivity() {
  const saveBtn = document.getElementById('save-btn');
  const activity = {
    id: document.getElementById('activity-id').value.trim(),
    course: document.getElementById('activity-course').value,
    title_en: document.getElementById('activity-title-en').value.trim(),
    title_ar: document.getElementById('activity-title-ar').value.trim(),
    description_en: document.getElementById('activity-description-en').value.trim(),
    description_ar: document.getElementById('activity-description-ar').value.trim(),
    difficulty: document.getElementById('activity-difficulty').value,
    type: document.getElementById('activity-type').value,
    url: document.getElementById('activity-url').value.trim(),
    image: document.getElementById('activity-image').value.trim() || undefined,
    tags: document.getElementById('activity-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    visible: document.getElementById('activity-visible').checked,
    allowRetake: document.getElementById('activity-allow-retake').checked,
    order: parseInt(document.getElementById('activity-order').value) || 1,
    availableFrom: document.getElementById('activity-available-from').value || null,
    dueAt: document.getElementById('activity-due-at').value || null,
  };

  if (!activity.id || !activity.title_en || !activity.url) {
    toast(t('fillRequiredFields', currentLang), 'error');
    return;
  }

  showSpinner(saveBtn, true);
  try {
    const res = await upsertActivity(activity);
    if (res.success) {
      toast(t('activitySaved', currentLang), 'success');
      await loadActivitiesFromFirestore();
      if (typeof window.cancelEdit === 'function') window.cancelEdit();
    } else {
      toast(res.error || 'Failed to save activity', 'error');
    }
  } catch (e) {
    console.error(e);
    toast('Failed to save activity', 'error');
  } finally {
    showSpinner(saveBtn, false);
  }
};

// Centralized Modal System
window.showConfirmModal = function(options) {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
      position: relative;
    `;
    
    modal.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 1rem; font-weight: 600; color: #212529;">
        ${options.title || 'Confirm Delete'}
      </h3>
      <p style="margin: 0 0 16px 0; line-height: 1.5; color: #6b7280;">
        ${options.message || 'Are you sure you want to delete this item?'}
      </p>
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
        <button id="modal-cancel" style="
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          color: #6b7280;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        ">
          ${options.cancelText || 'Cancel'}
        </button>
        <button id="modal-confirm" style="
          padding: 8px 16px;
          border: 1px solid #dc2626;
          background: #dc2626;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        ">
          ${options.confirmText || 'Delete'}
        </button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event handlers
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');
    
    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
    
    confirmBtn.onclick = () => {
      cleanup();
      resolve(true);
    };
    
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    };
    
    function cleanup() {
      document.body.removeChild(overlay);
    }
    
    // Focus management
    setTimeout(() => {
      confirmBtn.focus();
    }, 100);
  });
};

// Override deleteActivity with confirmation and spinner
window.deleteActivity = async function deleteActivityWrapper(index) {
  const activity = window.currentData.activities[index];
  if (!activity) return;
  
  const confirmed = await window.showConfirmModal({
    title: t('deleteActivity', currentLang),
    message: t('confirmDeleteActivity', currentLang, { activityTitle: activity.title_en || activity.title }),
    confirmText: t('delete', currentLang),
    cancelText: t('cancel', currentLang)
  });
  
  if (!confirmed) return;

  try {
    const res = await deleteActivity(activity.id);
    if (res.success) {
      toast(t('activityDeleted', currentLang), 'success');
      await loadActivitiesFromFirestore();
    } else {
      toast(res.error || 'Failed to delete activity', 'error');
    }
  } catch (e) {
    console.error(e);
    toast('Failed to delete activity', 'error');
  }
};

// Override editActivity to populate new fields
window.editActivity = function editActivity(index) {
  const activity = window.currentData.activities[index];
  document.getElementById('form-title').textContent = t('editActivity', currentLang);
  document.getElementById('activity-form').classList.remove('hidden');
  
  document.getElementById('activity-id').value = activity.id || '';
  document.getElementById('activity-course').value = activity.course || 'python';
  document.getElementById('activity-title-en').value = activity.title_en || activity.title || '';
  document.getElementById('activity-title-ar').value = activity.title_ar || '';
  document.getElementById('activity-description-en').value = activity.description_en || activity.description || '';
  document.getElementById('activity-description-ar').value = activity.description_ar || '';
  document.getElementById('activity-difficulty').value = activity.difficulty || 'beginner';
  document.getElementById('activity-type').value = activity.type || 'training';
  document.getElementById('activity-url').value = activity.url || '';
  document.getElementById('activity-image').value = activity.image || '';
  document.getElementById('activity-tags').value = (activity.tags || []).join(', ');
  document.getElementById('activity-visible').checked = activity.visible !== false;
  document.getElementById('activity-allow-retake').checked = activity.allowRetake !== false;
  document.getElementById('activity-order').value = activity.order || 1;
  document.getElementById('activity-available-from').value = activity.availableFrom || '';
  document.getElementById('activity-due-at').value = activity.dueAt || '';
  
  window.editingIndex = index;
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ensureAuth();
  
  // Language detection from localStorage or URL
  currentLang = localStorage.getItem('lang') || 'en';
  
  // Add language switcher if needed
  const langSelect = document.createElement('select');
  langSelect.innerHTML = '<option value="en">English</option><option value="ar">العربية</option>';
  langSelect.value = currentLang;
  langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('lang', currentLang);
    localizePage();
  });
  
  const header = document.querySelector('.header');
  if (header) {
    const langDiv = document.createElement('div');
    langDiv.style.cssText = 'position: absolute; top: 20px; right: 20px;';
    langDiv.appendChild(langSelect);
    header.style.position = 'relative';
    header.appendChild(langDiv);
  }
});

// ====== Allowlist Management (Admin-only) ======
window.loadAllowlistUI = async function loadAllowlistUI() {
  try {
    const res = await getAllowlistConfig();
    const data = res.success && res.data ? res.data : { allowedEmails: [], adminEmails: [] };
    const allowed = (data.allowedEmails || []).join('\n');
    const admins = (data.adminEmails || []).join('\n');
    const allowedEl = document.getElementById('allowlist-allowed');
    const adminsEl = document.getElementById('allowlist-admins');
    if (allowedEl) allowedEl.value = allowed;
    if (adminsEl) adminsEl.value = admins;
  } catch (e) {
    console.error('loadAllowlistUI error', e);
    toast('Failed to load allowlist', 'error');
  }
};

window.saveAllowlistUI = async function saveAllowlistUI() {
  const btn = document.getElementById('allowlist-save-btn');
  const allowedEl = document.getElementById('allowlist-allowed');
  const adminsEl = document.getElementById('allowlist-admins');
  const parseList = (txt) => (txt || '')
    .split(/\r?\n|,/) // allow comma or newline separated
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.toLowerCase());

  const allowedEmails = parseList(allowedEl?.value || '');
  const adminEmails = parseList(adminsEl?.value || '');

  showSpinner(btn, true);
  try {
    const res = await updateAllowlistRemote({ allowedEmails, adminEmails });
    if (res.success) {
      toast('Allowlist updated', 'success');
    } else {
      toast(res.error || 'Failed to update allowlist', 'error');
    }
  } catch (e) {
    console.error('saveAllowlistUI error', e);
    toast('Failed to update allowlist', 'error');
  } finally {
    showSpinner(btn, false);
  }
};
