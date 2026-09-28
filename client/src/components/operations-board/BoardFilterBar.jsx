import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, ToggleButton, ToggleButtonGroup, IconButton } from '@mui/material';
import { ArrowUpDown, ArrowDownAZ, Calendar, KanbanSquare, Workflow, Users, User, UserX, ArrowLeftRight, LayoutTemplate, Eye, EyeOff, Expand, FileSpreadsheet, FileText, CheckCircle2, ExternalLink, Download } from 'lucide-react';
import DatePicker from '@components/ui/DatePicker/DatePicker';
import { Input } from '@/components/kibo/ui/input';
import { Select } from '@components/ui';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { exportClassSummaryReport, exportProgramSummaryReport, exportClassDeductionReport } from '@services/business/studentSummaryReportService.js';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import BoardScheduleCalendar from './BoardScheduleCalendar.jsx';
import { shouldHideNotesParticipation, canViewParticipation } from './hrAttendancePrivacy.js';
import { openDriveFileInCollabora } from '@utils/collaboraUtils.js';
import { CARD_TYPE } from './operationsBoardConstants.js';

const PANEL_COLORS = {
  light: { root: '#dbeafe', text: '#2563eb', selected: '#3b82f6', hover: 'rgba(59,130,246,0.12)' },
  dark: { root: 'rgba(59,130,246,0.12)', text: '#93c5fd', selected: '#3b82f6', hover: 'rgba(96,165,250,0.15)' },
};

const LANE_TAB_COLORS = {
  attendance: {
    light: { text: '#c2410c', selected: '#f97316', hover: 'rgba(249,115,22,0.12)' },
    dark: { text: '#fdba74', selected: '#f97316', hover: 'rgba(249,115,22,0.15)' },
  },
  workflow: {
    light: { text: '#15803d', selected: '#22c55e', hover: 'rgba(34,197,94,0.12)' },
    dark: { text: '#86efac', selected: '#22c55e', hover: 'rgba(34,197,94,0.15)' },
  },
};

const getLaneTabsContainerSx = (isDark) => ({
  minHeight: 24,
  display: 'inline-flex',
  borderRadius: '999px',
  p: '2px',
  bgcolor: isDark ? 'rgba(75,85,99,0.3)' : '#f3f4f6',
  '& .MuiTabs-indicator': { display: 'none' },
  '& .MuiTabs-flexContainer': { gap: '2px' },
  '& .MuiTab-root': {
    minHeight: 24,
    textTransform: 'none',
    fontSize: '0.7rem',
    py: 0.15,
    px: 0.75,
    borderRadius: '999px',
    fontWeight: 500,
    border: '1px solid transparent',
    bgcolor: 'transparent',
    transition: 'all 0.15s',
  },
});

const getLaneTabSx = (isDark, type) => {
  const c = LANE_TAB_COLORS[type][isDark ? 'dark' : 'light'];
  return {
    color: c.text,
    '& .MuiTab-icon, & .MuiTab-iconWrapper, & svg': { color: c.text },
    '&.Mui-selected': { bgcolor: c.selected, color: '#fff', borderColor: c.selected },
    '&.Mui-selected .MuiTab-icon, &.Mui-selected .MuiTab-iconWrapper, &.Mui-selected svg': { color: '#fff' },
    '&:hover:not(.Mui-selected)': { bgcolor: c.hover },
  };
};

