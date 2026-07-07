import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import useResizableDrawer from '@hooks/useResizableDrawer';
import {
  getInboxDocuments,
  getOutboxDocuments,
  approveDocument,
  rejectDocument,
  returnDocument,
  withdrawDocument,
} from '@services/business/attendanceWorkflowService';

const TABS = {
  INBOX: 'inbox',
  OUTBOX: 'outbox',
};

const WORKFLOW_TYPE_FILTERS = [
  { value: 'ALL', labelEn: 'All Types', labelAr: 'كل الأنواع' },
  { value: 'ATTENDANCE_DAILY', labelEn: 'Attendance Daily', labelAr: 'الحضور اليومي' },
  { value: 'ATTENDANCE_WEEKLY', labelEn: 'Attendance Weekly', labelAr: 'الحضور الأسبوعي' },
  { value: 'GENERAL_HR', labelEn: 'General HR', labelAr: 'عام الموارد البشرية' },
  { value: 'GENERAL_ADMIN', labelEn: 'General Admin', labelAr: 'عام المدير' },
  { value: 'GENERAL_MIXED_HR_ADMIN', labelEn: 'Mixed HR→Admin', labelAr: 'مختلط موارد بشرية←مدير' },
  { value: 'GENERAL_MIXED_ADMIN_HR', labelEn: 'Mixed Admin→HR', labelAr: 'مختلط مدير←موارد بشرية' },
];

const STATUS_COLORS = {
  DRAFT: '#6b7280',
  SUBMITTED: '#2563eb',
  UNDER_REVIEW: '#f59e0b',
  ADMIN_APPROVED: '#8b5cf6',
  APPROVED: '#16a34a',
  REJECTED: '#dc2626',
  RETURNED: '#f97316',
  CLOSED: '#6b7280',
  WITHDRAWN: '#9ca3af',
};

const STATUS_LABELS = {
  DRAFT: { en: 'Draft', ar: 'مسودة' },
  SUBMITTED: { en: 'Submitted', ar: 'مُرسل' },
  UNDER_REVIEW: { en: 'Under Review', ar: 'قيد المراجعة' },
  ADMIN_APPROVED: { en: 'Admin Approved', ar: 'موافق عليه من المدير' },
  APPROVED: { en: 'Approved', ar: 'موافق عليه' },
  REJECTED: { en: 'Rejected', ar: 'مرفوض' },
  RETURNED: { en: 'Returned', ar: 'مُرتجع' },
  CLOSED: { en: 'Closed', ar: 'مغلق' },
  WITHDRAWN: { en: 'Withdrawn', ar: 'مسحوب' },
};

const SLA_72H_MS = 72 * 60 * 60 * 1000;

const getSlaColor = (submittedAt) => {
  if (!submittedAt) return '#6b7280';
  const elapsed = Date.now() - new Date(submittedAt).getTime();
  if (elapsed > SLA_72H_MS) return '#dc2626';
  if (elapsed > SLA_72H_MS * 0.8) return '#f59e0b';
  return '#16a34a';
};

const getSlaLabel = (submittedAt, lang) => {
  if (!submittedAt) return '';
  const elapsed = Date.now() - new Date(submittedAt).getTime();
  const hoursLeft = Math.max(0, Math.round((SLA_72H_MS - elapsed) / (60 * 60 * 1000)));
  if (lang === 'ar') {
    if (hoursLeft === 0) return 'متأخر';
    return `${hoursLeft}س متبقية`;
  }
  if (hoursLeft === 0) return 'Overdue';
  return `${hoursLeft}h left`;
};

