import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Eye,
  AlertTriangle,
  AlertCircle,
  X,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  Heart,
  Clock,
  FileX2,
  FileText,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowDownAZ,
  User,
  UserX,
  CircleX,
  Bell,
  CalendarDays,
  CalendarRange,
  Calendar,
  Users,
  Maximize2,
  Minimize2,
  Download,
  Hash,
  Sigma,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/kibo/ui/table';
import { Input } from '@/components/kibo/ui/input';
import BoardStudentAvatar from '@components/operations-board/BoardStudentAvatar.jsx';
import GridQuickFilterChips, { CHIP_VARIANTS } from '@components/ui/GridQuickFilterChips';
import { Select } from '@components/ui';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { useToast } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import ViolationReviewDialog from './ViolationReviewDialog';
import ViolationStudentCalendar from './ViolationStudentCalendar';
import ViolationsViewToggle from './ViolationsViewToggle';
import {
  fetchClassViolationData,
  loadProgramClasses,
  previewWarningLetter,
} from '@services/business/violationViewService.js';
import { getWarningWorkflowHistory } from '@services/business/workflowSnapshotService.js';
import { format, parseISO } from 'date-fns';
import { formatForDateInput } from '@utils/date-formatter.js';
import { openDriveFileInCollabora } from '@utils/collaboraUtils.js';
import { getWeekRange } from '@services/business/workflowSnapshotService.js';
import { exportClassSummaryReport, exportProgramSummaryReport } from '@services/business/studentSummaryReportService.js';
import { startExportLoading } from '@services/export/official-reports/index.jsx';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
const ROW_STATUS_VARIANTS = {
  dismissed: 'red',
  final: 'red',
  first: 'amber',
  has_workflow: 'purple',
  compliant: 'green',
};

function getRowStatusVariant(s, hasPendingWf) {
  if (s.warningType === 'dismissed' || s.warningType === 'final') return 'dismissed';
  if (s.warningType === 'first') return 'first';
  if (hasPendingWf) return 'has_workflow';
  return 'compliant';
}

const SORT_KEYS = {
  NAME: 'name',
  ABSENCES: 'absences',
  DEDUCTION: 'deduction',
  DEDUCTION_APPROVED: 'deductionApproved',
  DEDUCTION_NOT_APPROVED: 'deductionNotApproved',
  WARNING: 'warning',
};

const SORT_STORAGE_KEY = 'violations_tab_sort';
const AVATAR_STORAGE_KEY = 'violations_tab_show_avatars';
const HIGHLIGHT_STORAGE_KEY = 'violations_tab_highlight_enabled';
const ROW_ORDER_STORAGE_KEY = 'violations_tab_row_order';
const TOUR_STORAGE_KEY = 'violationsTourSeen';
const WELCOME_TOUR_STORAGE_KEY = 'welcomeTourSeen';
const VIEW_MODE_STORAGE_KEY = 'violations_tab_view_mode';
const CALENDAR_STUDENT_STORAGE_KEY = 'violations_tab_calendar_student_id';

function loadStoredSort() {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {}
  return null;
}

function saveStoredSort(sortBy, sortKey, sortDir) {
  try { localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ sortBy, sortKey, sortDir })); } catch {}
}