const getSubtabSx = (isDark, colors) => {
  const c = isDark ? colors.dark : colors.light;
  return {
    minHeight: 24,
    display: 'inline-flex',
    borderRadius: '999px',
    p: '2px',
    bgcolor: c.root,
    '& .MuiTabs-indicator': { display: 'none' },
    '& .MuiTabs-flexContainer': { gap: '2px' },
    '& .MuiTab-root': {
      minHeight: 24,
      textTransform: 'none',
      fontSize: '0.7rem',
      py: 0.15,
      px: 0.75,
      borderRadius: '999px',
      fontWeight: 500,
      color: c.text,
      border: '1px solid transparent',
      bgcolor: 'transparent',
      transition: 'all 0.15s',
      '&.Mui-selected': {
        bgcolor: c.selected,
        color: '#fff !important',
        fontWeight: 600,
        borderColor: c.selected,
      },
      '&.Mui-selected.MuiTab-textColorPrimary': { color: '#fff !important' },
      '&.Mui-selected.MuiTab-textColorInherit': { color: '#fff !important' },
      '&.Mui-selected .MuiTab-icon, &.Mui-selected .MuiTab-iconWrapper, &.Mui-selected svg': {
        color: '#fff !important',
      },
      '& .MuiTab-icon, & .MuiTab-iconWrapper, & svg': {
        color: `${c.text} !important`,
      },
      '&:hover:not(.Mui-selected)': {
        bgcolor: c.hover,
      },
    },
  };
};

