import React, { useEffect } from 'react';
import { Button, Card, CardBody } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { REPORT_TYPE_IDS, RECIPIENT_ROLES } from '@constants/reportConstants';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';


import { info, error, warn, debug } from '@services/utils/logger.js';const ReportExportModal = ({
  isOpen,
  onClose,
  reportType, // 'daily' or 'summary'
  exportFormat,
  setExportFormat,
  selectedSubjectsForReport,
  setSelectedSubjectsForReport,
  subjects,
  selectedProgramId,
  programs,
  emailRecipients,
  setEmailRecipients,
  usersLoading,
  availableUsers,
  toggleUserSelection,
  toggleRoleSelection,
  user,
  theme,
  t,
  lang,
  isExporting,
  onExport,
  fetchUsersForEmail,
  showError, // Add toast support
  attendanceMode, // Add attendance mode to distinguish between regular and standup
  selectedProgramsForReport,
  setSelectedProgramsForReport, // For standup mode: select programs instead of subjects
  officialExportFormat,
  setOfficialExportFormat,
}) => {
  useEffect(() => {
    if (isOpen && availableUsers.students?.length > 20) {
      setTimeout(() => {
        const studentsSection = document.getElementById('students-section');
        if (studentsSection) {
          studentsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [isOpen, availableUsers.students]);

  if (!isOpen) return null;

  const isSummaryReport = reportType === REPORT_TYPE_IDS.SUMMARY;
  const isDailyReport = reportType === REPORT_TYPE_IDS.DAILY;
  const isDailyOfficial = reportType === REPORT_TYPE_IDS.DAILY_OFFICIAL;
  const isStandupMode = attendanceMode === 'standup';

  return (
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
      zIndex: 1000
    }}>
      <Card style={{ maxWidth: '600px', margin: '1rem', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <CardBody>
          {/* Report Type Header */}
          <div style={{
            background: isSummaryReport
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
              : isDailyOfficial
                ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: 700
            }}>
              {isSummaryReport ? (
                (t('summary_report') || 'Summary')
              ) : isDailyOfficial ? (
                (t('daily_official') || 'Daily Official')
              ) : (
                (t('daily_report') || 'Daily')
              )}
            </h2>
          </div>

          {isDailyOfficial && setOfficialExportFormat && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                {t('export_format') || 'Export format'}
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dailyOfficialFormat"
                    checked={officialExportFormat === EXPORT_FORMAT.PDF}
                    onChange={() => setOfficialExportFormat(EXPORT_FORMAT.PDF)}
                  />
                  <span>{t('export_pdf') || 'PDF (watermarked)'}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dailyOfficialFormat"
                    checked={officialExportFormat === EXPORT_FORMAT.EXCEL}
                    onChange={() => setOfficialExportFormat(EXPORT_FORMAT.EXCEL)}
                  />
                  <span>{t('export_excel') || 'Excel (no watermark)'}</span>
                </label>
              </div>
            </div>
          )}

          
          {isSummaryReport && (
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
              {t('export_preferences') || 'Export Preferences'}
            </h3>
          )}
          
          {isSummaryReport && (
            <SubjectSelection
              selectedSubjectsForReport={selectedSubjectsForReport}
              setSelectedSubjectsForReport={setSelectedSubjectsForReport}
              subjects={subjects}
              selectedProgramId={selectedProgramId}
              programs={programs}
              t={t}
              lang={lang}
              attendanceMode={attendanceMode}
              selectedProgramsForReport={selectedProgramsForReport}
              setSelectedProgramsForReport={setSelectedProgramsForReport}
            />
          )}

          <ActionButtons
            onClose={onClose}
            onExport={onExport}
            isExporting={isExporting}
            exportFormat="csv"
            selectedSubjectsForReport={selectedSubjectsForReport}
            emailRecipients={[]}
            reportType={reportType}
            theme={theme}
            t={t}
            attendanceMode={attendanceMode}
            selectedProgramsForReport={selectedProgramsForReport}
            officialExportFormat={officialExportFormat}
            showError={showError}
          />
        </CardBody>
      </Card>
    </div>
  );
};

  // Helper Components
  const SubjectSelection = ({
  selectedSubjectsForReport,
  setSelectedSubjectsForReport,
  subjects,
  selectedProgramId,
  programs,
  t,
  lang,
  attendanceMode,
  selectedProgramsForReport,
  setSelectedProgramsForReport
}) => {
  const isStandupMode = attendanceMode === 'standup';
  
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
        {isStandupMode 
          ? (t('select_programs') || 'Select Programs for Report')
          : (t('select_subjects') || 'Select Subjects for Report')
        }
      </label>
      
      <div style={{
        padding: '0.75rem',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '0.375rem',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        {isStandupMode ? (
          // Show programs for standup mode
          programs.map(program => (
            <label
              key={program.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem',
                fontSize: '0.95rem',
                cursor: 'pointer',
                borderRadius: '0.375rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <input
                type="checkbox"
                checked={selectedProgramsForReport?.includes(program.id)}
                onChange={(e) => {
                  const programId = program.id;
                  if (e.target.checked) {
                    setSelectedProgramsForReport([...(selectedProgramsForReport || []), programId]);
                  } else {
                    setSelectedProgramsForReport((selectedProgramsForReport || []).filter(id => id !== programId));
                  }
                }}
                style={{ width: '1.125rem', height: '1.125rem', flexShrink: 0, margin: 0, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.95rem' }}>
                {lang === 'ar' ? (program.nameAr || program.nameEn || program.name || 'Unknown Program') : (program.nameEn || program.name || 'Unknown Program')}
              </span>
            </label>
          ))
        ) : (
          // Show subjects for regular mode
          subjects
            .filter(s => (s.programId === selectedProgramId) || (s.programId === programs.find(p => p.id == selectedProgramId)?.id))
            .map(subject => (
              <label
                key={subject.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  borderRadius: '0.375rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={selectedSubjectsForReport.includes(subject.id)}
                  onChange={(e) => {
                    const subjectId = subject.id;
                    if (e.target.checked) {
                      setSelectedSubjectsForReport([...selectedSubjectsForReport, subjectId]);
                    } else {
                      setSelectedSubjectsForReport(selectedSubjectsForReport.filter(id => id !== subjectId));
                    }
                  }}
                  style={{ width: '1.125rem', height: '1.125rem', flexShrink: 0, margin: 0, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.95rem' }}>
                  {lang === 'ar' ? (subject.nameAr || subject.nameEn || subject.name || 'Unknown Subject') : (subject.nameEn || subject.name || 'Unknown Subject')}
                </span>
              </label>
            ))
        )}
      </div>
      
      <div style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280', marginTop: '0.5rem' }}>
        {isStandupMode 
          ? ((selectedProgramsForReport?.length || 0) === 0 
              ? (t('select_at_least_one_program') || 'Please select at least one program')
              : (t('programs_selected') || 'Programs selected') + ': ' + selectedProgramsForReport.length)
          : (selectedSubjectsForReport.length === 0 
              ? (t('select_at_least_one_subject') || 'Please select at least one subject')
              : (t('subjects_selected') || 'Subjects selected') + ': ' + selectedSubjectsForReport.length)
        }
      </div>
    </div>
  );
};

const EmailOption = ({
  exportFormat,
  setExportFormat,
  emailRecipients,
  setEmailRecipients,
  usersLoading,
  availableUsers,
  toggleUserSelection,
  toggleRoleSelection,
  user,
  theme,
  t,
  fetchUsersForEmail
}) => {
  return (
    <div style={{
      padding: '0.75rem',
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '0.375rem',
      marginBottom: '1rem'
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={exportFormat === 'email'}
          onChange={(e) => {
            const isEmail = e.target.checked;
            setExportFormat(isEmail ? 'email' : 'csv');
            
            if (isEmail && availableUsers.length === 0) {
              fetchUsersForEmail();
            }
          }}
          style={{ width: '18px', height: '18px' }}
        />
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getThemedIcon('ui', 'send', 16, theme)}
          {t('send_via_email') || 'Send via Email instead of downloading'}
        </span>
      </label>
      
      {exportFormat === 'email' && (
        <RecipientSelection
          emailRecipients={emailRecipients}
          setEmailRecipients={setEmailRecipients}
          usersLoading={usersLoading}
          availableUsers={availableUsers}
          toggleUserSelection={toggleUserSelection}
          toggleRoleSelection={toggleRoleSelection}
          user={user}
          theme={theme}
          t={t}
        />
      )}
    </div>
  );
};

const RecipientSelection = ({
  emailRecipients,
  setEmailRecipients,
  usersLoading,
  availableUsers,
  toggleUserSelection,
  toggleRoleSelection,
  user,
  theme,
  t
}) => {
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
          {t('select_recipients') || 'Select Recipients'}
        </label>
        
        {usersLoading ? (
          <div style={{ 
            padding: '1rem', 
            textAlign: 'center', 
            color: '#64748b', 
            fontSize: 'var(--font-size-sm)' 
          }}>
            {t('loading_recipients') || 'Loading recipients...'}
          </div>
        ) : (
          <>
            <SelfEmailChip
              emailRecipients={emailRecipients}
              setEmailRecipients={setEmailRecipients}
              user={user}
              theme={theme}
              t={t}
            />
            
            <OtherRecipients
              emailRecipients={emailRecipients}
              setEmailRecipients={setEmailRecipients}
              availableUsers={availableUsers}
              toggleUserSelection={toggleUserSelection}
              toggleRoleSelection={toggleRoleSelection}
              theme={theme}
              t={t}
            />
          </>
        )}
      </div>
      
      <div style={{ marginTop: '0.75rem', fontSize: 'var(--font-size-sm)', color: '#1e40af', fontWeight: 500 }}>
        {emailRecipients.length === 0 
          ? (t('select_at_least_one_recipient') || 'Please select at least one recipient')
          : (t('recipients_selected') || 'Recipients selected') + ': ' + emailRecipients.length
        }
      </div>
    </div>
  );
};

const SelfEmailChip = ({ emailRecipients, setEmailRecipients, user, theme, t }) => {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div
        onClick={() => {
          if (emailRecipients.includes('self')) {
            setEmailRecipients(emailRecipients.filter(r => r !== 'self'));
          } else {
            setEmailRecipients([...emailRecipients, 'self']);
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '1rem',
          background: emailRecipients.includes('self') ? '#3b82f6' : '#f1f5f9',
          color: emailRecipients.includes('self') ? 'white' : '#475569',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 500
        }}
      >
        {t('send_to_myself') || 'Send to myself'} ({user?.email || ''})
        {emailRecipients.includes('self') && (
          <span style={{ marginLeft: '0.5rem', fontWeight: '600' }}>✓</span>
        )}
      </div>
    </div>
  );
};

const OtherRecipients = ({
  emailRecipients,
  setEmailRecipients,
  availableUsers,
  toggleUserSelection,
  toggleRoleSelection,
  theme,
  t
}) => {
  const scrollToStudents = () => {
    const studentsSection = document.getElementById('students-section');
    if (studentsSection) {
      studentsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const clearAllSelections = () => {
    setEmailRecipients([]);
  };

  const studentCount = availableUsers.students?.length || 0;
  const hasSelections = emailRecipients.length > 0;
  
  return (
    <div style={{
      padding: '0.75rem',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem'
    }}>
      <div style={{ 
        fontSize: 'var(--font-size-sm)', 
        color: '#64748b', 
        marginBottom: '0.75rem', 
        fontWeight: 500,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <span>{t('additional_recipients') || 'Additional Recipients'}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {hasSelections && (
            <button
              onClick={clearAllSelections}
              style={{
                fontSize: 'var(--font-size-xs)',
                padding: '0.25rem 0.5rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#dc2626'}
              onMouseOut={(e) => e.target.style.background = '#ef4444'}
            >
              {t('clear_all') || 'Clear All'}
            </button>
          )}
          {studentCount > 10 && (
            <button
              onClick={scrollToStudents}
              style={{
                fontSize: 'var(--font-size-xs)',
                padding: '0.25rem 0.5rem',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#7c3aed'}
              onMouseOut={(e) => e.target.style.background = '#8b5cf6'}
            >
              {t('scroll_to_students') || `Scroll to Students (${studentCount})`}
            </button>
          )}
        </div>
      </div>
      
      <RoleSection
        role={RECIPIENT_ROLES.INSTRUCTORS}
        title={t('instructors') || 'Instructors'}
        icon="users"
        users={availableUsers.instructors || []}
        emailRecipients={emailRecipients}
        toggleUserSelection={toggleUserSelection}
        toggleRoleSelection={toggleRoleSelection}
        theme={theme}
        t={t}
        chipColor="#10b981"
      />
      
      <RoleSection
        role={RECIPIENT_ROLES.ADMINS}
        title={t('admins') || 'Admins'}
        icon="shield"
        users={availableUsers.admins || []}
        emailRecipients={emailRecipients}
        toggleUserSelection={toggleUserSelection}
        toggleRoleSelection={toggleRoleSelection}
        theme={theme}
        t={t}
        chipColor="#f59e0b"
      />
      
      <RoleSection
        role={RECIPIENT_ROLES.HR}
        title={t('hr') || 'HR'}
        icon="user_check"
        users={availableUsers.hr || []}
        emailRecipients={emailRecipients}
        toggleUserSelection={toggleUserSelection}
        toggleRoleSelection={toggleRoleSelection}
        theme={theme}
        t={t}
        chipColor="#ef4444"
      />
      
      <div id="students-section">
        <RoleSection
          role={RECIPIENT_ROLES.STUDENTS}
          title={t('students') || 'Students'}
          icon="users"
          users={availableUsers.students || []}
          emailRecipients={emailRecipients}
          toggleUserSelection={toggleUserSelection}
          toggleRoleSelection={toggleRoleSelection}
          theme={theme}
          t={t}
          chipColor="#8b5cf6"
        />
      </div>
    </div>
  );
};

const RoleSection = ({
  role,
  title,
  icon,
  users,
  emailRecipients,
  toggleUserSelection,
  toggleRoleSelection,
  theme,
  t,
  chipColor
}) => {
  const roleKeys = users.map(user => `${user.role}_${user.id}`);
  const allSelected = roleKeys.every(key => emailRecipients.includes(key));

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0.5rem' 
      }}>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: '#1e293b' }}>
          {title}
        </div>
        <button
          onClick={() => toggleRoleSelection(role)}
          style={{
            padding: '0.375rem 0.875rem',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500',
            background: allSelected ? '#ffffff' : '#3b82f6',
            color: allSelected ? '#6b7280' : '#ffffff',
            border: allSelected ? '1px solid #d1d5db' : '1px solid #3b82f6',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = allSelected ? '#f9fafb' : '#2563eb';
            e.target.style.borderColor = allSelected ? '#9ca3af' : '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = allSelected ? '#ffffff' : '#3b82f6';
            e.target.style.borderColor = allSelected ? '#d1d5db' : '#3b82f6';
          }}
        >
          {allSelected ? (t('deselect_all') || 'Deselect All') : (t('select_all') || 'Select All')}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {users.length > 0 ? (
          users.map(user => (
            <UserChip
              key={user.id}
              user={user}
              emailRecipients={emailRecipients}
              toggleUserSelection={toggleUserSelection}
              chipColor={chipColor}
            />
          ))
        ) : (
          <div style={{
            padding: '0.75rem',
            fontSize: 'var(--font-size-sm)',
            color: '#9ca3af',
            fontStyle: 'italic',
            background: '#f9fafb',
            border: '1px dashed #e5e7eb',
            borderRadius: '0.375rem',
            width: '100%'
          }}>
            {t('no_users_found') || 'No users found'}
          </div>
        )}
      </div>
    </div>
  );
};

const UserChip = ({ user, emailRecipients, toggleUserSelection, chipColor }) => {
  const isSelected = emailRecipients.includes(`${user.role}_${user.id}`);
  
  return (
    <div
      onClick={() => toggleUserSelection(user)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '1rem',
        background: isSelected ? chipColor : '#f1f5f9',
        color: isSelected ? 'white' : '#475569',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: 'var(--font-size-sm)',
        border: '1px solid #e2e8f0'
      }}
    >
      <span>{user.name}</span>
      <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.8 }}>({user.email})</span>
      {isSelected && <span>✓</span>}
    </div>
  );
};

const ActionButtons = ({
  onClose,
  onExport,
  isExporting,
  exportFormat,
  selectedSubjectsForReport,
  emailRecipients,
  reportType,
  theme,
  t,
  attendanceMode,
  selectedProgramsForReport,
  officialExportFormat,
  showError,
}) => {
  const isSummaryReport = reportType === REPORT_TYPE_IDS.SUMMARY;
  const isDailyOfficial = reportType === REPORT_TYPE_IDS.DAILY_OFFICIAL;
  const isDailyReport = reportType === REPORT_TYPE_IDS.DAILY;
  const isStandupMode = attendanceMode === 'standup';

  const exportLabel = isDailyOfficial
    ? officialExportFormat === EXPORT_FORMAT.PDF
      ? t('export_pdf') || 'Export PDF'
      : t('export_excel') || 'Export Excel'
    : exportFormat === 'email'
      ? t('send_email') || 'Send Email'
      : t('export_csv_excel') || 'Export CSV (Excel)';

  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isExporting}
      >
        {t('cancel')}
      </Button>
      <Button
        variant="primary"
        onClick={() => {
          console.log('🔍 Modal validation debug:', {
            reportType,
            isSummaryReport,
            isDailyReport,
            isStandupMode,
            selectedSubjectsForReport,
            selectedSubjectsLength: selectedSubjectsForReport?.length,
            selectedProgramsForReport,
            selectedProgramsLength: selectedProgramsForReport?.length
          });

          if (isSummaryReport) {
            if (isStandupMode) {
              // Standup mode: validate program selection
              if (!selectedProgramsForReport || selectedProgramsForReport.length === 0) {
                error('❌ No programs selected for report');
                if (showError) {
                  showError(t('select_at_least_one_program') || 'Please select at least one program for the report');
                }
                return;
              }
            } else {
              // Regular mode: validate subject selection
              if (!selectedSubjectsForReport || selectedSubjectsForReport.length === 0) {
                error('❌ No subjects selected for report');
                if (showError) {
                  showError(t('select_at_least_one_subject') || 'Please select at least one subject for the report');
                }
                return;
              }
            }
          }
          
          if (exportFormat === 'email') {
            if (!emailRecipients || emailRecipients.length === 0) {
              console.error('❌ No email recipients selected');
              if (showError) {
                showError(t('select_at_least_one_recipient') || 'Please select at least one email recipient');
              }
              return;
            }
          }
          
          onClose();
          onExport();
        }}
        loading={isExporting}
        style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%);',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        {exportLabel}
      </Button>
    </div>
  );
};

export default ReportExportModal;
