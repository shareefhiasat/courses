import React, { useRef, useEffect, useCallback } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Trash2, Calendar, User, Clock, RefreshCw, Download, Users } from 'lucide-react';
import { ATTENDANCE_TYPES } from '@constants/attendanceTypes';
import { getThemedIcon } from '@constants/iconTypes';
import useManualBulkScan from '@hooks/useManualBulkScan';
import { useTheme } from '@contexts/ThemeContext';
import styles from './BulkScanDialog.module.css';

const BulkScanDialog = ({
  isOpen,
  onClose,
  programId,
  subjectId,
  classId,
  markedBy,
  performedBy,
  performedByName,
  performedByEmail,
  onSuccess,
  t,
  lang
}) => {
  const { theme } = useTheme();
  const textareaRef = useRef(null);
  const isRTL = lang === 'ar';

  const {
    inputText,
    setInputText,
    parsedNumbers,
    invalidRows,
    duplicates,
    validatedStudents,
    selectedStatus,
    setSelectedStatus,
    selectedDate,
    setSelectedDate,
    dateKey,
    loading,
    validating,
    addingAll,
    error,
    result,
    parseInput,
    validateStudents,
    removeChip,
    clearAll,
    addAllStudents,
    submit,
    canSubmit,
    stats
  } = useManualBulkScan({
    programId,
    subjectId,
    classId,
    markedBy,
    performedBy,
    performedByName,
    performedByEmail,
    onSuccess: (result) => {
      if (onSuccess) onSuccess(result);
      // Don't auto-close, let user see results
    }
  });

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (parsedNumbers.length > 0 && validatedStudents.found.length === 0 && !validating) {
      validateStudents();
    }
  }, [parsedNumbers, validatedStudents.found.length, validating, validateStudents]);

  // Export functionality
  const exportResults = useCallback(() => {
    if (!result?.results?.detailed) return;
    
    // Helper function to get Arabic day name
    const getArabicDay = (dateString) => {
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const date = new Date(dateString);
      return days[date.getDay()] || '';
    };
    
    // Helper function to get Arabic status using shared constants
    const getArabicStatus = (status) => {
      const attendanceType = ATTENDANCE_TYPES.find(type => type.id === status);
      return attendanceType ? attendanceType.label_ar : status;
    };
    
    // Helper function to format time
    const formatTime = (timestamp) => {
      try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ar-SA', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      } catch {
        return '';
      }
    };
    
    // Helper function to format date
    const formatDate = (timestamp) => {
      try {
        const date = new Date(timestamp);
        return date.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch {
        return '';
      }
    };
    
    const csvContent = [
      [
        'الرقم',
        'الاسم',
        'الحالة',
        'المشاركة',
        'السلوك',
        'الجزاء',
        'الحاضر',
        'متأخر',
        'غايب',
        'غايب بعذر',
        'إجازة',
        'حالة إنسانية',
        'وقت الحضور',
        'التاريخ',
        'اليوم'
      ],
      ...result.results.detailed.map(student => [
        student.studentNumber || '',
        student.studentName || '',
        getArabicStatus(student.status),
        student.participation || '0',
        student.behavior || '0',
        student.penalty || '0',
        student.attendanceStats?.present || '0',
        student.attendanceStats?.late || '0',
        student.attendanceStats?.absent || '0',
        student.attendanceStats?.absentWithExcuse || '0',
        student.attendanceStats?.excusedLeave || '0',
        student.attendanceStats?.humanitarianCase || '0',
        formatTime(student.timestamp),
        formatDate(student.timestamp),
        getArabicDay(student.timestamp)
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نتائج_الحضور_الجماعي_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result]);

  // Handle dialog close with state clearing
  const handleClose = useCallback(() => {
    clearAll();
    onClose();
  }, [clearAll, onClose]);

  if (!isOpen) return null;

  const handlePaste = (e) => {
    setTimeout(() => {
      parseInput();
    }, 50);
  };

  const handleParseClick = () => {
    parseInput();
  };

  const handleSubmit = async () => {
    await submit();
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'created':
        return <CheckCircle size={12} />;
      case 'updated':
        return <RefreshCw size={12} />;
      case 'skipped':
        return <Clock size={12} />;
      case 'failed':
        return <AlertCircle size={12} />;
      default:
        return <CheckCircle size={12} />;
    }
  };

  return (
    <div className={`${styles.overlay} ${styles[theme]}`}>
      <div 
        className={`${styles.dialog} ${styles[theme]} ${isRTL ? styles.rtl : ''}`} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="bulk-scan-title"
        aria-modal="true"
      >
        <div className={styles.header}>
          <h2 id="bulk-scan-title" className={styles.title}>
            {t('bulk_scan_title') || 'Bulk Student Scan'}
          </h2>
          <button
            onClick={handleClose}
            className={styles.closeButton}
            aria-label={t('close') || 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.inputSection}>
            <label htmlFor="bulk-input" className={styles.label}>
              {t('paste_student_numbers') || 'Paste Student Numbers'}
              <span className={styles.hint}>
                {t('one_per_line') || '(One per line, numeric only)'}
              </span>
            </label>
            <textarea
              id="bulk-input"
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPaste={handlePaste}
              placeholder={t('bulk_paste_placeholder') || 'Paste student numbers here...\n12345\n67890\n...'}
              className={styles.textarea}
              rows={8}
              disabled={loading}
              aria-describedby="bulk-input-help"
            />
            <div id="bulk-input-help" className={styles.helpText}>
              {t('bulk_input_help') || 'Maximum 500 student numbers per operation'}
            </div>

            <div className={styles.actionRow}>
              <button
                onClick={handleParseClick}
                className={styles.parseButton}
                disabled={!inputText.trim() || loading}
              >
                <Upload size={16} />
                {t('parse_input') || 'Parse Input'}
              </button>
              <button
                onClick={addAllStudents}
                className={styles.addAllButton}
                disabled={loading || validating || addingAll}
                title={t('add_all_students') || 'Add All Students from Program'}
              >
                {addingAll ? (
                  <>
                    <span className={styles.spinner} />
                    {t('adding_all') || 'Adding All...'}
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    {t('add_all') || 'Add All'}
                  </>
                )}
              </button>
              <button
                onClick={clearAll}
                className={styles.clearButton}
                disabled={loading}
              >
                <Trash2 size={16} />
                {t('clear_all') || 'Clear All'}
              </button>
            </div>
          </div>

          {(invalidRows.length > 0 || duplicates.length > 0) && (
            <div className={styles.validationSection}>
              {invalidRows.length > 0 && (
                <div className={styles.errorBox}>
                  <div className={styles.errorHeader}>
                    <AlertCircle size={16} />
                    <span>{t('invalid_entries') || 'Invalid Entries'} ({invalidRows.length})</span>
                  </div>
                  <div className={styles.errorList}>
                    {invalidRows.slice(0, 10).map((item, idx) => (
                      <div key={idx} className={styles.errorItem}>
                        <span className={styles.errorLine}>Line {item.line}:</span>
                        <span className={styles.errorValue}>"{item.value}"</span>
                        <span className={styles.errorReason}>- {item.reason}</span>
                      </div>
                    ))}
                    {invalidRows.length > 10 && (
                      <div className={styles.errorMore}>
                        ...and {invalidRows.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {duplicates.length > 0 && (
                <div className={styles.warningBox}>
                  <div className={styles.warningHeader}>
                    <AlertCircle size={16} />
                    <span>{t('duplicates_removed') || 'Duplicates Removed'} ({duplicates.length})</span>
                  </div>
                  <div className={styles.warningList}>
                    {duplicates.slice(0, 5).map((item, idx) => (
                      <div key={idx} className={styles.warningItem}>
                        Line {item.line}: "{item.value}"
                      </div>
                    ))}
                    {duplicates.length > 5 && (
                      <div className={styles.warningMore}>
                        ...and {duplicates.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {parsedNumbers.length > 0 && (
            <div className={styles.chipsSection}>
              <div className={styles.chipsHeader}>
                <span className={styles.chipsTitle}>
                  {t('student_numbers') || 'Student Numbers'} ({parsedNumbers.length})
                </span>
                {validating && (
                  <span className={styles.validatingBadge}>
                    {t('validating') || 'Validating...'}
                  </span>
                )}
              </div>
              <div className={styles.chipsContainer} role="list">
                {parsedNumbers.map((number) => {
                  const studentInfo = validatedStudents.found.find(s => s.studentNumber === number);
                  const isNotFound = validatedStudents.notFound.includes(number);
                  
                  return (
                    <div
                      key={number}
                      className={`${styles.chip} ${isNotFound ? styles.chipNotFound : ''} ${studentInfo ? styles.chipFound : ''}`}
                      role="listitem"
                    >
                      <span className={styles.chipText}>
                        {number}
                        {studentInfo && (
                          <span className={styles.chipName}> - {studentInfo.displayName}</span>
                        )}
                        {isNotFound && (
                          <span className={styles.chipNotFoundText}> - {t('not_found') || 'Not Found'}</span>
                        )}
                      </span>
                      <button
                        onClick={() => removeChip(number)}
                        className={styles.chipRemove}
                        aria-label={`${t('remove') || 'Remove'} ${number}`}
                        disabled={loading}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {validatedStudents.notFound.length > 0 && (
            <div className={styles.notFoundSection}>
              <div className={styles.notFoundHeader}>
                <AlertCircle size={16} />
                <span>{t('students_not_found') || 'Students Not Found'} ({validatedStudents.notFound.length})</span>
              </div>
              <div className={styles.notFoundList}>
                {validatedStudents.notFound.slice(0, 10).join(', ')}
                {validatedStudents.notFound.length > 10 && ` ...and ${validatedStudents.notFound.length - 10} more`}
              </div>
            </div>
          )}

          {parsedNumbers.length > 0 && (
            <div className={styles.controlsSection}>
              <div className={styles.controlGroup}>
                <div className={styles.statusCardsGrid}>
                  {ATTENDANCE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedStatus(type.id)}
                      disabled={loading}
                      className={`${styles.statusCard} ${styles[type.id]} ${selectedStatus === type.id ? styles.selected : ''} ${styles[theme]}`}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: `2px solid ${type.color || '#6b7280'}`,
                        background: selectedStatus === type.id ? (type.color || '#6b7280') : (theme === 'dark' ? '#1f2937' : 'white'),
                        color: selectedStatus === type.id ? 'white' : (type.color || '#6b7280'),
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        minWidth: '4rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {type.id === 'present' && <CheckCircle size={14} />}
                        {type.id === 'late' && <Clock size={14} />}
                        {type.id === 'absent_no_excuse' && <X size={14} />}
                        {type.id === 'absent_with_excuse' && <AlertCircle size={14} />}
                        {type.id === 'excused_leave' && <User size={14} />}
                        {type.id === 'human_case' && <AlertCircle size={14} />}
                      </div>
                      <span style={{ fontSize: '0.7rem', textAlign: 'center' }}>
                        {lang === 'ar' ? type.label_ar : type.label_en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.controlGroup}>
                <input
                  id="date-select"
                  type="date"
                  value={formatDate(selectedDate)}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className={`${styles.dateInput} ${styles[theme]}`}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {stats.found > 0 && (
            <div className={styles.summarySection}>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('total_input') || 'Total Input'}:</span>
                  <span className={styles.summaryValue}>{stats.totalInput}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('processed') || 'Processed'}:</span>
                  <span className={styles.summaryValue}>{stats.validParsed}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('issues_found') || 'Issues Found'}:</span>
                  <span className={styles.summaryValue}>{stats.invalid}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('repeated_entries') || 'Repeated Entries'}:</span>
                  <span className={styles.summaryValue}>{stats.duplicates}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('found') || 'Found'}:</span>
                  <span className={styles.summaryValue}>{stats.found}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('not_found') || 'Not Found'}:</span>
                  <span className={styles.summaryValue}>{stats.notFound}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage} role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {result && result.success && (
            <div className={`${styles.successSummaryCards} ${styles[theme]}`} role="status">
              <div className={styles.successSummaryHeader}>
                <CheckCircle size={20} className={styles.successIcon} />
                <span className={styles.successText}>
                  {t('bulk_operation_success') || 'Bulk Operation Successful!'}
                </span>
              </div>
              
              <div className={styles.statsCards}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{result.summary.total}</div>
                  <div className={styles.statLabel}>{t('students') || 'Students'}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{result.summary.succeeded}</div>
                  <div className={styles.statLabel}>{t('succeeded') || 'Succeeded'}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{result.summary.created}</div>
                  <div className={styles.statLabel}>{t('created') || 'Created'}</div>
                </div>
                {result.summary.updated > 0 && (
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{result.summary.updated}</div>
                    <div className={styles.statLabel}>{t('updated') || 'Updated'}</div>
                  </div>
                )}
                {(result.summary.skipped > 0 || result.summary.failed > 0) && (
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{result.summary.skipped + result.summary.failed}</div>
                    <div className={styles.statLabel}>{t('issues') || 'Issues'}</div>
                  </div>
                )}
              </div>
              
              {/* Show bulk students in summary */}
              {result.results?.detailed?.length > 0 && (
                <div className={styles.bulkStudentsSection}>
                  <span className={styles.bulkStudentsLabel}>
                    {t('marked_students') || 'Marked Students'}:
                  </span>
                  <div className={styles.bulkStudentsList}>
                    {result.results.detailed.slice(0, 8).map((student, index) => (
                      <span key={student.studentId} className={styles.bulkStudentChip}>
                        {student.studentNumber}: {student.studentName}
                      </span>
                    ))}
                    {result.results.detailed.length > 8 && (
                      <span className={styles.bulkStudentsMore}>
                        +{result.results.detailed.length - 8} {t('more') || 'more'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {result && result.success && result.results?.detailed?.length > 0 && (
            <div className={`${styles.detailedResults} ${styles[theme]}`}>
              <div className={styles.detailedResultsHeader}>
                <div className={styles.detailedResultsHeaderLeft}>
                  <h3 className={styles.detailedResultsTitle}>
                    {t('detailed_results') || 'Detailed Results'}
                  </h3>
                  <div className={styles.detailedResultsCount}>
                    {result.results.detailed.length} {t('students') || 'students'}
                  </div>
                </div>
                <div className={styles.detailedResultsHeaderRight}>
                  <button
                    onClick={clearAll}
                    className={`${styles.clearNewButton} ${styles[theme]}`}
                    title={t('clear_and_new') || 'Clear & Start New Operation'}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className={styles.spinnerSmall} />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    <span>{t('clear_new') || 'Clear & New'}</span>
                  </button>
                  <button
                    onClick={exportResults}
                    className={`${styles.exportButton} ${styles[theme]}`}
                    title={t('export_results') || 'Export Results'}
                  >
                    <Download size={16} />
                    <span>{t('export') || 'Export'}</span>
                  </button>
                </div>
              </div>
              <div className={styles.detailedResultsGrid}>
                {result.results.detailed.map((studentResult, index) => (
                  <div 
                    key={`${studentResult.studentId}-${index}`}
                    className={`${styles.studentCard} ${styles[studentResult.status]} ${styles[theme]}`}
                  >
                    <div className={styles.studentCardHeader}>
                      <div className={styles.studentCardInfo}>
                        <div className={styles.studentCardNumber}>
                          {studentResult.studentNumber}
                        </div>
                        <div className={styles.studentCardName}>
                          {studentResult.studentName}
                        </div>
                      </div>
                      <div className={`${styles.statusCardBadge} ${styles[studentResult.status]} ${styles[theme]}`}>
                        {getStatusIcon(studentResult.status)}
                        <span>{t(studentResult.status) || studentResult.status}</span>
                      </div>
                    </div>
                    <div className={styles.studentCardMessage}>
                      {studentResult.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            className={styles.submitButton}
            disabled={!canSubmit}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <CheckCircle size={16} />
                {t('apply_to_n_students', { n: stats.found }) || `Apply to ${stats.found} students`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkScanDialog;
