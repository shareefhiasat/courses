import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import {
  getAdminReviewDocuments,
  approveWorkflowDoc,
  rejectWorkflowDoc,
  returnWorkflowDoc,
} from '@services/business/adminReviewService';

const STATUS_FILTERS = {
  ALL: 'all',
  SUBMITTED: 'SUBMITTED',
  UNDER_ADMIN_REVIEW: 'UNDER_ADMIN_REVIEW',
  UNDER_HR_REVIEW: 'UNDER_HR_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RETURNED: 'RETURNED',
};

const STATUS_COLORS = {
  DRAFT: '#6b7280',
  SUBMITTED: '#2563eb',
  UNDER_ADMIN_REVIEW: '#f59e0b',
  UNDER_HR_REVIEW: '#8b5cf6',
  APPROVED: '#16a34a',
  REJECTED: '#dc2626',
  RETURNED: '#f97316',
  CLOSED: '#6b7280',
};

const STATUS_LABELS = {
  DRAFT: { en: 'Draft', ar: 'مسودة' },
  SUBMITTED: { en: 'Submitted', ar: 'مُرسل' },
  UNDER_ADMIN_REVIEW: { en: 'Under Admin Review', ar: 'قيد مراجعة المدير' },
  UNDER_HR_REVIEW: { en: 'Under HR Review', ar: 'قيد مراجعة الموارد البشرية' },
  APPROVED: { en: 'Approved', ar: 'موافق عليه' },
  REJECTED: { en: 'Rejected', ar: 'مرفوض' },
  RETURNED: { en: 'Returned', ar: 'مُرتجع' },
  CLOSED: { en: 'Closed', ar: 'مغلق' },
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

const AdminReviewPanel = ({ onBack }) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS.SUBMITTED);
  const [expandedId, setExpandedId] = useState(null);
  const [actionComment, setActionComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {
      role: 'admin',
      workflowCategory: 'ATTENDANCE',
    };
    if (statusFilter !== STATUS_FILTERS.ALL) {
      params.status = statusFilter;
    }
    const res = await getAdminReviewDocuments(params);
    if (res.success) {
      setDocuments(res.data || []);
    } else {
      setError(res.error || 'Failed to load documents');
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleAction = useCallback(async (action, docId) => {
    setActionLoading(true);
    let result;
    if (action === 'approve') {
      result = await approveWorkflowDoc(docId, actionComment);
    } else if (action === 'reject') {
      result = await rejectWorkflowDoc(docId, actionComment || 'Rejected');
    } else if (action === 'return') {
      result = await returnWorkflowDoc(docId, actionComment);
    }
    setActionLoading(false);
    if (result?.success) {
      setActionComment('');
      setExpandedId(null);
      fetchDocuments();
    } else {
      setError(result?.error || 'Action failed');
    }
  }, [actionComment, fetchDocuments]);

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

  const filteredDocs = useMemo(() => {
    if (!searchTerm) return documents;
    const term = searchTerm.toLowerCase();
    return documents.filter((doc) => {
      const submitterName = doc.submitter?.displayName || '';
      const className = doc.class?.nameEn || doc.class?.nameAr || doc.class?.code || '';
      const title = doc.title || '';
      return title.toLowerCase().includes(term)
        || submitterName.toLowerCase().includes(term)
        || className.toLowerCase().includes(term);
    });
  }, [documents, searchTerm]);

  const filterOptions = useMemo(() => {
    const opts = [
      { value: STATUS_FILTERS.ALL, label: t('admin_review_filter_all') || 'All' },
      { value: STATUS_FILTERS.SUBMITTED, label: t('admin_review_filter_submitted') || 'Submitted' },
      { value: STATUS_FILTERS.UNDER_ADMIN_REVIEW, label: t('admin_review_filter_admin_review') || 'Under Admin Review' },
      { value: STATUS_FILTERS.UNDER_HR_REVIEW, label: t('admin_review_filter_hr_review') || 'Under HR Review' },
      { value: STATUS_FILTERS.APPROVED, label: t('admin_review_filter_approved') || 'Approved' },
      { value: STATUS_FILTERS.REJECTED, label: t('admin_review_filter_rejected') || 'Rejected' },
    ];
    return opts;
  }, [t]);

  const cardStyle = useMemo(() => ({
    padding: '16px 20px',
    borderRadius: '12px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
    background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
    marginBottom: '10px',
  }), [isDark]);

  const filterBtnStyle = useCallback((isActive) => ({
    padding: '6px 14px',
    borderRadius: '8px',
    border: `1px solid ${isActive ? 'var(--color-primary, #800020)' : (isDark ? '#334155' : '#e2e8f0')}`,
    background: isActive ? 'rgba(128,0,32,0.1)' : 'transparent',
    color: isActive ? 'var(--color-primary, #800020)' : (isDark ? '#94a3b8' : '#64748b'),
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  }), [isDark]);

  const statusBadgeStyle = useCallback((status) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    background: `${STATUS_COLORS[status] || '#6b7280'}20`,
    color: STATUS_COLORS[status] || '#6b7280',
  }), []);

  const renderDocCard = useCallback((doc) => {
    const isExpanded = expandedId === doc.id;
    const status = doc.status || 'DRAFT';
    const submitterName = doc.submitter?.displayName
      || `${doc.submitter?.firstName || ''} ${doc.submitter?.lastName || ''}`.trim()
      || 'Unknown';
    const className = lang === 'ar' ? doc.class?.nameAr : doc.class?.nameEn || doc.class?.code || '';
    const subjectName = lang === 'ar' ? doc.class?.subject?.nameAr : doc.class?.subject?.nameEn || '';
    const canAct = status === 'SUBMITTED' || status === 'UNDER_ADMIN_REVIEW';

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: isDark ? '#f1f5f9' : '#1e293b',
                marginBottom: '4px',
              }}>
                {doc.title || className || `Document #${doc.id}`}
              </div>
              {className && (
                <div style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  {className}{subjectName ? ` · ${subjectName}` : ''}
                </div>
              )}
            </div>
            <span style={statusBadgeStyle(status)}>
              {getStatusLabel(status)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                {t('admin_review_submitter') || 'Submitter'}: {submitterName}
              </span>
              {doc.submittedAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            <span style={{ fontSize: '11px', color: isDark ? '#6b7280' : '#9ca3af' }}>
              {formatTimestamp(doc.submittedAt || doc.createdAt)}
            </span>
          </div>
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
                marginTop: '14px',
                paddingTop: '14px',
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
              }}>
                {doc.description && (
                  <div style={{
                    fontSize: '13px',
                    color: isDark ? '#cbd5e1' : '#475569',
                    marginBottom: '10px',
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
                      fontSize: '13px',
                      color: 'var(--color-primary, #800020)',
                      marginBottom: '10px',
                    }}
                  >
                    {getThemedIcon('ui', 'file', 14, theme)}
                    {t('admin_review_view_document') || 'View Document'}
                  </a>
                )}

                {canAct && (isAdmin || isSuperAdmin) && (
                  <div>
                    <input
                      type="text"
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      placeholder={t('admin_review_comment_placeholder') || 'Add a comment (optional)'}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                        background: isDark ? '#0f0f1e' : '#fff',
                        color: isDark ? '#fff' : '#111',
                        fontSize: '13px',
                        marginBottom: '10px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleAction('approve', doc.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#16a34a',
                          color: '#fff',
                          cursor: actionLoading ? 'wait' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {t('admin_review_approve') || 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction('return', doc.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '8px',
                          border: `1px solid ${isDark ? '#334155' : '#d1d5db'}`,
                          background: 'transparent',
                          color: '#f97316',
                          cursor: actionLoading ? 'wait' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {t('admin_review_return') || 'Return to Instructor'}
                      </button>
                      <button
                        onClick={() => handleAction('reject', doc.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#dc2626',
                          color: '#fff',
                          cursor: actionLoading ? 'wait' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {t('admin_review_reject') || 'Reject'}
                      </button>
                    </div>
                  </div>
                )}

                {!canAct && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                    fontSize: '13px',
                    color: isDark ? '#94a3b8' : '#64748b',
                  }}>
                    {t('admin_review_no_actions') || 'No actions available for this document status'}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }, [expandedId, actionComment, actionLoading, isDark, lang, t, theme, isAdmin, isSuperAdmin, cardStyle, statusBadgeStyle, getStatusLabel, formatTimestamp, handleAction]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0f172a' : '#f8fafc',
        padding: '24px 16px',
        dir: lang === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f1f5f9' : '#1e293b',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← {t('workspace_back') || 'Back'}
        </button>

        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 700,
            margin: 0,
            color: isDark ? '#f1f5f9' : '#1e293b',
          }}>
            {t('admin_review_title') || 'Admin Review'}
          </h1>
          <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 0' }}>
            {t('admin_review_subtitle') || 'Review attendance submissions before forwarding to HR'}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('admin_review_search') || 'Search by title, class, or instructor...'}
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f1f5f9' : '#1e293b',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              style={filterBtnStyle(statusFilter === opt.value)}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
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

      {/* Document List */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '300px',
          fontSize: '14px',
          color: isDark ? '#94a3b8' : '#64748b',
        }}>
          {t('loading') || 'Loading...'}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: isDark ? '#94a3b8' : '#64748b',
        }}>
          {getThemedIcon('ui', 'inbox', 48, theme)}
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            {t('admin_review_empty') || 'No documents pending review'}
          </p>
        </div>
      ) : (
        <div>
          {filteredDocs.map((doc) => renderDocCard(doc))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewPanel;
