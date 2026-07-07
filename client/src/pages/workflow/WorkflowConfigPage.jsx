import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import {
  getWorkflowTypeConfigs,
  createWorkflowTypeConfig,
  updateWorkflowTypeConfig,
  deleteWorkflowTypeConfig,
} from '@services/business/workflowTypeConfigService';

const APPROVAL_FLOWS = [
  { value: 'HR_ONLY', labelEn: 'HR Only', labelAr: 'الموارد البشرية فقط' },
  { value: 'ADMIN_ONLY', labelEn: 'Admin Only', labelAr: 'المدير فقط' },
  { value: 'HR_THEN_ADMIN', labelEn: 'HR → Admin', labelAr: 'الموارد البشرية ← المدير' },
  { value: 'ADMIN_THEN_HR', labelEn: 'Admin → HR', labelAr: 'المدير ← الموارد البشرية' },
  { value: 'INSTRUCTOR_THEN_HR', labelEn: 'Instructor → HR', labelAr: 'المدرّس ← الموارد البشرية' },
  { value: 'INSTRUCTOR_THEN_ADMIN_THEN_HR', labelEn: 'Instructor → Admin → HR', labelAr: 'المدرّس ← المدير ← الموارد البشرية' },
];

const CATEGORIES = [
  { value: 'GENERAL', labelEn: 'General', labelAr: 'عام' },
  { value: 'ATTENDANCE', labelEn: 'Attendance', labelAr: 'الحضور' },
  { value: 'PENALTY', labelEn: 'Penalty', labelAr: 'العقوبات' },
  { value: 'BEHAVIOR', labelEn: 'Behavior', labelAr: 'السلوك' },
  { value: 'DISCONTINUATION', labelEn: 'Discontinuation', labelAr: 'الانقطاع' },
];

const ROLE_OPTIONS = [
  { value: 'HR', labelEn: 'HR', labelAr: 'الموارد البشرية' },
  { value: 'ADMIN', labelEn: 'Admin', labelAr: 'المدير' },
  { value: 'INSTRUCTOR', labelEn: 'Instructor', labelAr: 'المدرّس' },
  { value: 'SUPER_ADMIN', labelEn: 'Super Admin', labelAr: 'المدير العام' },
];

