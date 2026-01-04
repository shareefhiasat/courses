import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { 
  getScheduledReports, 
  addScheduledReport, 
  updateScheduledReport, 
  deleteScheduledReport 
} from '../firebase/firestore';
import { getEmailTemplates } from '../firebase/firestore';
import { Loading, Button, Input, Select, Textarea, useToast, Card, CardBody } from '../components/ui';
import { Container } from '../components/ui';
import ToggleSwitch from '../components/ToggleSwitch';
import { Plus, Edit, Trash2, Calendar, Mail, FileText, X, FileDown, Search } from 'lucide-react';
import { formatDateTime } from '../utils/date';

const ScheduledReportsPage = () => {
  const { user, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!authLoading && user) {
      loadReports();
      loadTemplates();
    }
  }, [authLoading, user]);

  const loadReports = async () => {
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
    }
  };

  const loadTemplates = async () => {
    try {
      const result = await getEmailTemplates();
      if (result.success) {
        setTemplates(result.data || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (email && email.includes('@')) {
      if (!formData.recipients.includes(email)) {
        setFormData({ ...formData, recipients: [...formData.recipients, email] });
      }
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (email) => {
    setFormData({ ...formData, recipients: formData.recipients.filter(e => e !== email) });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (formData.recipients.length === 0) {
      toast.error('At least one recipient is required');
      return;
    }
    if (!formData.templateId) {
      toast.error('Email template is required');
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
        toast.success(editingReport ? 'Report updated successfully' : 'Report scheduled successfully');
        setShowAddForm(false);
        resetForm();
        loadReports();
      } else {
        toast.error('Failed to save report: ' + result.error);
      }
    } catch (error) {
      toast.error('Error saving report: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }
    setLoading(true);
    try {
      const result = await deleteScheduledReport(reportId);
      if (result.success) {
        toast.success('Report deleted successfully');
        loadReports();
        if (selectedReport?.docId === reportId) {
          setSelectedReport(null);
        }
      } else {
        toast.error('Failed to delete report: ' + result.error);
      }
    } catch (error) {
      toast.error('Error deleting report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (report) => {
    setLoading(true);
    try {
      const result = await updateScheduledReport(report.docId, { enabled: !report.enabled });
      if (result.success) {
        toast.success(`Report ${!report.enabled ? 'enabled' : 'disabled'}`);
        loadReports();
        if (selectedReport?.docId === report.docId) {
          setSelectedReport({ ...selectedReport, enabled: !report.enabled });
        }
      } else {
        toast.error('Failed to update report: ' + result.error);
      }
    } catch (error) {
      toast.error('Error updating report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
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
  };

  const resetForm = () => {
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
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Type', 'Schedule', 'Recipients', 'Next Run', 'Last Run', 'Status'];
    const rows = filteredReports.map(r => [
      r.title || '',
      r.reportType === 'analytics' ? 'Analytics' : 'Student Dashboard',
      r.schedule === 'daily' ? 'Daily' : r.schedule === 'weekly' ? 'Weekly' : 'Custom',
      (r.recipients || []).join('; '),
      r.nextRunAt ? formatDateTime(new Date(r.nextRunAt)) : 'N/A',
      r.lastRunAt ? formatDateTime(new Date(r.lastRunAt)) : 'Never',
      r.enabled !== false ? 'Enabled' : 'Disabled'
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

  if (authLoading) {
    return <Loading variant="overlay" message="Loading..." fancyVariant="dots" />;
  }

  if (!isAdmin && !isSuperAdmin) {
    return (
      <Container>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to view this page.</p>
        </div>
      </Container>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>📅 Scheduled Reports</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" variant="primary" icon={<Plus size={16} />} onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}>
            Schedule Report
          </Button>
          <Button size="sm" variant="outline" icon={<FileDown size={16} />} onClick={exportToCSV}>
            Export
          </Button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reports..."
            style={{ paddingLeft: 40 }}
            fullWidth
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card style={{ marginBottom: '1rem' }}>
          <CardBody>
            <h3 style={{ marginBottom: '1rem' }}>{editingReport ? 'Edit Scheduled Report' : 'Schedule New Report'}</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Weekly Analytics Summary"
                    fullWidth
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Report Type *</label>
                  <Select
                    value={formData.reportType}
                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                    options={[
                      { value: 'analytics', label: '📊 Advanced Analytics' },
                      { value: 'student-dashboard', label: '👤 Student Dashboard Status' }
                    ]}
                    fullWidth
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description of this report"
                  rows={3}
                  fullWidth
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Schedule *</label>
                  <Select
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'custom', label: 'Custom' }
                    ]}
                    fullWidth
                  />
                </div>
                {formData.schedule === 'custom' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Next Run Date & Time *</label>
                    <Input
                      type="datetime-local"
                      value={formData.customSchedule}
                      onChange={(e) => setFormData({ ...formData, customSchedule: e.target.value })}
                      fullWidth
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Email Template *</label>
                <Select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  options={[
                    { value: '', label: 'Select a template...' },
                    ...templates.map(t => ({
                      value: t.docId || t.id,
                      label: t.name || t.docId
                    }))
                  ]}
                  fullWidth
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Recipients *</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Input
                    type="email"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                    placeholder="Enter email address"
                    style={{ flex: 1 }}
                  />
                  <Button onClick={handleAddRecipient} variant="outline" size="sm">Add</Button>
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
                        background: 'var(--border)',
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
                  <span>Enabled</span>
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
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingReport ? 'Update' : 'Schedule')}
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
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Reports ({filteredReports.length})</h3>
            {loading ? (
              <Loading message="Loading reports..." fancyVariant="dots" />
            ) : filteredReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No scheduled reports found</p>
                {!searchTerm && (
                  <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)} style={{ marginTop: '1rem' }}>
                    Create First Report
                  </Button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 600, overflowY: 'auto' }}>
                {filteredReports.map(report => (
                  <div
                    key={report.docId}
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
                          {report.reportType === 'analytics' ? '📊 Analytics' : '👤 Student Dashboard'}
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
                        {report.schedule === 'daily' ? 'Daily' : report.schedule === 'weekly' ? 'Weekly' : 'Custom'}
                      </span>
                      <span><Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        {report.recipients?.length || 0} recipient(s)
                      </span>
                    </div>
                    {report.nextRunAt && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                        Next: {formatDateTime(new Date(report.nextRunAt))}
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
                  <h3 style={{ margin: 0 }}>Report Details</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="sm" variant="outline" icon={<Edit size={14} />} onClick={() => handleEdit(selectedReport)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => handleDelete(selectedReport.docId)}>
                      Delete
                    </Button>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Title</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>{selectedReport.title}</p>
                  </div>
                  {selectedReport.description && (
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Description</label>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>{selectedReport.description}</p>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Report Type</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                      {selectedReport.reportType === 'analytics' ? '📊 Advanced Analytics' : '👤 Student Dashboard Status'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Schedule</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                      {selectedReport.schedule === 'daily' ? 'Daily' : selectedReport.schedule === 'weekly' ? 'Weekly' : 'Custom'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Email Template</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                      {templates.find(t => (t.docId || t.id) === selectedReport.templateId)?.name || selectedReport.templateId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Recipients</label>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {(selectedReport.recipients || []).map((email, idx) => (
                        <span key={idx} style={{ padding: '4px 12px', background: 'var(--border)', borderRadius: 16, fontSize: '0.875rem' }}>
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Next Run</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                      {selectedReport.nextRunAt ? formatDateTime(new Date(selectedReport.nextRunAt)) : 'Not scheduled'}
                    </p>
                  </div>
                  {selectedReport.lastRunAt && (
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Last Run</label>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                        {formatDateTime(new Date(selectedReport.lastRunAt))}
                      </p>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>Status</label>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        background: selectedReport.enabled !== false ? '#d1fae5' : '#fee2e2',
                        color: selectedReport.enabled !== false ? '#065f46' : '#991b1b',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        {selectedReport.enabled !== false ? 'Enabled' : 'Disabled'}
                      </span>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Select a report to view details</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ScheduledReportsPage;
