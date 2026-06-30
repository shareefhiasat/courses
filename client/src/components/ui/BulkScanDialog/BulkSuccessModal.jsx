/**
 * Bulk Success Modal Component
 *
 * Displays a success summary after bulk attendance operations
 * Shows detailed stats and allows user to refresh the UI on OK
 */

import React from 'react';
import { Modal } from '@ui';
import { CheckCircle, Users, Clock, AlertCircle, X } from 'lucide-react';
import { getThemedIcon } from '@constants/iconTypes';

const BulkSuccessModal = ({
  isOpen,
  onClose,
  result,
  programName,
  statusLabel,
  statusIcon,
  statusColor,
  dateLabel,
  t = (key) => key
}) => {
  if (!isOpen || !result) return null;

  const successPercentage = result.summary.total > 0 
    ? Math.round((result.summary.succeeded / result.summary.total) * 100) 
    : 0;

  const handleOK = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleOK}
      title={t('bulk_operation_complete') || 'Bulk Operation Complete'}
      size="medium"
      showCloseButton={false}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      titleStyle={{ fontSize: 'var(--font-size-md)', fontWeight: '600' }}
    >
      <div style={{ padding: '1rem 0' }}>
        {/* Operation Details */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'nowrap' }}>
            <div style={{ fontSize: 'var(--font-size-md)', fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap' }}>
              {programName || '-'}
            </div>
            <div style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: '600',
              color: statusColor || '#1f2937',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {statusIcon && statusColor && getThemedIcon('ui', statusIcon.toLowerCase(), 18, statusColor)}
              <span>{statusLabel || '-'}</span>
            </div>
            <div style={{ fontSize: 'var(--font-size-md)', fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap' }}>
              {dateLabel || '-'}
            </div>
          </div>
        </div>

        {/* Success Percentage Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '1rem',
          backgroundColor: successPercentage === 100 ? '#dcfce7' : '#fef3c7',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <CheckCircle
            size={32}
            color={successPercentage === 100 ? '#16a34a' : '#ca8a04'}
          />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
              {successPercentage}%
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
              {t('completed') || 'Completed'}
            </div>
          </div>
        </div>

        {/* Stats Grid - Simplified */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              {result.summary.total}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
              {t('total_students') || 'Total Students'}
            </div>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#dcfce7',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#16a34a' }}>
              {result.summary.succeeded}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
              {t('succeeded') || 'Succeeded'}
            </div>
          </div>
        </div>

        {/* Processed Students List */}
        {result.results?.detailed?.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              fontSize: 'var(--font-size-sm)', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '0.75rem' 
            }}>
              {t('processed_students') || 'Processed Students'}:
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              maxHeight: '150px',
              overflowY: 'auto',
              padding: '0.75rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              {result.results.detailed.slice(0, 10).map((student) => (
                <div
                  key={student.studentId || student.userId}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '0.375rem',
                    fontSize: 'var(--font-size-sm)',
                    color: '#374151',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {student.studentNumber || student.userId || '-'}: {student.studentName || '-'}
                </div>
              ))}
              {result.results.detailed.length > 10 && (
                <div style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '0.375rem',
                  fontSize: 'var(--font-size-sm)',
                  color: '#64748b'
                }}>
                  +{result.results.detailed.length - 10} {t('more') || 'more'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* OK Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleOK}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: 'var(--font-size-md)',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <CheckCircle size={18} />
            {t('ok_refresh') || 'OK - Refresh Data'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkSuccessModal;
