/**
 * Weekly Summary Page
 * 
 * PURPOSE: HR staff can generate weekly attendance summaries
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Button from '@ui/Button';
import {
  generateWeeklySummary,
  getDailyDocuments,
  getCurrentWeekRange,
  getPreviousWeekRange
} from '@services/business/weeklySummaryService.js';

const WeeklySummaryPage = () => {
  const { user, isHR, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [comments, setComments] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dailyDocuments, setDailyDocuments] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && isHR) {
      // Set default to current week
      const currentWeek = getCurrentWeekRange();
      setWeekStart(currentWeek.weekStart);
      setWeekEnd(currentWeek.weekEnd);
    }
  }, [authLoading, isHR]);

  useEffect(() => {
    if (weekStart && weekEnd) {
      loadDailyDocuments();
    }
  }, [weekStart, weekEnd]);

  const loadDailyDocuments = async () => {
    try {
      const result = await getDailyDocuments(weekStart, weekEnd);
      if (result.success) {
        setDailyDocuments(result.data);
      } else {
        setDailyDocuments([]);
      }
    } catch (error) {
      console.error('Error loading daily documents:', error);
      setDailyDocuments([]);
    }
  };

  const handleCurrentWeek = () => {
    const currentWeek = getCurrentWeekRange();
    setWeekStart(currentWeek.weekStart);
    setWeekEnd(currentWeek.weekEnd);
  };

  const handlePreviousWeek = () => {
    const previousWeek = getPreviousWeekRange();
    setWeekStart(previousWeek.weekStart);
    setWeekEnd(previousWeek.weekEnd);
  };

  const handleGenerate = async () => {
    if (!weekStart || !weekEnd) {
      setError('Please select a date range');
      return;
    }

    if (dailyDocuments.length === 0) {
      setError('No daily attendance documents found for the selected date range');
      return;
    }

    setShowPreview(true);
  };

  const confirmGeneration = async () => {
    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const result = await generateWeeklySummary(weekStart, weekEnd, comments);

      if (result.success) {
        setSuccess(`Weekly summary generated successfully! Document ID: ${result.data.document.id}`);
        setShowPreview(false);
        setComments('');
        // Reload daily documents to reflect any changes
        await loadDailyDocuments();
      } else {
        setError(result.error || 'Failed to generate weekly summary');
      }
    } catch (error) {
      setError(error.message || 'Failed to generate weekly summary');
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!isHR) {
    return <div>Access denied. HR role required.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        {t('weekly_summary') || 'Weekly Attendance Summary'}
      </h1>

      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#d1fae5',
          border: '1px solid #a7f3d0',
          borderRadius: 8,
          color: '#065f46'
        }}>
          {success}
        </div>
      )}

      {/* Date Range Selection */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          {t('select_date_range') || 'Select Date Range'}
        </h2>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              {t('week_start') || 'Week Start'}
            </label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              {t('week_end') || 'Week End'}
            </label>
            <input
              type="date"
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.875rem'
              }}
            />
          </div>

          <Button
            variant="secondary"
            onClick={handleCurrentWeek}
            disabled={isGenerating}
          >
            {t('current_week') || 'Current Week'}
          </Button>

          <Button
            variant="secondary"
            onClick={handlePreviousWeek}
            disabled={isGenerating}
          >
            {t('previous_week') || 'Previous Week'}
          </Button>
        </div>
      </div>

      {/* Daily Documents Preview */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          {t('daily_documents') || 'Daily Attendance Documents'} ({dailyDocuments.length})
        </h2>

        {dailyDocuments.length === 0 ? (
          <p style={{ color: '#666' }}>
            {t('no_documents_found') || 'No daily attendance documents found for the selected date range.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                    {t('date') || 'Date'}
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                    {t('class') || 'Class'}
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                    {t('program') || 'Program'}
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                    {t('subject') || 'Subject'}
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                    {t('instructor') || 'Instructor'}
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                    {t('status') || 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dailyDocuments.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(doc.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {doc.class?.name || '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {doc.program || '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {doc.subject || '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {doc.submitter?.name || '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: doc.status === 'SUBMITTED' ? '#d1fae5' : '#f3f4f6',
                        color: doc.status === 'SUBMITTED' ? '#065f46' : '#374151'
                      }}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {dailyDocuments.length > 0 && (
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {t('generate_weekly_summary') || 'Generate Weekly Summary'}
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: '1.5rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
              {t('generate_weekly_summary') || 'Generate Weekly Summary'}
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
              {t('generate_confirmation') || `This will generate a weekly summary aggregating ${dailyDocuments.length} daily attendance documents from ${weekStart} to ${weekEnd}. The summary will be submitted to Admin for review. Are you sure you want to proceed?`}
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                {t('optional_comments') || 'Optional Comments'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={t('add_notes') || 'Add any notes for Admin...'}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setComments('');
                }}
                disabled={isGenerating}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  background: 'white',
                  color: '#374151',
                  fontWeight: 500,
                  cursor: isGenerating ? 'not-allowed' : 'pointer'
                }}
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={confirmGeneration}
                disabled={isGenerating}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: 'none',
                  borderRadius: 8,
                  background: isGenerating ? '#9ca3af' : '#10b981',
                  color: 'white',
                  fontWeight: 500,
                  cursor: isGenerating ? 'not-allowed' : 'pointer'
                }}
              >
                {isGenerating ? (t('generating') || 'Generating...') : (t('confirm_generate') || 'Confirm & Generate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklySummaryPage;
