import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import ProgramTermSelector from '@components/workspace/ProgramTermSelector';
import YearTermSelector from '@components/workspace/YearTermSelector';
import OfficialWeeklyScheduleGrid from '@components/workspace/OfficialWeeklyScheduleGrid';
import ClassActionMenu from '@components/workspace/ClassActionMenu';
import ClassHistoryDrawer from '@components/workspace/ClassHistoryDrawer';
import InboxOutboxDrawer from '@components/workspace/InboxOutboxDrawer';
import WorkspaceActionFab from '@components/workspace/WorkspaceActionFab';
import { getScheduleStatus, getAllPrograms, getProgramTerms } from '@services/business/attendanceWorkspaceService';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService';
import { prepareWeeklyScheduleData } from '@services/export/official-reports/engine/prepareWeeklyScheduleData';
import { exportWeeklyScheduleReport, EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import { academicTermToYearTerm } from '@utils/academicTermUtils';
import { getThemedIcon } from '@constants/iconTypes';

const STEPS = { PROGRAM: 'program', TERM: 'term', SCHEDULE: 'schedule' };

const AttendanceWorkspacePage = () => {
  const { user, isInstructor, isAdmin, isSuperAdmin, isHR } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(STEPS.PROGRAM);
  const [selection, setSelection] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [inboxOutboxOpen, setInboxOutboxOpen] = useState(false);
  const [inboxClassId, setInboxClassId] = useState(null);
  const [inboxInitialTab, setInboxInitialTab] = useState('inbox');
  const [historyState, setHistoryState] = useState({ open: false, classInfo: null, date: null });
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  const instructorId = user?.dbId;

  const handleProgramSelect = useCallback((payload) => {
    setSelection((prev) => ({ ...prev, ...payload }));
    setStep(STEPS.TERM);
  }, []);

  const handleTermSelect = useCallback((payload) => {
    setSelection((prev) => ({ ...prev, ...payload }));
    setStep(STEPS.SCHEDULE);
  }, []);

  const handleBackToProgram = useCallback(() => {
    setStep(STEPS.PROGRAM);
    setSelection(null);
    setScheduleData(null);
    setStatusMap({});
  }, []);

  const handleBackToTerm = useCallback(() => {
    setStep(STEPS.TERM);
    setScheduleData(null);
    setStatusMap({});
  }, []);

  useEffect(() => {
    if (deepLinkHandled) return;
    const programId = searchParams.get('programId');
    const academicTermId = searchParams.get('academicTermId');
    if (!programId) {
      setDeepLinkHandled(true);
      return;
    }

    const loadDeepLink = async () => {
      const programsRes = await getAllPrograms();
      const program = programsRes.data?.find((p) => Number(p.id) === Number(programId));
      if (!program) {
        setDeepLinkHandled(true);
        return;
      }

      const year = searchParams.get('year');
      const term = searchParams.get('term');
      let academicTerm = null;
      const termsRes = await getProgramTerms(program.id, { all: true });

      if (academicTermId) {
        academicTerm = termsRes.data?.find((item) => Number(item.id) === Number(academicTermId));
      } else if (year && term && termsRes.success) {
        const termKey = String(term).toUpperCase().replace(/\s+/g, '');
        academicTerm = termsRes.data?.find((item) => {
          const code = String(item.code || '').toUpperCase().replace(/\s+/g, '');
          return code === termKey || code === `${year}-${termKey.replace(/^\d+-/, '')}`;
        });
      }

      setSelection({ program, academicTerm });
      setStep(academicTerm ? STEPS.SCHEDULE : STEPS.TERM);
      setDeepLinkHandled(true);
    };

    loadDeepLink();
  }, [searchParams, deepLinkHandled]);

  useEffect(() => {
    if (step !== STEPS.SCHEDULE || !selection?.program?.id) return;

    const loadSchedule = async () => {
      setLoading(true);
      const { year, term } = academicTermToYearTerm(selection.academicTerm);

      const sources = await loadWeeklyScheduleSources({
        programId: selection.program.id,
        year,
        term,
        academicTermId: selection.academicTerm?.id,
        academicTermCode: selection.academicTerm?.code,
      });

      const programName = lang === 'ar' && selection.program.nameAr
        ? selection.program.nameAr
        : selection.program.nameEn;

      const prepared = prepareWeeklyScheduleData({
        metadata: {
          programId: selection.program.id,
          programName,
          year,
          term,
        },
        lang,
        sessions: sources.sessions,
        breakSessions: sources.breakSessions,
        instructorAvailability: sources.instructorAvailability,
        timeSlots: sources.timeSlots,
        attachSessionMeta: true,
      });

      setScheduleData(prepared);

      const classIds = (sources.cohortClasses || []).map((c) => c.id).filter(Boolean);
      if (classIds.length > 0) {
        const statusResult = await getScheduleStatus(classIds, selectedDate);
        if (statusResult.success) {
          setStatusMap(statusResult.data);
        }
      } else {
        setStatusMap({});
      }
      setLoading(false);
    };

    loadSchedule();
  }, [step, selection?.program, selection?.academicTerm, selectedDate, lang]);

  const handleCellClick = useCallback((slot, anchor) => {
    const session = slot?.session || (slot?.class ? {
      id: slot.sessionId,
      classId: slot.classId,
      class: slot.class,
      sessionType: slot.sessionType || 'lecture',
    } : null);
    if (!session) return;
    setSelectedSession(session);
    setMenuAnchor(anchor);
  }, []);

  const handleCloseClassMenu = useCallback(() => {
    setSelectedSession(null);
    setMenuAnchor(null);
  }, []);

  const handleOpenInbox = useCallback((tab, classId) => {
    setInboxInitialTab(tab);
    setInboxClassId(classId ?? null);
    setInboxOutboxOpen(true);
  }, []);

  const handleOpenHistory = useCallback((classInfo, date) => {
    setHistoryState({ open: true, classInfo, date });
  }, []);

  const handleCloseInbox = useCallback(() => {
    setInboxOutboxOpen(false);
    setInboxClassId(null);
  }, []);

  const handlePrintSchedule = useCallback(async () => {
    if (!selection?.program || !scheduleData) return;
    setExporting(true);
    try {
      const { year, term } = academicTermToYearTerm(selection.academicTerm);
      const programName = lang === 'ar' && selection.program.nameAr
        ? selection.program.nameAr
        : selection.program.nameEn;
      const reportData = {
        ...scheduleData,
        metadata: {
          ...scheduleData.metadata,
          programId: selection.program.id,
          programName,
          year,
          term,
          watermarkUser: user,
        },
      };
      const safeName = (programName || 'schedule').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
      const filename = `${safeName}_${year || ''}_${term || ''}_weekly`;
      const blob = await exportWeeklyScheduleReport(reportData, {
        format: EXPORT_FORMAT.PDF,
        filename,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [selection, scheduleData, lang, user]);

  const dateInputValue = selectedDate.toISOString().split('T')[0];

  const pageBg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)';

  const canInteractAll = isAdmin || isSuperAdmin || isHR;

  const fabActions = step === STEPS.SCHEDULE ? [
  {
    id: 'print-schedule',
    label: t('workspace_print_schedule'),
    icon: getThemedIcon('ui', 'download', 18, 'primary'),
    onClick: handlePrintSchedule,
    loading: exporting,
  },
  {
    id: 'inbox-outbox',
    label: t('inbox_outbox_button'),
    icon: getThemedIcon('ui', 'mailbox', 18, 'primary'),
    onClick: () => setInboxOutboxOpen(true),
  },
] : [];

  if (step === STEPS.PROGRAM) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, padding: '24px 16px', dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
        <ProgramTermSelector onSelect={handleProgramSelect} />
      </div>
    );
  }

  if (step === STEPS.TERM && selection?.program) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, padding: '24px 16px', dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
        <YearTermSelector
          program={selection.program}
          onSelect={handleTermSelect}
          onBack={handleBackToProgram}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0f172a' : '#f8fafc',
        padding: '24px 16px',
        dir: lang === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={handleBackToTerm}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              background: isDark ? '#1e293b' : '#ffffff',
              color: isDark ? '#f1f5f9' : '#1e293b',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ← {t('workspace_back')}
          </button>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: isDark ? '#f1f5f9' : '#1e293b' }}>
              {t('workspace_take_attendance')}
            </h1>
            <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 0' }}>
              {scheduleData?.subtitle || selection?.program?.nameEn}
              {selection?.academicTerm && (
                <> · {lang === 'ar' && selection.academicTerm.nameAr ? selection.academicTerm.nameAr : selection.academicTerm.nameEn}</>
              )}
            </p>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: isDark ? '#94a3b8' : '#64748b',
            }}
          >
            {t('workspace_date')}
            <input
              type="date"
              value={dateInputValue}
              onChange={(e) => setSelectedDate(new Date(`${e.target.value}T12:00:00`))}
              data-testid="workspace-date-picker"
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                background: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#f1f5f9' : '#1e293b',
                fontSize: '13px',
              }}
            />
          </label>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', color: isDark ? '#94a3b8' : '#64748b' }}>
            {t('loading')}
          </div>
        ) : (
          <OfficialWeeklyScheduleGrid
            scheduleData={scheduleData}
            statusMap={statusMap}
            instructorId={isInstructor ? instructorId : null}
            interactiveAll={canInteractAll}
            selectedDate={selectedDate}
            onCellClick={handleCellClick}
          />
        )}

        <p style={{ fontSize: '12px', color: isDark ? '#64748b' : '#94a3b8', marginTop: '16px', textAlign: 'center' }}>
          {isInstructor ? t('workspace_schedule_hint') : t('workspace_schedule_hint_admin')}
        </p>
      </div>

      <WorkspaceActionFab actions={fabActions} />

      <ClassActionMenu
        session={selectedSession}
        anchorPoint={menuAnchor}
        isOpen={Boolean(selectedSession && menuAnchor)}
        onClose={handleCloseClassMenu}
        selectedDate={selectedDate}
        program={selection?.program}
        onOpenInbox={handleOpenInbox}
        onOpenHistory={handleOpenHistory}
      />

      <ClassHistoryDrawer
        isOpen={historyState.open}
        onClose={() => setHistoryState({ open: false, classInfo: null, date: null })}
        classInfo={historyState.classInfo}
        date={historyState.date || selectedDate}
      />

      <InboxOutboxDrawer
        isOpen={inboxOutboxOpen}
        onClose={handleCloseInbox}
        classId={inboxClassId}
        initialTab={inboxInitialTab}
      />
    </div>
  );
};

export default AttendanceWorkspacePage;
