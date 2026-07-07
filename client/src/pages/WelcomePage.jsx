import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { ROLE_STRINGS } from '@utils/userUtils';
import WelcomeHeader from '@components/welcome/WelcomeHeader';
import ActionCard from '@components/welcome/ActionCard';
import ProgramTermSelector from '@components/workspace/ProgramTermSelector';
import YearTermSelector from '@components/workspace/YearTermSelector';
import OfficialWeeklyScheduleGrid from '@components/workspace/OfficialWeeklyScheduleGrid';
import ClassActionModal from '@components/workspace/ClassActionModal';
import { getScheduleStatus } from '@services/business/attendanceWorkspaceService';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService';
import { prepareWeeklyScheduleData } from '@services/export/official-reports/engine/prepareWeeklyScheduleData';
import { academicTermToYearTerm } from '@utils/academicTermUtils';

const STEPS = { PROGRAM: 'program', TERM: 'term', SCHEDULE: 'schedule' };
const STEP_ORDER = [STEPS.PROGRAM, STEPS.TERM, STEPS.SCHEDULE];
const WIZARD_STORAGE_KEY = 'welcome_wizard_selection';

const ROLE_CARDS = {
  [ROLE_STRINGS.INSTRUCTOR]: [
    {
      iconKey: 'take_attendance',
      title: 'Take Attendance',
      titleAr: 'تسجيل الحضور',
      desc: "Choose your program and open today's schedule",
      descAr: 'اختر برنامجك وافتح جدول اليوم',
      isPrimary: true,
    },
  ],
  [ROLE_STRINGS.ADMIN]: [
    {
      iconKey: 'review_daily',
      title: 'Review Daily Attendance',
      titleAr: 'مراجعة الحضور اليومي',
      desc: 'Review and correct submitted attendance',
      descAr: 'مراجعة وتصحيح الحضور المرسل',
      isPrimary: true,
    },
  ],
  [ROLE_STRINGS.HR]: [
    {
      iconKey: 'audit_attendance',
      title: 'Audit Attendance',
      titleAr: 'تدقيق الحضور',
      desc: 'Review approved attendance records',
      descAr: 'مراجعة سجلات الحضور المعتمدة',
      isPrimary: true,
    },
  ],
  [ROLE_STRINGS.SUPER_ADMIN]: [
    {
      iconKey: 'review_daily',
      title: 'Review Daily Attendance',
      titleAr: 'مراجعة الحضور اليومي',
      desc: 'Review and correct submitted attendance',
      descAr: 'مراجعة وتصحيح الحضور المرسل',
      isPrimary: true,
    },
  ],
};

