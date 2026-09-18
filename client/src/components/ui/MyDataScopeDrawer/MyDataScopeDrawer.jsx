import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Download, FileText, ClipboardList } from 'lucide-react';
import { Drawer, Button, SimpleLoading } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { getAuthToken } from '@utils/authHelpers';
import { getThemedIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { resolveUserRole } from '@utils/userUtils.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { getClassOptionLabel, getProgramOptionLabel, getSubjectOptionLabel } from '@utils/academicSelectOptions';
import { getAcademicTermLabel } from '@constants/academicTerms';
import { getLocalizedName } from '@utils/languageHelpers';
import useDrawerTheme from '@hooks/useDrawerTheme';
import { UI_THEMES } from '@constants/uiTheme';
import DatePicker from '@components/ui/DatePicker/DatePicker';
import AttendanceViolationsModal from '@components/qr-scanner/AttendanceViolationsModal';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import {
  exportWeeklyScheduleForScope,
  exportDailyOfficialTemplate,
  exportDailyOfficialForDate,
  exportAttendanceOfficialForScope,
} from '@services/business/accessScopeExportService.js';
import { formatQatarDateOnly, getQatarNow } from '@utils/qatarDate.js';

function ClassExportActions({
  cls,
  program,
  subject,
  lang,
  t,
  user,
  theme,
  canDailyWithDate,
  canAttendanceOfficial,
  onAttendanceOfficial,
  border,
  muted,
}) {
  const [exporting, setExporting] = useState(null);
  const [dailyDate, setDailyDate] = useState(formatQatarDateOnly(getQatarNow()));
  const [error, setError] = useState('');

  const runExport = async (key, fn) => {
    setExporting(key);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message || t('export_failed'));
    } finally {
      setExporting(null);
    }
  };

  const iconBtnStyle = {
    fontSize: '0.72rem',
    padding: '4px 6px',
    minHeight: 'unset',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  };

  return (
    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {error && <div style={{ fontSize: '0.72rem', color: UI_THEMES[theme]?.colors.error[600] || '#dc2626' }}>{error}</div>}
    </div>
  );
}