function loadStoredRowOrder(classId) {
  try {
    if (!classId) return [];
    const raw = localStorage.getItem(ROW_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    return Array.isArray(parsed[classId]) ? parsed[classId] : [];
  } catch {}
  return [];
}

function saveStoredRowOrder(classId, order) {
  try {
    if (!classId) return;
    const raw = localStorage.getItem(ROW_ORDER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[classId] = order;
    localStorage.setItem(ROW_ORDER_STORAGE_KEY, JSON.stringify(parsed));
  } catch {}
}

function getSortValue(student, key) {
  switch (key) {
    case SORT_KEYS.NAME:
      return (student.studentName || student.studentNameAr || '').toLowerCase();
    case SORT_KEYS.ABSENCES:
      return student.totalAbsences || 0;
    case SORT_KEYS.DEDUCTION:
      return student.deductionTotal || 0;
    case SORT_KEYS.DEDUCTION_APPROVED:
      return student.deductionApproved || 0;
    case SORT_KEYS.DEDUCTION_NOT_APPROVED:
      return student.deductionNotApproved || 0;
    case SORT_KEYS.WARNING:
      return student.warningType === 'final' ? 2 : student.warningType === 'first' ? 1 : 0;
    default:
      return '';
  }
}

const WORKFLOW_STATUS_CONFIG = {
  APPROVED: { labelKey: 'violations.approved', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', icon: FileCheck },
  PENDING_HR: { labelKey: 'violations.pending_hr', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', icon: Clock },
  SUBMITTED: { labelKey: 'violations.submitted', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: '#3b82f6', icon: Clock },
  REJECTED: { labelKey: 'violations.rejected', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', icon: FileX2 },
  DRAFT: { labelKey: 'violations.draft', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)', border: '#6b7280', icon: Clock },
};

const SEMANTIC_COLORS = {
  red: { dot: { light: '#ef4444', dark: '#f87171' }, text: { light: '#b91c1c', dark: '#fca5a5' } },
  amber: { dot: { light: '#f59e0b', dark: '#fbbf24' }, text: { light: '#b45309', dark: '#fed7aa' } },
  green: { dot: { light: '#22c55e', dark: '#4ade80' }, text: { light: '#15803d', dark: '#bbf7d0' } },
  blue: { dot: { light: '#3b82f6', dark: '#60a5fa' }, text: { light: '#1d4ed8', dark: '#bfdbfe' } },
  pink: { dot: { light: '#ec4899', dark: '#f472b6' }, text: { light: '#be185d', dark: '#fbcfe8' } },
  purple: { dot: { light: '#7c3aed', dark: '#a78bfa' }, text: { light: '#5b21b6', dark: '#ddd6fe' } },
  muted: { dot: { light: '#94a3b8', dark: '#9ca3af' }, text: { light: '#64748b', dark: '#d1d5db' } },
};

function getColor(key, isDark) {
  const c = SEMANTIC_COLORS[key] || SEMANTIC_COLORS.muted;
  return { dot: isDark ? c.dot.dark : c.dot.light, text: isDark ? c.text.dark : c.text.light };
}

const BREAKDOWN_ITEMS = [
  {
    key: 'unexcused',
    studentKey: 'unexcusedAbsences',
    labelKey: 'violations.unexcused',
    noteKey: 'violations.unexcused_note',
    color: '#ef4444',
    icon: CircleX,
  },
  { key: 'excused', studentKey: 'excusedAbsences', labelKey: 'violations.excused', color: '#ec4899', icon: FileCheck },
  { key: 'human', studentKey: 'humanCaseCount', labelKey: 'violations.human', color: '#8b5cf6', icon: Heart },
];

function getBreakdownItems(s, t) {
  return BREAKDOWN_ITEMS.map((item) => ({
    ...item,
    count: s[item.studentKey] || 0,
    label: t(item.labelKey),
    note: item.noteKey ? t(item.noteKey) : null,
    unit: 'count',
  }));
}

const TOTAL_BAR_ITEMS = [
  { key: 'absences', studentKey: 'totalAbsences', labelKey: 'violations.absences', icon: CircleX },
  { key: 'approved', studentKey: 'deductionApproved', labelKey: 'violations.deduction_approved', icon: FileCheck },
  { key: 'notApproved', studentKey: 'deductionNotApproved', labelKey: 'violations.deduction_not_approved', icon: FileX2 },
];

function getClassTotalBarItems(s, t, classTotalColor, classApprovedColor, classNotApprovedColor, canViewDeduction) {
  const items = [
    {
      ...TOTAL_BAR_ITEMS[0],
      count: s.classTotalAbsences || 0,
      value: s.classTotalAbsences || 0,
      display: s.classTotalAbsences || 0,
      label: t(TOTAL_BAR_ITEMS[0].labelKey),
      color: classTotalColor.dot,
      unit: 'count',
      // Counts and deduction weights are different units — when the deduction
      // split is shown, keep absences in the tooltip but out of the bar so the
      // bar encodes one consistent quantity (approved vs not-approved share).
      skipBar: canViewDeduction,
    },
  ];
  if (canViewDeduction) {
    const approved = Number(s.classDeductionApproved || 0);
    const notApproved = Number(s.classDeductionNotApproved || 0);
    // Bar proportions should reflect how many absences are approved vs not —
    // deduction weights (0.25 vs 0.5) would skew the visual share.
    const classAbsences = Array.isArray(s.classAbsences) ? s.classAbsences : [];
    const approvedCount = classAbsences.filter((a) => a.excusedViaWorkflow).length;
    const notApprovedCount = Math.max(0, classAbsences.length - approvedCount);
    items.push(
      {
        ...TOTAL_BAR_ITEMS[1],
        count: approved,
        value: approved,
        display: approved.toFixed(2),
        barValue: approvedCount,
        unit: 'marks',
        label: t(TOTAL_BAR_ITEMS[1].labelKey),
        color: classApprovedColor.dot,
      },
      {
        ...TOTAL_BAR_ITEMS[2],
        count: notApproved,
        value: notApproved,
        display: notApproved.toFixed(2),
        barValue: notApprovedCount,
        unit: 'marks',
        label: t(TOTAL_BAR_ITEMS[2].labelKey),
        color: classNotApprovedColor.dot,
      },
    );
  }
  return items;
}

function getBreakdownTooltipTitle(item, isDark) {
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const noteColor = isDark ? '#94a3b8' : '#64748b';
  if (!item.note) {
    return (
      <div style={{ color: textColor }}>
        <strong style={{ color: item.color }}>{item.count}</strong>
        {' '}
        <span style={{ color: item.color }}>{item.label}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 220, color: textColor }}>
      <span>
        <strong style={{ color: item.color }}>{item.count}</strong>
        {' '}
        <span style={{ color: item.color }}>{item.label}</span>
      </span>
      <span style={{ opacity: 0.85, fontSize: '0.95em', whiteSpace: 'pre-line', color: noteColor }}>
        {item.note}
      </span>
    </div>
  );
}

function BreakdownBar({ items, isDark, isAr, title, showTotal = true, totalDeduction = null }) {
  const { t } = useLang();
  // Items flagged skipBar stay in the tooltip but don't get a bar segment.
  const barItems = items.filter((i) => !i.skipBar);
  const segValue = (i) => i.barValue ?? i.value ?? i.count;
  const total = barItems.reduce((sum, i) => sum + segValue(i), 0);
  const activeItem = barItems.find((i) => segValue(i) > 0);
  const tooltipTextColor = isDark ? '#f1f5f9' : '#0f172a';
  const zeroColor = getColor('muted', isDark);
  const countLabel = t('violations.unit_count') || 'count';
  const marksLabel = t('violations.unit_marks') || 'marks';

  const summaryTooltip = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0', color: tooltipTextColor }}>
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
        {title || t('violations.absence_breakdown')}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const value = item.value ?? item.count;
        const display = item.display ?? item.count;
        const isActive = value > 0;
        const lineColor = item.color;
        const UnitIcon = item.unit === 'marks' ? Sigma : item.unit === 'count' ? Hash : null;
        const unitLabel = item.unit === 'marks' ? marksLabel : item.unit === 'count' ? countLabel : null;
        return (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <Icon size={13} style={{ color: item.color }} />
            {UnitIcon && (
              <ColoredTooltip title={unitLabel} color={item.color} placement="top">
                <UnitIcon size={10} style={{ color: item.color, opacity: 0.7, flexShrink: 0 }} />
              </ColoredTooltip>
            )}
            <span style={{ fontWeight: 600, minWidth: 16, color: item.color }}>{display}</span>
            <span style={{ opacity: isActive ? 1 : 0.75, color: lineColor }}>{item.label}</span>
            {item.unit === 'marks' && item.barValue != null && (
              <span style={{ opacity: 0.7, color: item.color, fontSize: '0.9em', whiteSpace: 'nowrap' }}>
                ×{item.barValue} {countLabel}
              </span>
            )}
          </div>
        );
      })}
      {showTotal && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 2, paddingTop: 4, fontWeight: 700, fontSize: 12 }}>
          {t('violations.total')}: {total}
        </div>
      )}
      {totalDeduction != null && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 2, paddingTop: 4, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sigma size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
          {t('violations.total_deduction') || 'Total deduction'}: {Number(totalDeduction).toFixed(2)} {marksLabel}
        </div>
      )}
      {items.some((i) => i.note) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85em', opacity: 0.9, marginTop: 2 }}>
          {items.filter((i) => i.note).map((item) => (
            <div key={`note-${item.key}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <item.icon size={12} style={{ color: item.color, flexShrink: 0, marginTop: 2 }} />
              <span style={{ maxWidth: 220, lineHeight: 1.35, color: zeroColor.text }}>{item.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (total === 0) {
    return (
      <ColoredTooltip
        title={summaryTooltip}
        color={tooltipTextColor}
        borderColor={zeroColor.dot}
        placement="top"
        arrow
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: 4,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: getColor('muted', isDark).dot,
            marginTop: 4,
            marginBottom: 5,
            cursor: 'default',
          }}
        />
      </ColoredTooltip>
    );
  }
  return (
    <ColoredTooltip
      title={summaryTooltip}
      color={tooltipTextColor}
      borderColor={activeItem?.color || zeroColor.dot}
      placement="top"
      arrow
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 4,
          borderRadius: 2,
          overflow: 'hidden',
          marginTop: 4,
          marginBottom: 5,
          cursor: 'default',
        }}
      >
        {barItems.map((item) => (
          <div
            key={item.key}
            style={{
              flex: `${segValue(item)} 0 0`,
              minWidth: segValue(item) > 0 ? 2 : 0,
              backgroundColor: item.color,
              height: '100%',
            }}
          />
        ))}
      </div>
    </ColoredTooltip>
  );
}

/**
 * Header tooltip that explains the stacked period/class-total rows in a column.
 * `lines` = [{ icon: ReactNode, text: string }]
 */
function HeaderScopeTooltip({ lines, children }) {
  return (
    <ColoredTooltip
      title={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '2px 0', minWidth: 200 }}>
          {lines.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, lineHeight: 1.4 }}>
              <span style={{ display: 'inline-flex', flexShrink: 0 }}>{line.icon}</span>
              <span>{line.text}</span>
            </div>
          ))}
        </div>
      )}
      color="#334155"
      placement="bottom"
      arrow
    >
      {children}
    </ColoredTooltip>
  );
}

export default function WelcomeViolationsTab({
  welcomeContext,
  isDark,
  scheduleFontScale = 100,
  selectedDate = new Date(),
  violationsViewMode = 'day',
  expanded = false,
  onToggleExpand,
  onScheduleFontScaleChange,
  onExportSuccess,
}) {
  const { lang, t } = useLang();
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();

  const canViewDeduction = useMemo(() => isAdmin || isHR || isSuperAdmin, [isAdmin, isHR, isSuperAdmin]);
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(welcomeContext?.classId || '');
  const [students, setStudents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilterId, setActiveFilterId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfPreviewingId, setPdfPreviewingId] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStudent, setReviewStudent] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      return stored === 'calendar' ? 'calendar' : 'table';
    } catch { return 'table'; }
  });
  const [calendarStudent, setCalendarStudent] = useState(null);
  const initialCalendarStudentIdRef = useRef(null);
  try {
    const storedId = localStorage.getItem(CALENDAR_STUDENT_STORAGE_KEY);
    if (storedId) initialCalendarStudentIdRef.current = storedId;
  } catch {}

  // Row order (drag & drop) for System Default sort
  const rowOrderKey = useMemo(() => String(selectedClassId) || null, [selectedClassId]);
  const [rowOrder, setRowOrder] = useState([]);
  const [dragOverStudentId, setDragOverStudentId] = useState(null);
  const [draggingRowId, setDraggingRowId] = useState(null);
  const dragRowRef = useRef(null);
  const rowDraggingRef = useRef(false);

  // Joyride tour state
  const [runJoyride, setRunJoyride] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = useMemo(() => `${TOUR_STORAGE_KEY}_${lang}`, [lang]);
  const welcomeTourSeenKey = useMemo(() => `${WELCOME_TOUR_STORAGE_KEY}_${lang}`, [lang]);

  // Sort state with persistence
  const storedSort = useMemo(() => loadStoredSort(), []);
  const [sortBy, setSortBy] = useState(storedSort?.sortBy || 'alpha'); // 'alpha' or 'system'
  const [sortKey, setSortKey] = useState(storedSort?.sortKey || SORT_KEYS.NAME);
  const [sortDir, setSortDir] = useState(storedSort?.sortDir || 'asc');

  // Avatar and absence-highlight toggles with persistence
  const [showAvatars, setShowAvatars] = useState(() => {
    try { return localStorage.getItem(AVATAR_STORAGE_KEY) !== 'false'; } catch { return true; }
  });
  const [highlightEnabled, setHighlightEnabled] = useState(() => {
    try { return localStorage.getItem(HIGHLIGHT_STORAGE_KEY) !== 'false'; } catch { return true; }
  });

  const handleToggleShowAvatars = useCallback(() => {
    setShowAvatars((v) => {
      const next = !v;
      try { localStorage.setItem(AVATAR_STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleToggleHighlight = useCallback(() => {
    setHighlightEnabled((v) => {
      const next = !v;
      try { localStorage.setItem(HIGHLIGHT_STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // Persist sort changes
  useEffect(() => {
    saveStoredSort(sortBy, sortKey, sortDir);
  }, [sortBy, sortKey, sortDir]);

  // Persist avatar and highlight toggles
  useEffect(() => {
    try { localStorage.setItem(AVATAR_STORAGE_KEY, String(showAvatars)); } catch {}
  }, [showAvatars]);

  useEffect(() => {
    try { localStorage.setItem(HIGHLIGHT_STORAGE_KEY, String(highlightEnabled)); } catch {}
  }, [highlightEnabled]);

  // Persist violations view mode and selected calendar student
  useEffect(() => {
    try { localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode); } catch {}
  }, [viewMode]);

  useEffect(() => {
    try {
      if (calendarStudent?.studentId) {
        localStorage.setItem(CALENDAR_STUDENT_STORAGE_KEY, String(calendarStudent.studentId));
      } else {
        localStorage.removeItem(CALENDAR_STUDENT_STORAGE_KEY);
      }
    } catch {}
  }, [calendarStudent]);

  // When sortBy changes to 'alpha', force name sort; 'system' clears sort
  useEffect(() => {
    if (sortBy === 'alpha') {
      setSortKey(SORT_KEYS.NAME);
      setSortDir('asc');
    } else if (sortBy === 'system') {
      setSortKey(null);
      setSortDir('asc');
    }
  }, [sortBy]);

  const handleSort = useCallback((key) => {
    // Switch to column sort mode
    setSortBy('alpha');
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const makeStep = useCallback((target, titleKey, bodyKey, placement = 'bottom') => ({
    target,
    content: (
      <div>
        <strong style={{ fontSize: '1.05em' }}>{t(titleKey)}</strong>
        <div style={{ marginTop: 6, fontSize: '0.88em', lineHeight: 1.45, opacity: 0.92 }}>
          {t(bodyKey)}
        </div>
      </div>
    ),
    disableBeacon: true,
    placement,
  }), [t]);

  const buildTourSteps = useCallback(() => {
    const steps = [
      makeStep('[data-tour="violations-filter-bar"]', 'tour.violations.filter_bar.title', 'tour.violations.filter_bar.body', 'bottom'),
      makeStep('[data-tour="violations-col-student"]', 'tour.violations.student_col.title', 'tour.violations.student_col.body', 'bottom'),
      makeStep('[data-tour="violations-col-total-absences"]', 'tour.violations.absences_col.title', 'tour.violations.absences_col.body', 'bottom'),
      makeStep('[data-tour="violations-col-breakdown"]', 'tour.violations.breakdown_col.title', 'tour.violations.breakdown_col.body', 'bottom'),
      makeStep('[data-tour="violations-col-deduction-approved"]', 'tour.violations.deduction_col.title', 'tour.violations.deduction_col.body', 'bottom'),
      makeStep('[data-tour="violations-col-warning"]', 'tour.violations.status_col.title', 'tour.violations.status_col.body', 'bottom'),
      makeStep('[data-tour="violations-col-recorded"]', 'tour.violations.warnings_col.title', 'tour.violations.warnings_col.body', 'bottom'),
      makeStep('[data-tour="violations-col-actions"]', 'tour.violations.actions_col.title', 'tour.violations.actions_col.body', 'bottom'),
      makeStep('[data-tour="violations-legend"]', 'tour.violations.legend.title', 'tour.violations.legend.body', 'top'),
    ].filter(s => !!document.querySelector(s.target));
    return steps;
  }, [makeStep]);

  const hasAutoStarted = useRef(false);

  const startTour = useCallback(() => {
    const steps = buildTourSteps();
    if (!steps.length) return;
    setTourSteps(steps);
    setRunJoyride(true);
  }, [buildTourSteps]);

  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunJoyride(false);
      window.__joyrideActive = false;
      try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
    } else if (status === 'running') {
      window.__joyrideActive = true;
    }
  }, [tourSeenKey]);

  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);

  // Sync selectedClassId whenever the context classId changes (e.g. picking a
  // class from the schedule updates the URL classId param)
  useEffect(() => {
    if (welcomeContext?.classId && String(welcomeContext.classId) !== String(selectedClassId)) {
      setSelectedClassId(welcomeContext.classId);
    }
  }, [welcomeContext?.classId, selectedClassId]);

  useEffect(() => {
    if (rowOrderKey) {
      setRowOrder(loadStoredRowOrder(rowOrderKey));
    }
  }, [rowOrderKey]);

  // Load program classes
  useEffect(() => {
    if (!welcomeContext?.programId) return;
    let cancelled = false;
    loadProgramClasses(welcomeContext.programId, { termId: welcomeContext.termId })
      .then((list) => {
        if (cancelled) return;
        setClasses(list || []);
        if (!selectedClassId && list?.length > 0) {
          const defaultId = welcomeContext?.classId && list.some((c) => String(c.id) === String(welcomeContext.classId))
            ? welcomeContext.classId
            : list[0].id;
          setSelectedClassId(defaultId);
        }
      })
      .catch((err) => console.error('[WelcomeViolationsTab] failed to load classes', err));
    return () => { cancelled = true; };
  }, [welcomeContext?.programId, welcomeContext?.termId, welcomeContext?.classId, selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((c) => String(c.id) === String(selectedClassId)) || null,
    [classes, selectedClassId]
  );

  const weekDateRange = useMemo(() => {
    if (!selectedDate) return { dateFrom: null, dateTo: null };
    if (violationsViewMode === 'week') {
      const { weekFrom, weekTo } = getWeekRange(selectedDate);
      return { dateFrom: weekFrom, dateTo: weekTo };
    }
    const iso = formatForDateInput(selectedDate);
    return { dateFrom: iso, dateTo: iso };
  }, [selectedDate, violationsViewMode]);

  // Fetch violation data and existing workflows
  const loadData = useCallback(async () => {
    if (!selectedClassId) {
      setStudents([]);
      setWorkflows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [violationsRes, workflowsRes] = await Promise.all([
        fetchClassViolationData({ classId: selectedClassId, ...weekDateRange }),
        getWarningWorkflowHistory({
          classId: selectedClassId,
          programId: welcomeContext?.programId,
        }),
      ]);

      if (violationsRes?.data) {
        setStudents(violationsRes.data);
      }
      if (workflowsRes?.data) {
        setWorkflows(workflowsRes.data);
      }
    } catch (err) {
      console.error('[WelcomeViolationsTab] error loading data:', err);
      setError(err.message || 'Failed to load violation data');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, welcomeContext?.programId, weekDateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const wasLoadingRef = useRef(false);

  // Auto-start the violations tour once the user has seen the main welcome tour
  // and the data has finished loading (so the tour targets exist in the DOM).
  useEffect(() => {
    if (loading) {
      wasLoadingRef.current = true;
      return;
    }
    if (!wasLoadingRef.current || hasAutoStarted.current || window.__joyrideActive) return;
    try {
      if (localStorage.getItem(tourSeenKey)) return;
      if (!localStorage.getItem(welcomeTourSeenKey)) return;
    } catch {}
    hasAutoStarted.current = true;
    const timer = setTimeout(() => startTour(), 500);
    return () => clearTimeout(timer);
  }, [loading, tourSeenKey, welcomeTourSeenKey, startTour]);

  // Map student workflows by targetStudentId
  const workflowsByStudentId = useMemo(() => {
    const map = new Map();
    (workflows || []).forEach((wf) => {
      const studentId = wf.targetStudentId || wf.metadata?.targetStudentId;
      if (studentId) {
        const key = String(studentId);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(wf);
      }
    });
    return map;
  }, [workflows]);

  // Metadata for PDF export
  const metadata = useMemo(() => {
    if (!selectedClass) return null;
    return {
      classId: selectedClass.id,
      className: isAr ? (selectedClass.nameAr || selectedClass.nameEn) : (selectedClass.nameEn || selectedClass.nameAr),
      classNameAr: selectedClass.nameAr || selectedClass.nameEn,
      classCode: selectedClass.code,
      programName: isAr ? (selectedClass.program?.nameAr || selectedClass.program?.nameEn) : (selectedClass.program?.nameEn || selectedClass.program?.nameAr),
      programNameAr: selectedClass.program?.nameAr || selectedClass.program?.nameEn,
      subjectName: isAr ? (selectedClass.subject?.nameAr || selectedClass.subject?.nameEn) : (selectedClass.subject?.nameEn || selectedClass.subject?.nameAr),
      subjectNameAr: selectedClass.subject?.nameAr || selectedClass.subject?.nameEn,
      term: welcomeContext?.term,
      date: new Date().toISOString().slice(0, 10),
    };
  }, [selectedClass, isAr, welcomeContext]);

  // Quick filter counts
  const filterCounts = useMemo(() => {
    const total = students.length;
    let first = 0;
    let final = 0;
    let dismissed = 0;
    let hasWorkflow = 0;
    let compliant = 0;

    students.forEach((s) => {
      const studentWfs = workflowsByStudentId.get(String(s.studentId)) || [];
      if (studentWfs.length > 0) hasWorkflow += 1;
      if (s.warningType === 'dismissed') dismissed += 1;
      else if (s.warningType === 'final') final += 1;
      else if (s.warningType === 'first') first += 1;
      else compliant += 1;
    });

    return { total, first, final, dismissed, hasWorkflow, compliant };
  }, [students, workflowsByStudentId]);

  // Filter chips (shortened to 2-3 words)
  const filterChips = useMemo(() => [
    {
      id: 'all',
      label: t('violations.all'),
      count: filterCounts.total,
      variant: 'slate',
      tooltip: t('violations.filter_all_tooltip') || 'All students in the class — shows everyone.',
    },
    {
      id: 'dismissed',
      label: t('violations.disconnected'),
      count: filterCounts.dismissed,
      variant: 'red',
      icon: <UserX size={13} />,
      tooltip: t('violations.filter_disconnected_tooltip') || 'Students whose violation case was dismissed or disconnected.',
    },
    {
      id: 'final',
      label: t('violations.final'),
      count: filterCounts.final,
      variant: 'red',
      icon: <AlertCircle size={13} />,
      tooltip: t('violations.filter_final_tooltip') || 'Students who received a final warning — the second-level warning after a first warning.',
    },
    {
      id: 'first',
      label: t('violations.first'),
      count: filterCounts.first,
      variant: 'amber',
      icon: <AlertTriangle size={13} />,
      tooltip: t('violations.filter_first_tooltip') || 'Students who received a first warning for absences or violations.',
    },
    {
      id: 'has_workflow',
      label: t('violations.in_review'),
      count: filterCounts.hasWorkflow,
      variant: 'purple',
      icon: <FileCheck size={13} />,
      tooltip: t('violations.filter_in_review_tooltip') || 'Students with a pending workflow document, e.g. a warning letter awaiting admin or HR review.',
    },
    {
      id: 'compliant',
      label: t('violations.compliant'),
      count: filterCounts.compliant,
      variant: 'green',
      icon: <CheckCircle2 size={13} />,
      tooltip: t('violations.filter_compliant_tooltip') || 'Students with no warning at all — clean record.',
    },
  ], [t, filterCounts]);

  const filteredStudents = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return students.filter((s) => {
      const studentWfs = workflowsByStudentId.get(String(s.studentId)) || [];
      const matchesSearch = !q
        || (s.studentName || '').toLowerCase().includes(q)
        || (s.studentNameAr || '').toLowerCase().includes(q)
        || (s.studentNumber || '').toLowerCase().includes(q);

      let matchesFilter = true;
      if (activeFilterId === 'dismissed') matchesFilter = s.warningType === 'dismissed';
      else if (activeFilterId === 'final') matchesFilter = s.warningType === 'final';
      else if (activeFilterId === 'first') matchesFilter = s.warningType === 'first';
      else if (activeFilterId === 'has_workflow') matchesFilter = studentWfs.length > 0;
      else if (activeFilterId === 'compliant') matchesFilter = !s.warningType;

      return matchesSearch && matchesFilter;
    });
  }, [students, searchQuery, activeFilterId, workflowsByStudentId]);

  const sortedStudents = useMemo(() => {
    if (sortBy === 'system' && rowOrder.length > 0) {
      const orderMap = new Map(rowOrder.map((id, i) => [String(id), i]));
      return [...filteredStudents].sort((a, b) => {
        const aIdx = orderMap.has(String(a.studentId)) ? orderMap.get(String(a.studentId)) : Number.MAX_SAFE_INTEGER;
        const bIdx = orderMap.has(String(b.studentId)) ? orderMap.get(String(b.studentId)) : Number.MAX_SAFE_INTEGER;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return 0;
      });
    }
    if (sortBy === 'system' || !sortKey) return filteredStudents;
    return [...filteredStudents].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredStudents, sortKey, sortDir, sortBy, rowOrder]);

  const classOptions = useMemo(() => {
    return classes.map((c) => {
      const className = isAr ? (c.nameAr || c.nameEn) : (c.nameEn || c.nameAr);
      return { value: String(c.id), label: className };
    });
  }, [classes, isAr]);

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown size={12} className="inline-block opacity-40 ml-1" />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="inline-block ml-1" />
      : <ArrowDown size={12} className="inline-block ml-1" />;
  };

  const handleOpenReview = useCallback((student) => {
    setReviewStudent(student);
    setReviewOpen(true);
  }, []);

  const handlePreviewPdf = useCallback(async (student) => {
    if (!student?.warningType || !metadata) return;
    setPdfPreviewingId(student.studentId);
    const stopLoading = startExportLoading(t('violations.generating_warning_letter') || 'Generating warning letter...');
    try {
      const url = await previewWarningLetter(student, student.warningType, lang, metadata);
      window.open(url, '_blank');
    } catch (err) {
      toast.error(t('violations.preview_warning_failed', { msg: err.message || 'Failed to preview warning letter' }));
    } finally {
      stopLoading();
      setPdfPreviewingId(null);
    }
  }, [metadata, lang, t]);

  const handleCloseReview = useCallback(() => {
    setReviewOpen(false);
    setReviewStudent(null);
  }, []);

  const handleOpenCalendar = useCallback((student) => {
    setCalendarStudent(student);
    setViewMode('calendar');
  }, []);

  const handleSwitchToTable = useCallback(() => setViewMode('table'), []);

  const handleSwitchToCalendar = useCallback(() => {
    setViewMode('calendar');
    const nextFiltered = filteredStudents;
    if (nextFiltered.length === 0) return;
    if (calendarStudent) {
      const match = nextFiltered.find((s) => String(s.studentId) === String(calendarStudent.studentId));
      if (match) return;
    }
    const storedId = initialCalendarStudentIdRef.current;
    const match = storedId ? nextFiltered.find((s) => String(s.studentId) === String(storedId)) : null;
    setCalendarStudent(match || nextFiltered[0]);
  }, [filteredStudents, calendarStudent, setCalendarStudent]);

  const handleCalendarStudentChange = useCallback((student) => {
    setCalendarStudent(student);
  }, []);

  const handleReviewUpdated = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      await loadData();
    } catch (err) {
      console.error('[WelcomeViolationsTab] review update refresh failed', err);
    }
  }, [loadData, selectedClassId]);

  // Keep the calendar student in sync with the filtered list
  useEffect(() => {
    if (viewMode !== 'calendar') return;
    if (!filteredStudents.length) {
      setCalendarStudent(null);
      return;
    }
    let match = calendarStudent
      ? filteredStudents.find((s) => String(s.studentId) === String(calendarStudent.studentId))
      : null;
    if (!match) {
      const storedId = initialCalendarStudentIdRef.current;
      match = storedId ? filteredStudents.find((s) => String(s.studentId) === String(storedId)) : null;
    }
    if (match && match !== calendarStudent) {
      setCalendarStudent(match);
    } else if (!match && calendarStudent !== filteredStudents[0]) {
      setCalendarStudent(filteredStudents[0]);
    }
  }, [viewMode, filteredStudents, calendarStudent]);

  const handleRowReorder = useCallback((fromId, toId) => {
    const currentIds = sortedStudents.map((s) => String(s.studentId));
    const fromIdx = currentIds.indexOf(String(fromId));
    const toIdx = currentIds.indexOf(String(toId));
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...currentIds];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setRowOrder(next);
    saveStoredRowOrder(String(selectedClassId), next);
  }, [sortedStudents, selectedClassId]);

  const isWeekMode = violationsViewMode === 'week';
  // Two-line tooltip for class-total values: label on top, scope note below
  const classTotalTip = (label) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.4, textAlign: 'center' }}>
      <span>{label}</span>
      <span style={{ opacity: 0.75, fontWeight: 400 }}>{t('violations.tip_class_scope_days')}</span>
    </div>
  );

  const headerPeriodLabel = isWeekMode ? t('this_week') : t('violations.today');
  const HeaderPeriodIcon = isWeekMode ? CalendarRange : Calendar;
  const visibleColumnCount =
    (showAvatars ? 1 : 0) + 1 + 1 + 1 + (canViewDeduction ? 2 : 0) + 1 + 1 + 1;

  // Compact legend chips reused at top and bottom of the violations panel
  const legendChips = (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0, fontSize: '0.75rem' }}>
      {/* Breakdown types */}
      {BREAKDOWN_ITEMS.map((item) => {
        const Icon = item.icon;
        const count = calendarStudent?.[item.studentKey] || 0;
        return (
          <div key={item.key} className={gridStyles.legendItem}>
            <Icon size={12} style={{ color: item.color }} />
            <span style={{ color: item.color }}>
              {t(item.labelKey)}{count > 0 ? ` (${count})` : ''}
            </span>
          </div>
        );
      })}
      <div className={gridStyles.legendDivider} aria-hidden="true" />
      {canViewDeduction && (
        <>
          {/* Deduction rates */}
          <ColoredTooltip
            title={t('violations.pending_review_0_50_approved_0_25')}
            color={getColor('blue', isDark).dot}
            placement="top"
          >
            <div className={gridStyles.legendItem} style={{ cursor: 'help' }}>
              <Clock size={12} style={{ color: getColor('blue', isDark).dot }} />
              <span style={{ color: getColor('blue', isDark).dot }}>
                {t('violations.pending')}
              </span>
            </div>
          </ColoredTooltip>
          <div className={gridStyles.legendDivider} aria-hidden="true" />
        </>
      )}
      {/* Warning thresholds */}
      <ColoredTooltip
        title={t('violations.4_unexcused_absences')}
        color={getColor('amber', isDark).text}
        placement="top"
      >
        <div className={gridStyles.legendItem} style={{ cursor: 'help' }}>
          <AlertTriangle size={12} style={{ color: getColor('amber', isDark).text }} />
          <span style={{ color: getColor('amber', isDark).text }}>
            {t('violations.1st_warning')}
          </span>
        </div>
      </ColoredTooltip>
      <ColoredTooltip
        title={t('violations.8_unexcused_absences')}
        color={getColor('red', isDark).text}
        placement="top"
      >
        <div className={gridStyles.legendItem} style={{ cursor: 'help' }}>
          <AlertCircle size={12} style={{ color: getColor('red', isDark).text }} />
          <span style={{ color: getColor('red', isDark).text }}>
            {t('violations.final_warning')}
          </span>
        </div>
      </ColoredTooltip>
      <ColoredTooltip
        title={t('violations.9_unexcused_absences')}
        color={getColor('red', isDark).text}
        placement="top"
      >
        <div className={gridStyles.legendItem} style={{ cursor: 'help' }}>
          <UserX size={12} style={{ color: getColor('red', isDark).text }} />
          <span style={{ color: getColor('red', isDark).text }}>
            {t('violations.class_dismissal')}
          </span>
        </div>
      </ColoredTooltip>
      <div className={gridStyles.legendDivider} aria-hidden="true" />
      {/* Approved doc */}
      <div className={gridStyles.legendItem}>
        <FileCheck size={12} style={{ color: getColor('green', isDark).dot }} />
        <span style={{ color: getColor('green', isDark).text }}>
          {t('violations.approved')}
        </span>
      </div>
    </div>
  );

  return (
    <Box
      className={expanded ? 'violations-panel-expanded' : ''}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        height: expanded ? '100%' : 'calc(100vh - var(--navbar-height, 60px) - 48px)',
      }}
    >
      {/* Font scale styles for the violations table and legend */}
      <style>
        {`
          [data-testid="violations-table"] {
            --schedule-font-scale: 1;
          }
          [data-testid="violations-table"] table {
            font-size: calc(11px * var(--schedule-font-scale, 1));
          }
          [data-testid="violations-table"] thead tr {
            height: calc(2.75rem * var(--schedule-font-scale, 1));
          }
          [data-testid="violations-table"] tbody tr {
            height: calc(2.5rem * var(--schedule-font-scale, 1));
          }
          [data-testid="violations-table"] th,
          [data-testid="violations-table"] td {
            padding-top: calc(0.5rem * var(--schedule-font-scale, 1));
            padding-bottom: calc(0.5rem * var(--schedule-font-scale, 1));
            font-size: calc(0.875rem * var(--schedule-font-scale, 1));
          }
          [data-testid="violations-table"] .text-xs {
            font-size: calc(0.75rem * var(--schedule-font-scale, 1)) !important;
          }
          [data-testid="violations-table"] .text-\\[10px\\] {
            font-size: calc(10px * var(--schedule-font-scale, 1)) !important;
          }
          /* Scale cell/status icons with the zoom slider and enlarge the base
             size so they're easier to hover. Lucide sets width/height as
             attributes — CSS width/height overrides them. */
          [data-testid="violations-table"] td svg,
          [data-testid="violations-table"] th svg {
            width: calc(16px * var(--schedule-font-scale, 1));
            height: calc(16px * var(--schedule-font-scale, 1));
          }
        `}
      </style>

      {/* Top Controls Bar — borderless, like BoardFilterBar */}
      <div className="flex flex-wrap items-start gap-2 px-1 py-1">
        {/* Quick filter chips at the start of the row */}
        <div
          className="flex shrink min-w-0 flex-wrap items-start gap-2"
          data-tour="violations-filter-bar"
        >
          <GridQuickFilterChips
            chips={filterChips}
            activeIds={[activeFilterId]}
            onChange={(id) => setActiveFilterId(id || 'all')}
            compact
          />
        </div>

        {/* Class selector + search share the remaining header space 2:1 */}
        {classes.length > 0 && (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="flex-[2] min-w-[160px]">
              <Select
                value={String(selectedClassId) || ''}
                onChange={(e) => {
                  const value = e.target?.value ?? e.value;
                  setSelectedClassId(value);
                }}
                options={classOptions}
                placeholder={t('all_classes') || 'All classes'}
                searchable
                fullWidth
                size="small"
                theme={isDark ? 'dark' : 'light'}
                style={{ width: '100%', '--border': isDark ? '#4b5563' : '#9ca3af' }}
              />
            </div>
            {/* Class / program attendance summary exports */}
            {[
              { format: 'excel', Icon: FileSpreadsheet, color: '#43a047', label: t('export_excel') || 'Excel' },
            ].map(({ format, Icon, color, label }) => (
              <ColoredTooltip
                key={format}
                title={`${selectedClassId ? (t('report_class_summary') || 'Class Summary') : (t('report_program_summary') || 'Program Summary')} — ${label}`}
                color={color}
                placement="bottom"
              >
                <IconButton
                  size="small"
                  sx={{ width: 28, height: 28, flexShrink: 0, color }}
                  onClick={() => {
                    const reportTitle = selectedClassId
                      ? (t('report_class_summary') || 'Class Summary Report')
                      : (t('report_program_summary') || 'Program Summary Report');
                    const done = lang === 'ar' ? 'تم التصدير بنجاح' : 'Export successful';
                    const openLabel = lang === 'ar' ? 'فتح الملف' : 'Open file';
                    const showBanner = (result) => {
                      if (!onExportSuccess || !result?.blob) return;
                      const blobUrl = URL.createObjectURL(result.blob);
                      setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
                      const downloadFile = () => {
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = result.filename || 'export.xlsx';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      };
                      if (format === 'excel') {
                        // Same action buttons as every other Excel export banner.
                        onExportSuccess({
                          pillColor: '#059669',
                          icon: <CheckCircle2 size={16} className="shrink-0" />,
                          message: `${reportTitle} — Excel — ${done}`,
                          actions: result.fileId
                            ? [
                                { label: t('export_open_collabora') || 'Open in Collabora', icon: <ExternalLink size={14} />, onClick: async () => { if (!(await openDriveFileInCollabora(result.fileId))) downloadFile(); } },
                                { label: t('export_save_file') || 'Save', icon: <Download size={14} />, onClick: downloadFile },
                              ]
                            : [{ label: t('export_save_file') || 'Save', icon: <Download size={14} />, onClick: downloadFile }],
                        });
                        return;
                      }
                      onExportSuccess({
                        pillColor: '#059669',
                        icon: <CheckCircle2 size={16} className="shrink-0" />,
                        message: (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0px', fontSize: '0.75rem' }}>
                            {`${reportTitle} — PDF — ${done}`}
                            <button
                              type="button"
                              className="inline-flex items-center gap-0.5 rounded-md text-xs font-semibold px-1.5 py-0.5 hover:bg-white/25 transition-colors"
                              onClick={() => window.open(blobUrl, '_blank')}
                              style={{ marginLeft: '8px' }}
                              aria-label={openLabel}
                            >
                              <ExternalLink size={14} />
                              {openLabel}
                            </button>
                          </span>
                        ),
                      });
                    };
                    if (selectedClassId && selectedClass) {
                      exportClassSummaryReport({
                        classId: selectedClass.id,
                        classInfo: {
                          className: selectedClass.nameEn || selectedClass.name || '',
                          classNameAr: selectedClass.nameAr || '',
                          subjectName: selectedClass.subject?.nameEn || '',
                          subjectNameAr: selectedClass.subject?.nameAr || '',
                          programName: welcomeContext?.program?.nameEn || selectedClass.program?.nameEn || '',
                          programNameAr: welcomeContext?.program?.nameAr || selectedClass.program?.nameAr || '',
                          term: welcomeContext?.academicTerm || welcomeContext?.term || '',
                        },
                        format,
                        lang,
                        user,
                        notify: false,
                        reportDate: format(selectedDate, 'yyyy-MM-dd'),
                      }).then(showBanner)
                        .catch((err) => console.error('[Violations] class summary export failed:', err));
                    } else {
                      exportProgramSummaryReport({
                        programId: welcomeContext?.programId,
                        programName: welcomeContext?.program?.nameEn || '',
                        academicTerm: welcomeContext?.academicTerm,
                        classes,
                        format,
                        lang,
                        user,
                        notify: false,
                        reportDate: format(selectedDate, 'yyyy-MM-dd'),
                      }).then(showBanner)
                        .catch((err) => console.error('[Violations] program summary export failed:', err));
                    }
                  }}
                >
                  <Icon size={16} />
                </IconButton>
              </ColoredTooltip>
            ))}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                position: 'relative',
                '& input': {
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  '&::placeholder': {
                    color: isDark ? '#94a3b8' : '#64748b',
                    opacity: 1,
                  },
                  '&:focus-visible': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 1px #3b82f6',
                    outline: 'none',
                  },
                },
              }}
            >
              <Input
                type="text"
                placeholder={t('violations.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="violations-search"
              />
            </Box>
          </div>
        )}

        {/* Right controls — utility icons */}
        <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>

          {/* Avatar Toggle — like BoardFilterBar */}
          <ColoredTooltip
            title={showAvatars ? (t('operations_board_hide_avatars') || 'Hide avatars') : (t('operations_board_show_avatars') || 'Show avatars')}
            color="#3b82f6"
            placement="bottom"
          >
            <IconButton
              size="small"
              onClick={() => setShowAvatars((v) => !v)}
              disabled={viewMode === 'calendar'}
              data-testid="violations-toggle-avatars"
              sx={{ width: 32, height: 32, flexShrink: 0, color: showAvatars ? 'primary.main' : 'text.secondary' }}
            >
              {showAvatars ? <User size={18} /> : <UserX size={18} />}
            </IconButton>
          </ColoredTooltip>

          {/* Sort Toggle — like BoardFilterBar */}
          <ToggleButtonGroup
            size="small"
            value={sortBy}
            exclusive
            disabled={viewMode === 'calendar'}
            onChange={(_, value) => value && setSortBy(value)}
            sx={{ flexShrink: 0, height: 32 }}
            data-testid="violations-sort"
          >
            <ColoredTooltip title={t('operations_board_sort_system') || 'System Default'} color="#3b82f6" placement="bottom">
              <ToggleButton value="system" sx={{ px: 1, py: 0.25, textTransform: 'none' }}>
                <ArrowUpDown size={16} />
              </ToggleButton>
            </ColoredTooltip>
            <ColoredTooltip title={t('operations_board_sort_alpha') || 'Alphabetical'} color="#3b82f6" placement="bottom">
              <ToggleButton value="alpha" sx={{ px: 1, py: 0.25, textTransform: 'none' }}>
                <ArrowDownAZ size={16} />
              </ToggleButton>
            </ColoredTooltip>
          </ToggleButtonGroup>

          {/* Highlight Toggle — QR-scanner style */}
          <ColoredTooltip
            title={highlightEnabled ? (t('violations_highlight_enabled') || 'Highlight warning status') : (t('violations_highlight_disabled') || 'Disable warning status highlighting')}
            color="#8b5cf6"
            placement="bottom"
          >
            <IconButton
              size="small"
              onClick={handleToggleHighlight}
              disabled={viewMode === 'calendar'}
              data-testid="violations-toggle-highlight"
              sx={{ width: 32, height: 32, flexShrink: 0, color: highlightEnabled ? '#8b5cf6' : 'text.secondary' }}
            >
              <Bell size={18} />
            </IconButton>
          </ColoredTooltip>

        </Box>
        </div>
      </div>

      {error && (
        <Alert severity="error" sx={{ py: 0.5 }}>
          {error}
        </Alert>
      )}

      {viewMode === 'table' && (
        <>
      {/* Main Table — borderless like BoardTableView */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <div className="flex-1 overflow-auto min-h-0">
          <div
            className="overflow-hidden rounded-lg"
            data-testid="violations-table"
            data-tour="violations-table"
            style={{ '--schedule-font-scale': scheduleFontScale / 100 }}
          >
            <Table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
            <TableHeader className="sticky top-0 z-10 bg-muted/50">
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {showAvatars && (
                  <TableHead className="w-12 text-center py-2 px-2">#</TableHead>
                )}
                <TableHead className="w-64 py-2 px-3 cursor-pointer select-none" onClick={() => handleSort(SORT_KEYS.NAME)} data-tour="violations-col-student">
                  <span className="inline-flex items-center gap-1">{t('violations.student')}<SortIcon columnKey={SORT_KEYS.NAME} /></span>
                </TableHead>
                <TableHead className="w-28 text-center py-2 px-2 cursor-pointer select-none" onClick={() => handleSort(SORT_KEYS.ABSENCES)} data-tour="violations-col-total-absences">
                  <HeaderScopeTooltip
                    lines={[
                      { icon: <HeaderPeriodIcon size={12} />, text: t('violations.hdr_top_period', { label: t('violations.absences'), period: headerPeriodLabel }) },
                      { icon: <Users size={12} />, text: t('violations.hdr_bottom_class', { label: t('violations.absences') }) },
                    ]}
                  >
                    <span className="inline-flex items-center gap-1">{t('violations.absences')}<SortIcon columnKey={SORT_KEYS.ABSENCES} /></span>
                  </HeaderScopeTooltip>
                </TableHead>
                <TableHead className="w-32 text-center py-2 px-2" data-tour="violations-col-breakdown">
                  <HeaderScopeTooltip
                    lines={[
                      { icon: <CircleX size={12} />, text: t('violations.hdr_breakdown_icons', { period: headerPeriodLabel }) },
                      { icon: <HeaderPeriodIcon size={12} />, text: t('violations.hdr_bar_period', { period: headerPeriodLabel }) },
                      { icon: <Users size={12} />, text: t('violations.hdr_bar_class') },
                      { icon: <FileX2 size={12} />, text: t('violations.hdr_breakdown_note') },
                    ]}
                  >
                    <span className="inline-flex items-center gap-1">{t('violations.breakdown')}</span>
                  </HeaderScopeTooltip>
                </TableHead>
                {canViewDeduction && (
                  <>
                    <TableHead className="w-24 text-center py-2 px-1 cursor-pointer select-none" onClick={() => handleSort(SORT_KEYS.DEDUCTION_APPROVED)} data-tour="violations-col-deduction-approved">
                      <HeaderScopeTooltip
                        lines={[
                          { icon: <HeaderPeriodIcon size={12} />, text: t('violations.hdr_top_period', { label: t('violations.deduction_approved'), period: headerPeriodLabel }) },
                          { icon: <Users size={12} />, text: t('violations.hdr_bottom_class', { label: t('violations.deduction_approved') }) },
                        ]}
                      >
                        <span className="inline-flex items-center gap-1">{t('violations.deduction_approved')}<SortIcon columnKey={SORT_KEYS.DEDUCTION_APPROVED} /></span>
                      </HeaderScopeTooltip>
                    </TableHead>
                    <TableHead className="w-24 text-center py-2 px-1 cursor-pointer select-none" onClick={() => handleSort(SORT_KEYS.DEDUCTION_NOT_APPROVED)} data-tour="violations-col-deduction-not-approved">
                      <HeaderScopeTooltip
                        lines={[
                          { icon: <HeaderPeriodIcon size={12} />, text: t('violations.hdr_top_period', { label: t('violations.deduction_not_approved'), period: headerPeriodLabel }) },
                          { icon: <Users size={12} />, text: t('violations.hdr_bottom_class', { label: t('violations.deduction_not_approved') }) },
                        ]}
                      >
                        <span className="inline-flex items-center gap-1">{t('violations.deduction_not_approved')}<SortIcon columnKey={SORT_KEYS.DEDUCTION_NOT_APPROVED} /></span>
                      </HeaderScopeTooltip>
                    </TableHead>
                  </>
                )}
                <TableHead className="w-28 py-2 px-2 cursor-pointer select-none" align="center" onClick={() => handleSort(SORT_KEYS.WARNING)} data-tour="violations-col-warning">
                  <span className="inline-flex items-center justify-center gap-1 w-full">{t('violations.status')}<SortIcon columnKey={SORT_KEYS.WARNING} /></span>
                </TableHead>
                <TableHead className="w-44 py-2 px-3" data-tour="violations-col-recorded">
                  {t('violations.warnings')}
                </TableHead>
                <TableHead className="w-32 text-end py-2 px-3" data-tour="violations-col-actions">
                  {t('violations.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} className="h-32 text-center text-muted-foreground">
                    {t('violations.no_students_match_current_filters')}
                  </TableCell>
                </TableRow>
              ) : (
                sortedStudents.map((s, idx) => {
                  const studentWfs = workflowsByStudentId.get(String(s.studentId)) || [];
                  const name = isAr ? (s.studentNameAr || s.studentName) : (s.studentName || s.studentNameAr);
                  const rank = isAr ? (s.rankAr || s.rankEn) : (s.rankEn || s.rankAr);
                  const hasPendingWf = studentWfs.some((wf) => ['SUBMITTED', 'PENDING_HR', 'DRAFT'].includes(wf.status));

                  const totalColor = getColor(
                    s.unexcusedAbsences > 0 ? 'red' : s.excusedAbsences > 0 ? 'pink' : s.humanCaseCount > 0 ? 'purple' : 'muted',
                    isDark
                  );
                  const unexcusedColor = getColor('red', isDark);
                  const excusedColor = getColor('pink', isDark);
                  const humanColor = getColor('purple', isDark);
                  const zeroColor = getColor('muted', isDark);
                  const approvedColor = getColor(s.deductionApproved > 0 ? 'green' : 'muted', isDark);
                  const notApprovedColor = getColor(s.deductionNotApproved > 0 ? 'red' : 'muted', isDark);
                  const classTotalColor = getColor(s.classTotalAbsences > 0 ? 'red' : 'muted', isDark);
                  const classApprovedColor = getColor(s.classDeductionApproved > 0 ? 'green' : 'muted', isDark);
                  const classNotApprovedColor = getColor(s.classDeductionNotApproved > 0 ? 'red' : 'muted', isDark);
                  const warningColor = getColor(
                    s.warningType === 'dismissed' || s.warningType === 'final' ? 'red' : s.warningType === 'first' ? 'amber' : 'green',
                    isDark
                  );
                  const breakdownItems = getBreakdownItems(s, t);
                  const classTotalBarItems = getClassTotalBarItems(s, t, classTotalColor, classApprovedColor, classNotApprovedColor, canViewDeduction);
                  const periodTotalLabel = isWeekMode ? t('violations.week_total') : t('violations.day_total');
                  const periodScopeLabel = isWeekMode ? t('this_week') : t('violations.today');
                  const PeriodScopeIcon = isWeekMode ? CalendarRange : Calendar;

                  const rowStatus = getRowStatusVariant(s, hasPendingWf);
                  const chipVariant = CHIP_VARIANTS[ROW_STATUS_VARIANTS[rowStatus]];
                  const chipPalette = chipVariant ? (isDark ? chipVariant.dark : chipVariant.light) : null;
                  const isDragOver = dragOverStudentId === s.studentId;
                  const isDraggingRow = draggingRowId === s.studentId;
                  const rowBg = isDragOver
                    ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)')
                    : (highlightEnabled && chipPalette ? chipPalette.bg : undefined);
                  const rowHighlightStyle = {
                    backgroundColor: rowBg,
                    cursor: isDraggingRow ? 'grabbing' : (sortBy === 'system' ? 'grab' : undefined),
                  };

                  return (
                    <TableRow
                      key={s.studentId}
                      className="transition-colors hover:bg-muted/40"
                      style={rowHighlightStyle}
                      draggable={sortBy === 'system'}
                      onDragStart={(e) => {
                        if (sortBy !== 'system') return;
                        e.dataTransfer.setData('text/plain', String(s.studentId));
                        e.dataTransfer.effectAllowed = 'move';
                        dragRowRef.current = String(s.studentId);
                        rowDraggingRef.current = true;
                        setDraggingRowId(s.studentId);
                        setDragOverStudentId(null);
                      }}
                      onDragOver={(e) => {
                        if (sortBy !== 'system' || dragRowRef.current === String(s.studentId)) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverStudentId(s.studentId);
                      }}
                      onDragLeave={() => setDragOverStudentId(null)}
                      onDrop={(e) => {
                        if (sortBy !== 'system') return;
                        e.preventDefault();
                        const fromId = dragRowRef.current;
                        setDragOverStudentId(null);
                        if (fromId && fromId !== String(s.studentId)) {
                          handleRowReorder(fromId, String(s.studentId));
                        }
                        dragRowRef.current = null;
                      }}
                      onDragEnd={() => {
                        setDragOverStudentId(null);
                        dragRowRef.current = null;
                        setDraggingRowId(null);
                        setTimeout(() => { rowDraggingRef.current = false; }, 50);
                      }}
                    >
                      {/* Index / Avatar — conditional */}
                      {showAvatars && (
                        <TableCell className="text-center py-2 px-2">
                          <div className="flex justify-center">
                            <BoardStudentAvatar
                              name={name}
                              profileImageUrl={s.profileImageUrl}
                              cacheBuster={s.avatarUpdatedAt}
                              size="sm"
                            />
                          </div>
                        </TableCell>
                      )}

                      {/* Student Info */}
                      <TableCell className="py-2 px-3">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" style={{ flexDirection: isAr ? 'row-reverse' : 'row', justifyContent: isAr ? 'flex-end' : 'flex-start' }}>
                            {rank && <span className="font-normal">{rank}</span>}
                            <span className="font-mono">{s.studentNumber}</span>
                          </div>
                          <span className="font-semibold text-foreground truncate" style={{ textAlign: isAr ? 'right' : 'left' }}>{name}</span>
                        </div>
                      </TableCell>

                      {/* Absences — two stacked values: period total (calendar) + class total (users) */}
                      <TableCell className="text-center py-2 px-2">
                        <div className="inline-flex flex-col items-center gap-0.5 text-xs font-semibold">
                          <ColoredTooltip title={t('violations.tip_period_absences', { period: periodTotalLabel }) || `${periodTotalLabel} — ${t('violations.absences')}`} color={totalColor.text} borderColor={totalColor.dot} placement="top" arrow>
                            <span className="inline-flex items-center gap-1" style={{ color: totalColor.text, cursor: 'default' }}>
                              <PeriodScopeIcon size={13} style={{ color: totalColor.dot, flexShrink: 0 }} />
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: totalColor.dot }} />
                              {s.totalAbsences || 0}
                            </span>
                          </ColoredTooltip>
                          <ColoredTooltip title={classTotalTip(t('violations.tip_class_absences') || `${t('violations.class_total')} — ${t('violations.absences')}`)} color={classTotalColor.text} borderColor={classTotalColor.dot} placement="top" arrow>
                            <span className="inline-flex items-center gap-1" style={{ color: classTotalColor.text, cursor: 'default' }}>
                              <Users size={13} style={{ color: classTotalColor.dot, flexShrink: 0 }} />
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: classTotalColor.dot }} />
                              {s.classTotalAbsences || 0}
                            </span>
                          </ColoredTooltip>
                        </div>
                      </TableCell>

                      {/* Breakdown: compact icons + counts + bar with unified tooltip */}
                      <TableCell className="py-2 px-2">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs">
                            {breakdownItems.map((item) => {
                              const Icon = item.icon;
                              const active = item.count > 0;
                              const color = active ? item.color : zeroColor.dot;
                              return (
                                <ColoredTooltip
                                  key={item.key}
                                  title={getBreakdownTooltipTitle(item, isDark)}
                                  color={item.color}
                                  borderColor={item.color}
                                  placement="top"
                                  arrow
                                >
                                  <span
                                    className="inline-flex items-center gap-1 font-semibold"
                                    style={{ color: active ? item.color : zeroColor.text, cursor: 'default' }}
                                  >
                                    <Icon size={13} style={{ color }} />
                                    {item.count}
                                  </span>
                                </ColoredTooltip>
                              );
                            })}
                          </div>
                          <BreakdownBar
                            items={breakdownItems}
                            isDark={isDark}
                            isAr={isAr}
                            title={isWeekMode ? t('violations.week_breakdown') : t('violations.day_breakdown')}
                          />
                          <BreakdownBar
                            items={classTotalBarItems}
                            isDark={isDark}
                            isAr={isAr}
                            title={t('violations.class_total')}
                            showTotal={false}
                            totalDeduction={s.classDeductionTotal}
                          />
                        </div>
                      </TableCell>

                      {canViewDeduction && (
                        <>
                          {/* Approved — two stacked dot values: period + class total */}
                          <TableCell className="text-center py-2 px-1">
                            <div className="inline-flex flex-col items-center gap-0.5 text-xs font-semibold">
                              <ColoredTooltip title={t('violations.tip_period_approved', { period: periodScopeLabel }) || `${periodTotalLabel} — ${t('violations.deduction_approved')}`} color={approvedColor.text} borderColor={approvedColor.dot} placement="top" arrow>
                                <span className="inline-flex items-center gap-1" style={{ color: approvedColor.text, cursor: 'default' }}>
                                  <PeriodScopeIcon size={13} style={{ color: approvedColor.dot, flexShrink: 0 }} />
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: approvedColor.dot }} />
                                  {Number(s.deductionApproved || 0).toFixed(2)}
                                </span>
                              </ColoredTooltip>
                              <ColoredTooltip title={classTotalTip(t('violations.tip_class_approved') || `${t('violations.class_total')} — ${t('violations.deduction_approved')}`)} color={classApprovedColor.text} borderColor={classApprovedColor.dot} placement="top" arrow>
                                <span className="inline-flex items-center gap-1" style={{ color: classApprovedColor.text, cursor: 'default' }}>
                                  <Users size={13} style={{ color: classApprovedColor.dot, flexShrink: 0 }} />
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: classApprovedColor.dot }} />
                                  {Number(s.classDeductionApproved || 0).toFixed(2)}
                                </span>
                              </ColoredTooltip>
                            </div>
                          </TableCell>
                          {/* Not Approved — two stacked dot values: period + class total */}
                          <TableCell className="text-center py-2 px-1">
                            <div className="inline-flex flex-col items-center gap-0.5 text-xs font-semibold">
                              <ColoredTooltip title={t('violations.tip_period_not_approved', { period: periodScopeLabel }) || `${periodTotalLabel} — ${t('violations.deduction_not_approved')}`} color={notApprovedColor.text} borderColor={notApprovedColor.dot} placement="top" arrow>
                                <span className="inline-flex items-center gap-1" style={{ color: notApprovedColor.text, cursor: 'default' }}>
                                  <PeriodScopeIcon size={13} style={{ color: notApprovedColor.dot, flexShrink: 0 }} />
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: notApprovedColor.dot }} />
                                  {Number(s.deductionNotApproved || 0).toFixed(2)}
                                </span>
                              </ColoredTooltip>
                              <ColoredTooltip title={classTotalTip(t('violations.tip_class_not_approved') || `${t('violations.class_total')} — ${t('violations.deduction_not_approved')}`)} color={classNotApprovedColor.text} borderColor={classNotApprovedColor.dot} placement="top" arrow>
                                <span className="inline-flex items-center gap-1" style={{ color: classNotApprovedColor.text, cursor: 'default' }}>
                                  <Users size={13} style={{ color: classNotApprovedColor.dot, flexShrink: 0 }} />
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: classNotApprovedColor.dot }} />
                                  {Number(s.classDeductionNotApproved || 0).toFixed(2)}
                                </span>
                              </ColoredTooltip>
                            </div>
                          </TableCell>
                        </>
                      )}

                      <TableCell align="center" className="py-2 px-2">
                        <ColoredTooltip
                        title={
                          s.warningType === 'dismissed'
                            ? (t('violations.disconnected'))
                            : s.warningType === 'final'
                              ? (t('violations.final_warning'))
                              : s.warningType === 'first'
                                ? (t('violations.first_warning'))
                                : (t('violations.compliant_tooltip', { count: s.classUnexcusedAbsences || 0 }) || t('violations.compliant'))
                        }
                        color={warningColor.text}
                        placement="top"
                      >
                        <span className="inline-flex items-center justify-center text-xs font-semibold w-full" style={{ color: warningColor.text, cursor: 'default' }}>
                          {s.warningType === 'dismissed' ? (
                            <UserX size={15} />
                          ) : s.warningType === 'final' ? (
                            <AlertCircle size={15} />
                          ) : s.warningType === 'first' ? (
                            <AlertTriangle size={15} />
                          ) : (
                            <CheckCircle2 size={15} />
                          )}
                        </span>
                      </ColoredTooltip>
                      </TableCell>

                      {/* Existing Warnings / Links */}
                      <TableCell className="py-2 px-3">
                        {studentWfs.length === 0 ? (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {studentWfs.map((wf) => {
                              const cfg = WORKFLOW_STATUS_CONFIG[wf.status] || WORKFLOW_STATUS_CONFIG.DRAFT;
                              const StatusIcon = cfg.icon;
                              const isFinal = wf.attendanceSubtype === 'WARNING_FINAL' || wf.title?.includes('Final');
                              return (
                                <button
                                  key={wf.id}
                                  type="button"
                                  onClick={() => navigate(`/workflow-documents/${wf.id}`)}
                                  className="group flex items-center justify-between gap-1.5 px-2 py-1 rounded text-[11px] border text-start transition-all hover:shadow-xs"
                                  style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}
                                >
                                  <div className="flex items-center gap-1 truncate font-medium">
                                    <StatusIcon size={12} />
                                    <span>{isFinal ? (t('violations.final')) : (t('violations.1st'))}</span>
                                    <span className="opacity-75">#{wf.id}</span>
                                    <span className="text-[10px] opacity-90">({t(cfg.labelKey)})</span>
                                  </div>
                                  <ExternalLink size={11} className="opacity-60 group-hover:opacity-100 shrink-0" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell className="text-end py-2 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <ColoredTooltip
                            title={
                              hasPendingWf
                                ? (t('violations.pending'))
                                : s.warningType === 'dismissed'
                                  ? (t('violations.dismiss'))
                                  : s.warningType === 'final'
                                    ? (t('violations.final_warning'))
                                    : s.warningType === 'first'
                                      ? (t('violations.first_warning'))
                                      : (t('violations.review'))
                            }
                            color={
                              s.warningType === 'dismissed' || s.warningType === 'final'
                                ? getColor('red', isDark).text
                                : s.warningType === 'first'
                                  ? getColor('amber', isDark).text
                                  : getColor('blue', isDark).text
                            }
                            placement="top"
                          >
                            <span>
                              <IconButton
                                size="small"
                                color={
                                  s.warningType === 'dismissed' || s.warningType === 'final'
                                    ? 'error'
                                    : s.warningType === 'first'
                                      ? 'warning'
                                      : 'primary'
                                }
                                disabled={s.warningType ? hasPendingWf : false}
                                onClick={() => { if (rowDraggingRef.current) return; handleOpenReview(s); }}
                                sx={{ width: 30, height: 30, ...(hasPendingWf ? { color: '#3b82f6' } : {}) }}
                                data-testid="violations-review-action"
                              >
                                {hasPendingWf ? (
                                  <Clock size={16} />
                                ) : s.warningType === 'dismissed' ? (
                                  <UserX size={16} />
                                ) : s.warningType === 'final' ? (
                                  <AlertCircle size={16} />
                                ) : s.warningType === 'first' ? (
                                  <AlertTriangle size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </IconButton>
                            </span>
                          </ColoredTooltip>
                          {s.warningType && !hasPendingWf && (
                            <ColoredTooltip
                              title={t('violations.preview_warning_letter')}
                              color="#3b82f6"
                              placement="top"
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => { if (rowDraggingRef.current) return; handlePreviewPdf(s); }}
                                  disabled={pdfPreviewingId === s.studentId}
                                  sx={{ width: 30, height: 30 }}
                                  data-testid="violations-pdf-action"
                                >
                                  {pdfPreviewingId === s.studentId ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <FileText size={16} />
                                  )}
                                </IconButton>
                              </span>
                            </ColoredTooltip>
                          )}
                          <ColoredTooltip
                            title={t('violations.calendar_details')}
                            color="#3b82f6"
                            placement="top"
                          >
                            <IconButton
                              size="small"
                              onClick={() => { if (rowDraggingRef.current) return; handleOpenCalendar(s); }}
                              sx={{ width: 30, height: 30, color: 'text.secondary' }}
                              data-testid="violations-calendar-action"
                            >
                              <CalendarDays size={16} />
                            </IconButton>
                          </ColoredTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      </>
      )}

      {viewMode === 'calendar' && (
        <ViolationStudentCalendar
          student={calendarStudent}
          students={filteredStudents}
          classId={selectedClassId}
          onStudentChange={handleCalendarStudentChange}
          isDark={isDark}
          dateFrom={weekDateRange.dateFrom}
          dateTo={weekDateRange.dateTo}
          selectedDate={selectedDate}
          violationsViewMode={violationsViewMode}
        />
      )}

      {/* Compact Legend — matches schedule page style */}
      <div className={`${gridStyles.statusLegend} ${gridStyles.statusLegendBottom} shrink-0`} style={{ fontSize: '0.75rem', justifyContent: 'flex-start', gap: '0.25rem' }} data-tour="violations-legend">
        {legendChips}
        <div style={{ marginInlineStart: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ViolationsViewToggle
            isAr={isAr}
            isDark={isDark}
            viewMode={viewMode}
            onTable={handleSwitchToTable}
            onCalendar={handleSwitchToCalendar}
            testId="violations-legend-view-mode"
          />
          {onToggleExpand && (
            <ColoredTooltip
              title={expanded ? (t('operations_board_collapse') || 'Collapse') : (t('operations_board_expand') || 'Expand')}
              color="#8b5cf6"
              placement="top"
            >
              <IconButton
                size="small"
                onClick={onToggleExpand}
                data-testid="violations-expand"
                aria-label={expanded ? (t('operations_board_collapse') || 'Collapse') : (t('operations_board_expand') || 'Expand')}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
                  color: isDark ? '#94a3b8' : '#64748b',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
                  },
                }}
              >
                {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </IconButton>
            </ColoredTooltip>
          )}
        </div>
      </div>

      <Joyride
        steps={tourSteps}
        run={runJoyride && tourSteps.length > 0}
        continuous
        disableScrolling={false}
        scrollOffset={100}
        scrollToFirstStep
        showSkipButton
        showProgress
        tooltipComponent={TourTooltipComponent}
        spotlightClicks={false}
        callback={handleTourCallback}
        locale={{
          back: t('tour_back') || 'Back',
          close: t('tour_close') || 'Close',
          last: t('tour_done') || 'Done',
          next: t('tour_next') || 'Next',
          skip: t('tour_skip') || 'Skip',
        }}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: isDark ? '#1f2937' : '#fff',
            backgroundColor: isDark ? '#1f2937' : '#fff',
            textColor: isDark ? '#f1f5f9' : '#0f172a',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            primaryColor: 'var(--color-primary, #800020)',
          },
        }}
      />

      <ViolationReviewDialog
        open={reviewOpen}
        onClose={handleCloseReview}
        student={reviewStudent || {}}
        classId={selectedClassId}
        programId={welcomeContext?.programId}
        isDark={isDark}
        isAr={isAr}
        lang={lang}
        metadata={metadata}
        user={user}
        onUpdated={handleReviewUpdated}
      />
    </Box>
  );
}

