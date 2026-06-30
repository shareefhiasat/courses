import React, { useMemo, useState, memo, useEffect, useCallback, useRef } from 'react';
import { Filter, ZoomIn, ZoomOut, Maximize2, GripVertical } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { info, error, warn, debug } from '@services/utils/logger.js';
import ColumnManager from '../analytics/ColumnManager';
import PortalTooltip from '@ui/PortalTooltip';
import { Modal } from '@ui';
import {
  resolveUser,
  resolveClass,
  resolveProgram,
  normalizeAttendanceStatus,
  normalizeActivityType,
  formatDate,
  truncateId,
  resolveRelatedColumn
} from '@utils/listChartResolvers';
import { getWidgetDisplayTitle } from '@constants/schedulingSummaryWidgets';

/**
 * Helper function to get localized name for agenda items
 * @param {Object} item - Data item
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {string} Localized name
 */
const getLocalizedName = (item, lang) => {
  if (!item) return '';

  if (lang === 'ar') {
    return item.localize || item.nameAr || item.titleAr || item.instructorNameAr
      || item.displayNameAr || item.name || item.title || item.instructorName
      || item.courseLabel || item.code || item.docId || '';
  }

  return item.nameEn || item.titleEn || item.instructorName || item.displayNameEn
    || item.name || item.title || item.courseLabel || item.code || item.docId || '';
};

const TEXT_FILTER_COLUMN_KEYS = new Set([
  'studentName', 'studentNumber', 'title', 'titleEn', 'titleAr', 'markedBy',
  'instructorName', 'id', 'name', 'nameEn', 'nameAr', 'createdBy', 'courseLabel',
]);

function getColumnFilterMode(colKey, uniqueCount) {
  if (TEXT_FILTER_COLUMN_KEYS.has(colKey)) return 'text';
  if (uniqueCount > 0 && uniqueCount <= 25) return 'checkbox';
  return 'text';
}

function buildTableExport(columns, items, renderCellValue) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = columns.map((c) => escape(c.label)).join(',');
  const rows = items.map((item) => columns.map((c) => escape(renderCellValue(item, c))).join(','));
  return `\uFEFF${[header, ...rows].join('\n')}`;
}

function buildTableTsv(columns, items, renderCellValue) {
  const header = columns.map((c) => c.label).join('\t');
  const rows = items.map((item) => columns.map((c) => String(renderCellValue(item, c) ?? '').replace(/[\t\n]/g, ' ')).join('\t'));
  return [header, ...rows].join('\n');
}

/**
 * List Chart Component - Displays detailed data in a table format
 * @param {Array} data - Array of items to display
 * @param {Object} size - Widget size from grid layout
 * @param {string} chartType - Type of data (activity, attendance, enrollment)
 * @param {Object} rawData - Raw data for context
 * @param {string} accentColor - Theme accent color
 * @param {Object} widget - Widget configuration
 */
