import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  forwardRef,
} from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLang } from '@contexts/LangContext';
import {
  FileCheck,
  Paperclip,
  Clock,
} from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import Calendar from '@components/ui/Calendar/Calendar.jsx';
import { Select } from '@ui';
import { fetchAttendanceDeductionSuggestion } from '@services/business/attendanceDeductionService.js';
import { AttendanceCountBar } from '@components/operations-board/BoardScheduleCalendar.jsx';
import {
  ATTENDANCE_STATUS,
  getAttendanceColor,
  getLocalizedAttendanceLabel,
} from '@constants/attendanceTypes.js';

function getStudentDisplayName(student, isAr) {
  if (!student) return '';
  const name = isAr
    ? (student.studentNameAr || student.studentName)
    : (student.studentName || student.studentNameAr);
  const rank = isAr
    ? (student.rankAr || student.rankEn)
    : (student.rankEn || student.rankAr);
  const parts = [rank, name].filter(Boolean);
  return parts.join(' ') || student.studentNumber || '';
}

function isGenericApprovalNote(note) {
  if (!note) return true;
  const s = note.trim().toLowerCase();
  return /^excuse approved(?:\s*via\s*workflow\s*#?\d+)?\.?$/.test(s);
}

function TooltipContent({ event }) {
  const { t, lang } = useLang();
  const row = event.resource;
  if (!row) return null;

  const color = event.color;
  const statusLabel = getLocalizedAttendanceLabel(row.statusCode, lang) || '';
  const deduction = Number(row.deduction || 0).toFixed(2);
  const date = format(
    row.date instanceof Date ? row.date : parseISO(row.date),
    'dd/MM/yyyy'
  );
  const note = row.lastAmendment?.reason;
  const attachmentUrl = row.lastAmendment?.attachmentUrl;
  const attachmentName = row.lastAmendment?.attachmentName;
  const hasNote = note && !isGenericApprovalNote(note);

  let stateText = '';
  let stateColor = color;
  if (event.approved) {
    stateText = t('violations.approved');
    stateColor = '#22c55e';
  } else if (!event.reviewable) {
    stateText = t('violations.final');
    stateColor = color;
  } else {
    stateText = t('violations.pending_review');
    stateColor = '#3b82f6';
  }

  return (
    <Box sx={{ p: 0.5, minWidth: 180, maxWidth: 260 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color }}>
        {date}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color }}>
        {t('violations.status_field')} {statusLabel}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', color }}>
        {t('violations.deduction_field')} {deduction}
      </Typography>
      <Typography
        variant="caption"
        sx={{ display: 'block', fontWeight: 600, color: stateColor, mt: 0.5 }}
      >
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          {event.approved ? (
            <FileCheck size={12} style={{ color: stateColor }} />
          ) : event.reviewable ? (
            <Clock size={12} style={{ color: stateColor }} />
          ) : null}
          {stateText}
        </Box>
      </Typography>
      {hasNote && (
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}
        >
          {t('violations.comment_field')} {note}
        </Typography>
      )}
      {attachmentUrl && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Paperclip size={12} />
            {t('violations.attachment_field')} {attachmentName || (t('violations.attachment'))}
          </Box>
        </Typography>
      )}
      {row.recordedBy && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
          {t('violations.recorded_by_field')} {row.recordedBy}
        </Typography>
      )}
    </Box>
  );
}

const CalendarEvent = forwardRef(function CalendarEvent({ event, title }, ref) {
  const { lang, t } = useLang();
  const isAr = lang === 'ar';
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const bg = isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)';
  const color = event.color;

  const statusIcon = event.approved ? (
    <FileCheck size={10} style={{ flexShrink: 0 }} key="approved" aria-label={t('violations.approved')} />
  ) : event.reviewable ? (
    <Clock size={10} style={{ flexShrink: 0 }} key="pending" aria-label={t('violations.pending_review')} />
  ) : null;

  const titleBox = (
    <Box
      component="span"
      key="title"
      sx={{
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}
    >
      {title}
    </Box>
  );

  return (
    <Tooltip
      ref={ref}
      title={<TooltipContent event={event} isAr={isAr} />}
      arrow
      placement="top"
      enterDelay={200}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: bg,
            color,
            fontWeight: 600,
            fontSize: '11px',
            border: `1px solid ${color}44`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            maxWidth: 280,
          },
        },
        arrow: {
          sx: {
            color: bg,
            '&::before': {
              border: `1px solid ${color}44`,
            },
          },
        },
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          width: '100%',
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: 1.2,
          cursor: 'pointer',
        }}
      >
        {isAr ? [statusIcon, titleBox] : [titleBox, statusIcon]}
      </Box>
    </Tooltip>
  );
});

