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
  accentColor 
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
        { key: 'studentName', label: t('student_name') || 'Student Name', required: true },
        { key: 'studentNumber', label: t('student_number') || 'Student Number', required: false },
        { key: 'status', label: t('status') || 'Status', required: true },
        { key: 'date', label: t('date') || 'Date', required: true },
        { key: 'className', label: t('class_name') || 'Class Name', required: false },
        { key: 'createdAt', label: t('created_date') || 'Created Date', required: false },
        { key: 'createdBy', label: t('created_by') || 'Created By', required: false },
        { key: 'id', label: t('id') || 'ID', required: false }
      ],
      
      // Activity columns (for activities, announcements, resources)
      activity: [
        { key: 'type', label: t('type') || 'Type', required: true },
        { key: 'title', label: t('title') || 'Title', required: true },
        { key: 'titleEn', label: t('title_english') || 'Title (EN)', required: false },
        { key: 'titleAr', label: t('title_arabic') || 'Title (AR)', required: false },
        { key: 'createdBy', label: t('created_by') || 'Created By', required: false },
        { key: 'createdAt', label: t('created_date') || 'Created Date', required: false },
        { key: 'className', label: t('class_name') || 'Class Name', required: false },
        { key: 'id', label: t('id') || 'ID', required: false }
      ],
      
      // Enrollment columns
      enrollment: [
        { key: 'programName', label: t('program_name') || 'Program Name', required: true },
        { key: 'studentName', label: t('student_name') || 'Student Name', required: true },
        { key: 'studentNumber', label: t('student_number') || 'Student Number', required: false },
        { key: 'className', label: t('class_name') || 'Class Name', required: false },
        { key: 'status', label: t('status') || 'Status', required: false },
        { key: 'enrollmentDate', label: t('enrollment_date') || 'Enrollment Date', required: false },
        { key: 'createdAt', label: t('created_date') || 'Created Date', required: false },
        { key: 'createdBy', label: t('created_by') || 'Created By', required: false }
      ],
      
      // User columns
      users: [
        { key: 'realNameEn', label: t('full_name_en') || 'Full Name (EN)', required: true },
        { key: 'realNameAr', label: t('full_name_ar') || 'Full Name (AR)', required: true },
        { key: 'displayNameEn', label: t('display_name_en') || 'Display Name (EN)', required: false },
        { key: 'displayNameAr', label: t('display_name_ar') || 'Display Name (AR)', required: false },
        { key: 'email', label: t('email') || 'Email', required: false },
        { key: 'role', label: t('role') || 'Role', required: true },
        { key: 'studentNumber', label: t('student_number') || 'Student Number', required: false },
        { key: 'status', label: t('status') || 'Status', required: false }
      ],
      
      // Class columns
      classes: [
        { key: 'nameEn', label: t('class_name_en') || 'Class Name (EN)', required: true },
        { key: 'nameAr', label: t('class_name_ar') || 'Class Name (AR)', required: true },
        { key: 'programName', label: t('program_name') || 'Program Name', required: false },
        { key: 'instructor', label: t('instructor') || 'Instructor', required: false },
        { key: 'term', label: t('term') || 'Term', required: false },
        { key: 'createdAt', label: t('created_date') || 'Created Date', required: false },
        { key: 'createdBy', label: t('created_by') || 'Created By', required: false }
      ],
      
      // Participation columns
      participations: [
        { key: 'studentName', label: t('student_name') || 'Student Name', required: true },
        { key: 'type', label: t('type') || 'Type', required: true },
        { key: 'date', label: t('date') || 'Date', required: true },
        { key: 'className', label: t('class_name') || 'Class Name', required: false },
        { key: 'points', label: t('points') || 'Points', required: false },
        { key: 'notes', label: t('notes') || 'Notes', required: false },
        { key: 'createdAt', label: t('created_date') || 'Created Date', required: false },
        { key: 'createdBy', label: t('created_by') || 'Created By', required: false }
      ],
      
      // Penalty columns
      penalties: [
        { key: 'studentName', label: t('student_name') || 'Student Name', required: true },
        { key: 'penaltyType', label: t('penalty_type') || 'Penalty Type', required: true },
        { key: 'date', label: t('date') || 'Date', required: true },
        { key: 'className', label: t('class_name') || 'Class Name', required: false },
        { key: 'points', label: t('points') || 'Points', required: false },
        { key: 'reason', label: t('reason') || 'Reason', required: false },
        { key: 'createdAt', label: t('created_date') || 'Created Date', required: false },
        { key: 'createdBy', label: t('created_by') || 'Created By', required: false }
      ],
      
      // Behavior columns
      behaviors: [
        { key: 'studentName', label: t('student_name') || 'Student Name', required: true },
        { key: 'type', label: t('type') || 'Type', required: true },
        { key: 'date', label: t('date') || 'Date', required: true },
        { key: 'className', label: t('class_name') || 'Class Name', required: false },
        { key: 'severity', label: t('severity') || 'Severity', required: false },
        { key: 'description', label: t('description') || 'Description', required: false },
        { key: 'createdAt', label: t('created_date') || 'Created Date', required: false },
        { key: 'createdBy', label: t('created_by') || 'Created By', required: false }
      ],
      
      // Program columns
      programs: [
        { key: 'nameEn', label: t('program_name_en') || 'Program Name (EN)', required: true },
        { key: 'nameAr', label: t('program_name_ar') || 'Program Name (AR)', required: true },
        { key: 'type', label: t('program_type') || 'Program Type', required: false },
        { key: 'duration', label: t('program_duration') || 'Program Duration', required: false },
        { key: 'createdAt', label: t('created_date') || 'Created Date', required: false },
        { key: 'createdBy', label: t('created_by') || 'Created By', required: false }
      ],
      
      // Subject columns
      subjects: [
        { key: 'nameEn', label: t('subject_name_en') || 'Subject Name (EN)', required: true },
        { key: 'nameAr', label: t('subject_name_ar') || 'Subject Name (AR)', required: true },
        { key: 'type', label: t('subject_type') || 'Subject Type', required: false },
        { key: 'credits', label: t('credits') || 'Credits', required: false },
        { key: 'createdAt', label: t('created_date') || 'Created Date', required: false },
        { key: 'createdBy', label: t('created_by') || 'Created By', required: false }
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
            { key: 'studentEmail', label: t('student_email') || 'Student Email', relation: 'studentId' },
            { key: 'studentPhone', label: t('student_phone') || 'Student Phone', relation: 'studentId' },
            { key: 'studentAddress', label: t('student_address') || 'Student Address', relation: 'studentId' },
            { key: 'parentName', label: t('parent_name') || 'Parent Name', relation: 'studentId' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'classInstructor', label: t('class_instructor') || 'Class Instructor', relation: 'classId' },
            { key: 'classSchedule', label: t('class_schedule') || 'Class Schedule', relation: 'classId' },
            { key: 'classRoom', label: t('class_room') || 'Class Room', relation: 'classId' }
          ]
        }
      ],
      
      activity: [
        { 
          collection: 'users', 
          columns: [
            { key: 'creatorEmail', label: t('creator_email') || 'Creator Email', relation: 'createdBy' },
            { key: 'creatorRole', label: t('creator_role') || 'Creator Role', relation: 'createdBy' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'className', label: t('class_name') || 'Class Name', relation: 'classId' },
            { key: 'classSubject', label: t('class_subject') || 'Class Subject', relation: 'classId' }
          ]
        },
        { 
          collection: 'quizzes', 
          columns: [
            { key: 'quizTitle', label: t('quiz_title') || 'Quiz Title', relation: 'quizId' },
            { key: 'quizDifficulty', label: t('quiz_difficulty') || 'Quiz Difficulty', relation: 'quizId' }
          ]
        }
      ],
      
      enrollment: [
        { 
          collection: 'users', 
          columns: [
            { key: 'studentEmail', label: t('student_email') || 'Student Email', relation: 'studentId' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'classInstructor', label: t('class_instructor') || 'Class Instructor', relation: 'classId' }
          ]
        },
        { 
          collection: 'programs', 
          columns: [
            { key: 'programName', label: t('program_name') || 'Program Name', relation: 'programId' }
          ]
        }
      ],
      
      participations: [
        { 
          collection: 'users', 
          columns: [
            { key: 'studentEmail', label: t('student_email') || 'Student Email', relation: 'studentId' },
            { key: 'studentNumber', label: t('student_number') || 'Student Number', relation: 'studentId' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'classInstructor', label: t('class_instructor') || 'Class Instructor', relation: 'classId' }
          ]
        }
      ],
      
      penalties: [
        { 
          collection: 'users', 
          columns: [
            { key: 'studentEmail', label: t('student_email') || 'Student Email', relation: 'studentId' },
            { key: 'studentNumber', label: t('student_number') || 'Student Number', relation: 'studentId' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'classInstructor', label: t('class_instructor') || 'Class Instructor', relation: 'classId' }
          ]
        }
      ],
      
      behaviors: [
        { 
          collection: 'users', 
          columns: [
            { key: 'studentEmail', label: t('student_email') || 'Student Email', relation: 'studentId' },
            { key: 'studentNumber', label: t('student_number') || 'Student Number', relation: 'studentId' }
          ]
        },
        { 
          collection: 'classes', 
          columns: [
            { key: 'classInstructor', label: t('class_instructor') || 'Class Instructor', relation: 'classId' }
          ]
        }
      ],
      
      programs: [
        { 
          collection: 'users', 
          columns: [
            { key: 'creatorEmail', label: t('creator_email') || 'Creator Email', relation: 'createdBy' },
            { key: 'creatorRole', label: t('creator_role') || 'Creator Role', relation: 'createdBy' }
          ]
        }
      ],
      
      subjects: [
        { 
          collection: 'users', 
          columns: [
            { key: 'creatorEmail', label: t('creator_email') || 'Creator Email', relation: 'createdBy' },
            { key: 'creatorRole', label: t('creator_role') || 'Creator Role', relation: 'createdBy' }
          ]
        },
        { 
          collection: 'programs', 
          columns: [
            { key: 'programName', label: t('program_name') || 'Program Name', relation: 'programId' },
            { key: 'programType', label: t('program_type') || 'Program Type', relation: 'programId' }
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
      const baseCols = getPredefinedColumns();
      const relCols = getRelatedColumns();
      setAvailableColumns(baseCols);
      setRelatedColumns(relCols);
    }
  }, [isOpen, dataSource, chartType]);

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
            {getThemedIcon('ui', 'settings', 20, theme)} {t('manage_columns') || 'Manage Columns'}
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
              {t('base_columns') || 'Base Columns'}
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
                {t('related_collection_columns') || 'Related Collection Columns'}
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
            {t('cancel') || 'Cancel'}
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
            {t('apply') || 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