function ListChart({ 
  data = [], 
  size = { width: 400, height: 300 }, 
  chartType = 'list',
  rawData = {},
  accentColor = '#800020',
  widget = {},
  onListColumnsChange,
  onListConfigChange,
}) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(widget.listColumns || []);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [colWidths, setColWidths] = useState(widget.listColumnWidths || {});
  const [collapsedCols, setCollapsedCols] = useState(() => new Set(widget.collapsedColumns || []));
  const [sortState, setSortState] = useState(widget.listSort || null);
  const [columnFilters, setColumnFilters] = useState(widget.listColumnFilters || {});
  const [openFilterCol, setOpenFilterCol] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [fontScale, setFontScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggedColKey, setDraggedColKey] = useState(null);
  const [dragOverColKey, setDragOverColKey] = useState(null);
  const filterMenuRef = useRef(null);

  useEffect(() => {
    setSelectedColumns(widget.listColumns || []);
  }, [widget.id, widget.listColumns]);

  useEffect(() => {
    setColWidths(widget.listColumnWidths || {});
    setCollapsedCols(new Set(widget.collapsedColumns || []));
    setSortState(widget.listSort || null);
    setColumnFilters(widget.listColumnFilters || {});
  }, [widget.id, widget.listColumnWidths, widget.collapsedColumns, widget.listSort, widget.listColumnFilters]);

  useEffect(() => {
    if (!openFilterCol) return undefined;
    const onDocClick = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setOpenFilterCol(null);
        setFilterSearch('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openFilterCol]);

  const persistListConfig = useCallback((patch) => {
    onListConfigChange?.(patch);
  }, [onListConfigChange]);

  const rowLimit = Math.max(1, Math.min(500, Number(widget.listLimit) || 50));

  // Disable all logging to prevent console spam
  // // Comprehensive logging for debugging
  // info('[ListChart] Widget configuration:', {
  //   chartType,
  //   dataSource: widget.dataSource,
  //   groupBy: widget.groupBy,
  //   filterValue: widget.filterValue,
  //   rawDataKeys: Object.keys(rawData || {}),
  //   usersCount: rawData.users?.length || 0,
  //   classesCount: rawData.classes?.length || 0,
  //   attendanceCount: rawData.attendance?.length || 0,
  //   activitiesCount: rawData.activities?.length || 0
  // });
  // Get items based on widget configuration
  const items = useMemo(() => {
    if (!rawData || typeof rawData !== 'object') return [];
    
    let sourceData = [];
    const { dataSource, filters = [], groupBy } = widget;
    
    // Get the appropriate data source based on dataSource
    if (dataSource && dataSource.includes(',')) {
      // Handle multiple data sources for activities
      const sources = dataSource.split(',').map(s => s.trim()).filter(Boolean);
      sources.forEach(source => {
        const sourceItems = rawData[source] || [];
        sourceData.push(...sourceItems);
      });
    } else if (dataSource === 'attendance') {
      // Combine attendance data from multiple sources
      sourceData = [
        ...(rawData.attendance || []),
        ...(rawData.absences || []),
        ...(rawData.attendanceSessions || [])
      ];
    } else if (dataSource === 'enrollments') {
      sourceData = rawData.enrollments || [];
    } else if (dataSource === 'activities') {
      sourceData = rawData.activities || [];
    } else if (dataSource === 'announcements') {
      sourceData = rawData.announcements || [];
    } else if (dataSource === 'resources') {
      sourceData = rawData.resources || [];
    } else if (dataSource?.startsWith('scheduling')) {
      sourceData = rawData[dataSource] || [];
    } else if (rawData[dataSource]) {
      sourceData = rawData[dataSource] || [];
    } else {
      // Default: try to find any array in rawData
      sourceData = Object.values(rawData).find(item => Array.isArray(item)) || [];
    }
    
    if (!Array.isArray(sourceData)) return [];
    
    // Apply filters if specified
    let filteredData = sourceData;
    if (groupBy && widget.filterValue) {
      filteredData = sourceData.filter((item) => {
        if (widget.drillFilters && typeof widget.drillFilters === 'object') {
          const scopeOk = Object.entries(widget.drillFilters).every(
            ([key, val]) => item[key] != null && String(item[key]) === String(val),
          );
          if (!scopeOk) return false;
        }
        if (chartType === 'activity') {
          const itemType = normalizeActivityType(item.type || 'Unknown', t);
          return itemType === widget.filterValue;
        }
        if (chartType === 'attendance') {
          const status = item.status || item.attendanceType || item.absenceType || item.attendanceStatus || 'Unknown';
          return normalizeAttendanceStatus(status, t) === widget.filterValue;
        }
        if (chartType === 'enrollment') {
          return (item.programId || item.status) === widget.filterValue;
        }
        if (groupBy === 'date' && widget.filterValue) {
          const itemDate = item.date || item.startDate;
          if (itemDate) {
            const d = typeof itemDate === 'string' ? itemDate.slice(0, 10) : new Date(itemDate).toISOString().slice(0, 10);
            return d === String(widget.filterValue).slice(0, 10);
          }
        }
        const fieldVal = item[groupBy];
        return fieldVal != null && String(fieldVal) === String(widget.filterValue);
      });
    }

    const sortedData = [...filteredData].sort((a, b) => {
      const dateA = a.date || a.startDate || a.createdAt?.seconds || a.createdAt || 0;
      const dateB = b.date || b.startDate || b.createdAt?.seconds || b.createdAt || 0;
      return new Date(dateB) - new Date(dateA);
    });

    return {
      items: sortedData.slice(0, rowLimit),
      totalCount: sortedData.length,
    };
  }, [rawData, widget, chartType, t, rowLimit]);

  const listItems = items.items || [];
  const totalCount = items.totalCount ?? listItems.length;

  // Use centralized resolvers for consistent data mapping

  // Handle size - make it adaptive to container
  let chartWidth, chartHeight;
  if (typeof size === 'object' && size.width && size.height) {
    chartWidth = size.width;
    chartHeight = size.height;
  } else if (typeof size === 'number') {
    chartWidth = size;
    chartHeight = size;
  } else {
    chartWidth = 400;
    chartHeight = 300;
  }
  
  // Ensure minimum height for usability
  chartHeight = Math.max(chartHeight, 200);
  chartWidth = Math.max(chartWidth, 300);

  // Enhanced column configuration based on data source and user selection
  const getColumns = () => {
    // If user has selected specific columns, use those
    if (selectedColumns.length > 0) {
      return selectedColumns.map(colKey => {
        // Parse related collection columns (e.g., "users_studentEmail")
        if (colKey.includes('_')) {
          const [collection, field] = colKey.split('_');
          return {
            key: colKey,
            label: getFieldLabel(collection, field),
            width: getColumnWidth(field),
            isRelated: true,
            collection,
            field
          };
        }
        
        // Base columns
        return {
          key: colKey,
          label: getBaseColumnLabel(colKey),
          width: getColumnWidth(colKey),
          isRelated: false
        };
      });
    }

    // Default columns based on chart type
    if (chartType === 'activity') {
      return [
        { key: 'type', label: t('type') || 'Type', width: '12%', isRelated: false },
        { key: 'title', label: t('title') || 'Title', width: '25%', isRelated: false },
        { key: 'titleAr', label: t('title_arabic') || 'Title (AR)', width: '20%', isRelated: false },
        { key: 'createdBy', label: t('created_by') || 'Created By', width: '15%', isRelated: false },
        { key: 'createdAt', label: t('created_date') || 'Created', width: '13%', isRelated: false },
        { key: 'id', label: t('id') || 'ID', width: '15%', isRelated: false }
      ];
    } else if (chartType === 'attendance') {
      return [
        { key: 'studentName', label: t('student_name') || 'Student Name', width: '20%', isRelated: false },
        { key: 'studentNumber', label: t('student_number') || 'Student Number', width: '12%', isRelated: false },
        { key: 'status', label: t('status') || 'Status', width: '12%', isRelated: false },
        { key: 'date', label: t('date') || 'Date', width: '15%', isRelated: false },
        { key: 'className', label: t('class_name') || 'Class', width: '15%', isRelated: false },
        { key: 'notes', label: t('notes') || 'Notes', width: '16%', isRelated: false },
        { key: 'id', label: t('id') || 'ID', width: '10%', isRelated: false }
      ];
    } else if (chartType === 'penalty' || widget.dataSource === 'penalties') {
      return [
        { key: 'studentName', label: t('student_name') || 'Student Name', width: '18%', isRelated: false },
        { key: 'penaltyType', label: t('type') || 'Type', width: '15%', isRelated: false },
        { key: 'descriptionEn', label: t('description') || 'Description', width: '25%', isRelated: false },
        { key: 'points', label: t('points') || 'Points', width: '8%', isRelated: false },
        { key: 'date', label: t('date') || 'Date', width: '12%', isRelated: false },
        { key: 'className', label: t('class_name') || 'Class', width: '12%', isRelated: false },
        { key: 'id', label: t('id') || 'ID', width: '10%', isRelated: false }
      ];
    } else if (chartType === 'behavior' || widget.dataSource === 'behaviors') {
      return [
        { key: 'studentName', label: t('student_name') || 'Student Name', width: '18%', isRelated: false },
        { key: 'behaviorType', label: t('type') || 'Type', width: '15%', isRelated: false },
        { key: 'descriptionEn', label: t('description') || 'Description', width: '25%', isRelated: false },
        { key: 'points', label: t('points') || 'Points', width: '8%', isRelated: false },
        { key: 'date', label: t('date') || 'Date', width: '12%', isRelated: false },
        { key: 'className', label: t('class_name') || 'Class', width: '12%', isRelated: false },
        { key: 'id', label: t('id') || 'ID', width: '10%', isRelated: false }
      ];
    } else if (chartType === 'participation' || widget.dataSource === 'participations') {
      return [
        { key: 'studentName', label: t('student_name') || 'Student Name', width: '18%', isRelated: false },
        { key: 'participationType', label: t('type') || 'Type', width: '15%', isRelated: false },
        { key: 'descriptionEn', label: t('description') || 'Description', width: '25%', isRelated: false },
        { key: 'points', label: t('points') || 'Points', width: '8%', isRelated: false },
        { key: 'date', label: t('date') || 'Date', width: '12%', isRelated: false },
        { key: 'className', label: t('class_name') || 'Class', width: '12%', isRelated: false },
        { key: 'id', label: t('id') || 'ID', width: '10%', isRelated: false }
      ];
    } else if (chartType === 'enrollment') {
      return [
        { key: 'programName', label: t('gb_program') || 'Program', width: '25%', isRelated: false },
        { key: 'studentName', label: t('student_name') || 'Student', width: '30%', isRelated: false },
        { key: 'studentNumber', label: t('student_number') || 'Student Number', width: '15%', isRelated: false },
        { key: 'className', label: t('class_name') || 'Class', width: '20%', isRelated: false },
        { key: 'status', label: t('status') || 'Status', width: '10%', isRelated: false }
      ];
    } else if (widget.dataSource === 'studentMarks') {
      return [
        { key: 'studentName', label: t('student_name') || 'Student Name', width: '15%', isRelated: false },
        { key: 'subjectName', label: t('gb_subject') || 'Subject', width: '12%', isRelated: false },
        { key: 'className', label: t('class_name') || 'Class', width: '12%', isRelated: false },
        { key: 'totalMarks', label: t('total_marks') || 'Total', width: '8%', isRelated: false },
        { key: 'letterGrade', label: t('grade') || 'Grade', width: '7%', isRelated: false },
        { key: 'isRepeated', label: t('repeated') || 'Repeated', width: '8%', isRelated: false },
        { key: 'term', label: t('term') || 'Term', width: '12%', isRelated: false },
        { key: 'year', label: t('year') || 'Year', width: '8%', isRelated: false },
        { key: 'id', label: t('id') || 'ID', width: '10%', isRelated: false }
      ];
    } else if (widget.dataSource === 'schedulingAttendanceRecords') {
      return [
        { key: 'date', label: t('date') || 'Date', width: '12%', isRelated: false },
        { key: 'attendanceTypeLabel', label: t('attendance_type') || 'Type', width: '14%', isRelated: false },
        { key: 'status', label: t('status') || 'Status', width: '12%', isRelated: false },
        { key: 'studentName', label: t('student_name') || 'Student', width: '18%', isRelated: false },
        { key: 'studentNumber', label: t('student_number') || 'Number', width: '10%', isRelated: false },
        { key: 'programName', label: t('gb_program') || 'Program', width: '16%', isRelated: false },
        { key: 'className', label: t('class_name') || 'Class', width: '14%', isRelated: false },
        { key: 'instructorName', label: t('gb_instructor') || 'Instructor', width: '14%', isRelated: false },
        { key: 'markedBy', label: t('marked_by') || 'Marked by', width: '12%', isRelated: false },
      ];
    } else if (widget.dataSource === 'schedulingInstructorWorkload') {
      return [
        { key: 'instructorName', label: t('gb_instructor') || 'Instructor', width: '28%', isRelated: false },
        { key: 'assignedHours', label: t('assigned_hours') || 'Assigned (h)', width: '16%', isRelated: false },
        { key: 'capacityHours', label: t('capacity_hours') || 'Capacity (h)', width: '16%', isRelated: false },
        { key: 'utilizationPct', label: t('vf_utilizationPct') || 'Utilization %', width: '14%', isRelated: false },
        { key: 'metricLabel', label: t('summary') || 'Summary', width: '26%', isRelated: false },
      ];
    } else if (widget.dataSource === 'schedulingTeachers') {
      return [
        { key: 'instructorName', label: t('gb_instructor') || 'Instructor', width: '30%', isRelated: false },
        { key: 'sessionCount', label: t('vf_sessionCount') || 'Sessions', width: '14%', isRelated: false },
        { key: 'teachingHours', label: t('vf_teachingHours') || 'Hours', width: '14%', isRelated: false },
        { key: 'primarySubject', label: t('gb_subject') || 'Subject', width: '22%', isRelated: false },
        { key: 'classCount', label: t('vf_classCount') || 'Classes', width: '10%', isRelated: false },
      ];
    } else if (widget.dataSource === 'schedulingCourses') {
      return [
        { key: 'courseLabel', label: t('gb_course') || 'Course', width: '35%', isRelated: false },
        { key: 'sessionCount', label: t('vf_sessionCount') || 'Sessions', width: '12%', isRelated: false },
        { key: 'teachingHours', label: t('vf_teachingHours') || 'Hours', width: '12%', isRelated: false },
        { key: 'location', label: t('gb_location') || 'Location', width: '20%', isRelated: false },
        { key: 'capacity', label: t('capacity') || 'Capacity', width: '10%', isRelated: false },
      ];
    } else if (widget.dataSource === 'driveRecentFiles') {
      return [
        { key: 'name', label: t('name') || 'Name', width: '35%', isRelated: false },
        { key: 'mimeType', label: t('type') || 'Type', width: '12%', isRelated: false },
        { key: 'size', label: t('size') || 'Size', width: '12%', isRelated: false },
        { key: 'bucket', label: t('bucket') || 'Bucket', width: '15%', isRelated: false },
        { key: 'createdAt', label: t('created_date') || 'Created', width: '15%', isRelated: false },
        { key: 'id', label: t('id') || 'ID', width: '11%', isRelated: false },
      ];
    } else if (widget.dataSource?.startsWith('scheduling')) {
      return [
        { key: 'title', label: t('title') || 'Title', width: '30%', isRelated: false },
        { key: 'status', label: t('status') || 'Status', width: '15%', isRelated: false },
        { key: 'date', label: t('date') || 'Date', width: '15%', isRelated: false },
        { key: 'instructorName', label: t('gb_instructor') || 'Instructor', width: '20%', isRelated: false },
        { key: 'sessionCount', label: t('vf_sessionCount') || 'Count', width: '10%', isRelated: false },
      ];
    }
    // Default columns
    return [
      { key: 'name', label: t('name') || 'Name', width: '40%', isRelated: false },
      { key: 'type', label: t('type') || 'Type', width: '20%', isRelated: false },
      { key: 'date', label: t('date') || 'Date', width: '20%', isRelated: false },
      { key: 'status', label: t('status') || 'Status', width: '20%', isRelated: false }
    ];
  };

  // Helper functions for dynamic column handling
  const getBaseColumnLabel = (key) => {
    const labels = {
      type: t('type') || 'Type',
      title: t('title') || 'Title',
      titleEn: t('title_english') || 'Title (EN)',
      titleAr: t('title_arabic') || 'Title (AR)',
      createdBy: t('created_by') || 'Created By',
      createdAt: t('created_date') || 'Created',
      studentName: t('student_name') || 'Student Name',
      studentNumber: t('student_number') || 'Student Number',
      status: t('status') || 'Status',
      date: t('date') || 'Date',
      programName: t('gb_program') || 'Program',
      className: t('class_name') || 'Class',
      instructorName: t('gb_instructor') || 'Instructor',
      markedBy: t('marked_by') || 'Marked by',
      attendanceTypeLabel: t('attendance_type') || 'Type',
      nameEn: t('program_name_en') || 'Program Name (EN)',
      nameAr: t('program_name_ar') || 'Program Name (AR)',
      realNameEn: t('full_name_en') || 'Full Name (EN)',
      realNameAr: t('full_name_ar') || 'Full Name (AR)',
      displayNameEn: t('display_name_en') || 'Display Name (EN)',
      displayNameAr: t('display_name_ar') || 'Display Name (AR)',
      totalMarks: t('total_marks') || 'Total Marks',
      letterGrade: t('grade') || 'Grade',
      isRepeated: t('repeated') || 'Repeated',
      term: t('term') || 'Term',
      year: t('year') || 'Year',
      id: t('id') || 'ID',
      name: t('name') || 'Name',
      mimeType: t('type') || 'Type',
      size: t('size') || 'Size',
      bucket: t('bucket') || 'Bucket',
    };
    return labels[key] || key;
  };

  const getFieldLabel = (collection, field) => {
    const labels = {
      users: {
        studentEmail: t('student_email') || 'Student Email',
        studentPhone: t('student_phone') || 'Student Phone',
        studentAddress: t('student_address') || 'Student Address',
        parentName: t('parent_name') || 'Parent Name',
        creatorEmail: t('creator_email') || 'Creator Email',
        creatorRole: t('creator_role') || 'Creator Role'
      },
      classes: {
        classInstructor: t('class_instructor') || 'Class Instructor',
        classSchedule: t('class_schedule') || 'Class Schedule',
        classRoom: t('class_room') || 'Class Room',
        className: t('class_name') || 'Class Name',
        classSubject: t('class_subject') || 'Class Subject'
      },
      quizzes: {
        quizTitle: t('quiz_title') || 'Quiz Title',
        quizDifficulty: t('quiz_difficulty') || 'Quiz Difficulty'
      },
      programs: {
        programDuration: t('program_duration') || 'Program Duration',
        programType: t('program_type') || 'Program Type'
      }
    };
    return labels[collection]?.[field] || field;
  };

  const getColumnWidth = (key) => {
    const widths = {
      type: '12%',
      title: '25%',
      titleEn: '20%',
      titleAr: '20%',
      createdBy: '15%',
      createdAt: '13%',
      studentName: '25%',
      studentNumber: '15%',
      status: '15%',
      date: '15%',
      nameEn: '20%',
      nameAr: '20%',
      realNameEn: '20%',
      realNameAr: '20%',
      displayNameEn: '20%',
      displayNameAr: '20%',
      id: '10%',
      name: '35%',
      mimeType: '12%',
      size: '12%',
      bucket: '15%',
      // Related columns
      studentEmail: '18%',
      studentPhone: '12%',
      studentAddress: '20%',
      parentName: '18%',
      creatorEmail: '18%',
      creatorRole: '12%',
      classInstructor: '15%',
      classSchedule: '15%',
      classRoom: '10%',
      classSubject: '12%',
      quizTitle: '20%',
      quizDifficulty: '12%',
      programDuration: '12%',
      programType: '12%'
    };
    return widths[key] || '15%';
  };

  const columns = getColumns();

  const handleColumnReorder = useCallback((fromKey, toKey) => {
    if (fromKey === toKey) return;
    const currentKeys = columns.map(c => c.key);
    const fromIdx = currentKeys.indexOf(fromKey);
    const toIdx = currentKeys.indexOf(toKey);
    if (fromIdx === -1 || toIdx === -1) return;
    const newKeys = [...currentKeys];
    newKeys.splice(fromIdx, 1);
    newKeys.splice(toIdx, 0, fromKey);
    setSelectedColumns(newKeys);
    onListColumnsChange?.(newKeys);
  }, [columns, onListColumnsChange]);

  const getResolvedWidth = useCallback((col) => {
    if (collapsedCols.has(col.key)) return 28;
    if (colWidths[col.key]) return colWidths[col.key];
    const w = col.width;
    if (typeof w === 'string' && w.endsWith('%')) {
      return Math.max(60, Math.round((parseFloat(w) / 100) * chartWidth));
    }
    return parseInt(w, 10) || 120;
  }, [colWidths, collapsedCols, chartWidth]);

  const tableMinWidth = useMemo(
    () => columns.reduce((sum, col) => sum + getResolvedWidth(col), 0),
    [columns, getResolvedWidth],
  );

  // Enhanced cell rendering with smart data mapping
  const pickLocalized = (item, field) => {
    const arKey = `${field}Ar`;
    const val = lang === 'ar' ? (item[arKey] || item[field]) : (item[field] || item[arKey]);
    // Normalize object values from API (e.g., {id, code, nameEn, nameAr})
    if (val && typeof val === 'object') return val.nameAr || val.nameEn || val.code || val.name || String(val.id || '') || '—';
    return val || '—';
  };

  const renderCellValue = (item, column) => {
    if (column.isRelated) {
      return resolveRelatedColumn(item, column.key, rawData, t);
    }

    // Helper to resolve nested user object from API
    const resolveStudentName = (item) => {
      if (item.studentName) return item.studentName;
      if (item.user) {
        const u = item.user;
        if (lang === 'ar' && (u.displayNameAr || (u.firstNameAr && u.lastNameAr))) {
          return u.displayNameAr || `${u.firstNameAr} ${u.lastNameAr}`.trim();
        }
        return u.displayName || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}`.trim() : '') || u.realName || u.email || '—';
      }
      return '—';
    };

    const resolveClassName = (item) => {
      if (item.className) return item.className;
      if (item.class) {
        const c = item.class;
        return lang === 'ar' ? (c.nameAr || c.nameEn || c.code || '—') : (c.nameEn || c.nameAr || c.code || '—');
      }
      return '—';
    };

    const resolveStudentNumber = (item) => {
      if (item.studentNumber) return item.studentNumber;
      if (item.user?.studentNumber) return item.user.studentNumber;
      return '—';
    };

    const resolveTypeLabel = (typeObj) => {
      if (!typeObj) return '—';
      if (typeof typeObj === 'string') return typeObj;
      if (typeof typeObj === 'object') {
        return lang === 'ar' ? (typeObj.nameAr || typeObj.nameEn || typeObj.code || '—') : (typeObj.nameEn || typeObj.nameAr || typeObj.code || '—');
      }
      return String(typeObj);
    };

    switch (column.key) {
      case 'type':
        return normalizeActivityType(item.type || item.activityType, t);
      
      case 'title':
        return getLocalizedName(item, lang) || item.label || item.courseLabel || t('not_specified');

      case 'instructorName':
        return pickLocalized(item, 'instructorName');

      case 'assignedHours':
      case 'capacityHours':
      case 'utilizationPct':
      case 'sessionCount':
      case 'teachingHours':
      case 'classCount':
      case 'subjectCount':
        return item[column.key] ?? '—';

      case 'courseLabel':
      case 'metricLabel':
      case 'location':
      case 'capacity':
      case 'primarySubject':
      case 'subjectName':
      case 'breakType':
      case 'roomName':
        return item[column.key] ?? '—';

      case 'programName':
        return pickLocalized(item, 'programName');
      case 'className':
        return resolveClassName(item);
      case 'studentName':
        return resolveStudentName(item);
      case 'markedBy':
        return pickLocalized(item, 'markedBy');

      case 'attendanceTypeLabel':
        if (item.attendanceType === 'daily') {
          return lang === 'ar' ? (t('daily_attendance') || 'الحضور اليومي') : (t('daily_attendance_en') || 'Daily attendance');
        }
        return lang === 'ar' ? (t('class_attendance') || 'حضور الصف') : (t('class_attendance_en') || 'Class attendance');

      case 'studentNumber':
        return resolveStudentNumber(item);

      case 'titleEn':
        return item.titleEn || getLocalizedName(item, 'en') || '—';
        
      case 'titleAr':
        return item.titleAr || getLocalizedName(item, 'ar') || '—';
      
      case 'createdBy':
        const creator = resolveUser(item.createdBy, rawData.users, t);
        return creator.name;
      
      case 'createdAt':
        return formatDate(item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : item.createdAt, t);

      case 'status':
        if (item.status) {
          if (typeof item.status === 'object') {
            return lang === 'ar' ? (item.status.nameAr || item.status.nameEn || item.status.code || '—') : (item.status.nameEn || item.status.nameAr || item.status.code || '—');
          }
          return normalizeAttendanceStatus(item.status, t);
        }
        if (item.statusAr) return pickLocalized(item, 'status');
        return normalizeAttendanceStatus(item.attendanceType || item.absenceType || item.attendanceStatus, t);

      case 'date':
        if (item.date) return formatDate(item.date?.seconds ? new Date(item.date.seconds * 1000) : item.date, t);
        if (item.createdAt) return formatDate(item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : item.createdAt, t);
        return '—';

      case 'penaltyType':
        return resolveTypeLabel(item.penaltyType);

      case 'behaviorType':
        return resolveTypeLabel(item.behaviorType);

      case 'participationType':
        return resolveTypeLabel(item.participationType);

      case 'descriptionEn':
        if (lang === 'ar' && item.descriptionAr) return item.descriptionAr;
        return item.descriptionEn || item.description || item.comment || '—';

      case 'points':
        return item.points ?? '—';

      case 'totalMarks':
        return item.totalMarks != null ? `${item.totalMarks}%` : '—';

      case 'letterGrade':
        return item.letterGrade || '—';

      case 'isRepeated':
        if (item.isRepeated === true) return t('yes') || 'Yes';
        if (item.isRepeated === false) return t('no') || 'No';
        return '—';

      case 'term':
        return item.term || '—';

      case 'year':
        return item.year || '—';

      case 'notes':
        return item.notes || item.comment || '—';

      case 'titleEn':
        return item.titleEn || getLocalizedName(item, 'en') || '—';

      case 'nameEn':
        if (item.nameEn) {
          return item.nameEn || getLocalizedName(item, 'en') || '—';
        }
        if (item.classId) {
          const classInfoEn = resolveClass(item.classId, rawData.classes, t);
          return classInfoEn.nameEn || classInfoEn.name || getLocalizedName(item, 'en') || '—';
        }
        if (item.programId || item.id) {
          const programEn = resolveProgram(item.programId || item.id, rawData.programs, t);
          return programEn.nameEn || programEn.name || getLocalizedName(item, 'en') || '—';
        }
        return getLocalizedName(item, 'en') || '—';
        
      case 'nameAr':
        // Handle different entity types for nameAr
        if (item.nameAr) {
          return item.nameAr || getLocalizedName(item, 'ar') || '—';
        }
        if (item.classId) {
          const classInfoAr = resolveClass(item.classId, rawData.classes, t);
          return classInfoAr.nameAr || classInfoAr.name || getLocalizedName(item, 'ar') || '—';
        }
        if (item.programId || item.id) {
          const programAr = resolveProgram(item.programId || item.id, rawData.programs, t);
          return programAr.nameAr || programAr.name || getLocalizedName(item, 'ar') || '—';
        }
        return getLocalizedName(item, 'ar') || '—';
      
      case 'realNameEn':
        const userEn = resolveUser(item.userId || item.studentId || item.id, rawData.users, t);
        return userEn.nameEn || '—';
        
      case 'realNameAr':
        const userAr = resolveUser(item.userId || item.studentId || item.id, rawData.users, t);
        return userAr.nameAr || '—';
        
      case 'displayName':
        return getLocalizedName(item, lang) || item.displayName || item.display_name || item.realName || '—';
        
      case 'displayNameEn':
        return item.displayNameEn || item.display_name_en || getLocalizedName(item, 'en') || item.displayName || item.realName || '—';
        
      case 'displayNameAr':
        return item.displayNameAr || item.display_name_ar || getLocalizedName(item, 'ar') || item.displayName || item.realName || '—';
      
      case 'mimeType': {
        const mime = item.mimeType || item.type;
        if (!mime) return '—';
        const MIME_TO_EXT = {
          'application/pdf': 'PDF',
          'image/png': 'PNG',
          'image/jpeg': 'JPG',
          'image/jpg': 'JPG',
          'image/gif': 'GIF',
          'image/webp': 'WEBP',
          'image/svg+xml': 'SVG',
          'image/bmp': 'BMP',
          'image/tiff': 'TIFF',
          'video/mp4': 'MP4',
          'video/webm': 'WEBM',
          'video/avi': 'AVI',
          'video/mov': 'MOV',
          'video/quicktime': 'MOV',
          'audio/mpeg': 'MP3',
          'audio/mp3': 'MP3',
          'audio/wav': 'WAV',
          'audio/ogg': 'OGG',
          'application/msword': 'DOC',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
          'application/vnd.ms-excel': 'XLS',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
          'application/vnd.ms-powerpoint': 'PPT',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
          'application/zip': 'ZIP',
          'application/x-zip-compressed': 'ZIP',
          'application/x-rar-compressed': 'RAR',
          'application/x-7z-compressed': '7Z',
          'application/json': 'JSON',
          'application/xml': 'XML',
          'text/xml': 'XML',
          'text/plain': 'TXT',
          'text/csv': 'CSV',
          'text/html': 'HTML',
          'text/css': 'CSS',
          'text/javascript': 'JS',
          'application/javascript': 'JS',
          'application/x-pdf': 'PDF',
          'application/octet-stream': 'FILE',
          'application/x-directory': 'DIR',
        };
        const lower = mime.toLowerCase();
        if (MIME_TO_EXT[lower]) return MIME_TO_EXT[lower];
        const parts = lower.split('/');
        if (parts.length > 1) {
          return parts[parts.length - 1].replace(/^x-/, '').toUpperCase();
        }
        return mime.toUpperCase();
      }

      case 'size': {
        const bytes = item.size || 0;
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
      }

      case 'bucket':
        return item.bucket ? item.bucket.replace(/^lms-/, '').toUpperCase() : '—';

      case 'id':
        return truncateId(item.id || item.docId, 8);
      
      case 'penaltyType':
        return item.penaltyType || item.type || t('not_specified');
      
      case 'points':
        return item.points || item.score || '—';
      
      case 'reason':
      case 'notes':
      case 'description':
        return item[column.key] || '—';
      
      case 'severity':
        return item.severity || item.level || '—';
      
      default:
        return item[column.key] ?? '—';
    }
  };

  const columnFilteredItems = useMemo(() => {
    const activeFilters = Object.entries(columnFilters || {}).filter(([, v]) => {
      if (v == null || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    });
    if (!activeFilters.length) return listItems;

    return listItems.filter((item) => activeFilters.every(([key, filter]) => {
      const col = columns.find((c) => c.key === key);
      if (!col) return true;
      const val = String(renderCellValue(item, col) ?? '');
      if (Array.isArray(filter)) return filter.includes(val);
      return val.toLowerCase().includes(String(filter).toLowerCase());
    }));
  }, [listItems, columnFilters, columns, lang, t, rawData]);

  const displayItems = useMemo(() => {
    if (!sortState?.key) return columnFilteredItems;
    const col = columns.find((c) => c.key === sortState.key);
    if (!col) return columnFilteredItems;
    const dir = sortState.dir === 'desc' ? -1 : 1;
    return [...columnFilteredItems].sort((a, b) => {
      const av = String(renderCellValue(a, col) ?? '');
      const bv = String(renderCellValue(b, col) ?? '');
      const an = Number(av);
      const bn = Number(bv);
      if (!Number.isNaN(an) && !Number.isNaN(bn) && av !== '' && bv !== '') {
        return (an - bn) * dir;
      }
      return av.localeCompare(bv, undefined, { numeric: true }) * dir;
    });
  }, [columnFilteredItems, sortState, columns, lang, t, rawData]);

  const getColumnUniqueValues = useCallback((colKey) => {
    const col = columns.find((c) => c.key === colKey);
    if (!col) return [];
    const values = new Set();
    listItems.forEach((item) => {
      const v = renderCellValue(item, col);
      if (v != null && v !== '' && v !== '—') values.add(String(v));
    });
    return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [columns, listItems, lang, t, rawData]);

  const isColumnFilterActive = useCallback((colKey) => {
    const f = columnFilters?.[colKey];
    if (f == null || f === '') return false;
    if (Array.isArray(f)) return f.length > 0;
    return true;
  }, [columnFilters]);

  const toggleColumnFilterValue = useCallback((colKey, value) => {
    setColumnFilters((prev) => {
      const current = Array.isArray(prev[colKey]) ? [...prev[colKey]] : [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const updated = { ...prev, [colKey]: next };
      if (!next.length) delete updated[colKey];
      persistListConfig({ listColumnFilters: updated });
      return updated;
    });
  }, [persistListConfig]);

  const setColumnTextFilter = useCallback((colKey, text) => {
    setColumnFilters((prev) => {
      const updated = { ...prev };
      if (!text) delete updated[colKey];
      else updated[colKey] = text;
      persistListConfig({ listColumnFilters: updated });
      return updated;
    });
  }, [persistListConfig]);

  const clearColumnFilter = useCallback((colKey) => {
    setColumnFilters((prev) => {
      const updated = { ...prev };
      delete updated[colKey];
      persistListConfig({ listColumnFilters: updated });
      return updated;
    });
    setOpenFilterCol(null);
    setFilterSearch('');
  }, [persistListConfig]);

  const handleHeaderClick = useCallback((col) => {
    setSortState((prev) => {
      let next;
      if (prev?.key !== col.key) next = { key: col.key, dir: 'asc' };
      else if (prev.dir === 'asc') next = { key: col.key, dir: 'desc' };
      else next = null;
      persistListConfig({ listSort: next });
      return next;
    });
  }, [persistListConfig]);

  const handleHeaderDblClick = useCallback((col, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsedCols((prev) => {
      const next = new Set(prev);
      if (next.has(col.key)) next.delete(col.key);
      else next.add(col.key);
      persistListConfig({ collapsedColumns: [...next] });
      return next;
    });
  }, [persistListConfig]);

  const startColumnResize = useCallback((colKey, e) => {
    e.preventDefault();
    e.stopPropagation();
    const col = columns.find((c) => c.key === colKey);
    if (!col) return;
    const startX = e.clientX;
    const startW = getResolvedWidth(col);
    const onMove = (ev) => {
      const delta = ev.clientX - startX;
      setColWidths((prev) => ({ ...prev, [colKey]: Math.max(48, startW + delta) }));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      setColWidths((prev) => {
        persistListConfig({ listColumnWidths: { ...prev } });
        return prev;
      });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [columns, getResolvedWidth, persistListConfig]);

  const handleCopy = useCallback(async () => {
    try {
      const tsv = buildTableTsv(columns, listItems, renderCellValue);
      await navigator.clipboard.writeText(tsv);
      setCopyFeedback(t('copied') || 'Copied');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch {
      setCopyFeedback(t('copy_failed') || 'Copy failed');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  }, [columns, displayItems, t]);

  const handleExport = useCallback(() => {
    const csv = buildTableExport(columns, displayItems, renderCellValue);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(widget.title || 'list_export').replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, listItems, widget.title]);

  const headerBtnStyle = {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '2px 6px',
    cursor: 'pointer',
    fontSize: '10px',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const listTitle = getWidgetDisplayTitle(widget, t, lang);

  if (listItems.length === 0) {
    return (
      <div style={{
        width: chartWidth,
        height: chartHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '14px',
      }}>
        {t('no_data_available') || 'No data available'}
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minWidth: chartWidth,
      minHeight: chartHeight,
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'var(--font-family-sans)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        background: `${accentColor}15`,
        borderBottom: `2px solid ${accentColor}`,
        borderRadius: '6px 6px 0 0',
        fontSize: '12px',
        fontWeight: '600',
        color: accentColor,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          {listTitle} ({displayItems.length} {t('items_label') || t('items') || 'items'})
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {copyFeedback && <span style={{ fontSize: 10, color: accentColor }}>{copyFeedback}</span>}
          <PortalTooltip content={t('copy_list') || 'Copy'} position="top">
            <button type="button" onClick={handleCopy} style={headerBtnStyle}>
              {getThemedIcon('ui', 'copy', 12, theme)}
            </button>
          </PortalTooltip>
          <PortalTooltip content={t('export_list') || 'Export CSV'} position="top">
            <button type="button" onClick={handleExport} style={headerBtnStyle}>
              {getThemedIcon('ui', 'download', 12, theme)}
            </button>
          </PortalTooltip>
          <PortalTooltip content={t('font_decrease') || 'Decrease font'} position="top">
            <button type="button" onClick={() => setFontScale(s => Math.max(0.7, s - 0.1))} style={headerBtnStyle}>
              <ZoomOut size={12} />
            </button>
          </PortalTooltip>
          <span style={{ fontSize: 9, color: 'var(--muted)', minWidth: 28, textAlign: 'center' }}>{Math.round(fontScale * 100)}%</span>
          <PortalTooltip content={t('font_increase') || 'Increase font'} position="top">
            <button type="button" onClick={() => setFontScale(s => Math.min(2, s + 0.1))} style={headerBtnStyle}>
              <ZoomIn size={12} />
            </button>
          </PortalTooltip>
          <PortalTooltip content={t('fullscreen_view') || 'Full view'} position="top">
            <button type="button" onClick={() => setIsFullscreen(true)} style={headerBtnStyle}>
              <Maximize2 size={12} />
            </button>
          </PortalTooltip>
          <PortalTooltip content={t('manage_columns')} position="top">
        <button
          type="button"
          onClick={() => setShowColumnManager(true)}
          style={headerBtnStyle}
          aria-label={t('columns')}
        >
          {getThemedIcon('ui', 'settings', 12, theme)}
        </button>
      </PortalTooltip>
        </div>
      </div>

      {/* Table */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        border: '1px solid var(--border)',
        borderRadius: '0 0 6px 6px',
        background: 'var(--panel)',
      }}>
        <div style={{ minWidth: tableMinWidth, width: 'max-content', paddingInlineEnd: 12, boxSizing: 'border-box' }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          fontSize: `${10 * fontScale}px`,
          fontWeight: '600',
          color: 'var(--muted)',
          position: 'sticky',
          top: 0,
          zIndex: 2,
          minWidth: tableMinWidth,
        }}>
          {columns.map((column) => {
            const isCollapsed = collapsedCols.has(column.key);
            const width = getResolvedWidth(column);
            const isSorted = sortState?.key === column.key;
            const filterActive = isColumnFilterActive(column.key);
            const uniqueValues = getColumnUniqueValues(column.key);
            const filterMode = getColumnFilterMode(column.key, uniqueValues.length);
            const isFilterOpen = openFilterCol === column.key;
            const filteredUniqueValues = filterSearch
              ? uniqueValues.filter((v) => v.toLowerCase().includes(filterSearch.toLowerCase()))
              : uniqueValues;
            return (
            <div
              key={column.key}
              draggable
              onDragStart={(e) => { setDraggedColKey(column.key); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverColKey(column.key); }}
              onDragLeave={() => setDragOverColKey(null)}
              onDrop={(e) => { e.preventDefault(); if (draggedColKey) handleColumnReorder(draggedColKey, column.key); setDraggedColKey(null); setDragOverColKey(null); }}
              onDragEnd={() => { setDraggedColKey(null); setDragOverColKey(null); }}
              style={{
                padding: '6px 8px',
                width,
                minWidth: isCollapsed ? 28 : 48,
                maxWidth: width,
                borderInlineEnd: '1px solid var(--border)',
                overflow: 'visible',
                cursor: 'grab',
                userSelect: 'none',
                position: 'relative',
                flexShrink: 0,
                background: dragOverColKey === column.key ? `${accentColor}25` : (isSorted || filterActive ? `${accentColor}10` : 'transparent'),
                opacity: draggedColKey === column.key ? 0.5 : 1,
                borderInlineStart: dragOverColKey === column.key && draggedColKey !== column.key ? `2px solid ${accentColor}` : 'none',
              }}
              onDoubleClick={(e) => handleHeaderDblClick(column, e)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
                <GripVertical size={10} style={{ flexShrink: 0, color: 'var(--muted)', opacity: 0.5, cursor: 'grab' }} />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleHeaderClick(column)}
                  title={isCollapsed ? `${column.label} — ${t('double_click_expand') || 'Double-click to expand'}` : `${column.label} — ${t('click_sort') || 'Click to sort'}`}
                >
                  {isCollapsed ? '*' : column.label}
                  {!isCollapsed && isSorted && (
                    <span style={{ marginInlineStart: 4, fontSize: 9 }}>{sortState.dir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenFilterCol(isFilterOpen ? null : column.key);
                      setFilterSearch('');
                    }}
                    title={t('column_filter') || 'Filter column'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 2,
                      border: 'none',
                      background: filterActive ? `${accentColor}22` : 'transparent',
                      borderRadius: 3,
                      cursor: 'pointer',
                      flexShrink: 0,
                      color: filterActive ? accentColor : 'var(--muted)',
                    }}
                  >
                    <Filter size={10} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              {!isCollapsed && isFilterOpen && (
                <div
                  ref={filterMenuRef}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    insetInlineStart: 0,
                    minWidth: 160,
                    maxWidth: 240,
                    maxHeight: 220,
                    overflow: 'auto',
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 200,
                    padding: 8,
                    fontSize: 10,
                    fontWeight: 400,
                    color: 'var(--text)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 9, color: 'var(--muted)' }}>
                      {t('column_filter') || 'Filter'}
                    </span>
                    {filterActive && (
                      <button
                        type="button"
                        onClick={() => clearColumnFilter(column.key)}
                        style={{ border: 'none', background: 'none', color: accentColor, cursor: 'pointer', fontSize: 9, padding: 0 }}
                      >
                        {t('filter_clear') || 'Clear'}
                      </button>
                    )}
                  </div>
                  {filterMode === 'text' ? (
                    <input
                      type="text"
                      autoFocus
                      value={typeof columnFilters[column.key] === 'string' ? columnFilters[column.key] : ''}
                      onChange={(e) => setColumnTextFilter(column.key, e.target.value)}
                      placeholder={t('filter_search') || 'Search…'}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: 10,
                        boxSizing: 'border-box',
                      }}
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        autoFocus
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder={t('filter_search') || 'Search…'}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          marginBottom: 6,
                          border: '1px solid var(--border)',
                          borderRadius: 4,
                          background: 'var(--bg)',
                          color: 'var(--text)',
                          fontSize: 10,
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const all = uniqueValues;
                            setColumnFilters((prev) => {
                              const updated = { ...prev, [column.key]: all };
                              persistListConfig({ listColumnFilters: updated });
                              return updated;
                            });
                          }}
                          style={{ border: 'none', background: 'none', color: accentColor, cursor: 'pointer', fontSize: 9, padding: 0 }}
                        >
                          {t('filter_select_all') || 'All'}
                        </button>
                      </div>
                      {filteredUniqueValues.map((val) => {
                        const selected = Array.isArray(columnFilters[column.key])
                          ? columnFilters[column.key].includes(val)
                          : false;
                        return (
                          <label
                            key={val}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleColumnFilterValue(column.key, val)}
                              style={{ accentColor }}
                            />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
                              {val}
                            </span>
                          </label>
                        );
                      })}
                      {!filteredUniqueValues.length && (
                        <div style={{ color: 'var(--muted)', fontSize: 9 }}>{t('no_data') || 'No values'}</div>
                      )}
                    </>
                  )}
                </div>
              )}
              {!isCollapsed && (
                <span
                  role="separator"
                  onMouseDown={(e) => startColumnResize(column.key, e)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    insetInlineEnd: 0,
                    width: 5,
                    height: '100%',
                    cursor: 'col-resize',
                    zIndex: 2,
                  }}
                />
              )}
            </div>
          );})}
        </div>

        {/* Table Body */}
        <div style={{ fontSize: `${9 * fontScale}px` }}>
          {displayItems.length === 0 ? (
            <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--muted)', fontSize: 10 * fontScale }}>
              {columnFilteredItems.length === 0 && listItems.length > 0
                ? (t('no_matching_rows') || 'No rows match the current filters')
                : (t('no_data') || 'No data')}
            </div>
          ) : displayItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                background: idx % 2 === 0 ? 'var(--panel)' : 'var(--bg)',
                alignItems: 'center',
                transition: 'background 0.2s ease',
                minWidth: tableMinWidth,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${accentColor}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = idx % 2 === 0 ? 'var(--panel)' : 'var(--bg)';
              }}
            >
              {columns.map((column) => {
                const isCollapsed = collapsedCols.has(column.key);
                const width = getResolvedWidth(column);
                return (
                <div
                  key={column.key}
                  style={{
                    padding: `${6 * fontScale}px ${8 * fontScale}px`,
                    width,
                    minWidth: isCollapsed ? 28 : 48,
                    maxWidth: width,
                    borderInlineEnd: '1px solid var(--border)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: column.key === 'type' || column.key === 'status' ? 'var(--text)' : 'var(--muted)',
                    fontWeight: column.key === 'type' || column.key === 'status' ? '500' : '400',
                    flexShrink: 0,
                    textAlign: isCollapsed ? 'center' : 'start',
                  }}
                  title={isCollapsed ? '' : renderCellValue(item, column)}
                >
                  {isCollapsed ? '·' : renderCellValue(item, column)}
                </div>
              );})}
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Footer with row counts */}
      {(totalCount > listItems.length || displayItems.length !== listItems.length) && (
        <div style={{
          padding: '4px 12px',
          fontSize: '8px',
          color: 'var(--muted)',
          textAlign: 'center',
          background: 'var(--bg)',
          borderRadius: '0 0 6px 6px',
          borderTop: '1px solid var(--border)'
        }}>
          {displayItems.length !== listItems.length
            ? `${t('filtered_rows') || 'Filtered'}: ${displayItems.length} / ${listItems.length}`
            : `${t('showing') || 'Showing'} ${listItems.length} / ${totalCount} ${t('items') || 'items'}`}
        </div>
      )}

      {/* Fullscreen Modal */}
      <Modal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={listTitle}
        size="full"
        showCloseButton={true}
        closeOnOverlayClick={true}
        closeOnEscape={true}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            borderBottom: '1px solid var(--border)',
            fontSize: '13px',
            fontWeight: '600',
            color: accentColor,
          }}>
            <span>{listTitle} ({displayItems.length} {t('items_label') || t('items') || 'items'})</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => setFontScale(s => Math.max(0.7, s - 0.1))} style={{ ...headerBtnStyle, fontSize: '12px', padding: '4px 8px' }}>
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 36, textAlign: 'center' }}>{Math.round(fontScale * 100)}%</span>
              <button type="button" onClick={() => setFontScale(s => Math.min(2, s + 0.1))} style={{ ...headerBtnStyle, fontSize: '12px', padding: '4px 8px' }}>
                <ZoomIn size={14} />
              </button>
              <button type="button" onClick={handleCopy} style={{ ...headerBtnStyle, fontSize: '12px', padding: '4px 8px' }}>
                {getThemedIcon('ui', 'copy', 14, theme)}
              </button>
              <button type="button" onClick={handleExport} style={{ ...headerBtnStyle, fontSize: '12px', padding: '4px 8px' }}>
                {getThemedIcon('ui', 'download', 14, theme)}
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border)', background: 'var(--panel)' }}>
            <div style={{ minWidth: tableMinWidth, width: 'max-content', paddingInlineEnd: 12, boxSizing: 'border-box' }}>
              <div style={{
                display: 'flex',
                background: 'var(--bg)',
                borderBottom: '1px solid var(--border)',
                fontSize: `${12 * fontScale}px`,
                fontWeight: '600',
                color: 'var(--muted)',
                position: 'sticky',
                top: 0,
                zIndex: 2,
                minWidth: tableMinWidth,
              }}>
                {columns.map((column) => {
                  const isCollapsed = collapsedCols.has(column.key);
                  const width = getResolvedWidth(column);
                  return (
                    <div
                      key={column.key}
                      draggable
                      onDragStart={(e) => { setDraggedColKey(column.key); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverColKey(column.key); }}
                      onDragLeave={() => setDragOverColKey(null)}
                      onDrop={(e) => { e.preventDefault(); if (draggedColKey) handleColumnReorder(draggedColKey, column.key); setDraggedColKey(null); setDragOverColKey(null); }}
                      onDragEnd={() => { setDraggedColKey(null); setDragOverColKey(null); }}
                      style={{
                        padding: `${8 * fontScale}px ${10 * fontScale}px`,
                        width,
                        minWidth: isCollapsed ? 28 : 60,
                        maxWidth: width,
                        borderInlineEnd: '1px solid var(--border)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        cursor: 'grab',
                        background: dragOverColKey === column.key ? `${accentColor}25` : 'transparent',
                        opacity: draggedColKey === column.key ? 0.5 : 1,
                        borderInlineStart: dragOverColKey === column.key && draggedColKey !== column.key ? `2px solid ${accentColor}` : 'none',
                      }}
                    >
                      {isCollapsed ? '·' : column.label}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: `${11 * fontScale}px` }}>
                {displayItems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--font-size-sm)' }}>
                    {t('no_data') || 'No data'}
                  </div>
                ) : displayItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      borderBottom: '1px solid var(--border)',
                      background: idx % 2 === 0 ? 'var(--panel)' : 'var(--bg)',
                      minWidth: tableMinWidth,
                    }}
                  >
                    {columns.map((column) => {
                      const isCollapsed = collapsedCols.has(column.key);
                      const width = getResolvedWidth(column);
                      return (
                        <div
                          key={column.key}
                          style={{
                            padding: `${8 * fontScale}px ${10 * fontScale}px`,
                            width,
                            minWidth: isCollapsed ? 28 : 60,
                            maxWidth: width,
                            borderInlineEnd: '1px solid var(--border)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: column.key === 'type' || column.key === 'status' ? 'var(--text)' : 'var(--muted)',
                            fontWeight: column.key === 'type' || column.key === 'status' ? '500' : '400',
                            flexShrink: 0,
                          }}
                          title={isCollapsed ? '' : renderCellValue(item, column)}
                        >
                          {isCollapsed ? '·' : renderCellValue(item, column)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Column Manager Dialog */}
      <ColumnManager
          isOpen={showColumnManager}
          onClose={() => setShowColumnManager(false)}
          dataSource={widget.dataSource}
          chartType={chartType}
          selectedColumns={selectedColumns}
          onColumnsChange={(cols) => {
            setSelectedColumns(cols);
            onListColumnsChange?.(cols);
          }}
          accentColor={accentColor}
          columnDefinitions={columns.map((c) => ({ key: c.key, label: c.label }))}
      />
    </div>
  );
}

const ListChartMemo = memo(ListChart);
ListChartMemo.displayName = 'ListChart';
export default ListChartMemo;