function buildEvents(rows) {
  if (!rows) return [];
  return rows
    .filter((row) => row.statusCode !== ATTENDANCE_STATUS.LATE && row.statusCode !== ATTENDANCE_STATUS.STANDUP_LATE)
    .map((row) => {
      const statusCode = row.statusCode;
      const baseColor = getAttendanceColor(statusCode) || '#6b7280';
      const approved = Boolean(row.excusedViaWorkflow) || Number(row.deduction) === 0.25;
      const color = approved ? '#22c55e' : baseColor;
      const deductionText = Number(row.deduction || 0).toFixed(2);
      // Parse only the calendar-day portion so a UTC time component cannot
      // shift the event into the previous/next local day.
      let eventDate;
      if (row.date instanceof Date) {
        eventDate = startOfDay(row.date);
      } else {
        const m = String(row.date).match(/^(\d{4})-(\d{2})-(\d{2})/);
        eventDate = m
          ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
          : startOfDay(parseISO(row.date));
      }
      const eventEnd = endOfDay(eventDate);
      return {
        id: row.attendanceId,
        title: deductionText,
        start: eventDate,
        end: eventEnd,
        allDay: true,
        resource: row,
        statusCode,
        reviewable: true,
        approved,
        deduction: row.deduction,
        color,
      };
    });
}

function getEventStyle(event) {
  return {
    className: `rbc-event--${event.statusCode}`,
    style: {
      backgroundColor: event.color,
      borderColor: event.color,
      color: '#ffffff',
      borderRadius: '4px',
      fontSize: '11px',
      padding: '1px 4px',
      opacity: 0.95,
    },
  };
}

