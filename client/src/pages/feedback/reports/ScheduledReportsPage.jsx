import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  getScheduledReports, 
  addScheduledReport, 
  updateScheduledReport, 
  deleteScheduledReport 
} from '@services/db/configService';
import { getEmailTemplates } from '@services/business/emailDbService';
import { Button, Input, Select, Textarea, useToast, Card, CardBody } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { Container } from '@ui';
import { ToggleSwitch, RibbonTabs } from '@ui';
import { Plus, Edit, Trash2, Calendar, Mail, FileText, X, FileDown, Search, BarChart3, Users } from 'lucide-react';
import { getThemedIcon } from '@constants/iconTypes';
import { formatDateTime } from '@utils/date';
import styles from './ScheduledReportsPage.module.css';

const ScheduledReportsPage = () => {
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schedule: 'daily',
    recipients: [],
    templateId: '',
    reportType: 'analytics',
    filters: {},
    enabled: true,
    customSchedule: ''
  });
  const [recipientInput, setRecipientInput] = useState('');
  const [editingReport, setEditingReport] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getScheduledReports(isSuperAdmin ? null : user.uid);
      if (result.success) {
        setReports(result.data || []);
      } else {
        // Silently handle permission errors - don't show alert
        if (result.error && result.error.includes('permission')) {
          setReports([]);
        }
      }
    } catch (error) {
      // Silently handle errors - don't show alert
      setReports([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [user, isSuperAdmin]);

  const loadTemplates = useCallback(async () => {
    try {
      const result = await getEmailTemplates();
      if (result.success) {
        setTemplates(result.data || []);
      }
    } catch (error) {
      error('Error loading templates:', error);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadReports();
      loadTemplates();
    }
  }, [authLoading, user, loadReports, loadTemplates]);

  const resetForm = useCallback(() => {
    setEditingReport(null);
    setSelectedReport(null);
    setFormData({
      title: '',
      description: '',
      schedule: 'daily',
      recipients: [],
      templateId: '',
      reportType: 'analytics',
      filters: {},
      enabled: true,
      customSchedule: ''
    });
    setRecipientInput('');
  }, []);

  const handleAddRecipient = useCallback(() => {
    const email = recipientInput.trim();
    if (email && email.includes('@')) {
      if (!formData.recipients.includes(email)) {
        setFormData({ ...formData, recipients: [...formData.recipients, email] });
      }
      setRecipientInput('');
    }
  }, [formData, recipientInput]);

  const handleRemoveRecipient = useCallback((email) => {
    setFormData({ ...formData, recipients: formData.recipients.filter(e => e !== email) });
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error(t('scheduled_reports_title_required'));
      return;
    }
    if (formData.recipients.length === 0) {
      toast.error(t('scheduled_reports_at_least_one_recipient_required'));
      return;
    }
    if (!formData.templateId) {
      toast.error(t('scheduled_reports_email_template_required'));
      return;
    }

    setSaving(true);
    try {
      const reportData = {
        ...formData,
        userId: user.uid,
        recipients: formData.recipients
      };

      // Calculate nextRunAt based on schedule
      const now = new Date();
      let nextRunAt = new Date(now);
      if (formData.schedule === 'daily') {
        nextRunAt.setDate(nextRunAt.getDate() + 1);
        nextRunAt.setHours(8, 0, 0, 0); // 8 AM
      } else if (formData.schedule === 'weekly') {
        nextRunAt.setDate(nextRunAt.getDate() + 7);
        nextRunAt.setHours(8, 0, 0, 0);
      } else if (formData.schedule === 'custom' && formData.customSchedule) {
        nextRunAt = new Date(formData.customSchedule);
      }
      reportData.nextRunAt = nextRunAt;

      let result;
      if (editingReport) {
        result = await updateScheduledReport(editingReport.docId, reportData);
      } else {
        result = await addScheduledReport(reportData);
      }

      if (result.success) {
        toast.success(editingReport ? t('scheduled_reports_report_updated_successfully') : t('scheduled_reports_report_scheduled_successfully'));
        setShowAddForm(false);
        resetForm();
        loadReports();
      } else {
        toast.error(t('scheduled_reports_failed_to_save_report') + result.error);
      }
    } catch (error) {
      toast.error(t('scheduled_reports_error_saving_report') + error.message);
    } finally {
      setSaving(false);
    }
  }, [formData, editingReport, user, toast, loadReports, resetForm]);

  const handleDelete = useCallback(async (reportId) => {
    if (!window.confirm(t('scheduled_reports_are_you_sure_delete'))) {
      return;
    }
    setLoading(true);
    try {
      const result = await deleteScheduledReport(reportId);
      if (result.success) {
        toast.success(t('scheduled_reports_report_deleted_successfully'));
        loadReports();
        if (selectedReport?.docId === reportId) {
          setSelectedReport(null);
        }
      } else {
        toast.error(t('scheduled_reports_failed_to_delete_report') + result.error);
      }
    } catch (error) {
      toast.error(t('scheduled_reports_error_deleting_report') + error.message);
    } finally {
      setLoading(false);
    }
  }, [toast, loadReports, selectedReport?.docId]);

  const handleToggleEnabled = useCallback(async (report) => {
    setLoading(true);
    try {
      const result = await updateScheduledReport(report.docId, { enabled: !report.enabled });
      if (result.success) {
        toast.success(t(`scheduled_reports_report_${!report.enabled ? 'enabled' : 'disabled'}`));
        loadReports();
        if (selectedReport?.docId === report.docId) {
          setSelectedReport({ ...selectedReport, enabled: !report.enabled });
        }
      } else {
        toast.error(t('scheduled_reports_failed_to_update_report') + result.error);
      }
    } catch (error) {
      toast.error(t('scheduled_reports_error_updating_report') + error.message);
    } finally {
      setLoading(false);
    }
  }, [toast, loadReports, selectedReport]);

  const handleEdit = useCallback((report) => {
    setEditingReport(report);
    setSelectedReport(report);
    setFormData({
      title: report.title || '',
      description: report.description || '',
      schedule: report.schedule || 'daily',
      recipients: report.recipients || [],
      templateId: report.templateId || '',
      reportType: report.reportType || 'analytics',
      filters: report.filters || {},
      enabled: report.enabled !== false,
      customSchedule: report.nextRunAt ? new Date(report.nextRunAt).toISOString().slice(0, 16) : ''
    });
    setShowAddForm(true);
  }, []);

  const exportToCSV = () => {
    const headers = [t('title'), t('type'), t('schedule'), t('recipients'), t('next_run'), t('last_run'), t('status')];
    const rows = filteredReports.map(r => [
      r.title || '',
      r.reportType === 'analytics' ? t('scheduled_reports_analytics') : t('scheduled_reports_student_dashboard'),
      r.schedule === 'daily' ? t('scheduled_reports_daily') : r.schedule === 'weekly' ? t('scheduled_reports_weekly') : t('scheduled_reports_custom'),
      (r.recipients || []).join('; '),
      r.nextRunAt ? formatDateTime(new Date(r.nextRunAt)) : 'N/A',
      r.lastRunAt ? formatDateTime(new Date(r.lastRunAt)) : t('scheduled_reports_never'),
      r.enabled !== false ? t('scheduled_reports_enabled') : t('scheduled_reports_disabled')
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduled-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.title || '').toLowerCase().includes(term) ||
      (r.description || '').toLowerCase().includes(term) ||
      (r.recipients || []).some(email => email.toLowerCase().includes(term))
    );
  });

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!isAdmin && !isSuperAdmin) return;

    let stopped = false;
    const stopGlobalLoading = startLoading();
    const safeStop = () => {
      if (stopped) return;
      stopped = true;
      stopGlobalLoading();
    };

    const loadData = async () => {
      try {
        await Promise.all([
          loadReports(),
          loadTemplates()
        ]);
      } catch (error) {
        error('Error loading reports data:', error);
      } finally {
        safeStop();
      }
    };

    loadData();

    return () => {
      safeStop();
    };
  }, [authLoading, user, isAdmin, isSuperAdmin, loadReports, loadTemplates, startLoading]);

  if (!isAdmin && !isSuperAdmin) {
    return (
      <Container>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>{t('access_denied')}</h2>
          <p>{t('no_permission_view_page')}</p>
        </div>
      </Container>
    );
  }

  return (
    <div className={styles.page} style={{ maxWidth: 1400, margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" variant="primary" icon={<Plus size={16} />} onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}>
            {t('schedule_report_btn')}
          </Button>
          <Button size="sm" variant="outline" icon={<FileDown size={16} />} onClick={exportToCSV}>
            {t('export_btn')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('search_reports_placeholder')}
          prefixIcon={getThemedIcon('ui', 'search', 16, theme)}
          style={{ maxWidth: 400 }}
          fullWidth
        />
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card style={{ marginBottom: '1rem' }}>
          <CardBody>
            <h3 style={{ marginBottom: '1rem' }}>{editingReport ? t('edit_scheduled_report') : t('schedule_new_report')}</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('title_required_label')}</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('scheduled_reports.title_example', 'e.g., Weekly Analytics Summary')}
                    fullWidth
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('report_type_label')}</label>
                  <Select
                    value={formData.reportType}
                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                    options={[
                      { value: 'analytics', label: t('advanced_analytics') || 'Advanced Analytics', icon: <BarChart3 size={16} color="var(--text-secondary, #374151)" /> },
                      { value: 'student-dashboard', label: t('student_dashboard_status') || 'Student Dashboard Status', icon: <Users size={16} color="var(--text-secondary, #374151)" /> }
                    ]}
                    fullWidth
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('description_label')}</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('scheduled_reports.description_placeholder', 'Optional description of this report')}
                  rows={3}
                  fullWidth
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('schedule_label')}</label>
                  <Select
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    options={[
                      { value: 'daily', label: t('scheduled_reports_daily'), icon: <Calendar size={16} color="var(--text-secondary, #374151)" /> },
                      { value: 'weekly', label: t('scheduled_reports_weekly'), icon: <Calendar size={16} color="var(--text-secondary, #374151)" /> },
                      { value: 'custom', label: t('scheduled_reports_custom'), icon: <Calendar size={16} color="var(--text-secondary, #374151)" /> }
                    ]}
                    fullWidth
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('email_template_label')}</label>
                  <Select
                    value={formData.templateId}
                    onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                    options={[
                      { value: '', label: t('select_template_placeholder') },
                      ...templates.map(t => ({
                        value: t.docId || t.id,
                        label: t.name || t.docId
                      }))
                    ]}
                    fullWidth
                  />
                </div>
              </div>

              {formData.schedule === 'custom' && (
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('next_run_date_time_label')}</label>
                  <Input
                    type="datetime-local"
                    value={formData.customSchedule}
                    onChange={(e) => setFormData({ ...formData, customSchedule: e.target.value })}
                    fullWidth
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('recipients_label')}</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Input
                    type="email"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                    placeholder={t('enter_email_address')}
                    style={{ flex: 1 }}
                  />
                  <Button onClick={handleAddRecipient} variant="outline" size="sm">{t('add_btn')}</Button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {formData.recipients.map((email, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 12px',
                        background: 'rgba(128, 0, 32, 0.1)',
                        border: '1px solid var(--color-primary, #800020)',
                        borderRadius: 16,
                        fontSize: '0.875rem'
                      }}
                    >
                      <span>{email}</span>
                      <button
                        onClick={() => handleRemoveRecipient(email)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <ToggleSwitch
                    checked={formData.enabled}
                    onChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    size="small"
                  />
                  <span>{t('enabled_label')}</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? t('saving_label') : (editingReport ? t('update_btn') : t('schedule_btn'))}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', minHeight: 600 }}>
        {/* Left: List */}
        <Card>
          <CardBody>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{t('all_reports_count').replace('{count}', filteredReports.length)}</h3>
            {filteredReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>{t('no_scheduled_reports_found')}</p>
                {!searchTerm && (
                  <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)} style={{ marginTop: '1rem' }}>
                    {t('create_first_report')}
                  </Button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 600, overflowY: 'auto' }}>
                {filteredReports.map((report, idx) => (
                  <div
                    key={report.docId || idx}
                    onClick={() => setSelectedReport(report)}
                    style={{
                      padding: '1rem',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: selectedReport?.docId === report.docId ? 'var(--color-primary-light, rgba(128,0,32,0.1))' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{report.title}</h4>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                          {report.reportType === 'analytics' ? t('scheduled_reports_analytics') : t('scheduled_reports_student_dashboard')}
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={report.enabled !== false}
                        onChange={() => handleToggleEnabled(report)}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      <span><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        {report.schedule === 'daily' ? t('scheduled_reports_daily') : report.schedule === 'weekly' ? t('scheduled_reports_weekly') : t('scheduled_reports_custom')}
                      </span>
                      <span><Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        {t('recipient_count').replace('{count}', report.recipients?.length || 0)}
                      </span>
                    </div>
                    {report.nextRunAt && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                        {t('next_label')} {formatDateTime(new Date(report.nextRunAt))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right: Details/Edit */}
        <Card>
          <CardBody>
            {selectedReport ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>{t('report_details')}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="sm" variant="outline" icon={<Edit size={14} />} onClick={() => handleEdit(selectedReport)}>
                      {t('edit')}
                    </Button>
                    <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => handleDelete(selectedReport.docId)}>
                      {t('delete')}
                    </Button>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('title')}</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>{selectedReport.title}</p>
                  </div>
                  {selectedReport.description && (
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('description_label')}</label>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>{selectedReport.description}</p>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('report_type_label')}</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                      {selectedReport.reportType === 'analytics' ? t('scheduled_reports_analytics') : t('scheduled_reports_student_dashboard')}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('schedule_label')}</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                      {selectedReport.schedule === 'daily' ? t('scheduled_reports_daily') : selectedReport.schedule === 'weekly' ? t('scheduled_reports_weekly') : t('scheduled_reports_custom')}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('email_template_label')}</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                      {templates.find(t => (t.docId || t.id) === selectedReport.templateId)?.name || selectedReport.templateId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('recipients_label')}</label>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {(selectedReport.recipients || []).map((email, idx) => (
                        <span key={idx} style={{ padding: '4px 12px', background: 'var(--border)', borderRadius: 16, fontSize: '0.875rem' }}>
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('next_label')}</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                      {selectedReport.nextRunAt ? formatDateTime(new Date(selectedReport.nextRunAt)) : t('not_scheduled')}
                    </p>
                  </div>
                  {selectedReport.lastRunAt && (
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('last_run')}</label>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                        {formatDateTime(new Date(selectedReport.lastRunAt))}
                      </p>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>{t('status')}</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        background: selectedReport.enabled !== false ? '#d1fae5' : '#fee2e2',
                        color: selectedReport.enabled !== false ? '#065f46' : '#991b1b',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        {selectedReport.enabled !== false ? t('scheduled_reports_enabled') : t('scheduled_reports_disabled')}
                      </span>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>{t('select_report_to_view')}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ScheduledReportsPage;

