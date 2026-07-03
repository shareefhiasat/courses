import React, { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Column Manager Component - UI dialog for managing list widget columns
 * Allows users to show/hide columns and add related collection columns
 */
export default function ColumnManager({ 
  isOpen, 
  onClose, 
  dataSource, 
  chartType, 
  selectedColumns, 
  onColumnsChange,
  accentColor,
  columnDefinitions = null,
}) {
  const { t } = useLang();
  const { theme } = useTheme();
  const [availableColumns, setAvailableColumns] = useState([]);
  const [relatedColumns, setRelatedColumns] = useState([]);

  // Predefined column sets for each data source
  const getPredefinedColumns = () => {
    const baseColumns = {
      // Attendance columns
      attendance: [
        { key: 'studentName', label: t('student_name'), required: true },
        { key: 'studentNumber', label: t('student_number'), required: false },
        { key: 'status', label: t('status'), required: true },
        { key: 'date', label: t('date'), required: true },
        { key: 'className', label: t('class_name'), required: false },
        { key: 'createdAt', label: t('created_date'), required: false },
        { key: 'createdBy', label: t('created_by'), required: false },
        { key: 'id', label: t('id'), required: false }
      ],
      
      // Activity columns (for activities, announcements, resources)
      activity: [
        { key: 'type', label: t('type'), required: true },
        { key: 'title', label: t('title'), required: true },
        { key: 'titleEn', label: t('title_english'), required: false },
        { key: 'titleAr', label: t('title_arabic'), required: false },
        { key: 'createdBy', label: t('created_by'), required: false },
        { key: 'createdAt', label: t('created_date'), required: false },
        { key: 'className', label: t('class_name'), required: false },
        { key: 'id', label: t('id'), required: false }
      ],
      
      // Enrollment columns
      enrollment: [
        { key: 'programName', label: t('program_name'), required: true },
        { key: 'studentName', label: t('student_name'), required: true },
        { key: 'studentNumber', label: t('student_number'), required: false },
        { key: 'className', label: t('class_name'), required: false },
        { key: 'status', label: t('status'), required: false },
        { key: 'enrollmentDate', label: t('enrollment_date'), required: false },
        { key: 'createdAt', label: t('created_date'), required: false },
        { key: 'createdBy', label: t('created_by'), required: false }
      ],
      
      // User columns
      users: [
        { key: 'realNameEn', label: t('full_name_en'), required: true },
        { key: 'realNameAr', label: t('full_name_ar'), required: true },
        { key: 'displayNameEn', label: t('display_name_en'), required: false },
        { key: 'displayNameAr', label: t('display_name_ar'), required: false },
        { key: 'email', label: t('email'), required: false },
        { key: 'role', label: t('role'), required: true },
        { key: 'studentNumber', label: t('student_number'), required: false },
        { key: 'status', label: t('status'), required: false }
      ],
      
      // Class columns
      classes: [
        { key: 'nameEn', label: t('class_name_en'), required: true },
        { key: 'nameAr', label: t('class_name_ar'), required: true },
        { key: 'programName', label: t('program_name'), required: false },
        { key: 'instructor', label: t('instructor'), required: false },
        { key: 'term', label: t('term'), required: false },
        { key: 'createdAt', label: t('created_date'), required: false },
        { key: 'createdBy', label: t('created_by'), required: false }
      ],
      
      // Participation columns
      participations: [
        { key: 'studentName', label: t('student_name'), required: true },
        { key: 'type', label: t('type'), required: true },
        { key: 'date', label: t('date'), required: true },
        { key: 'className', label: t('class_name'), required: false },
        { key: 'points', label: t('points'), required: false },
        { key: 'notes', label: t('notes'), required: false },
        { key: 'createdAt', label: t('created_date'), required: false },
        { key: 'createdBy', label: t('created_by'), required: false }
      ],
      
      // Penalty columns
      penalties: [
        { key: 'studentName', label: t('student_name'), required: true },
        { key: 'penaltyType', label: t('penalty_type'), required: true },
        { key: 'date', label: t('date'), required: true },
        { key: 'className', label: t('class_name'), required: false },
        { key: 'points', label: t('points'), required: false },
        { key: 'reason', label: t('reason'), required: false },
        { key: 'createdAt', label: t('created_date'), required: false },
        { key: 'createdBy', label: t('created_by'), required: false }
      ],
      
      // Behavior columns
      behaviors: [
        { key: 'studentName', label: t('student_name'), required: true },
        { key: 'type', label: t('type'), required: true },
        { key: 'date', label: t('date'), required: true },
        { key: 'className', label: t('class_name'), required: false },
        { key: 'severity', label: t('severity'), required: false },
        { key: 'description', label: t('description'), required: false },
        { key: 'createdAt', label: t('created_date'), required: false },
        { key: 'createdBy', label: t('created_by'), required: false }
      ],
      
      // Program columns
      programs: [
        { key: 'nameEn', label: t('program_name_en'), required: true },
        { key: 'nameAr', label: t('program_name_ar'), required: true },
        { key: 'type', label: t('program_type'), required: false },
        { key: 'duration', label: t('program_duration'), required: false },
        { key: 'createdAt', label: t('created_date'), required: false },
        { key: 'createdBy', label: t('created_by'), required: false }
      ],
      
      // Subject columns
      subjects: [
        { key: 'nameEn', label: t('subject_name_en'), required: true },
        { key: 'nameAr', label: t('subject_name_ar'), required: true },
        { key: 'type', label: t('subject_type'), required: false },
        { key: 'credits', label: t('credits'), required: false },
        { key: 'createdAt', label: t('created_date'), required: false },
        { key: 'createdBy', label: t('created_by'), required: false }
      ],

      schedulingInstructorWorkload: [
        { key: 'instructorName', label: t('gb_instructor'), required: true },
        { key: 'assignedHours', label: t('assigned_hours'), required: true },
        { key: 'capacityHours', label: t('capacity_hours'), required: true },
        { key: 'utilizationPct', label: t('vf_utilizationPct'), required: false },
        { key: 'metricLabel', label: t('summary'), required: false },
      ],

      schedulingTeachers: [
        { key: 'instructorName', label: t('gb_instructor'), required: true },
        { key: 'sessionCount', label: t('vf_sessionCount'), required: true },
        { key: 'teachingHours', label: t('vf_teachingHours'), required: true },
        { key: 'primarySubject', label: t('gb_subject'), required: false },
        { key: 'classCount', label: t('vf_classCount'), required: false },
      ],

      schedulingCourses: [
        { key: 'courseLabel', label: t('gb_course'), required: true },
        { key: 'sessionCount', label: t('vf_sessionCount'), required: true },
        { key: 'teachingHours', label: t('vf_teachingHours'), required: false },
        { key: 'location', label: t('gb_location'), required: false },
        { key: 'capacity', label: t('capacity'), required: false },
      ],

      schedulingAttendanceRecords: [
        { key: 'date', label: t('date'), required: false },
        { key: 'attendanceTypeLabel', label: t('attendance_type'), required: false },
        { key: 'status', label: t('status'), required: true },
        { key: 'studentName', label: t('student_name'), required: true },
        { key: 'studentNumber', label: t('student_number'), required: false },
        { key: 'programName', label: t('program_name'), required: false },
        { key: 'className', label: t('class_name'), required: false },
        { key: 'instructorName', label: t('gb_instructor'), required: false },
        { key: 'markedBy', label: t('marked_by'), required: false },
      ],

      scheduling: [
        { key: 'title', label: t('title'), required: true },
        { key: 'status', label: t('status'), required: false },
        { key: 'date', label: t('date'), required: false },
        { key: 'instructorName', label: t('gb_instructor'), required: false },
        { key: 'sessionCount', label: t('vf_sessionCount'), required: false },
      ],

      driveRecentFiles: [
        { key: 'name', label: t('name'), required: true },
        { key: 'mimeType', label: t('type'), required: false },
        { key: 'size', label: t('size'), required: false },
        { key: 'bucket', label: t('bucket'), required: false },
        { key: 'createdAt', label: t('created_date'), required: false },
        { key: 'id', label: t('id'), required: false },
      ],
    };

    // Determine chart type from data source
    let type = chartType;
    if (dataSource?.includes('attendance')) {
      type = 'attendance';
    } else if (dataSource?.includes('activities') || dataSource?.includes('announcements') || dataSource?.includes('resources')) {
      type = 'activity';
    } else if (dataSource?.includes('enrollments')) {
      type = 'enrollment';
    } else if (dataSource?.includes('users')) {
      type = 'users';
    } else if (dataSource?.includes('classes')) {
      type = 'classes';
    } else if (dataSource?.includes('participations')) {
      type = 'participations';
    } else if (dataSource?.includes('penalties')) {
      type = 'penalties';
    } else if (dataSource?.includes('behaviors')) {
      type = 'behaviors';
    } else if (dataSource?.includes('programs')) {
      type = 'programs';
    } else if (dataSource?.includes('subjects')) {
      type = 'subjects';
    } else if (dataSource?.includes('schedulingInstructorWorkload')) {
      type = 'schedulingInstructorWorkload';
    } else if (dataSource?.includes('schedulingTeachers')) {
      type = 'schedulingTeachers';
    } else if (dataSource?.includes('schedulingCourses')) {
      type = 'schedulingCourses';
    } else if (dataSource === 'schedulingAttendanceRecords') {
      type = 'schedulingAttendanceRecords';
    } else if (dataSource === 'driveRecentFiles') {
      type = 'driveRecentFiles';
    } else if (dataSource?.startsWith('scheduling')) {
      type = 'scheduling';
    }

    return baseColumns[type] || baseColumns.activity;
  };

  // Related collection columns that can be added
  const getRelatedColumns = () => {
    const related = {
      attendance: [
        { 
          collection: 'users', 
          columns: [
            { key: 'studentEmail', label: t('student_email'), relation: 'studentId' },
            { key: 'studentPhone', label: t('student_phone'), relation: 'studentId' },
            { key: 'studentAddress', label: t('student_address'), relation: 'studentId' },
            { key: 'parentName', label: t('parent_name'), relation: 'studentId' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'classInstructor', label: t('class_instructor'), relation: 'classId' },
            { key: 'classSchedule', label: t('class_schedule'), relation: 'classId' },
            { key: 'classRoom', label: t('class_room'), relation: 'classId' }
          ]
        }
      ],
      
      activity: [
        { 
          collection: 'users', 
          columns: [
            { key: 'creatorEmail', label: t('creator_email'), relation: 'createdBy' },
            { key: 'creatorRole', label: t('creator_role'), relation: 'createdBy' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'className', label: t('class_name'), relation: 'classId' },
            { key: 'classSubject', label: t('class_subject'), relation: 'classId' }
          ]
        },
        { 
          collection: 'quizzes', 
          columns: [
            { key: 'quizTitle', label: t('quiz_title'), relation: 'quizId' },
            { key: 'quizDifficulty', label: t('quiz_difficulty'), relation: 'quizId' }
          ]
        }
      ],
      
      enrollment: [
        { 
          collection: 'users', 
          columns: [
            { key: 'studentEmail', label: t('student_email'), relation: 'studentId' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'classInstructor', label: t('class_instructor'), relation: 'classId' }
          ]
        },
        { 
          collection: 'programs', 
          columns: [
            { key: 'programName', label: t('program_name'), relation: 'programId' }
          ]
        }
      ],
      
      participations: [
        { 
          collection: 'users', 
          columns: [
            { key: 'studentEmail', label: t('student_email'), relation: 'studentId' },
            { key: 'studentNumber', label: t('student_number'), relation: 'studentId' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'classInstructor', label: t('class_instructor'), relation: 'classId' }
          ]
        }
      ],
      
      penalties: [
        { 
          collection: 'users', 
          columns: [
            { key: 'studentEmail', label: t('student_email'), relation: 'studentId' },
            { key: 'studentNumber', label: t('student_number'), relation: 'studentId' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'classInstructor', label: t('class_instructor'), relation: 'classId' }
          ]
        }
      ],
      
      behaviors: [
        { 
          collection: 'users', 
          columns: [
            { key: 'studentEmail', label: t('student_email'), relation: 'studentId' },
            { key: 'studentNumber', label: t('student_number'), relation: 'studentId' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'classInstructor', label: t('class_instructor'), relation: 'classId' }
          ]
        }
      ],
      
      programs: [
        { 
          collection: 'users', 
          columns: [
            { key: 'creatorEmail', label: t('creator_email'), relation: 'createdBy' },
            { key: 'creatorRole', label: t('creator_role'), relation: 'createdBy' }
          ]
        }
      ],
      
      subjects: [
        { 
          collection: 'users', 
          columns: [
            { key: 'creatorEmail', label: t('creator_email'), relation: 'createdBy' },
            { key: 'creatorRole', label: t('creator_role'), relation: 'createdBy' }
          ]
        },
        { 
          collection: 'programs', 
          columns: [
            { key: 'programName', label: t('program_name'), relation: 'programId' },
            { key: 'programType', label: t('program_type'), relation: 'programId' }
          ]
        }
      ]
    };

    // Determine chart type from data source
    let type = chartType;
    if (dataSource?.includes('attendance')) {
      type = 'attendance';
    } else if (dataSource?.includes('activities') || dataSource?.includes('announcements') || dataSource?.includes('resources')) {
      type = 'activity';
    } else if (dataSource?.includes('enrollments')) {
      type = 'enrollment';
    } else if (dataSource?.includes('participations')) {
      type = 'participations';
    } else if (dataSource?.includes('penalties')) {
      type = 'penalties';
    } else if (dataSource?.includes('behaviors')) {
      type = 'behaviors';
    } else if (dataSource?.includes('programs')) {
      type = 'programs';
    } else if (dataSource?.includes('subjects')) {
      type = 'subjects';
    }

    return related[type] || [];
  };

  React.useEffect(() => {
    if (isOpen) {
      const baseCols = columnDefinitions?.length
        ? columnDefinitions.map((c) => ({ key: c.key, label: c.label, required: c.required || false }))
        : getPredefinedColumns();
      const relCols = columnDefinitions?.length ? [] : getRelatedColumns();
      setAvailableColumns(baseCols);
      setRelatedColumns(relCols);
    }
  }, [isOpen, dataSource, chartType, columnDefinitions]);

  const handleColumnToggle = (columnKey) => {
    const newSelected = selectedColumns.includes(columnKey)
      ? selectedColumns.filter(col => col !== columnKey)
      : [...selectedColumns, columnKey];
    onColumnsChange(newSelected);
  };

  const handleRelatedColumnToggle = (collection, column) => {
    const columnKey = `${collection}_${column.key}`;
    const newSelected = selectedColumns.includes(columnKey)
      ? selectedColumns.filter(col => col !== columnKey)
      : [...selectedColumns, columnKey];
    onColumnsChange(newSelected);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div
        style={{
          background: 'var(--panel)',
          borderRadius: 16,
          width: '90vw',
          maxWidth: '800px',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>
            {getThemedIcon('ui', 'settings', 20, theme)} {t('manage_columns')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Base Columns */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
              {t('base_columns')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {availableColumns.map(column => (
                <label
                  key={column.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '6px',
                    background: selectedColumns.includes(column.key) ? `${accentColor}15` : 'var(--bg)',
                    border: selectedColumns.includes(column.key) ? `1px solid ${accentColor}` : '1px solid var(--border)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.key)}
                    onChange={() => handleColumnToggle(column.key)}
                    disabled={column.required}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '12px' }}>
                    {column.label}
                    {column.required && <span style={{ color: accentColor, marginLeft: '4px' }}>*</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Related Collection Columns */}
          {relatedColumns.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                {t('related_collection_columns')}
              </h3>
              {relatedColumns.map(({ collection, columns }) => (
                <div key={collection} style={{ marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '12px', fontWeight: '500', color: 'var(--muted)' }}>
                    {t(collection) || collection.charAt(0).toUpperCase() + collection.slice(1)}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    {columns.map(column => (
                      <label
                        key={`${collection}_${column.key}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px',
                          borderRadius: '6px',
                          background: selectedColumns.includes(`${collection}_${column.key}`) ? `${accentColor}15` : 'var(--bg)',
                          border: selectedColumns.includes(`${collection}_${column.key}`) ? `1px solid ${accentColor}` : '1px solid var(--border)',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(`${collection}_${column.key}`)}
                          onChange={() => handleRelatedColumnToggle(collection, column)}
                          style={{ margin: 0 }}
                        />
                        <span style={{ fontSize: '12px' }}>{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--text)'
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: accentColor,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'white',
              fontWeight: '500'
            }}
          >
            {t('apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
