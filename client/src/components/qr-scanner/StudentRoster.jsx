import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ATTENDANCE_STATUS_LABELS } from '../../firebase/attendance';

const SearchIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const FilterIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const DownloadIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

const StarIcon = ({ style, filled }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const SidebarOpenIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);

const ChevronDownIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ChevronRightIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function StudentRoster({
  students,
  onStudentSelect,
  selectedStudentId,
  onTogglePin,
  onDownload,
  onFilter,
  searchQuery,
  onSearchChange,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  totalStudents
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRowExpansion = (studentId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedRows(newExpanded);
  };

  const getAttendanceBadge = (status) => {
    const statusInfo = ATTENDANCE_STATUS_LABELS[status] || ATTENDANCE_STATUS_LABELS.absent_no_excuse;
    
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        background: statusInfo.color + '20',
        color: statusInfo.color,
        border: `1px solid ${statusInfo.color}40`
      }}>
        {statusInfo.en}
      </span>
    );
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      { bg: '#e9d5ff', color: '#6b21a8' },
      { bg: '#fed7aa', color: '#9a3412' },
      { bg: '#bfdbfe', color: '#1e3a8a' },
      { bg: '#fbcfe8', color: '#831843' },
      { bg: '#d1fae5', color: '#065f46' },
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      border: '1px solid #e5e7eb',
      padding: '1.5rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div>
          {/*<h2 style={{*/}
          {/*  fontSize: '1.125rem',*/}
          {/*  fontWeight: 600,*/}
          {/*  color: '#111827',*/}
          {/*  margin: 0*/}
          {/*}}>*/}
          {/*  STUDENT ROSTER*/}
          {/*</h2>*/}
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '0.25rem',
            marginBottom: 0
          }}>
            {totalStudents} Students
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <SearchIcon style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1rem',
              height: '1rem',
              color: '#6b7280'
            }} />
            <Input
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '16rem' }}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onFilter}>
            <FilterIcon style={{ width: '1rem', height: '1rem' }} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDownload}>
            <DownloadIcon style={{ width: '1rem', height: '1rem' }} />
          </Button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ width: '40px', padding: '0.75rem 1rem' }}></th>
              <th 
                onClick={() => onSort('name')}
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Student Name {getSortIcon('name')}
              </th>
              <th 
                onClick={() => onSort('attendance')}
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Attendance {getSortIcon('attendance')}
              </th>
              <th 
                onClick={() => onSort('participation')}
                style={{
                  textAlign: 'center',
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Part. {getSortIcon('participation')}
              </th>
              <th 
                onClick={() => onSort('behavior')}
                style={{
                  textAlign: 'center',
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Behav. {getSortIcon('behavior')}
              </th>
              <th 
                onClick={() => onSort('penalty')}
                style={{
                  textAlign: 'center',
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Penalty {getSortIcon('penalty')}
              </th>
              <th style={{
                textAlign: 'center',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                width: '60px'
              }}>
                
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const avatarColor = getAvatarColor(student.name);
              const isExpanded = expandedRows.has(student.id);
              
              console.log('[StudentRoster] Rendering student:', student.name, 'participation:', student.participation, 'behavior:', student.behavior, 'penalty:', student.penalty);
              
              return (
                <React.Fragment key={student.id}>
                  <tr
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      background: selectedStudentId === student.id ? '#f9fafb' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedStudentId !== student.id) {
                        e.currentTarget.style.background = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedStudentId !== student.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(student.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDownIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                        ) : (
                          <ChevronRightIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '1rem' }} onClick={() => onStudentSelect(student)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(student.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <StarIcon 
                            style={{ 
                              width: '1rem', 
                              height: '1rem', 
                              color: student.isPinned ? '#f59e0b' : '#d1d5db'
                            }} 
                            filled={student.isPinned}
                          />
                        </button>
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          background: avatarColor.bg,
                          color: avatarColor.color
                        }}>
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: '#111827' }}>
                            {student.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            ID: STU-{student.studentNumber || student.studentId?.slice(-4) || '0000'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }} onClick={() => onStudentSelect(student)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getAttendanceBadge(student.attendance)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        background: student.participation >= 10 ? '#d1fae5' : student.participation >= 5 ? '#dbeafe' : '#f3f4f6',
                        color: student.participation >= 10 ? '#065f46' : student.participation >= 5 ? '#1e40af' : '#374151'
                      }}>
                        {student.participation}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        background: student.behavior >= 0 ? '#d1fae5' : '#fee2e2',
                        color: student.behavior >= 0 ? '#065f46' : '#991b1b'
                      }}>
                        {student.behavior}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        background: student.penalty < 0 ? '#fee2e2' : '#f3f4f6',
                        color: student.penalty < 0 ? '#991b1b' : '#374151'
                      }}>
                        {student.penalty}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStudentSelect(student);
                          }}
                        >
                          <SidebarOpenIcon style={{ width: '1rem', height: '1rem' }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded History Row */}
                  {isExpanded && (
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <td colSpan="7" style={{ padding: '1rem 2rem' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          <h4 style={{ 
                            margin: '0 0 0.75rem 0', 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            📅 Today's History
                          </h4>
                          
                          {(!student.behaviorHistory || student.behaviorHistory.length === 0) &&
                           (!student.participationHistory || student.participationHistory.length === 0) &&
                           (!student.penaltyHistory || student.penaltyHistory.length === 0) ? (
                            <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8125rem' }}>
                              No activity recorded for today
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {student.participationHistory?.map((entry, idx) => (
                                <div key={`part-${idx}`} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.5rem 0.75rem',
                                  background: '#ecfdf5',
                                  borderRadius: '0.375rem',
                                  border: '1px solid #a7f3d0'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                      {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    <span style={{ 
                                      padding: '0.125rem 0.5rem',
                                      background: '#059669',
                                      color: 'white',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.6875rem',
                                      fontWeight: 600
                                    }}>
                                      +{entry.points} Part.
                                    </span>
                                    <span style={{ color: '#047857', fontSize: '0.8125rem' }}>
                                      {entry.reason || 'Active participation'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              
                              {student.behaviorHistory?.map((entry, idx) => (
                                <div key={`behav-${idx}`} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.5rem 0.75rem',
                                  background: entry.points >= 0 ? '#ecfdf5' : '#fef2f2',
                                  borderRadius: '0.375rem',
                                  border: entry.points >= 0 ? '1px solid #a7f3d0' : '1px solid #fecaca'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                      {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    <span style={{ 
                                      padding: '0.125rem 0.5rem',
                                      background: entry.points >= 0 ? '#059669' : '#dc2626',
                                      color: 'white',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.6875rem',
                                      fontWeight: 600
                                    }}>
                                      {entry.points >= 0 ? '+' : ''}{entry.points} Behav.
                                    </span>
                                    <span style={{ 
                                      color: entry.points >= 0 ? '#047857' : '#991b1b', 
                                      fontSize: '0.8125rem'
                                    }}>
                                      {entry.reason || entry.type}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              
                              {student.penaltyHistory?.map((entry, idx) => (
                                <div key={`penalty-${idx}`} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.5rem 0.75rem',
                                  background: '#fef2f2',
                                  borderRadius: '0.375rem',
                                  border: '1px solid #fecaca'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                      {new Date(entry.createdAt?.toDate?.() || entry.createdAt).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    <span style={{ 
                                      padding: '0.125rem 0.5rem',
                                      background: '#dc2626',
                                      color: 'white',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.6875rem',
                                      fontWeight: 600
                                    }}>
                                      -{entry.points} Penalty
                                    </span>
                                    <span style={{ color: '#991b1b', fontSize: '0.8125rem' }}>
                                      {entry.reason || entry.type}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '1.5rem'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          Showing {students.length} of {totalStudents} students
          {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button 
            variant="ghost" 
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <span style={{ fontSize: '0.875rem', color: '#6b7280', padding: '0 0.5rem' }}>
            {currentPage} / {totalPages}
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
