import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { ROLE_STRINGS } from '@utils/userUtils';
import WelcomeHeader from '@components/welcome/WelcomeHeader';
import ProgramTermSelector from '@components/workspace/ProgramTermSelector';
import YearTermSelector from '@components/workspace/YearTermSelector';
import OfficialWeeklyScheduleGrid from '@components/workspace/OfficialWeeklyScheduleGrid';
import ClassHistoryDrawer from '@components/workspace/ClassHistoryDrawer';
import InboxOutboxDrawer from '@components/workspace/InboxOutboxDrawer';
import ScheduleContextMenu from '@components/workspace/ScheduleContextMenu';
import ScheduleSpeedDial from '@components/workspace/ScheduleSpeedDial';
import {
  Tabs, Tab, Box, Paper, Snackbar, Alert, LinearProgress,
  Button,
} from '@mui/material';
import Joyride from 'react-joyride';
import { getScheduleStatus } from '@services/business/attendanceWorkspaceService';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService';
import { prepareWeeklyScheduleData } from '@services/export/official-reports/engine/prepareWeeklyScheduleData';
import { academicTermToYearTerm } from '@utils/academicTermUtils';
import useQRPermissions from '@hooks/useQRPermissions';
import { getThemedIcon } from '@constants/iconTypes';

const WELCOME_SELECTION_KEY = 'welcome_selection';

