import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, Button, SimpleLoading } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getAuthToken } from '@utils/authHelpers';
import { getThemedIcon } from '@constants/iconTypes';
import { getClassOptionLabel, getProgramOptionLabel, getSubjectOptionLabel } from '@utils/academicSelectOptions';
import { getAcademicTermOptions, getAcademicTermLabel } from '@constants/academicTerms';
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

function labelFor(item, lang, fallback = '—') {
  if (!item) return fallback;
  return lang === 'ar'
    ? item.nameAr || item.nameEn || item.code || fallback
    : item.nameEn || item.nameAr || item.code || fallback;
}

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

  const btnStyle = {
    fontSize: '0.72rem',
    padding: '4px 8px',
    minHeight: 'unset',
  };

  return (
    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        <Button
          variant="outline"
          size="sm"
          style={btnStyle}
          disabled={!!exporting}
          onClick={() => runExport('weekly', () => exportWeeklyScheduleForScope({ cls, program, subject, lang, t, user }))}
        >
          {exporting === 'weekly' ? t('exporting') : t('weekly_schedule')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          style={btnStyle}
          disabled={!!exporting}
          onClick={() => runExport('template', () => exportDailyOfficialTemplate({ cls, program, subject, lang, user }))}
        >
          {exporting === 'template' ? t('exporting') : t('daily_official_template')}
        </Button>
        {canDailyWithDate && (
          <>
            <DatePicker
              value={dailyDate}
              onChange={setDailyDate}
              theme={theme}
              style={{ width: 130, fontSize: '0.75rem' }}
            />
            <Button
              variant="primary"
              size="sm"
              style={btnStyle}
              disabled={!!exporting || !dailyDate}
              onClick={() => runExport('daily', () => exportDailyOfficialForDate({
                cls, program, subject, lang, user, date: dailyDate,
              }))}
            >
              {exporting === 'daily' ? t('exporting') : t('daily_official')}
            </Button>
          </>
        )}
        {canAttendanceOfficial && (
          <Button
            variant="outline"
            size="sm"
            style={btnStyle}
            onClick={() => onAttendanceOfficial({ cls, program, subject })}
          >
            {t('attendance_official')}
          </Button>
        )}
      </div>
      {error && <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>{error}</div>}
    </div>
  );
}

