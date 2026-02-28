import React, { useMemo, useContext, useState, memo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import logger from '@utils/logger';
import ColumnManager from '../analytics/ColumnManager';
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

/**
 * Helper function to get localized name for agenda items
 * @param {Object} item - Data item
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {string} Localized name
 */
const getLocalizedName = (item, lang) => {
  if (!item) return '';
  
  // Check for Arabic name first
  if (lang === 'ar') {
    return item.localize || item.nameAr || item.titleAr || item.name || item.title || item.code || item.docId || '';
  }
  
  // Default to English
  return item.nameEn || item.name || item.title || item.code || item.docId || '';
};

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
  widget = {}
}) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);

  // Disable all logging to prevent console spam
  // // Comprehensive logging for debugging
  // logger.log('[ListChart] Widget configuration:', {
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
    } else {
      // Default: try to find any array in rawData
      sourceData = Object.values(rawData).find(item => Array.isArray(item)) || [];
    }
    
    if (!Array.isArray(sourceData)) return [];
    
    // Apply filters if specified
    let filteredData = sourceData;
    if (groupBy && widget.filterValue) {
      filteredData = sourceData.filter(item => {
        if (chartType === 'activity') {
          const itemType = normalizeActivityType(item.type || 'Unknown', t);
          return itemType === widget.filterValue;
        } else if (chartType === 'attendance') {
          // Handle different data structures from multiple attendance sources
          let status = item.status || item.attendanceType || item.absenceType || item.attendanceStatus || 'Unknown';
          const itemStatus = normalizeAttendanceStatus(status, t);
          return itemStatus === widget.filterValue;
        } else if (chartType === 'enrollment') {
          return (item.programId || item.status) === widget.filterValue;
        }
        return false;
      });
    }
    
    // Sort by creation date (newest first)
    const sortedData = filteredData.sort((a, b) => {
      const dateA = a.createdAt?.seconds || a.createdAt || 0;
      const dateB = b.createdAt?.seconds || b.createdAt || 0;
      return dateB - dateA;
    }).slice(0, 50); // Limit to 50 items for performance

    // Disable all logging to prevent console spam
    // // Log sample data for debugging
    // logger.log('[ListChart] Processed items:', {
    //   totalSourceRecords: filteredData.length,
    //   finalItemsCount: sortedData.length,
    //   sampleItem: sortedData[0] || 'No items',
    //   hasStudentIds: sortedData.some(item => item.studentId),
    //   hasClassIds: sortedData.some(item => item.classId),
    //   hasStatuses: sortedData.some(item => item.status)
    // });

    return sortedData;
  }, [rawData, widget, chartType]);

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

  if (items.length === 0) {
    return (
      <div style={{ 
        width: chartWidth, 
        height: chartHeight, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#999',
        fontSize: '14px'
      }}>
        {t('no_data_available') || 'No data available'}
      </div>
    );
  }

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
        { key: 'studentName', label: t('student_name') || 'Student Name', width: '25%', isRelated: false },
        { key: 'studentNumber', label: t('student_number') || 'Student Number', width: '15%', isRelated: false },
        { key: 'status', label: t('status') || 'Status', width: '15%', isRelated: false },
        { key: 'date', label: t('date') || 'Date', width: '15%', isRelated: false },
        { key: 'className', label: t('class_name') || 'Class', width: '20%', isRelated: false },
        { key: 'id', label: t('id') || 'ID', width: '10%', isRelated: false }
      ];
    } else if (chartType === 'enrollment') {
      return [
        { key: 'programName', label: t('program_name') || 'Program', width: '25%', isRelated: false },
        { key: 'studentName', label: t('student_name') || 'Student', width: '30%', isRelated: false },
        { key: 'studentNumber', label: t('student_number') || 'Student Number', width: '15%', isRelated: false },
        { key: 'className', label: t('class_name') || 'Class', width: '20%', isRelated: false },
        { key: 'status', label: t('status') || 'Status', width: '10%', isRelated: false }
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
      nameEn: t('program_name_en') || 'Program Name (EN)',
      nameAr: t('program_name_ar') || 'Program Name (AR)',
      realNameEn: t('full_name_en') || 'Full Name (EN)',
      realNameAr: t('full_name_ar') || 'Full Name (AR)',
      displayNameEn: t('display_name_en') || 'Display Name (EN)',
      displayNameAr: t('display_name_ar') || 'Display Name (AR)',
      id: t('id') || 'ID'
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

  // Enhanced cell rendering with smart data mapping
  const renderCellValue = (item, column) => {
    if (column.isRelated) {
      return resolveRelatedColumn(item, column.key, rawData, t);
    }

    switch (column.key) {
      case 'type':
        return normalizeActivityType(item.type || item.activityType, t);
      
      case 'title':
        return getLocalizedName(item, lang) || t('not_specified');
      
      case 'titleEn':
        return item.titleEn || getLocalizedName(item, 'en') || '—';
        
      case 'titleAr':
        return item.titleAr || getLocalizedName(item, 'ar') || '—';
      
      case 'createdBy':
        const creator = resolveUser(item.createdBy, rawData.users, t);
        return creator.name;
      
      case 'createdAt':
        return formatDate(item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : item.createdAt, t);
      
      case 'studentName':
        const student = resolveUser(item.studentId, rawData.users, t);
        return student.name;
      
      case 'studentNumber':
        const studentNum = resolveUser(item.studentId, rawData.users, t);
        return studentNum.number;
      
      case 'status':
        // Handle different data structures from multiple attendance sources
        let status = item.status || item.attendanceType || item.absenceType || item.attendanceStatus;
        return normalizeAttendanceStatus(status, t);
      
      case 'date':
        return formatDate(item.date?.seconds ? new Date(item.date.seconds * 1000) : item.date, t);
      
      case 'nameEn':
        // Handle different entity types for nameEn
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
        return item[column.key] || '—';
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minWidth: chartWidth,
      minHeight: chartHeight,
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
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
          {widget.title || t('list_view') || 'List View'} ({items.length} {t('items') || 'items'})
        </span>
        <button
          onClick={() => setShowColumnManager(true)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '2px 6px',
            cursor: 'pointer',
            fontSize: '10px',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title={t('manage_columns') || 'Manage Columns'}
        >
          {getThemedIcon('ui', 'settings', 12, theme)}
          {t('columns') || 'Columns'}
        </button>
      </div>

      {/* Table */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        border: '1px solid var(--border)',
        borderRadius: '0 0 6px 6px',
        background: 'var(--panel)'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          fontSize: '10px',
          fontWeight: '600',
          color: 'var(--muted)',
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}>
          {columns.map(column => (
            <div
              key={column.key}
              style={{
                padding: '6px 8px',
                width: column.width,
                minWidth: '60px',
                borderRight: '1px solid var(--border)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {column.label}
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div style={{ fontSize: '9px' }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                background: idx % 2 === 0 ? 'var(--panel)' : 'var(--bg)',
                alignItems: 'center',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${accentColor}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = idx % 2 === 0 ? 'var(--panel)' : 'var(--bg)';
              }}
            >
              {columns.map(column => (
                <div
                  key={column.key}
                  style={{
                    padding: '6px 8px',
                    width: column.width,
                    minWidth: '60px',
                    borderRight: '1px solid var(--border)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: column.key === 'type' || column.key === 'status' ? 'var(--text)' : 'var(--muted)',
                    fontWeight: column.key === 'type' || column.key === 'status' ? '500' : '400'
                  }}
                  title={renderCellValue(item, column)}
                >
                  {renderCellValue(item, column)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer with more info */}
      {items.length >= 50 && (
        <div style={{
          padding: '4px 12px',
          fontSize: '8px',
          color: 'var(--muted)',
          textAlign: 'center',
          background: 'var(--bg)',
          borderRadius: '0 0 6px 6px',
          borderTop: '1px solid var(--border)'
        }}>
          {t('showing_first_items') || `Showing first 50 items`}
        </div>
      )}

      {/* Column Manager Dialog */}
      <ColumnManager
          isOpen={showColumnManager}
          onClose={() => setShowColumnManager(false)}
          dataSource={widget.dataSource}
          chartType={chartType}
          selectedColumns={selectedColumns}
          onColumnsChange={setSelectedColumns}
          accentColor={accentColor}
      />
    </div>
  );
}

const ListChartMemo = memo(ListChart);
ListChartMemo.displayName = 'ListChart';
export default ListChartMemo;