const WelcomePage = () => {
  const { user, role, isInstructor, isAdmin, isHR, isSuperAdmin, isStudent, dbId } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const wizardStep = searchParams.get('step');

  const [selection, setSelection] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const instructorId = dbId;

  const effectiveRole = useMemo(() => {
    if (isSuperAdmin) return ROLE_STRINGS.SUPER_ADMIN;
    if (isAdmin) return ROLE_STRINGS.ADMIN;
    if (isHR) return ROLE_STRINGS.HR;
    if (isInstructor) return ROLE_STRINGS.INSTRUCTOR;
    if (isStudent) return ROLE_STRINGS.STUDENT;
    return role;
  }, [isSuperAdmin, isAdmin, isHR, isInstructor, isStudent, role]);

  const cards = ROLE_CARDS[effectiveRole] || [];

  useEffect(() => {
    if (isStudent) {
      navigate('/', { replace: true });
    }
  }, [isStudent, navigate]);

  // Restore selection from sessionStorage on mount (refresh persistence)
  useEffect(() => {
    if (wizardStep) {
      try {
        const saved = sessionStorage.getItem(WIZARD_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSelection(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persistSelection = useCallback((next) => {
    setSelection(next);
    try {
      sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const openWizard = useCallback(() => {
    setSearchParams({ step: STEPS.PROGRAM });
  }, [setSearchParams]);

  const closeWizard = useCallback(() => {
    sessionStorage.removeItem(WIZARD_STORAGE_KEY);
    setSelection(null);
    setScheduleData(null);
    setStatusMap({});
    setSearchParams({});
  }, [setSearchParams]);

  const handleProgramSelect = useCallback((payload) => {
    const next = { program: payload.program };
    persistSelection(next);
    setSearchParams({ step: STEPS.TERM, programId: String(payload.program.id) });
  }, [setSearchParams, persistSelection]);

  const handleTermSelect = useCallback((payload) => {
    const next = { program: payload.program, academicTerm: payload.academicTerm };
    persistSelection(next);
    setSearchParams({
      step: STEPS.SCHEDULE,
      programId: String(payload.program.id),
      termId: String(payload.academicTerm.id),
    });
  }, [setSearchParams, persistSelection]);

  const handleBackToProgram = useCallback(() => {
    setSelection((prev) => {
      const next = prev ? { ...prev, academicTerm: null } : prev;
      try { sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setScheduleData(null);
    setStatusMap({});
    setSearchParams({ step: STEPS.PROGRAM });
  }, [setSearchParams]);

  const handleBackToTerm = useCallback(() => {
    setScheduleData(null);
    setStatusMap({});
    setSearchParams({ step: STEPS.TERM, programId: String(selection?.program?.id || '') });
  }, [setSearchParams, selection]);

  const navigateToWizardStep = useCallback((targetStep) => {
    const currentIdx = STEP_ORDER.indexOf(wizardStep);
    const targetIdx = STEP_ORDER.indexOf(targetStep);
    if (targetIdx > currentIdx) return;
    if (targetStep === STEPS.PROGRAM) {
      handleBackToProgram();
    } else if (targetStep === STEPS.TERM && selection?.program) {
      handleBackToTerm();
    }
  }, [wizardStep, selection, handleBackToProgram, handleBackToTerm]);

  const canNavigateToStep = useCallback((stepKey) => {
    const currentIdx = STEP_ORDER.indexOf(wizardStep);
    const targetIdx = STEP_ORDER.indexOf(stepKey);
    if (targetIdx > currentIdx) return false;
    if (stepKey === STEPS.TERM && !selection?.program) return false;
    if (stepKey === STEPS.SCHEDULE && !selection?.academicTerm) return false;
    return true;
  }, [wizardStep, selection]);

  useEffect(() => {
    if (!wizardStep || wizardStep === STEPS.PROGRAM) {
      window.dispatchEvent(new CustomEvent('welcome-wizard-nav', { detail: null }));
      return undefined;
    }
    const programName = selection?.program
      ? (lang === 'ar' && selection.program.nameAr ? selection.program.nameAr : selection.program.nameEn)
      : null;
    const termLabel = selection?.academicTerm
      ? (lang === 'ar' && selection.academicTerm.nameAr ? selection.academicTerm.nameAr : selection.academicTerm.nameEn)
      : null;
    window.dispatchEvent(new CustomEvent('welcome-wizard-nav', {
      detail: { programName, termLabel, step: wizardStep },
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('welcome-wizard-nav', { detail: null }));
    };
  }, [wizardStep, selection, lang]);

  // Load schedule data when step is SCHEDULE
  useEffect(() => {
    if (wizardStep !== STEPS.SCHEDULE || !selection?.program?.id || !selection?.academicTerm?.id) return;

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
  }, [wizardStep, selection?.program, selection?.academicTerm, selectedDate, lang]);

  const handleCellClick = useCallback((slot) => {
    if (!slot?.session) return;
    setSelectedSession(slot.session);
  }, []);

  if (isStudent) return null;

  const pageBg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)';

  const dateInputValue = selectedDate.toISOString().split('T')[0];

  return (
    <div
      className="welcome-page"
      style={{
        minHeight: '100vh',
        background: pageBg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 16px 48px',
        dir: lang === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {!wizardStep && <WelcomeHeader user={user} role={effectiveRole} />}

      {/* Action cards — shown when wizard not open */}
      {!wizardStep && cards.length > 0 && (
        <div
          className="welcome-cards-grid"
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: '420px',
            width: '100%',
          }}
        >
          {cards.map((card) => (
            <ActionCard
              key={card.iconKey}
              card={{ ...card, onClick: openWizard }}
              isPrimary={card.isPrimary}
            />
          ))}
        </div>
      )}

      {/* Wizard section — expands below */}
      {wizardStep && (
        <div
          className="wizard-section"
          style={{
            width: '100%',
            maxWidth: '1100px',
            marginTop: wizardStep ? '0' : '8px',
            animation: 'fadeInDown 0.3s ease',
          }}
        >
          {/* Wizard header bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              padding: '10px 16px',
              borderRadius: '12px',
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { key: STEPS.PROGRAM, label: t('workspace_select_program') },
                { key: STEPS.TERM, label: t('workspace_select_term') },
                { key: STEPS.SCHEDULE, label: t('workspace_take_attendance') },
              ].map((s, i) => {
                const isActive = wizardStep === s.key;
                const isDone = STEP_ORDER.indexOf(wizardStep) > i;
                const clickable = canNavigateToStep(s.key);
                return (
                  <React.Fragment key={s.key}>
                    {i > 0 && (
                      <span style={{ color: isDark ? '#475569' : '#cbd5e1' }}>→</span>
                    )}
                    <button
                      type="button"
                      onClick={() => clickable && navigateToWizardStep(s.key)}
                      disabled={!clickable}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        fontWeight: isActive || isDone ? 700 : 400,
                        color: isActive
                          ? 'var(--color-primary, #3b82f6)'
                          : isDone
                            ? (isDark ? '#4ade80' : '#22c55e')
                            : (isDark ? '#64748b' : '#94a3b8'),
                        cursor: clickable ? 'pointer' : 'default',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                      }}
                    >
                      {s.label}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step content */}
          {wizardStep === STEPS.PROGRAM && (
            <ProgramTermSelector onSelect={handleProgramSelect} />
          )}

          {wizardStep === STEPS.TERM && selection?.program && (
            <YearTermSelector
              program={selection.program}
              onSelect={handleTermSelect}
              onBack={handleBackToProgram}
              showBack={false}
            />
          )}

          {wizardStep === STEPS.SCHEDULE && selection?.program && selection?.academicTerm && (
            <div
              style={{
                background: isDark ? '#0f172a' : '#f8fafc',
                borderRadius: '12px',
                padding: '24px 16px',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                }}
              >
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '64px',
                    color: isDark ? '#94a3b8' : '#64748b',
                  }}
                >
                  {t('loading')}
                </div>
              ) : (
                <OfficialWeeklyScheduleGrid
                  scheduleData={scheduleData}
                  statusMap={statusMap}
                  instructorId={isInstructor ? instructorId : null}
                  selectedDate={selectedDate}
                  onCellClick={handleCellClick}
                />
              )}

              <p
                style={{
                  fontSize: '12px',
                  color: isDark ? '#64748b' : '#94a3b8',
                  marginTop: '16px',
                  textAlign: 'center',
                }}
              >
                {isInstructor ? t('workspace_schedule_hint') : t('workspace_schedule_hint_admin')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer link — only when wizard not open */}
      {!wizardStep && (
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

      {selectedSession && (
        <ClassActionModal
          session={selectedSession}
          status={statusMap[selectedSession.class?.id]}
          selectedDate={selectedDate}
          onClose={() => setSelectedSession(null)}
        />
      )}

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