export default function BoardFilterBar({
  filters,
  onFilterChange,
  welcomeContext = null,
  panelTab,
  onPanelTabChange,
  onClassSessionClick,
  sortBy = 'system',
  onSortChange,
  lane = 'attendance',
  onLaneChange,
  onAutoFitContent,
  onAutoFitScreen,
  showLaneReset = false,
  roleContext = {},
  embedded = false,
  expanded = false,
  onToggleExpand,
  viewMode = 'day',
  showAvatars = true,
  onToggleShowAvatars,
  view = 'kanban',
  calendarView,
  onCalendarViewChange,
  onActionBanner,
}) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hideNotesParticipation = shouldHideNotesParticipation(roleContext);
  const hideParticipation = !canViewParticipation(roleContext);

  // Show the board pill banner on export success with an "Open file" action.
  const showExportBanner = useCallback((titleKey, fallbackTitle, format, { blob, filename, fileId } = {}) => {
    if (!onActionBanner || !blob) return;
    const blobUrl = URL.createObjectURL(blob);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
    const downloadFile = () => {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    const openFile = async () => {
      if (format === 'excel') {
        // Prefer the Collabora viewer when the export was persisted to Drive.
        if (fileId && (await openDriveFileInCollabora(fileId))) return;
        downloadFile();
      } else {
        window.open(blobUrl, '_blank');
      }
    };
    const fmt = format === 'excel' ? 'Excel' : 'PDF';
    const done = lang === 'ar' ? 'تم التصدير بنجاح' : 'Export successful';
    const openLabel = lang === 'ar' ? 'فتح الملف' : 'Open file';
    const collaboraLabel = t('export_open_collabora') || 'Open in Collabora';
    const saveLabel = t('export_save_file') || 'Save';
    onActionBanner({
      pillColor: '#059669',
      icon: <CheckCircle2 size={16} className="shrink-0" />,
      message: `${t(titleKey) || fallbackTitle} — ${fmt} — ${done}`,
      // Excel exports persisted to Drive get a choice: open in Collabora or save.
      actions: format === 'excel' && fileId
        ? [
            { label: collaboraLabel, icon: <ExternalLink size={14} />, onClick: async () => { if (!(await openDriveFileInCollabora(fileId))) downloadFile(); } },
            { label: saveLabel, icon: <Download size={14} />, onClick: downloadFile },
          ]
        : [{ label: openLabel, icon: <ExternalLink size={14} />, onClick: openFile }],
    });
  }, [onActionBanner, lang, t]);

  const showExportError = useCallback((label, err) => {
    console.error('[BoardFilterBar] export failed:', err);
    if (!onActionBanner) return;
    onActionBanner({
      pillColor: '#dc2626',
      icon: <FileText size={16} className="shrink-0" />,
      message: `${label} — ${lang === 'ar' ? 'فشل التصدير' : 'Export failed'}`,
    });
  }, [onActionBanner, lang]);

  // Report icons beside the class dropdown: class summary when a class is
  // selected, program-level summary (all classes) when it is not.
  const runSummaryReport = useCallback((format) => () => {
    const classes = welcomeContext?.classes || [];
    const selectedClass = classes.find((c) => String(c.id) === String(filters.classId));
    if (filters.classId) {
      exportClassSummaryReport({
        classId: filters.classId,
        classInfo: {
          className: selectedClass?.nameEn || selectedClass?.name || '',
          classNameAr: selectedClass?.nameAr || '',
          subjectName: selectedClass?.subject?.nameEn || selectedClass?.subjectName || '',
          subjectNameAr: selectedClass?.subject?.nameAr || selectedClass?.subjectNameAr || '',
          programName: welcomeContext?.program?.nameEn || selectedClass?.program?.nameEn || '',
          programNameAr: welcomeContext?.program?.nameAr || selectedClass?.program?.nameAr || '',
          term: welcomeContext?.academicTerm || selectedClass?.term || '',
        },
        format,
        lang,
        user,
        notify: false,
        reportDate: filters.date,
      }).then((res) => showExportBanner('report_class_summary', 'Class Summary Report', format, res))
        .catch((err) => showExportError(t('report_class_summary') || 'Class Summary', err));
      return;
    }
    exportProgramSummaryReport({
      programId: welcomeContext?.programId,
      programName: welcomeContext?.program?.nameEn || '',
      classes,
      format,
      lang,
      user,
      notify: false,
      reportDate: filters.date,
    }).then((res) => showExportBanner('report_program_summary', 'Program Summary Report', format, res))
      .catch((err) => showExportError(t('report_program_summary') || 'Program Summary', err));
  }, [filters.classId, filters.date, welcomeContext, lang, user, showExportBanner, showExportError, t]);

  // Class-level deduction report (all students' absence dates + deductions).
  const runDeductionReport = useCallback((format) => () => {
    const classes = welcomeContext?.classes || [];
    const selectedClass = classes.find((c) => String(c.id) === String(filters.classId));
    if (!filters.classId) return;
    exportClassDeductionReport({
      classId: filters.classId,
      classInfo: {
        className: selectedClass?.nameEn || selectedClass?.name || '',
        classNameAr: selectedClass?.nameAr || '',
        subjectName: selectedClass?.subject?.nameEn || selectedClass?.subjectName || '',
        subjectNameAr: selectedClass?.subject?.nameAr || selectedClass?.subjectNameAr || '',
        programName: welcomeContext?.program?.nameEn || selectedClass?.program?.nameEn || '',
        programNameAr: welcomeContext?.program?.nameAr || selectedClass?.program?.nameAr || '',
        term: welcomeContext?.academicTerm || selectedClass?.term || '',
      },
      format,
      lang,
      user,
      notify: false,
      reportDate: filters.date,
    }).then((res) => showExportBanner('report_class_deduction', 'Class Deduction Report', format, res))
      .catch((err) => showExportError(t('report_class_deduction') || 'Deduction Report', err));
  }, [filters.classId, filters.date, welcomeContext, lang, user, showExportBanner, showExportError, t]);

  const summaryReportIcons = (
    <>
      {filters.classId && (
        <ColoredTooltip
          title={`${t('report_class_deduction') || 'Deduction Report'} — ${t('export_pdf') || 'PDF'}`}
          color="#e53935"
          placement="bottom"
        >
          <IconButton size="small" onClick={runDeductionReport('pdf')} sx={{ width: 28, height: 28, flexShrink: 0, color: '#e53935' }}>
            <FileText size={16} />
          </IconButton>
        </ColoredTooltip>
      )}
      <ColoredTooltip
        title={`${filters.classId ? (t('report_class_summary') || 'Class Summary') : (t('report_program_summary') || 'Program Summary')} — ${t('export_excel') || 'Excel'}`}
        color="#43a047"
        placement="bottom"
      >
        <IconButton size="small" onClick={runSummaryReport('excel')} sx={{ width: 28, height: 28, flexShrink: 0, color: '#43a047' }}>
          <FileSpreadsheet size={16} />
        </IconButton>
      </ColoredTooltip>
      {filters.classId && (
        <ColoredTooltip
          title={`${t('report_class_deduction') || 'Deduction Report'} — ${t('export_excel') || 'Excel'}`}
          color="#f59e0b"
          placement="bottom"
        >
          <IconButton size="small" onClick={runDeductionReport('excel')} sx={{ width: 28, height: 28, flexShrink: 0, color: '#f59e0b' }}>
            <FileSpreadsheet size={16} />
          </IconButton>
        </ColoredTooltip>
      )}
    </>
  );
  const isInstructor = roleContext?.isInstructor && !roleContext?.isAdmin && !roleContext?.isHR && !roleContext?.isSuperAdmin;
  const isAdminViewer = Boolean(roleContext?.isAdmin || roleContext?.isSuperAdmin);
  const [peekAllClasses, setPeekAllClasses] = useState(() => {
    try {
      return localStorage.getItem('operations_board_peek_all_classes') === 'true';
    } catch {
      return false;
    }
  });
  const selectedDate = filters.date || new Date().toISOString().slice(0, 10);

  useEffect(() => {
    try {
      localStorage.setItem('operations_board_peek_all_classes', peekAllClasses ? 'true' : 'false');
    } catch {}
  }, [peekAllClasses]);

  const handleFilterUpdate = useCallback(
    (key, value) => {
      const newFilters = { ...filters };
      if (value) newFilters[key] = value;
      else delete newFilters[key];
      console.log('[BoardFilterBar] handleFilterUpdate', { key, value, newFilters, classId: newFilters.classId });
      onFilterChange(newFilters);
    },
    [filters, onFilterChange]
  );

  const handleDateSelect = useCallback(
    (isoDate) => {
      if (!isoDate) return;
      handleFilterUpdate('date', isoDate);
    },
    [handleFilterUpdate]
  );

  const handleClassSessionClick = useCallback(
    (session) => {
      onClassSessionClick?.(session);
      onPanelTabChange?.('board');
    },
    [onClassSessionClick, onPanelTabChange]
  );

  return (
    <Box
      className="operations-board-filters"
      data-testid="operations-board-filters"
      sx={{
        flexShrink: panelTab === 'calendar' ? undefined : 0,
        flex: panelTab === 'calendar' ? 1 : undefined,
        display: panelTab === 'calendar' ? 'flex' : undefined,
        flexDirection: panelTab === 'calendar' ? 'column' : undefined,
        minHeight: panelTab === 'calendar' ? 0 : undefined,
        borderRadius: 2,
        border: 0,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.95)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 0.75, py: 0.15 }}>
        {onLaneChange && !isInstructor && (
          <Tabs
            value={panelTab}
            onChange={(_, value) => onPanelTabChange?.(value)}
            data-tour="operations-board-panel-tabs"
            data-filter-tabs="true"
            sx={getSubtabSx(isDark, PANEL_COLORS)}
          >
            <Tab
              value="board"
              icon={<KanbanSquare size={14} />}
              iconPosition="start"
              label={(
                <ColoredTooltip title={t('operations_board_tab_board')} placement="top" color={PANEL_COLORS[isDark ? 'dark' : 'light'].text}>
                  <span>{t('operations_board_tab_board')}</span>
                </ColoredTooltip>
              )}
              data-testid="operations-board-tab-board"
            />
            <Tab
              value="calendar"
              icon={<Calendar size={14} />}
              iconPosition="start"
              label={(
                <ColoredTooltip title={t('operations_board_tab_calendar')} placement="top" color={PANEL_COLORS[isDark ? 'dark' : 'light'].text}>
                  <span>{t('operations_board_tab_calendar')}</span>
                </ColoredTooltip>
              )}
              data-testid="operations-board-tab-calendar"
            />
          </Tabs>
        )}
        {panelTab !== 'calendar' && onLaneChange && !isInstructor && (
          <Tabs
            value={lane}
            onChange={(_, value) => onLaneChange?.(value)}
            data-tour="operations-board-lane-tabs"
            data-filter-tabs="true"
            sx={getLaneTabsContainerSx(isDark)}
            data-testid="operations-board-lane-tabs"
          >
            <Tab
              value="attendance"
              icon={<Users size={14} />}
              iconPosition="start"
              sx={getLaneTabSx(isDark, 'attendance')}
              label={(
                <ColoredTooltip title={viewMode === 'week' ? (t('operations_board_attendance_week_disabled') || 'Attendance board is not available in week mode') : (t('operations_board_tab_attendance') || 'Attendance')} placement="top" color={LANE_TAB_COLORS.attendance[isDark ? 'dark' : 'light'].text}>
                  <span>{t('operations_board_tab_attendance') || 'Attendance'}</span>
                </ColoredTooltip>
              )}
              data-testid="operations-board-tab-attendance"
              disabled={viewMode === 'week'}
            />
            {!isInstructor && (
            <Tab
              value="status"
              icon={<Workflow size={14} />}
              iconPosition="start"
              sx={getLaneTabSx(isDark, 'workflow')}
              label={(
                <ColoredTooltip title={t('operations_board_tab_workflow') || 'Workflow'} placement="top" color={LANE_TAB_COLORS.workflow[isDark ? 'dark' : 'light'].text}>
                  <span>{t('operations_board_tab_workflow') || 'Workflow'}</span>
                </ColoredTooltip>
              )}
              data-testid="operations-board-tab-workflow"
            />
            )}
          </Tabs>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          {panelTab === 'board' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
              {(lane === 'status' || lane === 'attendance') && welcomeContext?.classes?.length > 0 && (
                <div className="min-w-0" style={{ flex: 2, minWidth: 0 }}>
                  <Select
                    value={filters.classId || ''}
                    onChange={(e) => {
                      const selectedValue = e.target?.value ?? e.value;
                      console.log('[BoardFilterBar] class Select onChange', { selectedValue, raw: e });
                      handleFilterUpdate('classId', selectedValue || undefined);
                    }}
                    options={welcomeContext.classes.map((c) => ({
                      value: String(c.id),
                      label: lang === 'ar' ? (c.nameAr || c.nameEn || c.code) : (c.nameEn || c.nameAr || c.code),
                    }))}
                    placeholder={t('all_classes') || 'All classes'}
                    searchable
                    fullWidth
                    theme={isDark ? 'dark' : 'light'}
                    size="small"
                    style={{ width: '100%', '--border': isDark ? '#4b5563' : '#9ca3af' }}
                  />
                </div>
              )}
              {(lane === 'status' || lane === 'attendance') && welcomeContext?.classes?.length > 0 && summaryReportIcons}
              <Box
                data-tour="operations-board-search"
                sx={{
                  position: 'relative',
                  flex: 1,
                  minWidth: 0,
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
                  placeholder={t('operations_board_search')}
                  value={filters.search || ''}
                  onChange={(e) => handleFilterUpdate('search', e.target.value)}
                  data-testid="operations-board-search"
                />
              </Box>
            </Box>
          )}
          {panelTab === 'calendar' && (lane === 'status' || lane === 'attendance') && welcomeContext?.classes?.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
              <div className="min-w-0" style={{ flex: 2, minWidth: 0 }}>
                <Select
                  value={filters.classId || ''}
                  onChange={(e) => {
                    const selectedValue = e.target?.value ?? e.value;
                    console.log('[BoardFilterBar] class Select onChange (calendar)', { selectedValue, raw: e });
                    handleFilterUpdate('classId', selectedValue || undefined);
                  }}
                  options={welcomeContext.classes.map((c) => ({
                    value: String(c.id),
                    label: lang === 'ar' ? (c.nameAr || c.nameEn || c.code) : (c.nameEn || c.nameAr || c.code),
                  }))}
                  placeholder={t('all_classes') || 'All classes'}
                  searchable
                  fullWidth
                  theme={isDark ? 'dark' : 'light'}
                  size="small"
                  style={{ width: '100%', '--border': isDark ? '#4b5563' : '#9ca3af' }}
                />
              </div>
              {summaryReportIcons}
              {filters.classId && (
                <ColoredTooltip
                  title={peekAllClasses ? (t('operations_board_show_selected_class') || 'Show selected class only') : (t('operations_board_peek_all_classes') || 'Peek all classes')}
                  color="#3b82f6"
                  placement="bottom"
                >
                  <IconButton
                    size="small"
                    onClick={() => setPeekAllClasses((prev) => !prev)}
                    data-testid="operations-board-peek-all-classes"
                    sx={{ width: 32, height: 32, flexShrink: 0, color: peekAllClasses ? 'primary.main' : 'text.secondary' }}
                  >
                    {peekAllClasses ? <Eye size={18} /> : <EyeOff size={18} />}
                  </IconButton>
                </ColoredTooltip>
              )}
            </Box>
          )}
          {showLaneReset && onAutoFitContent && (
            <ColoredTooltip
              title={t('operations_board_auto_fit_content') || 'Auto-fit content'}
              color="#3b82f6"
              placement="bottom"
            >
              <IconButton
                size="small"
                onClick={onAutoFitContent}
                data-testid="operations-board-auto-fit-content"
                sx={{ width: 32, height: 32, flexShrink: 0 }}
              >
                <LayoutTemplate size={16} />
              </IconButton>
            </ColoredTooltip>
          )}
          {showLaneReset && onAutoFitScreen && (
            <ColoredTooltip
              title={t('operations_board_expand_all') || 'Expand all'}
              color="#3b82f6"
              placement="bottom"
            >
              <IconButton
                size="small"
                onClick={onAutoFitScreen}
                data-testid="operations-board-auto-fit-screen"
                sx={{ width: 32, height: 32, flexShrink: 0 }}
              >
                <Expand size={16} />
              </IconButton>
            </ColoredTooltip>
          )}
          {panelTab === 'board' && lane === CARD_TYPE.ATTENDANCE && onToggleShowAvatars && !isInstructor && (
            <ColoredTooltip
              title={showAvatars ? (t('operations_board_hide_avatars') || 'Hide avatars') : (t('operations_board_show_avatars') || 'Show avatars')}
              color="#3b82f6"
              placement="bottom"
            >
              <IconButton
                size="small"
                onClick={onToggleShowAvatars}
                data-testid="operations-board-toggle-avatars"
                sx={{ width: 32, height: 32, flexShrink: 0, color: showAvatars ? 'primary.main' : 'text.secondary' }}
              >
                {showAvatars ? <User size={18} /> : <UserX size={18} />}
              </IconButton>
            </ColoredTooltip>
          )}
          {panelTab === 'board' && onSortChange && (
            <ToggleButtonGroup
              size="small"
              value={sortBy}
              exclusive
              onChange={(_, value) => value && onSortChange(value)}
              sx={{ flexShrink: 0, height: 32 }}
              data-testid="operations-board-sort"
              data-tour="operations-board-sort"
            >
              <ColoredTooltip
                title={t('operations_board_sort_system') || 'System Default'}
                color="#3b82f6"
                placement="bottom"
              >
                <ToggleButton value="system" sx={{ px: 1, py: 0.25, textTransform: 'none' }}>
                  <ArrowUpDown size={16} />
                </ToggleButton>
              </ColoredTooltip>
              <ColoredTooltip
                title={t('operations_board_sort_alpha') || 'Alphabetical'}
                color="#3b82f6"
                placement="bottom"
              >
                <ToggleButton value="alpha" sx={{ px: 1, py: 0.25, textTransform: 'none' }}>
                  <ArrowDownAZ size={16} />
                </ToggleButton>
              </ColoredTooltip>
            </ToggleButtonGroup>
          )}
        </Box>
      </Box>

      {panelTab === 'calendar' && (
        <Box sx={{ p: 1, flex: 1, minHeight: 0, overflow: 'auto' }} data-tour="operations-board-calendar">
          <BoardScheduleCalendar
            selectedDate={selectedDate}
            selectedClassId={filters.classId || null}
            showAllClasses={peekAllClasses}
            onDateSelect={handleDateSelect}
            welcomeContext={welcomeContext}
            onClassSessionClick={handleClassSessionClick}
            hideNotesParticipation={hideNotesParticipation}
            hideParticipation={hideParticipation}
            embedded={embedded}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            viewMode={viewMode}
            calendarView={calendarView}
            onCalendarViewChange={onCalendarViewChange}
          />
        </Box>
      )}
    </Box>
  );
}