const WorkflowConfigPage = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    approvalFlow: 'HR_ONLY',
    workflowCategory: 'GENERAL',
    requiresFile: false,
    isActive: true,
    allowedRoles: [],
  });

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getWorkflowTypeConfigs();
    if (res.success) {
      setConfigs(res.data || []);
    } else {
      setError(res.error || 'Failed to load');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleEdit = useCallback((config) => {
    setEditingConfig(config);
    setFormData({
      name: config.name || '',
      nameAr: config.nameAr || '',
      description: config.description || '',
      approvalFlow: config.approvalFlow || 'HR_ONLY',
      workflowCategory: config.workflowCategory || 'GENERAL',
      requiresFile: config.requiresFile || false,
      isActive: config.isActive !== false,
      allowedRoles: config.allowedRoles || [],
    });
    setShowForm(true);
  }, []);

  const handleNew = useCallback(() => {
    setEditingConfig(null);
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      approvalFlow: 'HR_ONLY',
      workflowCategory: 'GENERAL',
      requiresFile: false,
      isActive: true,
      allowedRoles: [],
    });
    setShowForm(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    let result;
    if (editingConfig) {
      result = await updateWorkflowTypeConfig(editingConfig.id, formData);
    } else {
      result = await createWorkflowTypeConfig(formData);
    }
    setLoading(false);
    if (result?.success) {
      setShowForm(false);
      setEditingConfig(null);
      fetchConfigs();
    } else {
      setError(result?.error || 'Save failed');
    }
  }, [formData, editingConfig, fetchConfigs]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm(t('workflow_config_confirm_delete') || 'Delete this workflow type?')) return;
    const result = await deleteWorkflowTypeConfig(id);
    if (result?.success) {
      fetchConfigs();
    } else {
      setError(result?.error || 'Delete failed');
    }
  }, [fetchConfigs, t]);

  const toggleRole = useCallback((role) => {
    setFormData((prev) => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter((r) => r !== role)
        : [...prev.allowedRoles, role],
    }));
  }, []);

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b' }}>
        {t('workflow_config_admin_only') || 'Admin access required'}
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
    background: isDark ? '#0f172a' : '#fff',
    color: isDark ? '#f1f5f9' : '#111',
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '4px',
    color: isDark ? '#cbd5e1' : '#374151',
  };

  const cardStyle = {
    padding: '16px 20px',
    borderRadius: '12px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
    background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
    marginBottom: '10px',
  };

  const getFlowLabel = (flow) => {
    const f = APPROVAL_FLOWS.find((x) => x.value === flow);
    return f ? (lang === 'ar' ? f.labelAr : f.labelEn) : flow;
  };

  const getCategoryLabel = (cat) => {
    const c = CATEGORIES.find((x) => x.value === cat);
    return c ? (lang === 'ar' ? c.labelAr : c.labelEn) : cat;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0f172a' : '#f8fafc',
        padding: '24px 16px',
        dir: lang === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: isDark ? '#f1f5f9' : '#1e293b' }}>
            {t('workflow_config_title') || 'Workflow Type Configuration'}
          </h1>
          <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 0' }}>
            {t('workflow_config_subtitle') || 'Configure custom workflow types with approval steps'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--color-primary, #800020)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          + {t('workflow_config_new') || 'New Workflow Type'}
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.2)',
          color: '#dc2626',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {loading && !showForm ? (
        <div style={{ textAlign: 'center', padding: '60px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {t('loading') || 'Loading...'}
        </div>
      ) : (
        <div>
          {configs.length === 0 && !showForm ? (
            <div style={{ textAlign: 'center', padding: '60px', color: isDark ? '#94a3b8' : '#64748b' }}>
              {t('workflow_config_empty') || 'No workflow types configured. Click "New Workflow Type" to create one.'}
            </div>
          ) : (
            configs.map((config) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={cardStyle}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>
                        {lang === 'ar' && config.nameAr ? config.nameAr : config.name}
                      </span>
                      {!config.isActive && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: 600,
                          background: 'rgba(107,114,128,0.15)',
                          color: '#6b7280',
                        }}>
                          {t('workflow_config_inactive') || 'Inactive'}
                        </span>
                      )}
                    </div>
                    {config.description && (
                      <div style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>
                        {config.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                      <span><strong>{t('workflow_config_flow') || 'Flow'}:</strong> {getFlowLabel(config.approvalFlow)}</span>
                      <span><strong>{t('workflow_config_category') || 'Category'}:</strong> {getCategoryLabel(config.workflowCategory)}</span>
                      {config.requiresFile && <span><strong>{t('workflow_config_requires_file') || 'Requires File'}</strong></span>}
                      {config.allowedRoles?.length > 0 && (
                        <span><strong>{t('workflow_config_roles') || 'Roles'}:</strong> {config.allowedRoles.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(config)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                        background: 'transparent',
                        color: isDark ? '#f1f5f9' : '#1e293b',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      {t('workflow_config_edit') || 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(config.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'rgba(220,38,38,0.1)',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      {t('workflow_config_delete') || 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
            }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDark ? '#1e293b' : '#fff',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                {editingConfig
                  ? (t('workflow_config_edit_title') || 'Edit Workflow Type')
                  : (t('workflow_config_new_title') || 'New Workflow Type')}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>{t('workflow_config_name') || 'Name'} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                    placeholder="e.g., Budget Request"
                  />
                </div>

                <div>
                  <label style={labelStyle}>{t('workflow_config_name_ar') || 'Name (Arabic)'}</label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    style={inputStyle}
                    placeholder="مثال: طلب ميزانية"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label style={labelStyle}>{t('workflow_config_description') || 'Description'}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                    rows={2}
                  />
                </div>

                <div>
                  <label style={labelStyle}>{t('workflow_config_flow') || 'Approval Flow'}</label>
                  <select
                    value={formData.approvalFlow}
                    onChange={(e) => setFormData({ ...formData, approvalFlow: e.target.value })}
                    style={inputStyle}
                  >
                    {APPROVAL_FLOWS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {lang === 'ar' ? f.labelAr : f.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>{t('workflow_config_category') || 'Category'}</label>
                  <select
                    value={formData.workflowCategory}
                    onChange={(e) => setFormData({ ...formData, workflowCategory: e.target.value })}
                    style={inputStyle}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {lang === 'ar' ? c.labelAr : c.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>{t('workflow_config_roles') || 'Allowed Roles'}</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {ROLE_OPTIONS.map((r) => (
                      <label
                        key={r.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: isDark ? '#cbd5e1' : '#374151',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.allowedRoles.includes(r.value)}
                          onChange={() => toggleRole(r.value)}
                        />
                        {lang === 'ar' ? r.labelAr : r.labelEn}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: isDark ? '#cbd5e1' : '#374151' }}>
                    <input
                      type="checkbox"
                      checked={formData.requiresFile}
                      onChange={(e) => setFormData({ ...formData, requiresFile: e.target.checked })}
                    />
                    {t('workflow_config_requires_file') || 'Requires File Attachment'}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: isDark ? '#cbd5e1' : '#374151' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    {t('workflow_config_active') || 'Active'}
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                    background: 'transparent',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--color-primary, #800020)',
                    color: '#fff',
                    cursor: loading ? 'wait' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {loading
                    ? (t('saving') || 'Saving...')
                    : (t('save') || 'Save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowConfigPage;
