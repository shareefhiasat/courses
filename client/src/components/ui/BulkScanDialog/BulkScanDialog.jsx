import React, { useRef, useEffect, useCallback, useState } from 'react';
import { X, Upload, Trash2, Calendar, RefreshCw, Download, RotateCcw, Users, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ATTENDANCE_TYPES, STANDUP_ATTENDANCE_TYPES, ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import { getThemedIcon } from '@constants/iconTypes';
import useManualBulkScan from '@hooks/useManualBulkScan';
import { useTheme } from '@contexts/ThemeContext';
import Tabs from '@components/ui/Tabs/Tabs';
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
  attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR,
  onModeChange,
  onSuccess,
  t,
  lang,
  showSuccess,
  showError
}) => {
  // DEBUG: Log dialog props
  console.log('🔍 [DEBUG] BulkScanDialog props:', {
    isOpen,
    attendanceMode,
    hasOnModeChange: !!onModeChange,
    classId,
    programId
  });

  const { theme } = useTheme();
  const textareaRef = useRef(null);
  const isRTL = lang === 'ar';

  // Tab state for bulk operations
  const [activeTab, setActiveTab] = useState(null); // null, 'manual', 'addAll', 'addAllExcept'

  // Tab handlers - just change tab, don't auto-execute
  const handleTabChange = (tab) => {
    // Clear stale data when switching between different operation types
    if (activeTab !== tab) {
      // Clear parsed results and validation when switching tabs
      // But preserve input text for "Add All Except" if coming from manual
      const currentInput = inputText;
      if (tab === 'addAllExcept' && activeTab === 'manual') {
        // Preserve input text when going from manual to addAllExcept
        clearState();
        setInputText(currentInput);
      } else {
        // Clear everything for other tab switches
        clearState();
      }
    }
    setActiveTab(tab);
  };

  // Execute bulk operations
  const executeBulkOperation = () => {
    if (activeTab === 'addAll') {
      addAllStudents();
    } else if (activeTab === 'addAllExcept') {
      addAllExcept();
    }
  };

  // Remove individual student number
  const removeStudentNumber = (numberToRemove) => {
    const currentInput = inputText.split('\n').filter(line => line.trim() !== numberToRemove.toString()).join('\n');
    
    // Update input text
    setInputText(currentInput);
    
    // Use the hook's removeChip function to remove from parsed numbers and validated students
    removeChip(numberToRemove);
    
    // If no numbers left, clear everything
    const remainingNumbers = parsedNumbers.filter(num => num !== numberToRemove);
    if (remainingNumbers.length === 0) {
      clearState();
    }
  };

  // Define tabs for the Tabs component
  const bulkTabs = [
    {
      value: 'manual',
      label: t('manual_input') || 'Manual Input',
      icon: <Upload size={16} />
    },
    {
      value: 'addAll',
      label: t('add_all') || 'Add All',
      icon: <Users size={16} />
    },
    {
      value: 'addAllExcept',
      label: t('add_all_except') || 'Add All Except',
      icon: <Users size={16} />
    }
  ];

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
    progress,
    result,
    parseInput,
    validateStudents,
    removeChip,
    clearAll,
    clearState,
    addAllStudents,
    addAllExcept,
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
    attendanceMode,
    onSuccess: (result) => {
      if (onSuccess) onSuccess(result);
      // Don't auto-close, let user see results
    },
    t,
    showSuccess,
    showError
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
      const allAttendanceTypes = [...ATTENDANCE_TYPES, ...STANDUP_ATTENDANCE_TYPES];
      const attendanceType = allAttendanceTypes.find(type => type.id === status);
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

        {/* Progress Bar - Positioned at top for maximum visibility */}
        {loading && progress.total > 0 && (
          <div className={styles.progressSection}>
            <div className={styles.progressInfo}>
              <span className={styles.progressText}>
                {t('processing_students') || 'Processing students'}: {progress.processed}/{progress.total}
              </span>
              <span className={styles.progressPercentage}>
                {progress.percentage}%
              </span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            {progress.totalBatches > 1 && (
              <div className={styles.batchInfo}>
                {t('batch') || 'Batch'} {progress.currentBatch}/{progress.totalBatches}
              </div>
            )}
          </div>
        )}

        <div className={styles.content}>
          {/* Beautiful Tab Navigation - Moved to Top */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <Tabs
                tabs={bulkTabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                variant="default"
                size="md"
                style={{ flex: 1 }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {activeTab === 'manual' && (
                  <button
                    onClick={handleParseClick}
                    className={styles.parseButton}
                    disabled={!inputText.trim() || loading}
                  >
                    <Upload size={16} />
                    {t('parse_input') || 'Parse Input'}
                  </button>
                )}
                {(activeTab === 'addAll' || activeTab === 'addAllExcept') && (
                  <button
                    onClick={executeBulkOperation}
                    className={activeTab === 'addAll' ? styles.addAllButton : styles.addAllExceptButton}
                    disabled={loading || validating || addingAll || (activeTab === 'addAllExcept' && inputText.trim() === '') || result !== null}
                  >
                    {addingAll ? (
                      <>
                        <span className={styles.spinner} />
                        {t('adding_all') || 'Adding All...'}
                      </>
                    ) : (
                      <>
                        <Users size={16} />
                        {activeTab === 'addAll' ? (t('add_all') || 'Add All') : (t('add_all_except') || 'Add All Except')}
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={clearState}
                  className={styles.clearButton}
                  disabled={loading || addingAll}
                  title={t('clear_and_new') || 'Clear All and Start New Operation'}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <RotateCcw size={16} />
                  {t('clear_new') || 'Clear/New'}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.inputSection}>
            <label htmlFor="bulk-input" className={styles.label}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {t('paste_student_numbers') || 'Paste Student Numbers'}
                <div className={styles.infoIcon} title={t('bulk_input_help') || 'Maximum 500 student numbers per operation'}>
                  <Info size={14} />
                </div>
              </span>
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
              rows={4}
              disabled={loading}
            />
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
                        onClick={() => removeStudentNumber(number)}
                        className={styles.chipRemove}
                        aria-label={`Remove student ${number}`}
                        title={`Remove student ${number}`}
                      >
                        <X size={12} />
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
              {/* Attendance Mode Toggle */}
                            <div className={styles.controlGroup}>
                <div className={styles.statusCardsGrid}>
                  {(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? STANDUP_ATTENDANCE_TYPES : ATTENDANCE_TYPES).map((type) => (
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
                        {type.id === 'present' && getThemedIcon('ui', 'check_circle', 14, selectedStatus === type.id ? 'white' : '#22c55e')}
                        {type.id === 'late' && getThemedIcon('ui', 'clock', 14, selectedStatus === type.id ? 'white' : '#eab308')}
                        {type.id === 'absent_no_excuse' && getThemedIcon('ui', 'x_circle', 14, selectedStatus === type.id ? 'white' : '#ef4444')}
                        {type.id === 'absent_with_excuse' && getThemedIcon('ui', 'x_circle', 14, selectedStatus === type.id ? 'white' : '#ef4444')}
                        {type.id === 'excused_leave' && getThemedIcon('ui', 'x_circle', 14, selectedStatus === type.id ? 'white' : '#ef4444')}
                        {type.id === 'human_case' && getThemedIcon('ui', 'heart', 14, selectedStatus === type.id ? 'white' : '#8b5cf6')}
                        {/* Standup attendance icons */}
                        {type.id === 'standup_present' && getThemedIcon('ui', 'star', 14, selectedStatus === type.id ? 'white' : '#10b981')}
                        {type.id === 'standup_absent' && getThemedIcon('ui', 'x', 14, selectedStatus === type.id ? 'white' : '#dc2626')}
                        {type.id === 'standup_clinic' && getThemedIcon('ui', 'heart', 14, selectedStatus === type.id ? 'white' : '#0891b2')}
                        {type.id === 'standup_late' && getThemedIcon('ui', 'clock', 14, selectedStatus === type.id ? 'white' : '#f59e0b')}
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
                  <span className={styles.summaryLabel}>{t('total_input') || 'Total Input'}</span>
                  <span className={styles.summaryValue}>{stats.totalInput}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('processed') || 'Processed'}</span>
                  <span className={styles.summaryValue}>{stats.validParsed}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('issues_found') || 'Issues Found'}</span>
                  <span className={styles.summaryValue}>{stats.invalid}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('repeated_entries') || 'Repeated Entries'}</span>
                  <span className={styles.summaryValue}>{stats.duplicates}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('found') || 'Found'}</span>
                  <span className={styles.summaryValue}>{stats.found}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('not_found') || 'Not Found'}</span>
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
                    {t('marked_students') || 'Marked Students'}
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
        </div>
          
        <div className={styles.footer}>
          <div style={{ flex: 1 }}></div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
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
    </div>
  );
};

export default BulkScanDialog;