export default function MyDataScopeDrawer({ isOpen, onClose }) {
  const { user, isSuperAdmin, isAdmin, isInstructor, isHR } = useAuth();
  const { t, lang } = useLang();
  const { isDarkMode, borderColor, textColor, mutedColor, cardBg, bgColor } = useDrawerTheme();
  const theme = isDarkMode ? 'dark' : 'light';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('all');

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceContext, setAttendanceContext] = useState(null);
  const [selectedSubjectsForViolations, setSelectedSubjectsForViolations] = useState([]);
  const [selectedViolationTypes, setSelectedViolationTypes] = useState({
    absentNoExcuse: true,
    absentWithExcuse: true,
    excusedLeave: true,
    late: true,
    humanCase: true,
  });
  const [violationsDateFrom, setViolationsDateFrom] = useState('');
  const [violationsDateTo, setViolationsDateTo] = useState('');
  const [violationsExportFormat, setViolationsExportFormat] = useState(EXPORT_FORMAT.PDF);
  const [attendanceExporting, setAttendanceExporting] = useState(false);
  const [attendanceExportSuccess, setAttendanceExportSuccess] = useState(null);

  const canDailyWithDate = isInstructor || isAdmin || isSuperAdmin;
  const canAttendanceOfficial = isHR || isSuperAdmin;

  const loadDetails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const base = import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1';
      const res = await fetch(`${base}/me/data-scope?details=1`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const json = await res.json();
      console.log('[MyDataScopeDrawer] API response:', { status: res.status, success: json.success, data: json.data });
      console.log('[MyDataScopeDrawer] details.unlimited:', json.data?.unlimited, '| details.unrestricted:', json.data?.unrestricted, '| source:', json.data?.source);
      console.log('[MyDataScopeDrawer] programs:', json.data?.programs?.length, '| subjects:', json.data?.subjects?.length, '| classes:', json.data?.classes?.length);
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load access scope');
      }
      setDetails(json.data || null);
    } catch (err) {
      setError(err.message || t('error_loading_data'));
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (isOpen) loadDetails();
  }, [isOpen, loadDetails]);

  const programMap = useMemo(
    () => new Map((details?.programs || []).map((p) => [Number(p.id), p])),
    [details],
  );
  const subjectMap = useMemo(
    () => new Map((details?.subjects || []).map((s) => [Number(s.id), s])),
    [details],
  );


  const filteredClasses = useMemo(() => {
    let items = details?.classes || [];
    if (ownershipFilter === 'mine') {
      items = items.filter((c) => c.isInstructor);
    } else if (ownershipFilter === 'others') {
      items = items.filter((c) => !c.isInstructor);
    }
    if (programFilter) {
      items = items.filter((c) => Number(c.programId || c.program?.id) === Number(programFilter));
    }
    if (subjectFilter) {
      items = items.filter((c) => Number(c.subjectId || c.subject?.id) === Number(subjectFilter));
    }
    const q = searchText.trim().toLowerCase();
    if (q) {
      items = items.filter((c) => {
        const classLabel = getClassOptionLabel(c, lang).toLowerCase();
        const subj = getLocalizedName(c.subject || subjectMap.get(Number(c.subjectId)), lang).toLowerCase();
        const program = programMap.get(Number(c.programId)) || c.program || null;
        const prog = getLocalizedName(program, lang).toLowerCase();
        return (
          classLabel.includes(q)
          || subj.includes(q)
          || prog.includes(q)
          || (c.code || '').toLowerCase().includes(q)
        );
      });
    }
    return items;
  }, [details, ownershipFilter, programFilter, subjectFilter, searchText, lang, programMap, subjectMap]);

  const filteredSubjects = useMemo(() => {
    let items = details?.subjects || [];
    if (programFilter) {
      items = items.filter((s) => Number(s.programId || s.program?.id) === Number(programFilter));
    }
    if (subjectFilter) {
      items = items.filter((s) => Number(s.id) === Number(subjectFilter));
    }
    const q = searchText.trim().toLowerCase();
    if (q) {
      items = items.filter((s) => {
        const label = `${s.code} ${getLocalizedName(s, lang)}`.toLowerCase();
        const program = programMap.get(Number(s.programId)) || s.program || null;
        const prog = getLocalizedName(program, lang).toLowerCase();
        return label.includes(q) || prog.includes(q);
      });
    }
    return items;
  }, [details, programFilter, subjectFilter, searchText, lang, programMap]);

  const groupedClasses = useMemo(() => {
    const groups = new Map();
    filteredClasses.forEach((cls) => {
      const programId = Number(cls.programId || cls.program?.id);
      const key = programId || 0;
      if (!groups.has(key)) {
        groups.set(key, {
          program: programMap.get(programId) || cls.program || null,
          classes: [],
        });
      }
      groups.get(key).classes.push(cls);
    });
    return [...groups.values()].sort((a, b) =>
      getLocalizedName(a.program, lang).localeCompare(getLocalizedName(b.program, lang), lang === 'ar' ? 'ar' : 'en'),
    );
  }, [filteredClasses, programMap, lang]);

  const filteredPrograms = useMemo(() => {
    let items = details?.programs || [];
    if (programFilter) {
      items = items.filter((p) => Number(p.id) === Number(programFilter));
    }
    const q = searchText.trim().toLowerCase();
    if (q) {
      items = items.filter((p) => {
        const label = getProgramOptionLabel(p, lang).toLowerCase();
        const code = (p.code || '').toLowerCase();
        return label.includes(q) || code.includes(q);
      });
    }
    return items;
  }, [details?.programs, programFilter, searchText, lang]);

  const programOptions = useMemo(() => {
    const items = details?.programs || [];
    return [...items].sort((a, b) =>
      getProgramOptionLabel(a, lang).localeCompare(getProgramOptionLabel(b, lang), lang === 'ar' ? 'ar' : 'en'),
    );
  }, [details, lang]);

  const subjectOptions = useMemo(() => {
    let items = details?.subjects || [];
    if (programFilter) {
      items = items.filter((s) => Number(s.programId || s.program?.id) === Number(programFilter));
    }
    return [...items].sort((a, b) =>
      getSubjectOptionLabel(a, lang).localeCompare(getSubjectOptionLabel(b, lang), lang === 'ar' ? 'ar' : 'en'),
    );
  }, [details, programFilter, lang]);

  const openAttendanceOfficial = useCallback(({ cls, program, subject }) => {
    const subjectId = cls.subjectId || subject?.id;
    setAttendanceContext({ cls, program, subject });
    setSelectedSubjectsForViolations(subjectId ? [subjectId] : []);
    const today = formatQatarDateOnly(getQatarNow());
    setViolationsDateFrom(today);
    setViolationsDateTo(today);
    setAttendanceExportSuccess(null);
    setShowAttendanceModal(true);
  }, []);

  const handleAttendanceExport = useCallback(async (subjectsToExport, violationTypes, options = {}) => {
    if (!attendanceContext) return;
    setAttendanceExporting(true);
    try {
      const program = attendanceContext.program;
      const programName = program
        ? (lang === 'ar' ? program.nameAr || program.nameEn : program.nameEn || program.nameAr)
        : '';
      const result = await exportAttendanceOfficialForScope({
        subjectIds: subjectsToExport,
        violationTypes,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        programId: program?.id || attendanceContext.cls?.programId,
        programName,
        lang,
        user,
        format: options.format || EXPORT_FORMAT.PDF,
        preview: options.preview,
      });
      setAttendanceExportSuccess(result);
    } catch (err) {
      setError(err.message || t('export_failed'));
    } finally {
      setAttendanceExporting(false);
    }
  }, [attendanceContext, lang, user, t]);

  const goToAttendanceWorkspace = useCallback((cls) => {
    if (!cls?.programId) return;
    const params = new URLSearchParams({ programId: String(cls.programId) });
    if (cls.academicTermId) {
      params.set('academicTermId', String(cls.academicTermId));
    } else if (cls.year && cls.term) {
      params.set('year', String(cls.year));
      params.set('term', String(cls.term));
    }
    onClose();
    navigate(`/attendance-workspace?${params}`);
  }, [navigate, onClose]);

  const muted = mutedColor;
  const border = borderColor;
  const panelBg = cardBg;
  const palette = UI_THEMES[theme].colors;
  const successColors = palette.success;
  const grayColors = palette.gray;
  const errorColor = palette.error[600];

  const selectStyle = {
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${border}`,
    background: bgColor,
    fontSize: '0.8rem',
    color: textColor,
  };

  const instructorBadge = (isMine) => (
    <span
      style={{
        marginInlineStart: 6,
        padding: '1px 6px',
        borderRadius: 999,
        fontSize: '0.68rem',
        fontWeight: 600,
        background: isMine ? successColors[100] : grayColors[100],
        color: isMine ? successColors[800] : muted,
        border: `1px solid ${isMine ? successColors[300] : border}`,
      }}
    >
      {isMine ? t('my_access_instructor') : t('my_access_not_instructor')}
    </span>
  );

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        position="right"
        size="md"
        title={t('my_data_access')}
        resizable
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
          {!loading && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {user.profileImageUrl || user.avatar ? (
                  <img
                    src={user.profileImageUrl || user.avatar}
                    alt={getLocalizedUserName(user, lang, '')}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      background: 'linear-gradient(135deg, rgb(212, 175, 55), rgb(255, 215, 0))',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'rgb(46, 59, 78)',
                      background: 'linear-gradient(135deg, rgb(212, 175, 55), rgb(255, 215, 0))',
                    }}
                  >
                    {(getLocalizedUserName(user, lang, '') || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                {(() => {
                  const role = resolveUserRole(user);
                  const roleIcon = role ? getUserRoleIcon(role) : null;
                  const roleColor = role ? getUserRoleColor(role) : null;
                  return roleIcon && (
                    <div
                      aria-label={role}
                      style={{
                        position: 'absolute',
                        right: -8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)',
                        color: '#fff',
                        boxShadow: `0 0 0 1px ${roleColor}`,
                      }}
                    >
                      {React.cloneElement(roleIcon, { size: 12, color: '#fff', fill: roleColor })}
                    </div>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: textColor }}>
                  {getLocalizedUserName(user, lang, '')}
                </span>
                <span style={{ fontSize: '0.75rem', color: mutedColor }}>
                  {t('signed_in_as')}
                </span>
              </div>
            </div>
          )}

          {!loading && details && !(details.unlimited && (details.programs?.length || 0) === 0 && (details.subjects?.length || 0) === 0 && (details.classes?.length || 0) === 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={t('my_access_search_placeholder')}
                style={{ ...selectStyle, width: '100%' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  value={programFilter}
                  onChange={(e) => { setProgramFilter(e.target.value); setSubjectFilter(''); }}
                  style={{ ...selectStyle, flex: 1, minWidth: 120 }}
                >
                  <option value="">{t('all_programs')}</option>
                  {programOptions.map((p) => (
                    <option key={p.id} value={p.id}>{getProgramOptionLabel(p, lang)}</option>
                  ))}
                </select>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  style={{ ...selectStyle, flex: 1, minWidth: 120 }}
                >
                  <option value="">{t('all_subjects')}</option>
                  {subjectOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `${s.code} — ` : ''}{getSubjectOptionLabel(s, lang)}
                    </option>
                  ))}
                </select>
                <select
                  value={ownershipFilter}
                  onChange={(e) => setOwnershipFilter(e.target.value)}
                  style={{ ...selectStyle, flex: 1, minWidth: 120 }}
                >
                  <option value="all">{t('my_access_filter_all_classes')}</option>
                  <option value="mine">{t('my_access_filter_my_classes')}</option>
                  <option value="others">{t('my_access_filter_other_classes')}</option>
                </select>
              </div>
            </div>
          )}

          {loading && <SimpleLoading message={t('loading')} />}

          {!loading && error && (
            <div style={{ color: errorColor, fontSize: '0.875rem' }}>{error}</div>
          )}

          {!loading && !error && details && (
            <>
              {details.unlimited && (() => {
                const totalPrograms = details.programs?.length || 0;
                const totalSubjects = details.subjects?.length || 0;
                const totalClasses = details.classes?.length || 0;
                const hasNoFilters = !searchText.trim() && !programFilter && !subjectFilter && ownershipFilter === 'all';
                const noDataAtAll = totalPrograms === 0 && totalSubjects === 0 && totalClasses === 0;

                if (noDataAtAll && hasNoFilters) {
                  return (
                    <div style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 10,
                      border: `1px solid ${isDarkMode ? '#166534' : '#16a34a'}`,
                      background: isDarkMode ? 'rgba(22, 101, 52, 0.12)' : 'rgba(34, 197, 94, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getThemedIcon('ui', 'shield', 20, 'success')}
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isDarkMode ? '#4ade80' : '#15803d' }}>
                          {t('my_access_unlimited')}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: isDarkMode ? '#86efac' : '#16a34a' }}>
                        {t('my_access_unlimited_hint')}
                      </p>
                    </div>
                  );
                }

                return null;
              })()}

              {(!details.unlimited || (details.unlimited && !(() => {
                const totalPrograms = details.programs?.length || 0;
                const totalSubjects = details.subjects?.length || 0;
                const totalClasses = details.classes?.length || 0;
                const hasNoFilters = !searchText.trim() && !programFilter && !subjectFilter && ownershipFilter === 'all';
                return totalPrograms === 0 && totalSubjects === 0 && totalClasses === 0 && hasNoFilters;
              })())) && (
                <>
              {details.unlimited && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 8,
                  border: `1px solid ${isDarkMode ? '#166534' : '#16a34a'}`,
                  background: isDarkMode ? 'rgba(22, 101, 52, 0.12)' : 'rgba(34, 197, 94, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getThemedIcon('ui', 'shield', 18, 'success')}
                    <span style={{ fontWeight: 600, color: isDarkMode ? '#4ade80' : '#15803d' }}>{t('my_access_unlimited')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: isDarkMode ? '#86efac' : '#16a34a' }}>{t('my_access_unlimited_hint')}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'programs', count: filteredPrograms.length, label: t('programs') },
                  { key: 'subjects', count: filteredSubjects.length, label: t('subjects') },
                  { key: 'classes', count: filteredClasses.length, label: t('classes') },
                ].map((chip) => (
                  <span
                    key={chip.key}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: isDarkMode ? grayColors[100] : bgColor,
                      border: `1px solid ${border}`,
                    }}
                  >
                    {chip.count} {chip.label}
                  </span>
                ))}
              </div>

              {(() => {
                const hasNoFilters = !searchText.trim() && !programFilter && !subjectFilter && ownershipFilter === 'all';
                const totalPrograms = details.programs?.length || 0;
                const totalSubjects = details.subjects?.length || 0;
                const totalClasses = details.classes?.length || 0;
                const noDataAtAll = totalPrograms === 0 && totalSubjects === 0 && totalClasses === 0;
                const noClassesButHasPrograms = totalClasses === 0 && totalPrograms > 0 && hasNoFilters;

                if (noDataAtAll && hasNoFilters) {
                  return (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: 8, border: `1px dashed ${border}`, color: muted, fontSize: '0.875rem' }}>
                      {details.unrestricted
                        ? t('my_access_no_data_unrestricted')
                        : t('my_access_empty')}
                    </div>
                  );
                }

                if (noClassesButHasPrograms && filteredSubjects.length === 0) {
                  return (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: 8, border: `1px dashed ${border}`, color: muted, fontSize: '0.875rem' }}>
                      {t('my_access_no_classes_yet')}
                    </div>
                  );
                }

                if (filteredClasses.length === 0 && filteredSubjects.length === 0 && !hasNoFilters && filteredPrograms.length === 0) {
                  return (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: 8, border: `1px dashed ${border}`, color: muted, fontSize: '0.875rem' }}>
                      {t('my_access_no_filter_results')}
                    </div>
                  );
                }

                return null;
              })()}

              {groupedClasses.map((group) => (
                <div key={group.program?.id || 'unknown'} style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '0.6rem 0.85rem', background: panelBg, fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getProgramOptionLabel(group.program, lang) || t('unknown_program')}
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: 999,
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      background: isDarkMode ? grayColors[100] : bgColor,
                      color: muted,
                      border: `1px solid ${border}`,
                    }}>
                      {group.classes.length}
                    </span>
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {group.classes.map((cls) => {
                      const subject = cls.subject || subjectMap.get(Number(cls.subjectId));
                      return (
                        <li
                          key={cls.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => goToAttendanceWorkspace(cls)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              goToAttendanceWorkspace(cls);
                            }
                          }}
                          style={{
                            padding: '0.6rem 0.85rem',
                            borderTop: `1px solid ${border}`,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            {getClassOptionLabel(cls, lang)}
                            {instructorBadge(!!cls.isInstructor)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: muted, marginTop: 4 }}>
                            {[
                              getProgramOptionLabel(group.program, lang) || t('unknown_program'),
                              subject ? getSubjectOptionLabel(subject, lang) : null,
                              cls.year || cls.term
                                ? `${cls.year || ''}${cls.term ? ` / ${getAcademicTermLabel(cls.term, lang)}` : ''}`
                                : null,
                              cls.instructor && !cls.isInstructor
                                ? `${t('instructor')}: ${lang === 'ar'
                                  ? cls.instructor.displayNameAr || cls.instructor.displayName
                                  : cls.instructor.displayName}`
                                : null,
                            ].filter(Boolean).join(' · ')}
                          </div>
                          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <ClassExportActions
                              cls={cls}
                              program={group.program}
                              subject={subject}
                              lang={lang}
                              t={t}
                              user={user}
                              theme={theme}
                              canDailyWithDate={canDailyWithDate}
                              canAttendanceOfficial={canAttendanceOfficial}
                              onAttendanceOfficial={openAttendanceOfficial}
                              border={border}
                              muted={muted}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {(() => {
                const programIdsWithClasses = new Set(
                  groupedClasses.map((g) => Number(g.program?.id)).filter(Boolean)
                );
                const programsWithoutClasses = (details.programs || []).filter(
                  (p) => !programIdsWithClasses.has(Number(p.id))
                );
                const filteredProgramsWithoutClasses = programsWithoutClasses.filter((p) => {
                  if (programFilter && Number(p.id) !== Number(programFilter)) return false;
                  const q = searchText.trim().toLowerCase();
                  if (q) {
                    const label = getProgramOptionLabel(p, lang).toLowerCase();
                    const code = (p.code || '').toLowerCase();
                    if (!label.includes(q) && !code.includes(q)) return false;
                  }
                  return true;
                });
                if (filteredProgramsWithoutClasses.length === 0) return null;
                return (
                  <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '0.6rem 0.85rem', background: panelBg, fontWeight: 600, fontSize: '0.9rem' }}>
                      {t('programs_without_classes')}
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {filteredProgramsWithoutClasses.map((p) => (
                        <li key={p.id} style={{
                          padding: '0.6rem 0.85rem',
                          borderTop: `1px solid ${border}`,
                          fontSize: '0.85rem',
                        }}>
                          <div style={{ fontWeight: 500 }}>
                            {getProgramOptionLabel(p, lang)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: muted, marginTop: 4 }}>
                            {t('my_access_no_classes_in_program')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {filteredSubjects.length > 0 && (
                <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '0.6rem 0.85rem', background: panelBg, fontWeight: 600, fontSize: '0.9rem' }}>
                    {t('subjects')}
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: '0.25rem 0' }}>
                    {filteredSubjects.map((sub) => {
                      const program = programMap.get(Number(sub.programId || sub.program?.id)) || sub.program || null;
                      return (
                        <li key={sub.id} style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
                          <span>{sub.code} — {getSubjectOptionLabel(sub, lang)}</span>
                          {instructorBadge(!!sub.isInstructor)}
                          {program && (
                            <div style={{ fontSize: '0.72rem', color: muted, marginTop: 2 }}>
                              {getProgramOptionLabel(program, lang)}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <p style={{ margin: 0, fontSize: '0.78rem', color: muted }}>{t('my_data_access_hint')}</p>
                </>
              )}
            </>
          )}
        </div>
      </Drawer>

      <AttendanceViolationsModal
        isOpen={showAttendanceModal}
        onClose={() => {
          if (attendanceExportSuccess?.blobUrl) {
            URL.revokeObjectURL(attendanceExportSuccess.blobUrl);
          }
          setAttendanceExportSuccess(null);
          setShowAttendanceModal(false);
          setAttendanceContext(null);
        }}
        subjects={details?.subjects || []}
        selectedSubjects={selectedSubjectsForViolations}
        setSelectedSubjects={setSelectedSubjectsForViolations}
        selectedViolationTypes={selectedViolationTypes}
        setSelectedViolationTypes={setSelectedViolationTypes}
        dateFrom={violationsDateFrom}
        setDateFrom={setViolationsDateFrom}
        dateTo={violationsDateTo}
        setDateTo={setViolationsDateTo}
        exportFormat={violationsExportFormat}
        setExportFormat={setViolationsExportFormat}
        mode="official"
        onExport={handleAttendanceExport}
        isExporting={attendanceExporting}
        t={t}
        lang={lang}
        theme={theme}
        successResult={attendanceExportSuccess}
        allowPreviewUnapproved={canAttendanceOfficial || isAdmin}
        cls={attendanceContext?.cls}
      />
    </>
  );
}
