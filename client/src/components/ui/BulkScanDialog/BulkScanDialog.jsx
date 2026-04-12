import React, { useRef, useEffect, useCallback, useState } from 'react';
import { X, Upload, Trash2, Calendar, RefreshCw, Download, RotateCcw, Users, CheckCircle, AlertCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { ATTENDANCE_TYPES, STANDUP_ATTENDANCE_TYPES, ATTENDANCE_TYPE_CATEGORY, getAttendanceColor, ATTENDANCE_DISPLAY_NAMES } from '@constants/attendanceTypes';
import { getThemedIcon } from '@constants/iconTypes';
import { useBulkScan } from '@/contexts/BulkScanContext';
import { useTheme } from '@contexts/ThemeContext';
import Tabs from '@components/ui/Tabs/Tabs';
import StatusCard from './StatusCard';
import StudentChip from './StudentChip';
import styles from './BulkScanDialog.module.css';


import { info, error, warn, debug } from '@services/utils/logger.js';
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
      clearState();
    }
    setActiveTab(tab);

    // Auto-fetch all students when clicking Add All tab
    // (addAllStudents already handles parsing and validation internally)
    if (tab === 'addAll') {
      addAllStudents({ programId, classId, attendanceMode });
    }
  };

  // Execute bulk operations
  const executeBulkOperation = () => {
    // Add All tab doesn't need a separate execute operation - it auto-fetches on tab click
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

  const {
    inputText,
    setInputText,
    parsedNumbers,
    invalidRows,
    duplicates,
    validatedStudents,
    selectedStudents,
    excludedStudents,
    selectedStatus,
    setSelectedStatus,
    selectedDate,
    setSelectedDate,
    loading,
    validating,
    addingAll,
    error,
    progress,
    result,
    clearState,
    clearAll,
    addAllStudents,
    addAllExcept,
    removeChip,
    parseInput,
    validateStudents,
    submit,
    canSubmit,
    stats,
    updateConfig,
    moveToExcluded,
    moveToSelected,
    moveAllToExcluded,
    moveAllToSelected,
  } = useBulkScan();

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Reset all state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab(null);
      clearAll();
    }
  }, [isOpen, clearAll]);

  useEffect(() => {
    if (parsedNumbers.length > 0 && validatedStudents.found.length === 0 && !validating) {
      validateStudents();
    }
  }, [parsedNumbers, validatedStudents.found.length, validating, validateStudents]);

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
    }
  ];

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
    console.log('[BulkScanDialog] handlePaste triggered');
    setTimeout(() => {
      console.log('[BulkScanDialog] Calling parseInput after paste');
      parseInput();
    }, 50);
  };

  const handleParseClick = async () => {
    console.log('[BulkScanDialog] handleParseClick triggered');
    await parseInput();
  };

  const handleSubmit = async () => {
    const submissionResult = await submit();
    // Dialog closure is handled by the onSuccess callback in the parent component
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
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
            {t('bulk_scan_title') || 'Bulk Scan'}
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
          <div className={styles.tabNavigationContainer}>
            <div className={styles.tabNavigationHeader}>
              <Tabs
                tabs={bulkTabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                variant="default"
                size="md"
                style={{ flex: 1 }}
              />
              {activeTab && (
                <div className={styles.tabActions}>
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
                  {activeTab === 'addAllExcept' && (
                    <button
                      onClick={executeBulkOperation}
                      className={styles.addAllExceptButton}
                      disabled={loading || validating || addingAll || inputText.trim() === '' || result !== null}
                    >
                      {addingAll ? (
                        <>
                          <span className={styles.spinner} />
                          {t('adding_all') || 'Adding All...'}
                        </>
                      ) : (
                        <>
                          <Users size={16} />
                          {t('add_all_except') || 'Add All Except'}
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={clearState}
                    className={`${styles.clearButton} ${styles.tabActionButtons}`}
                    disabled={loading || addingAll}
                    title={t('clear_and_new') || 'Clear All and Start New Operation'}
                  >
                    <RotateCcw size={16} />
                    {t('clear_new') || 'Clear/New'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Show instructional message when no tab is selected */}
          {!activeTab && (
            <div className={`${styles.instructionalMessage} ${styles[theme]}`}>
              <Users size={48} className={styles.instructionalIcon} />
              <p className={styles.instructionalTitle}>
                {t('select_input_method') || 'Select an Input Method'}
              </p>
              <p className={styles.instructionalDescription}>
                {t('select_input_method_desc') || 'Choose Manual Input to paste student numbers, or Add All to load all students from the program'}
              </p>
            </div>
          )}

          {/* Dual-list layout and controls - only show when a tab is selected */}
          {activeTab && (
            <>
            {/* Dual-list layout for modern mode */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              {/* Left column: Text area for manual input or excluded students */}
              <div style={{ flex: 0.5, display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="bulk-input" className={styles.label}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {activeTab === 'manual'
                      ? (t('paste_student_numbers') || 'Paste Student Numbers')
                      : (t('excluded_students') || 'Excluded Students')}
                  </span>
                </label>
                {activeTab === 'manual' ? (
                  <textarea
                    id="bulk-input"
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onPaste={handlePaste}
                    placeholder={t('bulk_paste_placeholder') || 'Paste student numbers here...\n12345\n67890\n...'}
                    className={styles.textarea}
                    rows={10}
                    disabled={loading}
                    style={{ width: '100%', minHeight: '300px' }}
                  />
                ) : (
                  <div className={styles.chipsContainer} role="list" style={{ minHeight: '300px', maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem' }}>
                    {excludedStudents.length === 0 ? (
                      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                        {t('no_excluded_students') || 'No excluded students'}
                      </div>
                    ) : (
                      excludedStudents.map((student) => (
                        <StudentChip
                          key={student.userId || student.id}
                          student={student}
                          direction="toSelected"
                          onMove={moveToSelected}
                          disabled={loading}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Move buttons column */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                {(activeTab === 'addAll' || activeTab === 'manual') && (
                  <>
                    <button
                      onClick={moveAllToExcluded}
                      className={styles.clearButton}
                      disabled={selectedStudents.length === 0 || loading}
                      title={t('move_all_left') || 'Move all to excluded'}
                      style={{ padding: '0.5rem' }}
                    >
                      <ChevronLeft size={16} />
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={moveAllToSelected}
                      className={styles.clearButton}
                      disabled={excludedStudents.length === 0 || loading}
                      title={t('move_all_right') || 'Move all to selected'}
                      style={{ padding: '0.5rem' }}
                    >
                      <ChevronRight size={16} />
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Right column: Selected students */}
              <div style={{ flex: 0.5, display: 'flex', flexDirection: 'column' }}>
                <label className={styles.label}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {t('selected_students') || 'Selected Students'} ({selectedStudents.length})
                  </span>
                </label>
                <div className={styles.chipsContainer} role="list" style={{ minHeight: '300px', maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem' }}>
                  {selectedStudents.length === 0 ? (
                    <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                      {activeTab === 'manual'
                        ? (t('no_students_selected') || 'No students selected yet')
                        : (t('click_add_all') || 'Click Add All to load students')
                      }
                    </div>
                  ) : (
                    selectedStudents.map((student) => (
                      (activeTab === 'addAll' || activeTab === 'manual') ? (
                        <StudentChip
                          key={student.userId || student.id}
                          student={student}
                          direction="toExcluded"
                          onMove={moveToExcluded}
                          disabled={loading}
                        />
                      ) : (
                        <div
                          key={student.userId || student.id}
                          className={`${styles.chip} ${styles.chipFound}`}
                          style={{ marginBottom: '0.25rem', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          role="listitem"
                        >
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                            <span className={styles.chipText} style={{ fontWeight: '600' }}>
                              {student.studentNumber}
                            </span>
                            {student.displayName && (
                              <span className={styles.chipName} style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                {student.displayName}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    ))
                  )}
                </div>
              </div>
            </div>

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
                  {Object.entries(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? STANDUP_ATTENDANCE_TYPES : ATTENDANCE_TYPES).map(([key, value]) => {
                    const type = {
                      id: value,
                      color: getAttendanceColor?.(value) || '#6b7280',
                      labelEn: ATTENDANCE_DISPLAY_NAMES[value] || value,
                      labelAr: ATTENDANCE_DISPLAY_NAMES[value] || value
                    };

                    return (
                      <StatusCard
                        key={type.id}
                        id={type.id}
                        color={type.color}
                        labelEn={type.labelEn}
                        labelAr={type.labelAr}
                        selected={selectedStatus === type.id}
                        onClick={setSelectedStatus}
                        disabled={loading}
                        theme={theme}
                        lang={lang}
                      />
                    );
                  })}
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


          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          </>
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
                {t('apply_to_n_students', { n: selectedStudents.length }) || `Apply to ${selectedStudents.length} students`}
              </>
            )}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom comparison function to prevent remounting when only callback props change
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.programId === nextProps.programId &&
    prevProps.subjectId === nextProps.subjectId &&
    prevProps.classId === nextProps.classId &&
    prevProps.attendanceMode === nextProps.attendanceMode &&
    prevProps.markedBy === nextProps.markedBy &&
    prevProps.performedBy === nextProps.performedBy &&
    prevProps.performedByName === nextProps.performedByName &&
    prevProps.performedByEmail === nextProps.performedByEmail
  );
};

export default React.memo(BulkScanDialog, arePropsEqual);