function CalendarToolbar({ label, view, date }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const displayLabel = useMemo(() => {
    if (view !== 'week' || !date) return label;
    const anchor = date instanceof Date ? date : new Date(date);
    const weekStart = new Date(anchor);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const jan1 = new Date(weekStart.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((weekStart - jan1) / 86400000) + 1;
    const weekNum = Math.ceil(dayOfYear / 7);
    if (isAr) {
      return `${fmt(weekStart)} - ${fmt(weekEnd)} أسبوع ${weekNum}`;
    }
    return `W${weekNum} ${fmt(weekStart)} - ${fmt(weekEnd)}`;
  }, [view, date, label, isAr]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: '4px 2px',
        gap: 1.5,
        flexWrap: 'wrap',
        borderBottom: `1px solid ${isDark ? 'rgba(51,65,85,0.5)' : '#e2e8f0'}`,
        mb: 1,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: '#3b82f6',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {displayLabel}
      </Typography>
    </Box>
  );
}

export default function ViolationStudentCalendar({
  student,
  students,
  classId,
  onStudentChange,
  isDark,
  dateFrom,
  dateTo,
  selectedDate = new Date(),
  violationsViewMode = 'week',
}) {
  const { lang, t } = useLang();
  const isAr = lang === 'ar';
  const [selectedStudent, setSelectedStudent] = useState(student || null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const anchorDate = useMemo(() => {
    if (selectedDate) return selectedDate;
    return dateFrom ? new Date(dateFrom) : new Date();
  }, [selectedDate, dateFrom]);

  useEffect(() => {
    setSelectedStudent(student || null);
  }, [student]);

  useEffect(() => {
    if (!selectedStudent?.studentId || !classId) return;

    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAttendanceDeductionSuggestion({
          userId: selectedStudent.studentId,
          classId,
          ...(dateFrom ? { dateFrom } : {}),
          ...(dateTo ? { dateTo } : {}),
        });
        const payload = res?.data || res?.payload || res;
        const built = buildEvents(payload?.rows || []);
        if (mounted) {
          setEvents(built);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || (t('violations.failed_to_load_attendance_records')));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [selectedStudent, classId, isAr, t, dateFrom, dateTo]);

  const studentOptions = useMemo(() => {
    if (!students) return [];
    return [...students].sort((a, b) => {
      const nameA = getStudentDisplayName(a, isAr);
      const nameB = getStudentDisplayName(b, isAr);
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [students, isAr]);

  const studentSelectOptions = useMemo(() => {
    return studentOptions.map((s) => {
      const displayName = getStudentDisplayName(s, isAr);
      const initial = displayName.charAt(0).toUpperCase();
      const avatarUrl = s.profileImageUrl
        ? `${s.profileImageUrl}${s.avatarUpdatedAt ? `?t=${s.avatarUpdatedAt}` : ''}`
        : null;
      return {
        value: String(s.studentId),
        displayLabel: displayName,
        searchText: `${displayName} ${s.studentNumber || ''} ${s.studentName || ''} ${s.studentNameAr || ''} ${s.rankEn || ''} ${s.rankAr || ''}`,
        label: displayName,
        subtext: s.studentNumber || '',
        icon: (
          <Avatar
            src={avatarUrl || undefined}
            alt={displayName}
            sx={{
              width: 24,
              height: 24,
              fontSize: 10,
              bgcolor: 'primary.main',
            }}
          >
            {initial}
          </Avatar>
        ),
      };
    });
  }, [studentOptions, isAr]);

  const handleChangeStudent = useCallback((e) => {
    const newValue = e?.target?.value || e?.value || '';
    if (!newValue) {
      setSelectedStudent(null);
      if (onStudentChange) onStudentChange(null);
      return;
    }
    const found = studentOptions.find(
      (s) => String(s.studentId) === String(newValue)
    );
    if (found) {
      setSelectedStudent(found);
      if (onStudentChange) onStudentChange(found);
    }
  }, [onStudentChange, studentOptions]);

  const summary = useMemo(() => {
    if (!selectedStudent) return null;
    const approvedCount = events.filter((e) => e.approved).length;
    const pendingCount = events.filter((e) => e.reviewable && !e.approved).length;
    const totalDeduction = events.reduce((sum, e) => sum + Number(e.deduction || 0), 0).toFixed(2);
    return { approvedCount, pendingCount, totalDeduction };
  }, [events, selectedStudent]);

  const attendanceBarStatus = useMemo(() => {
    if (!selectedStudent) return null;
    return {
      hasAttendance: true,
      counts: {
        present: 0,
        absent: selectedStudent.unexcusedAbsences || 0,
        excused: selectedStudent.excusedAbsences || 0,
        humanCase: selectedStudent.humanCaseCount || 0,
        notTaken: 0,
      },
    };
  }, [selectedStudent]);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        gap: 2,
        p: 1,
      }}
    >
      {/* Header with student selector and summary */}
      <Card
        className="p-4 border-0 shadow-sm"
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        {students && students.length > 1 ? (
          <Box data-testid="violation-student-select" sx={{ minWidth: { xs: '100%', sm: 260 } }}>
            <Select
              value={selectedStudent?.studentId || ''}
              onChange={handleChangeStudent}
              options={studentSelectOptions}
              placeholder={t('violations.select_student')}
              searchable
              fullWidth
              size="small"
            />
          </Box>
        ) : selectedStudent ? (
          <Typography variant="subtitle1" className="font-semibold">
            {getStudentDisplayName(selectedStudent, isAr)}
            <Typography component="span" variant="caption" className="text-muted-foreground ml-2">
              {selectedStudent.studentNumber}
            </Typography>
          </Typography>
        ) : null}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            flex: 1,
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          }}
        >
          {summary && (
            <>
              <Chip
                size="small"
                icon={<FileCheck size={14} style={{ color: '#22c55e' }} />}
                label={`${t('violations.approved')} ${summary.approvedCount}`}
                sx={{
                  backgroundColor: '#22c55e15',
                  color: '#22c55e',
                  fontWeight: 600,
                  border: '1px solid #22c55e30',
                }}
              />
              <Chip
                size="small"
                icon={<Clock size={14} style={{ color: '#3b82f6' }} />}
                label={`${t('violations.pending')} ${summary.pendingCount}`}
                sx={{
                  backgroundColor: '#3b82f615',
                  color: '#3b82f6',
                  fontWeight: 600,
                  border: '1px solid #3b82f630',
                }}
              />
              <Chip
                size="small"
                label={`${t('violations.deduction')} ${summary.totalDeduction}`}
                sx={{
                  backgroundColor: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.15)',
                  color: isDark ? '#94a3b8' : '#475569',
                  fontWeight: 600,
                }}
              />
            </>
          )}
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            borderRadius: 1,
            backgroundColor: isDark ? 'rgba(15,23,42,0.4)' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(51,65,85,0.5)' : '#e2e8f0'}`,
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            '& .rbc-time-view': { display: 'flex', flexDirection: 'column', height: '100%' },
            '& .rbc-time-view .rbc-time-header': { flex: 1 },
            '& .rbc-time-view .rbc-time-content': { display: 'none' },
            '& .rbc-time-view .rbc-time-gutter, & .rbc-time-view .rbc-time-column': { display: 'none' },
            '& .rbc-time-view .rbc-time-header-gutter': { display: 'none' },
          }}
        >
          {attendanceBarStatus && (
            <Box sx={{ mb: 1, px: 0.5 }}>
              <AttendanceCountBar status={attendanceBarStatus} t={t} height={6} style={{ borderRadius: '4px' }} />
            </Box>
          )}
          <Calendar
            key={`violations-calendar-${violationsViewMode}-${anchorDate.toISOString().slice(0, 10)}`}
            events={events}
            defaultView={violationsViewMode}
            views={['day', 'week']}
            defaultDate={anchorDate}
            eventStyleGetter={getEventStyle}
            components={{ toolbar: CalendarToolbar, event: CalendarEvent }}
            style={{ height: '100%' }}
            popup
          />
        </Box>
      )}

    </Box>
  );
}