const InboxOutboxDrawer = ({ isOpen, onClose }) => {
  const { user, isInstructor, isAdmin, isSuperAdmin, isHR } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { width: drawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: 'inbox_outbox_drawer_width',
    defaultWidth: 520,
    minWidth: 360,
    maxWidth: 900,
    isRTL,
  });

  const [activeTab, setActiveTab] = useState(TABS.INBOX);
  const [inboxDocs, setInboxDocs] = useState([]);
  const [outboxDocs, setOutboxDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [actionComment, setActionComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [workflowTypeFilter, setWorkflowTypeFilter] = useState('ALL');

  const role = useMemo(() => {
    if (isHR) return 'hr';
    if (isAdmin || isSuperAdmin) return 'admin';
    return 'instructor';
  }, [isHR, isAdmin, isSuperAdmin]);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = { role, workflowCategory: 'ATTENDANCE' };
    if (workflowTypeFilter !== 'ALL') params.workflowType = workflowTypeFilter;
    const res = await getInboxDocuments(params);
    if (res.success) {
      setInboxDocs(res.data || []);
    } else {
      setError(res.error || 'Failed to load inbox');
    }
    setLoading(false);
  }, [role, workflowTypeFilter]);

  const fetchOutbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = { workflowCategory: 'ATTENDANCE' };
    if (workflowTypeFilter !== 'ALL') params.workflowType = workflowTypeFilter;
    const res = await getOutboxDocuments(params);
    if (res.success) {
      setOutboxDocs(res.data || []);
    } else {
      setError(res.error || 'Failed to load outbox');
    }
    setLoading(false);
  }, [workflowTypeFilter]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === TABS.INBOX) {
      fetchInbox();
    } else {
      fetchOutbox();
    }
  }, [isOpen, activeTab, fetchInbox, fetchOutbox]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setExpandedId(null);
    setActionComment('');
    setError(null);
  }, []);

  const handleWorkflowTypeChange = useCallback((type) => {
    setWorkflowTypeFilter(type);
    setExpandedId(null);
    setError(null);
  }, []);

  const handleAction = useCallback(async (action, docId) => {
    setActionLoading(true);
    let result;
    if (action === 'approve') {
      result = await approveDocument(docId, actionComment);
    } else if (action === 'reject') {
      result = await rejectDocument(docId, actionComment || 'Rejected');
    } else if (action === 'return') {
      result = await returnDocument(docId, actionComment);
    } else if (action === 'withdraw') {
      result = await withdrawDocument(docId);
    }
    setActionLoading(false);
    if (result?.success) {
      setActionComment('');
      setExpandedId(null);
      if (activeTab === TABS.INBOX) fetchInbox();
      else fetchOutbox();
    } else {
      setError(result?.error || 'Action failed');
    }
  }, [actionComment, activeTab, fetchInbox, fetchOutbox]);

  const formatTimestamp = useCallback((ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString(lang === 'ar' ? 'ar' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  }, [lang]);

  const getStatusLabel = useCallback((status) => {
    const labels = STATUS_LABELS[status] || { en: status, ar: status };
    return lang === 'ar' ? labels.ar : labels.en;
  }, [lang]);

  const tabBtnStyle = useMemo(() => ({
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    borderBottom: '3px solid transparent',
    color: isDark ? '#94a3b8' : '#64748b',
  }), [isDark]);

  const activeTabStyle = useMemo(() => ({
    ...tabBtnStyle,
    color: 'var(--color-primary, #800020)',
    borderBottomColor: 'var(--color-primary, #800020)',
  }), [tabBtnStyle]);

  const cardStyle = useMemo(() => ({
    padding: '14px 16px',
    borderRadius: '10px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
    background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
    marginBottom: '8px',
  }), [isDark]);

  const statusBadgeStyle = useCallback((status) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    background: `${STATUS_COLORS[status] || '#6b7280'}20`,
    color: STATUS_COLORS[status] || '#6b7280',
  }), []);

  const renderDocCard = useCallback((doc, isInbox) => {
    const isExpanded = expandedId === doc.id;
    const status = doc.status || 'DRAFT';
    const submitterName = doc.submitter?.displayName
      || `${doc.submitter?.firstName || ''} ${doc.submitter?.lastName || ''}`.trim()
      || 'Unknown';
    const className = lang === 'ar' ? doc.class?.nameAr : doc.class?.nameEn || doc.class?.code || '';
    const subjectName = lang === 'ar' ? doc.class?.subject?.nameAr : doc.class?.subject?.nameEn || '';

    return (
      <motion.div
        key={doc.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={cardStyle}
      >
        <div
          onClick={() => setExpandedId(isExpanded ? null : doc.id)}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: isDark ? '#f1f5f9' : '#1e293b',
                marginBottom: '2px',
              }}>
                {doc.title || className || `Document #${doc.id}`}
              </div>
              {className && (
                <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  {className}{subjectName ? ` · ${subjectName}` : ''}
                </div>
              )}
            </div>
            <span style={statusBadgeStyle(status)}>
              {getStatusLabel(status)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
              {isInbox
                ? `${t('inbox_from') || 'From'}: ${submitterName}`
                : `${t('outbox_submitted_to') || 'To'}: ${getStatusLabel(doc.currentStage || status)}`}
            </span>
            <span style={{ fontSize: '11px', color: isDark ? '#6b7280' : '#9ca3af' }}>
              {formatTimestamp(doc.submittedAt || doc.createdAt)}
            </span>
          </div>

          {isInbox && doc.submittedAt && (
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getSlaColor(doc.submittedAt),
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                color: getSlaColor(doc.submittedAt),
              }}>
                {getSlaLabel(doc.submittedAt, lang)}
              </span>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
              }}>
                {doc.description && (
                  <div style={{
                    fontSize: '13px',
                    color: isDark ? '#cbd5e1' : '#475569',
                    marginBottom: '8px',
                  }}>
                    {doc.description}
                  </div>
                )}

                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: 'var(--color-primary, #800020)',
                      marginBottom: '8px',
                    }}
                  >
                    {getThemedIcon('ui', 'file', 14, theme)}
                    {t('inbox_view_document') || 'View Document'}
                  </a>
                )}

                {isInbox && (isAdmin || isSuperAdmin || isHR) && (
                  <div style={{ marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      placeholder={t('inbox_comment_placeholder') || 'Add a comment (optional)'}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                        background: isDark ? '#0f0f1e' : '#fff',
                        color: isDark ? '#fff' : '#111',
                        fontSize: '13px',
                        marginBottom: '8px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleAction('approve', doc.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#16a34a',
                          color: '#fff',
                          cursor: actionLoading ? 'wait' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {t('inbox_approve') || 'Approve'}
                      </button>
                      {(isHR || isSuperAdmin) && (
                        <button
                          onClick={() => handleAction('reject', doc.id)}
                          disabled={actionLoading}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#dc2626',
                            color: '#fff',
                            cursor: actionLoading ? 'wait' : 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {t('inbox_reject') || 'Reject'}
                        </button>
                      )}
                      <button
                        onClick={() => handleAction('return', doc.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                          background: 'transparent',
                          color: '#f97316',
                          cursor: actionLoading ? 'wait' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {t('inbox_return') || 'Return'}
                      </button>
                    </div>
                  </div>
                )}

                {!isInbox && isInstructor && (status === 'SUBMITTED' || status === 'UNDER_REVIEW') && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={() => handleAction('withdraw', doc.id)}
                      disabled={actionLoading}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                        background: 'transparent',
                        color: '#f97316',
                        cursor: actionLoading ? 'wait' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {t('outbox_withdraw') || 'Withdraw'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }, [expandedId, actionComment, actionLoading, isDark, lang, t, theme, isInstructor, isAdmin, isSuperAdmin, isHR, cardStyle, statusBadgeStyle, getStatusLabel, formatTimestamp, handleAction]);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {t('loading') || 'Loading...'}
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          margin: '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.2)',
          color: '#dc2626',
          fontSize: '13px',
        }}>
          {error}
        </div>
      );
    }

    const docs = activeTab === TABS.INBOX ? inboxDocs : outboxDocs;

    if (!docs || docs.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {getThemedIcon('ui', 'inbox', 48, theme)}
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            {activeTab === TABS.INBOX
              ? (t('inbox_empty') || 'No pending documents')
              : (t('outbox_empty') || 'No submitted documents')}
          </p>
        </div>
      );
    }

    return (
      <div style={{ padding: '12px' }}>
        {docs.map((doc) => renderDocCard(doc, activeTab === TABS.INBOX))}
      </div>
    );
  };

  if (!isOpen) return null;

  const inboxCount = inboxDocs.length;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 999,
          backdropFilter: 'blur(2px)',
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          [isRTL ? 'left' : 'right']: 0,
          height: '100vh',
          width: drawerWidth,
          background: isDark ? '#1a1a2e' : '#ffffff',
          boxShadow: isRTL ? '2px 0 20px rgba(0,0,0,0.15)' : '-2px 0 20px rgba(0,0,0,0.15)',
          zIndex: 1002,
          display: 'flex',
          flexDirection: 'column',
          dir: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <div {...resizeHandleProps} />

        {/* Header */}
        <div style={{
          padding: '16px 20px 0',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
          background: isDark ? '#0f0f1e' : '#f9fafb',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: isDark ? '#fff' : '#111',
              }}>
                {t('inbox_outbox_title') || 'Inbox / Outbox'}
              </h2>
              {inboxCount > 0 && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--color-primary, #800020)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '0 6px',
                }}>
                  {inboxCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#9ca3af' : '#6b7280',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary, #800020)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280';
              }}
            >
              {getThemedIcon('ui', 'close', 20, theme)}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              style={activeTab === TABS.INBOX ? activeTabStyle : tabBtnStyle}
              onClick={() => handleTabChange(TABS.INBOX)}
            >
              {t('inbox_tab') || 'Inbox'}
              {inboxCount > 0 && (
                <span style={{
                  marginLeft: '6px',
                  fontSize: '11px',
                  color: 'var(--color-primary, #800020)',
                }}>
                  ({inboxCount})
                </span>
              )}
            </button>
            <button
              style={activeTab === TABS.OUTBOX ? activeTabStyle : tabBtnStyle}
              onClick={() => handleTabChange(TABS.OUTBOX)}
            >
              {t('outbox_tab') || 'Outbox'}
            </button>
          </div>
        </div>

        {/* Workflow Type Filter */}
        <div style={{
          padding: '8px 16px',
          borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
          background: isDark ? '#161629' : '#f9fafb',
        }}>
          <select
            value={workflowTypeFilter}
            onChange={(e) => handleWorkflowTypeChange(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
              background: isDark ? '#0f172a' : '#fff',
              color: isDark ? '#f1f5f9' : '#1e293b',
              fontSize: '13px',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            {WORKFLOW_TYPE_FILTERS.map((wf) => (
              <option key={wf.value} value={wf.value}>
                {lang === 'ar' ? wf.labelAr : wf.labelEn}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: isDark ? '#1a1a2e' : '#ffffff',
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default InboxOutboxDrawer;
