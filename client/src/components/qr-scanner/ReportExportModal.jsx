import React, { useEffect } from 'react';
import { Button, Card, CardBody } from '@ui';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { getThemedIcon } from '@constants/iconTypes';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { REPORT_TYPE_IDS, RECIPIENT_ROLES } from '@constants/reportConstants';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import ExportSuccessPanel from '@components/export/ExportSuccessPanel.jsx';


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
  successResult = null,
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

  useEffect(() => {
    if (isOpen && reportType === REPORT_TYPE_IDS.DAILY_OFFICIAL && setOfficialExportFormat) {
      setOfficialExportFormat(EXPORT_FORMAT.PDF);
    }
  }, [isOpen, reportType, setOfficialExportFormat]);

  if (!isOpen) return null;

  const isSummaryReport = reportType === REPORT_TYPE_IDS.SUMMARY;
  const isDailyReport = reportType === REPORT_TYPE_IDS.DAILY;
  const isDailyOfficial = reportType === REPORT_TYPE_IDS.DAILY_OFFICIAL;
  const isStandupMode = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP;

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
          {successResult ? (
            <>
              <ExportSuccessPanel successResult={successResult} t={t} theme={theme} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={onClose} disabled={isExporting}>
                  {t('cancel')}
                </Button>
              </div>
            </>
          ) : isDailyOfficial ? (
            <DailyOfficialExport
              t={t}
              theme={theme}
              isExporting={isExporting}
              setOfficialExportFormat={setOfficialExportFormat}
              onExport={onExport}
              onClose={onClose}
            />
          ) : (
          <>
          <div style={{
            background: isSummaryReport
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
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
                (t('summary_report'))
              ) : (
                (t('daily_report'))
              )}
            </h2>
          </div>

          
          {isSummaryReport && (
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
              {t('export_preferences')}
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
          </>
          )}
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
  const isStandupMode = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP;
  
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
        {isStandupMode 
          ? (t('select_programs'))
          : (t('select_subjects'))
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
              ? (t('select_at_least_one_program'))
              : (t('programs_selected')) + ': ' + selectedProgramsForReport.length)
          : (selectedSubjectsForReport.length === 0 
              ? (t('select_at_least_one_subject'))
              : (t('subjects_selected')) + ': ' + selectedSubjectsForReport.length)
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
          {t('send_via_email')}
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
          {t('select_recipients')}
        </label>
        
        {usersLoading ? (
          <div style={{ 
            padding: '1rem', 
            textAlign: 'center', 
            color: '#64748b', 
            fontSize: 'var(--font-size-sm)' 
          }}>
            {t('loading_recipients')}
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
          ? (t('select_at_least_one_recipient'))
          : (t('recipients_selected')) + ': ' + emailRecipients.length
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
        {t('send_to_myself')} ({user?.email || ''})
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
        <span>{t('additional_recipients')}</span>
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
              {t('clear_all')}
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
              {t('scroll_to_students')}
            </button>
          )}
        </div>
      </div>
      
      <RoleSection
        role={RECIPIENT_ROLES.INSTRUCTORS}
        title={t('instructors')}
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
        title={t('admins')}
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
        title={t('hr')}
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
          title={t('students')}
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
          {allSelected ? (t('deselect_all')) : (t('select_all'))}
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
            {t('no_users_found')}
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
  const isStandupMode = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP;

  const exportLabel = isDailyOfficial
    ? officialExportFormat === EXPORT_FORMAT.PDF
      ? t('export_pdf')
      : t('export_excel')
    : exportFormat === 'email'
      ? t('send_email')
      : t('export_csv_excel');

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
                  showError(t('select_at_least_one_program'));
                }
                return;
              }
            } else {
              // Regular mode: validate subject selection
              if (!selectedSubjectsForReport || selectedSubjectsForReport.length === 0) {
                error('❌ No subjects selected for report');
                if (showError) {
                  showError(t('select_at_least_one_subject'));
                }
                return;
              }
            }
          }
          
          if (exportFormat === 'email') {
            if (!emailRecipients || emailRecipients.length === 0) {
              console.error('❌ No email recipients selected');
              if (showError) {
                showError(t('select_at_least_one_recipient'));
              }
              return;
            }
          }
          
          if (isDailyOfficial) {
            onExport();
            return;
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

const DailyOfficialExport = ({
  t,
  theme,
  isExporting,
  setOfficialExportFormat,
  onExport,
  onClose,
}) => {
  const handleExport = (format) => {
    if (setOfficialExportFormat) {
      setOfficialExportFormat(format);
    }
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '1rem 0',
      }}
    >
      <ColoredTooltip
        title={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12,
              padding: '4px 0',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              {t('daily_official') || 'Daily Official'}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  color: '#e53935',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport(EXPORT_FORMAT.PDF);
                }}
              >
                <FileText size={14} /> PDF
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  color: '#43a047',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport(EXPORT_FORMAT.EXCEL);
                }}
              >
                <FileSpreadsheet size={14} /> Excel
              </span>
            </div>
          </div>
        }
        color="#64748b"
        placement="bottom"
      >
        <button
          type="button"
          disabled={isExporting}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.5rem 2rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border, #e5e7eb)',
            background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f9fafb',
            cursor: isExporting ? 'not-allowed' : 'pointer',
          }}
        >
          <div style={{ fontSize: '2.5rem', color: '#64748b' }}>
            {getThemedIcon('ui', 'file_signature', 40, theme)}
          </div>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: theme === 'dark' ? '#f1f5f9' : '#374151',
            }}
          >
            {t('daily_official') || 'Daily Official'}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: theme === 'dark' ? '#94a3b8' : '#6b7280',
            }}
          >
            {t('hover_to_choose_format') || 'Hover to choose format'}
          </div>
        </button>
      </ColoredTooltip>

      <Button variant="outline" onClick={onClose} disabled={isExporting}>
        {t('cancel')}
      </Button>
    </div>
  );
};

export default ReportExportModal;
