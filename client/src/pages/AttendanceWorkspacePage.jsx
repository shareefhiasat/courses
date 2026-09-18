import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { IconButton } from '@mui/material';
import { DoorOpen, GraduationCap } from 'lucide-react';
import ProgramTermSelector from '@components/workspace/ProgramTermSelector';
import YearTermSelector from '@components/workspace/YearTermSelector';
import OfficialWeeklyScheduleGrid from '@components/workspace/OfficialWeeklyScheduleGrid';
import ClassActionMenu from '@components/workspace/ClassActionMenu';
import ClassHistoryDrawer from '@components/workspace/ClassHistoryDrawer';
import InboxOutboxDrawer from '@components/workspace/InboxOutboxDrawer';
import WorkspaceActionFab from '@components/workspace/WorkspaceActionFab';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { WELCOME_STORAGE_KEYS, WELCOME_COLORS } from '@components/welcome/welcomeControls.constants.js';
import { getScheduleStatus, getAllPrograms, getProgramTerms } from '@services/business/attendanceWorkspaceService';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService';
import { prepareWeeklyScheduleData } from '@services/export/official-reports/engine/prepareWeeklyScheduleData';
import { exportWeeklyScheduleReport, EXPORT_FORMAT, downloadBlob } from '@services/export/official-reports/index.jsx';
import { academicTermToYearTerm, getAcademicTermDisplayName } from '@utils/academicTermUtils';
import { getThemedIcon } from '@constants/iconTypes';
import { canViewParticipation } from '@components/operations-board/hrAttendancePrivacy.js';

const STEPS = { PROGRAM: 'program', TERM: 'term', SCHEDULE: 'schedule' };

const AttendanceWorkspacePage = () => {
  const { user, isInstructor, isAdmin, isSuperAdmin, isHR } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const [showRoom, setShowRoom] = useState(() => {
    try {
      const saved = localStorage.getItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_ROOM);
      return saved ? saved !== 'false' : true;
    } catch { return true; }
  });
  const [showInstructor, setShowInstructor] = useState(() => {
    try {
      const saved = localStorage.getItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_INSTRUCTOR);
      return saved ? saved !== 'false' : true;
    } catch { return true; }
  });

  const instructorId = user?.dbId;
  const isInstructorOnly = isInstructor && !isAdmin && !isSuperAdmin && !isHR;

  const handleToggleShowRoom = useCallback(() => {
    setShowRoom((prev) => {
      const next = !prev;
      try { localStorage.setItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_ROOM, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleToggleShowInstructor = useCallback(() => {
    setShowInstructor((prev) => {
      const next = !prev;
      try { localStorage.setItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_INSTRUCTOR, String(next)); } catch {}
      return next;
    });
  }, []);

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
        t,
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
  }, [step, selection?.program, selection?.academicTerm, selectedDate, lang, t]);

  const handleCellClick = useCallback((slot, anchor) => {
    const session = slot?.session || (slot?.class ? {
      id: slot.sessionId,
      classId: slot.classId,
      class: slot.class,
      sessionType: slot.sessionType || 'lecture',
    } : null);
    if (!session) return;

    // Instructors can go back in time to view participation, but cannot act on past classes.
    if (isInstructorOnly) {
      const selectedDay = new Date(selectedDate);
      selectedDay.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDay.getTime() < today.getTime()) {
        return;
      }
    }

    setSelectedSession(session);
    setMenuAnchor(anchor);
  }, [isInstructorOnly, selectedDate]);

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

  const handleExportWeeklySchedule = useCallback(async (format = EXPORT_FORMAT.PDF) => {
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
        format,
        filename,
        download: false,
      });
      const ext = format === EXPORT_FORMAT.EXCEL ? 'xlsx' : 'pdf';
      downloadBlob(blob, `${filename}.${ext}`);
    } finally {
      setExporting(false);
    }
  }, [selection, scheduleData, lang, user]);

  const dateInputValue = selectedDate.toISOString().split('T')[0];

  const pageBg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)';

  const handleGoToStandup = useCallback(() => {
    const programId = selection?.program?.id;
    if (!programId) return;
    if (isInstructorOnly) {
      const selectedDay = new Date(selectedDate);
      selectedDay.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDay.getTime() < today.getTime()) return;
    }
    const date = dateInputValue;
    navigate(`/qr-scanner?programId=${programId}&date=${date}&mode=standup`);
  }, [selection, dateInputValue, navigate, isInstructorOnly, selectedDate]);

  const canInteractAll = isAdmin || isSuperAdmin || isHR;

  const fabActions = step === STEPS.SCHEDULE ? [
  {
    id: 'inbox-outbox',
    label: t('inbox_outbox_button'),
    icon: getThemedIcon('ui', 'mailbox', 18, 'primary'),
    onClick: () => setInboxOutboxOpen(true),
  },
  {
    id: 'standup',
    label: t('standup') || 'Standup',
    icon: getThemedIcon('ui', 'users', 18, 'primary'),
    onClick: handleGoToStandup,
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
                <> · {getAcademicTermDisplayName(selection.academicTerm, lang)}</>
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
              max={isInstructorOnly ? new Date().toISOString().split('T')[0] : undefined}
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

          <button
            type="button"
            onClick={handleGoToStandup}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              background: isDark ? '#1e293b' : '#ffffff',
              color: isDark ? '#f1f5f9' : '#1e293b',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {getThemedIcon('ui', 'users', 14, 'currentColor')}
            {t('standup') || 'Standup'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ColoredTooltip title={showRoom ? t('hide_room') : t('show_room')} color={WELCOME_COLORS.gold} placement="bottom">
              <IconButton
                size="small"
                onClick={handleToggleShowRoom}
                sx={{
                  width: 28,
                  height: 28,
                  color: showRoom ? (isDark ? '#f1f5f9' : '#1e293b') : (isDark ? '#64748b' : '#94a3b8'),
                }}
                aria-label={showRoom ? t('hide_room') : t('show_room')}
              >
                <DoorOpen size={14} />
              </IconButton>
            </ColoredTooltip>
            <ColoredTooltip title={showInstructor ? t('hide_instructor') : t('show_instructor')} color={WELCOME_COLORS.gold} placement="bottom">
              <IconButton
                size="small"
                onClick={handleToggleShowInstructor}
                sx={{
                  width: 28,
                  height: 28,
                  color: showInstructor ? (isDark ? '#f1f5f9' : '#1e293b') : (isDark ? '#64748b' : '#94a3b8'),
                }}
                aria-label={showInstructor ? t('hide_instructor') : t('show_instructor')}
              >
                <GraduationCap size={14} />
              </IconButton>
            </ColoredTooltip>
          </div>
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
            hideParticipation={!canViewParticipation({ isInstructor, isAdmin, isHR, isSuperAdmin })}
            selectedDate={selectedDate}
            onCellClick={handleCellClick}
            showInstructor={showInstructor}
            showRoom={showRoom}
            onExportWeeklySchedule={handleExportWeeklySchedule}
          />
        )}

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