export default function MyDataScopeDrawer({ isOpen, onClose }) {
  const { user, isSuperAdmin, isAdmin, isInstructor, isHR } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
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

  const availableYears = useMemo(() => {
    const years = new Set((details?.classes || []).map((c) => c.year).filter(Boolean));
    return [...years].sort((a, b) => String(b).localeCompare(String(a)));
  }, [details]);

  const termOptions = getAcademicTermOptions(lang);

  const filteredClasses = useMemo(() => {
    let items = details?.classes || [];
    if (ownershipFilter === 'mine') {
      items = items.filter((c) => c.isInstructor);
    } else if (ownershipFilter === 'others') {
      items = items.filter((c) => !c.isInstructor);
    }
    if (yearFilter) items = items.filter((c) => String(c.year) === String(yearFilter));
    if (termFilter) {
      items = items.filter((c) => String(c.term || '').toLowerCase() === termFilter.toLowerCase());
    }
    const q = searchText.trim().toLowerCase();
    if (q) {
      items = items.filter((c) => {
        const classLabel = getClassOptionLabel(c, lang).toLowerCase();
        const subj = labelFor(c.subject || subjectMap.get(Number(c.subjectId)), lang).toLowerCase();
        const prog = labelFor(programMap.get(Number(c.programId)), lang).toLowerCase();
        return (
          classLabel.includes(q)
          || subj.includes(q)
          || prog.includes(q)
          || (c.code || '').toLowerCase().includes(q)
        );
      });
    }
    return items;
  }, [details, ownershipFilter, yearFilter, termFilter, searchText, lang, programMap, subjectMap]);

  const filteredSubjects = useMemo(() => {
    let items = details?.subjects || [];
    if (yearFilter || termFilter) {
      const classSubjectIds = new Set(
        filteredClasses.map((c) => Number(c.subjectId)).filter(Boolean),
      );
      if (yearFilter || termFilter) {
        items = items.filter((s) => classSubjectIds.has(Number(s.id)));
      }
    }
    const q = searchText.trim().toLowerCase();
    if (q) {
      items = items.filter((s) => {
        const label = `${s.code} ${labelFor(s, lang)}`.toLowerCase();
        const prog = labelFor(programMap.get(Number(s.programId)), lang).toLowerCase();
        return label.includes(q) || prog.includes(q);
      });
    }
    return items;
  }, [details, filteredClasses, yearFilter, termFilter, searchText, lang, programMap]);

  const groupedClasses = useMemo(() => {
    const groups = new Map();
    filteredClasses.forEach((cls) => {
      const programId = Number(cls.programId);
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
      labelFor(a.program, lang).localeCompare(labelFor(b.program, lang), lang === 'ar' ? 'ar' : 'en'),
    );
  }, [filteredClasses, programMap, lang]);

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

  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';
  const panelBg = theme === 'dark' ? '#111827' : '#f9fafb';
  const inputBg = theme === 'dark' ? '#1f2937' : '#fff';

  const selectStyle = {
    padding: '6px 10px',
    borderRadius: 6,
    border: `1px solid ${border}`,
    background: inputBg,
    fontSize: '0.8rem',
    color: theme === 'dark' ? '#f3f4f6' : '#111827',
  };

  const instructorBadge = (isMine) => (
    <span
      style={{
        marginInlineStart: 6,
        padding: '1px 6px',
        borderRadius: 999,
        fontSize: '0.68rem',
        fontWeight: 600,
        background: isMine ? '#dcfce7' : '#f3f4f6',
        color: isMine ? '#166534' : muted,
        border: `1px solid ${isMine ? '#86efac' : border}`,
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
          {!loading && details && (
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
                  value={ownershipFilter}
                  onChange={(e) => setOwnershipFilter(e.target.value)}
                  style={{ ...selectStyle, flex: 1, minWidth: 120 }}
                >
                  <option value="all">{t('my_access_filter_all_classes')}</option>
                  <option value="mine">{t('my_access_filter_my_classes')}</option>
                  <option value="others">{t('my_access_filter_other_classes')}</option>
                </select>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  style={{ ...selectStyle, flex: 1, minWidth: 90 }}
                >
                  <option value="">{t('all_years')}</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={termFilter}
                  onChange={(e) => setTermFilter(e.target.value)}
                  style={{ ...selectStyle, flex: 1, minWidth: 110 }}
                >
                  <option value="">{t('all_terms')}</option>
                  {termOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {loading && <SimpleLoading message={t('loading')} />}

          {!loading && error && (
            <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</div>
          )}

          {!loading && !error && details && (
            <>
              {details.unlimited && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 8, border: `1px solid ${border}`, background: panelBg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getThemedIcon('ui', 'shield', 18, 'success')}
                    <span style={{ fontWeight: 500 }}>{t('my_access_unlimited')}</span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: muted }}>{t('my_access_unlimited_hint')}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'programs', count: details.programs?.length || 0, label: t('programs') },
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
                      background: theme === 'dark' ? '#1f2937' : '#fff',
                      border: `1px solid ${border}`,
                    }}
                  >
                    {chip.count} {chip.label}
                  </span>
                ))}
              </div>

              {filteredClasses.length === 0 && filteredSubjects.length === 0 && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 8, border: `1px dashed ${border}`, color: muted, fontSize: '0.875rem' }}>
                  {details.programs?.length === 0 && details.classes?.length === 0
                    ? t('my_access_empty')
                    : t('my_access_no_filter_results')}
                </div>
              )}

              {groupedClasses.map((group) => (
                <div key={group.program?.id || 'unknown'} style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '0.6rem 0.85rem', background: panelBg, fontWeight: 600, fontSize: '0.9rem' }}>
                    {getProgramOptionLabel(group.program, lang) || t('unknown_program')}
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
                            {t('my_access_open_workspace')}
                          </div>
                          {subject && (
                            <div style={{ color: muted, fontSize: '0.78rem', marginTop: 2 }}>
                              {t('subject')}: {getSubjectOptionLabel(subject, lang)}
                            </div>
                          )}
                          {(cls.year || cls.term) && (
                            <div style={{ color: muted, fontSize: '0.78rem', marginTop: 2 }}>
                              {cls.year}{cls.term ? ` / ${getAcademicTermLabel(cls.term, lang)}` : ''}
                            </div>
                          )}
                          {cls.instructor && !cls.isInstructor && (
                            <div style={{ color: muted, fontSize: '0.78rem', marginTop: 2 }}>
                              {t('instructor')}: {lang === 'ar'
                                ? cls.instructor.displayNameAr || cls.instructor.displayName
                                : cls.instructor.displayName}
                            </div>
                          )}
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

              {filteredSubjects.length > 0 && (
                <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '0.6rem 0.85rem', background: panelBg, fontWeight: 600, fontSize: '0.9rem' }}>
                    {t('subjects')}
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: '0.25rem 0' }}>
                    {filteredSubjects.map((sub) => (
                      <li key={sub.id} style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
                        <span>{sub.code} — {getSubjectOptionLabel(sub, lang)}</span>
                        {instructorBadge(!!sub.isInstructor)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p style={{ margin: 0, fontSize: '0.78rem', color: muted }}>{t('my_data_access_hint')}</p>
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
      />
    </>
  );
}