const WelcomePage = () => {
  const { user, role, isInstructor, isAdmin, isHR, isSuperAdmin, isStudent } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selection, setSelection] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [inboxOutboxOpen, setInboxOutboxOpen] = useState(false);
  const [inboxClassId, setInboxClassId] = useState(null);
  const [inboxInitialTab, setInboxInitialTab] = useState('inbox');
  const [historyState, setHistoryState] = useState({ open: false, classInfo: null, date: null });

  const instructorId = user?.dbId;
  const canInteractAll = isAdmin || isSuperAdmin || isHR;
  const { canExport } = useQRPermissions();
  const [exportingKey, setExportingKey] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info', progress: null });
  const [runJoyride, setRunJoyride] = useState(false);

  const showSchedule = useMemo(() => Boolean(selection?.program && selection?.academicTerm), [selection]);

  const effectiveRole = useMemo(() => {
    if (isSuperAdmin) return ROLE_STRINGS.SUPER_ADMIN;
    if (isAdmin) return ROLE_STRINGS.ADMIN;
    if (isHR) return ROLE_STRINGS.HR;
    if (isInstructor) return ROLE_STRINGS.INSTRUCTOR;
    if (isStudent) return ROLE_STRINGS.STUDENT;
    return role;
  }, [isSuperAdmin, isAdmin, isHR, isInstructor, isStudent, role]);

  useEffect(() => {
    if (isStudent) {
      navigate('/', { replace: true });
    }
  }, [isStudent, navigate]);

  // Restore selection from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(WELCOME_SELECTION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelection(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const persistSelection = useCallback((next) => {
    setSelection(next);
    try {
      sessionStorage.setItem(WELCOME_SELECTION_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const handleResetSelection = useCallback(() => {
    sessionStorage.removeItem(WELCOME_SELECTION_KEY);
    setSelection(null);
    setScheduleData(null);
    setStatusMap({});
    setSearchParams({});
  }, [setSearchParams]);

  const handleProgramSelect = useCallback((payload) => {
    const next = { program: payload.program };
    persistSelection(next);
    setSearchParams({ programId: String(payload.program.id) });
  }, [setSearchParams, persistSelection]);

  const handleTermSelect = useCallback((payload) => {
    const next = { program: payload.program, academicTerm: payload.academicTerm };
    persistSelection(next);
    setSearchParams({
      programId: String(payload.program.id),
      termId: String(payload.academicTerm.id),
    });
  }, [setSearchParams, persistSelection]);

  const handleBackToProgram = useCallback(() => {
    const next = selection ? { ...selection, academicTerm: null } : null;
    persistSelection(next);
    setScheduleData(null);
    setStatusMap({});
    if (next?.program?.id) {
      setSearchParams({ programId: String(next.program.id) });
    } else {
      setSearchParams({});
    }
  }, [selection, setSearchParams, persistSelection]);

  const handleBackToTerm = useCallback(() => {
    setScheduleData(null);
    setStatusMap({});
    if (selection?.program?.id) {
      setSearchParams({ programId: String(selection.program.id) });
    } else {
      setSearchParams({});
    }
  }, [selection, setSearchParams]);

  // Listen for navbar request to change selection
  useEffect(() => {
    const onReset = () => handleResetSelection();
    window.addEventListener('welcome-reset-selection', onReset);
    return () => window.removeEventListener('welcome-reset-selection', onReset);
  }, [handleResetSelection]);

  // Start Joyride once when the schedule is first shown
  useEffect(() => {
    if (!showSchedule) return;
    try {
      const seen = localStorage.getItem('welcome_tour_seen');
      if (seen) return;
      const timer = setTimeout(() => setRunJoyride(true), 600);
      return () => clearTimeout(timer);
    } catch {
      // ignore
    }
  }, [showSchedule]);

  useEffect(() => {
    const programName = selection?.program
      ? (lang === 'ar' && selection.program.nameAr ? selection.program.nameAr : selection.program.nameEn)
      : null;
    const termLabel = selection?.academicTerm
      ? (lang === 'ar' && selection.academicTerm.nameAr ? selection.academicTerm.nameAr : selection.academicTerm.nameEn)
      : null;
    window.dispatchEvent(new CustomEvent('welcome-wizard-nav', {
      detail: { programName, termLabel },
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('welcome-wizard-nav', { detail: null }));
    };
  }, [selection, lang]);

  // Load schedule data when program and term are selected
  useEffect(() => {
    if (!selection?.program?.id || !selection?.academicTerm?.id) return;

    const loadSchedule = async () => {
      setLoading(true);
      const { year, term } = academicTermToYearTerm(selection.academicTerm);

      const sources = await loadWeeklyScheduleSources({
        programId: selection.program.id,
        year,
        term,
        academicTermId: selection.academicTerm.id,
        academicTermCode: selection.academicTerm.code,
      });

      const programName = lang === 'ar' && selection.program.nameAr
        ? selection.program.nameAr
        : selection.program.nameEn;

      const prepared = prepareWeeklyScheduleData({
        metadata: { programId: selection.program.id, programName, year, term },
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
  }, [selection?.program, selection?.academicTerm, selectedDate, lang]);

  const handleCellClick = useCallback((slot, anchor, openMenu = true) => {
    const session = slot?.session || (slot?.class ? {
      id: slot.sessionId,
      classId: slot.classId,
      class: slot.class,
      sessionType: slot.sessionType || 'lecture',
    } : null);
    if (!session) return;
    setSelectedSession(session);
    setSelectedSlot({
      classId: session.classId,
      dayCode: slot?.dayCode,
      colKey: slot?.colKey,
    });
    if (openMenu && anchor && typeof anchor.x === 'number') {
      const virtualEl = document.createElement('div');
      virtualEl.style.position = 'fixed';
      virtualEl.style.left = `${anchor.x}px`;
      virtualEl.style.top = `${anchor.y}px`;
      virtualEl.style.width = '0';
      virtualEl.style.height = '0';
      document.body.appendChild(virtualEl);
      setMenuAnchorEl(virtualEl);
    }
  }, []);

  // Allow double-clicking another schedule cell to open its menu even when a menu is already open.
  // The MUI menu backdrop consumes the first click, so the cell's own onDoubleClick may not fire.
  useEffect(() => {
    if (!showSchedule) return undefined;
    const onDblClick = (e) => {
      const button = e.target.closest?.('[data-testid^="schedule-cell-"]');
      if (!button) return;
      const raw = button.getAttribute('data-slot');
      if (!raw) return;
      try {
        const slot = JSON.parse(raw);
        if (!slot) return;
        e.preventDefault();
        e.stopPropagation();
        handleCellClick(slot, { x: e.clientX, y: e.clientY }, true);
      } catch {
        // ignore parse errors
      }
    };
    document.addEventListener('dblclick', onDblClick, true);
    return () => document.removeEventListener('dblclick', onDblClick, true);
  }, [showSchedule, handleCellClick]);

  const handleCloseClassMenu = useCallback(() => {
    setMenuAnchorEl((prev) => {
      if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      return null;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedSession(null);
    setSelectedSlot(null);
  }, []);

  const handleOpenInbox = useCallback((tab, classId) => {
    setInboxInitialTab(tab);
    setInboxClassId(classId ?? null);
    setInboxOutboxOpen(true);
  }, []);

  const handleOpenHistory = useCallback((classInfo, date) => {
    setHistoryState({ open: true, classInfo, date });
  }, []);

  const handleExportWeeklySchedule = useCallback(async (format) => {
    if (!selection?.program || !selection?.academicTerm) {
      setSnackbar({
        open: true,
        message: `${t('weekly_schedule')} ${format === EXPORT_FORMAT.PDF ? t('export_pdf') : t('export_excel')} — select program and term first`,
        severity: 'warning',
        progress: null,
      });
      return;
    }
    const key = `weekly-${format}`;
    setExportingKey(key);
    setSnackbar({
      open: true,
      message: `${t('weekly_schedule')} ${format === EXPORT_FORMAT.PDF ? t('export_pdf') : t('export_excel')} — ${t('exporting')}…`,
      severity: 'info',
      progress: 0,
    });
    try {
      const { year, term } = academicTermToYearTerm(selection.academicTerm);
      await exportWeeklyScheduleForProgram({
        program: selection.program,
        academicTerm: selection.academicTerm,
        year,
        term,
        lang,
        t,
        user,
        format,
      });
      setSnackbar({
        open: true,
        message: `${t('weekly_schedule')} ${format === EXPORT_FORMAT.PDF ? t('export_pdf') : t('export_excel')} — ${t('export_success')}`,
        severity: 'success',
        progress: null,
      });
    } catch (err) {
      console.error('[WelcomePage] weekly schedule export failed:', err);
      setSnackbar({
        open: true,
        message: `${t('weekly_schedule')} ${format === EXPORT_FORMAT.PDF ? t('export_pdf') : t('export_excel')} — ${t('export_failed')}`,
        severity: 'error',
        progress: null,
      });
    } finally {
      setExportingKey(null);
    }
  }, [selection?.program, selection?.academicTerm, lang, t, user]);

  const fabActions = useMemo(() => {
    const actions = [
      {
        id: 'weekly-schedule',
        name: t('weekly_schedule'),
        icon: getThemedIcon('ui', 'file_signature', 20, 'currentColor'),
        children: [
          {
            id: 'weekly-pdf',
            name: t('export_pdf'),
            icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'),
            disabled: exportingKey === 'weekly-pdf',
            onClick: () => handleExportWeeklySchedule(EXPORT_FORMAT.PDF),
          },
          {
            id: 'weekly-excel',
            name: t('export_excel'),
            icon: getThemedIcon('ui', 'file_text', 16, 'currentColor'),
            disabled: exportingKey === 'weekly-excel',
            onClick: () => handleExportWeeklySchedule(EXPORT_FORMAT.EXCEL),
          },
        ],
      },
      {
        id: 'attendance-official',
        name: t('official_attendance') || 'Attendance Official',
        icon: getThemedIcon('ui', 'file_signature', 20, 'currentColor'),
        onClick: () => navigate('/qr-scanner'),
      },
      {
        id: 'marks-reports',
        name: t('marks_reports') || 'Marks Reports',
        icon: getThemedIcon('ui', 'download', 20, 'currentColor'),
        children: [
          { id: 'semester_certificate', name: t('semester_certificate') || 'Semester Certificate', icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'), onClick: () => navigate('/marks-entry') },
          { id: 'qualitative_card', name: t('qualitative_card') || 'Qualitative Card', icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'), onClick: () => navigate('/marks-entry') },
          { id: 'class_subject_report', name: t('class_subject') || 'Class Subject Report', icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'), onClick: () => navigate('/marks-entry') },
          { id: 'first_warning', name: t('first_warning') || 'First Warning', icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'), onClick: () => navigate('/marks-entry') },
          { id: 'final_warning', name: t('final_warning') || 'Final Warning', icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'), onClick: () => navigate('/marks-entry') },
        ],
      },
    ];

    return actions;
  }, [exportingKey, handleExportWeeklySchedule, navigate, t]);

  const handleCloseInbox = useCallback(() => {
    setInboxOutboxOpen(false);
    setInboxClassId(null);
  }, []);

  const handleFabAction = useCallback((action) => {
    if (!action.id.startsWith('weekly-')) {
      setSnackbar({
        open: true,
        message: `${action.name} — action triggered`,
        severity: 'info',
        progress: null,
      });
    }
  }, []);

  if (isStudent) return null;

  const pageBg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)';

  const joyrideSteps = useMemo(() => [
    {
      target: '#welcome-navbar-title',
      content: t('tour_change_program_term') || 'Click here any time to change the program or term.',
      disableBeacon: true,
    },
    {
      target: '[data-testid="official-weekly-schedule-grid"]',
      content: t('tour_schedule_grid') || 'Click or double-click a class cell to open actions.',
      disableBeacon: true,
    },
  ], [t]);

  return (
    <div
      className="welcome-page"
      style={{
        minHeight: showSchedule ? 'calc(100vh - 64px)' : '100vh',
        height: showSchedule ? 'calc(100vh - 64px)' : 'auto',
        background: pageBg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: showSchedule ? '0 8px 8px' : '0 16px 48px',
        dir: lang === 'ar' ? 'rtl' : 'ltr',
        boxSizing: 'border-box',
      }}
    >
      {showSchedule && (
        <Joyride
          steps={joyrideSteps}
          run={runJoyride}
          continuous
          showSkipButton
          showProgress
          callback={(data) => {
            if (data.status === 'finished' || data.status === 'skipped') {
              setRunJoyride(false);
              try { localStorage.setItem('welcome_tour_seen', '1'); } catch {}
            }
          }}
          styles={{
            options: {
              zIndex: 10000,
              arrowColor: isDark ? '#1e293b' : '#fff',
              backgroundColor: isDark ? '#1e293b' : '#fff',
              textColor: isDark ? '#f1f5f9' : '#0f172a',
              overlayColor: 'rgba(0, 0, 0, 0.5)',
            },
          }}
        />
      )}

      {!selection?.program && <WelcomeHeader user={user} role={effectiveRole} />}

      {/* Selection flow */}
      <div
        className="selection-section"
        style={{
          width: '100%',
          maxWidth: '1200px',
          marginTop: 0,
          flex: selection?.program && selection?.academicTerm ? 1 : undefined,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          animation: 'fadeInDown 0.3s ease',
        }}
      >
        {!selection?.program && (
          <ProgramTermSelector onSelect={handleProgramSelect} />
        )}

        {selection?.program && !selection?.academicTerm && (
          <YearTermSelector
            program={selection.program}
            onSelect={handleTermSelect}
            onBack={handleBackToProgram}
            showBack={false}
          />
        )}

        {selection?.program && selection?.academicTerm && (
          <div
            style={{
              background: isDark ? '#0f172a' : '#f8fafc',
              borderRadius: '8px',
              padding: '8px',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="standard"
                sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none' } }}
              >
                <Tab label={t('welcome_tab_schedule') || 'Schedule'} />
                <Tab label={t('welcome_tab_overview') || 'Overview'} />
              </Tabs>
              <Button
                size="small"
                onClick={handleResetSelection}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {t('change') || 'Change'}
              </Button>
            </Box>

            {activeTab === 0 && (
              <>
                {loading ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flex: 1,
                      color: isDark ? '#94a3b8' : '#64748b',
                    }}
                  >
                    {t('loading') || 'Loading...'}
                  </div>
                ) : (
                  <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <OfficialWeeklyScheduleGrid
                      scheduleData={scheduleData}
                      statusMap={statusMap}
                      instructorId={isInstructor ? instructorId : null}
                      interactiveAll={canInteractAll}
                      selectedDate={selectedDate}
                      selectedSlot={selectedSlot}
                      onCellClick={handleCellClick}
                      onDateChange={setSelectedDate}
                      compact
                      fillHeight
                    />
                    {selectedSlot && !menuAnchorEl && selectedSession && (
                      <ScheduleSpeedDial
                        session={selectedSession}
                        selectedDate={selectedDate}
                        program={selection?.program}
                        onClose={handleClearSelection}
                        onOpenInbox={handleOpenInbox}
                        onOpenHistory={handleOpenHistory}
                      />
                    )}
                  </div>
                )}

                <p
                  style={{
                    fontSize: '11px',
                    color: isDark ? '#64748b' : '#94a3b8',
                    marginTop: '8px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isInstructor ? t('workspace_schedule_hint') : t('workspace_schedule_hint_admin')}
                </p>
              </>
            )}

            {activeTab === 1 && (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    maxWidth: 480,
                    bgcolor: 'transparent',
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📊</div>
                  <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
                    {t('welcome_dummy_title') || 'Overview'}
                  </div>
                  <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 14 }}>
                    {t('welcome_dummy_description') || 'This tab will show an overview dashboard. Content coming soon.'}
                  </div>
                </Paper>
              </Box>
            )}
          </div>
        )}
      </div>

      {/* Footer link — only when no selection */}
      {!selection?.program && (
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          style={{
            marginTop: '36px',
            background: 'none',
            border: 'none',
            color: isDark ? '#64748b' : '#94a3b8',
            fontSize: '13px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {t('welcome_go_home')}
        </button>
      )}

      <ScheduleContextMenu
        session={selectedSession}
        anchorEl={menuAnchorEl}
        open={Boolean(selectedSession && menuAnchorEl)}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.progress !== null ? null : 4000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setSnackbar((s) => ({ ...s, open: false }));
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: 320, overflow: 'hidden' }}
        >
          {snackbar.message}
          {snackbar.progress !== null && (
            <LinearProgress
              color={snackbar.severity}
              sx={{ mt: 1, borderRadius: 1 }}
            />
          )}
        </Alert>
      </Snackbar>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
