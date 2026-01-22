import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ATTENDANCE_STATUS_LABELS } from '../../firebase/attendance';
import { getAttendanceByStudent } from '../../firebase/attendance';
import { getPenalties } from '../../firebase/penalties';

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
  const [studentHistory, setStudentHistory] = useState({});

  const toggleRowExpansion = async (studentId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
      // Fetch historical data for this student if not already loaded
      if (!studentHistory[studentId]) {
        try {
          // Get all attendance records for this student
          const attendanceResponse = await getAttendanceByStudent(studentId);
          const attendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];
          
          // Get all penalties for this student
          const penaltiesResponse = await getPenalties();
          const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
          const studentPenalties = allPenalties.filter(p => p.studentId === studentId);
          
          // Combine and format logs
          const logs = [
            ...attendanceRecords.map(record => ({
              type: 'attendance',
              date: record.date || (record.timestamp?.toDate ? record.timestamp.toDate().toISOString().split('T')[0] : new Date(record.timestamp).toISOString().split('T')[0]),
              time: record.timestamp || record.date,
              label: ATTENDANCE_STATUS_LABELS[record.status]?.en || record.status,
              points: record.delta || 0,
              comment: record.reason || '',
              severity: 'low',
              color: ATTENDANCE_STATUS_LABELS[record.status]?.color || '#6b7280'
            })),
            ...studentPenalties.map(penalty => ({
              type: 'penalty',
              date: penalty.date || (penalty.createdAt?.toDate ? penalty.createdAt.toDate().toISOString().split('T')[0] : new Date(penalty.createdAt).toISOString().split('T')[0]),
              time: penalty.createdAt,
              label: penalty.reason || 'Penalty',
              points: penalty.points || 0,
              comment: penalty.comment || '',
              severity: penalty.severity || 'medium',
              color: penalty.points > 0 ? '#dcfce7' : '#fee2e2'
            }))
          ].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
          });
          
          setStudentHistory(prev => ({
            ...prev,
            [studentId]: logs
          }));
        } catch (error) {
          console.error('Error fetching student history:', error);
        }
      }
    }
    setExpandedRows(newExpanded);
  };

  // Group logs by day
  const groupLogsByDay = (logs) => {
    const grouped = {};
    
    logs.forEach(log => {
      const date = log.date;
      if (!grouped[date]) {
        grouped[date] = {
          date: date,
          attendance: [],
          penalties: [],
          participation: []
        };
      }
      
      if (log.type === 'attendance') {
        grouped[date].attendance.push(log);
      } else if (log.type === 'penalty') {
        grouped[date].penalties.push(log);
      } else if (log.points > 0) {
        grouped[date].participation.push(log);
      } else if (log.points < 0) {
        grouped[date].penalties.push(log);
      }
    });
    
    return Object.values(grouped);
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
              const avatarColor = getAvatarColor(student.displayName || student.realName || student.name || '');
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
                          {getInitials(student.displayName || student.realName || student.name || '')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: '#111827' }}>
                            {student.displayName || student.realName || student.name || student.email}
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
                        {studentHistory[student.id] ? (
                          <div style={{ fontSize: '0.875rem' }}>
                            {/*<h4 style={{ */}
                            {/*  margin: '0 0 0.75rem 0', */}
                            {/*  fontSize: '0.75rem', */}
                            {/*  fontWeight: 600, */}
                            {/*  color: '#6b7280',*/}
                            {/*  textTransform: 'uppercase',*/}
                            {/*  letterSpacing: '0.05em'*/}
                            {/*}}>*/}
                            {/*  📅 Student History*/}
                            {/*</h4>*/}
                            
                            {groupLogsByDay(studentHistory[student.id]).map((dayGroup, dayIndex) => {
                              const dateObj = new Date(dayGroup.date);
                              const dateStr = dateObj.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              });
                              
                              return (
                                <div key={dayIndex} style={{
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.5rem',
                                  overflow: 'hidden',
                                  marginBottom: '0.75rem'
                                }}>
                                  {/* Day Header */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0.75rem 1rem',
                                      background: '#f9fafb',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #e5e7eb'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                                        {dateStr}
                                      </span>
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {dayGroup.attendance.length > 0 && (
                                          <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.125rem 0.375rem',
                                            background: '#22c55e',
                                            color: 'white',
                                            borderRadius: '0.25rem'
                                          }}>
                                            {dayGroup.attendance.length} Attendance
                                          </span>
                                        )}
                                        {dayGroup.participation.length > 0 && (
                                          <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.125rem 0.375rem',
                                            background: '#3b82f6',
                                            color: 'white',
                                            borderRadius: '0.25rem'
                                          }}>
                                            {dayGroup.participation.length} Participation
                                          </span>
                                        )}
                                        {dayGroup.penalties.length > 0 && (
                                          <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.125rem 0.375rem',
                                            background: '#ef4444',
                                            color: 'white',
                                            borderRadius: '0.25rem'
                                          }}>
                                            {dayGroup.penalties.length} Penalties
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Expanded Content */}
                                  <div style={{ padding: '1rem' }}>
                                    {/* Attendance */}
                                    {dayGroup.attendance.length > 0 && (
                                      <div style={{ marginBottom: '1rem' }}>
                                        <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#22c55e', marginBottom: '0.5rem' }}>
                                          ATTENDANCE
                                        </h5>
                                        {dayGroup.attendance.map((log, idx) => (
                                          <div key={idx} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem',
                                            padding: '0.25rem 0',
                                            fontSize: '0.8125rem'
                                          }}>
                                            <span style={{ color: '#6b7280', minWidth: '80px' }}>
                                              {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </span>
                                            <span style={{ 
                                              padding: '0.125rem 0.375rem',
                                              background: log.color,
                                              color: 'white',
                                              borderRadius: '0.25rem',
                                              fontSize: '0.75rem'
                                            }}>
                                              {log.label}
                                            </span>
                                            {log.comment && (
                                              <span style={{ color: '#6b7280' }}>
                                                - {log.comment}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Participation */}
                                    {dayGroup.participation.length > 0 && (
                                      <div style={{ marginBottom: '1rem' }}>
                                        <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', marginBottom: '0.5rem' }}>
                                          PARTICIPATION
                                        </h5>
                                        {dayGroup.participation.map((log, idx) => (
                                          <div key={idx} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem',
                                            padding: '0.25rem 0',
                                            fontSize: '0.8125rem'
                                          }}>
                                            <span style={{ color: '#6b7280', minWidth: '80px' }}>
                                              {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </span>
                                            <span style={{ 
                                              padding: '0.125rem 0.375rem',
                                              background: '#dcfce7',
                                              color: '#166534',
                                              borderRadius: '0.25rem',
                                              fontSize: '0.75rem',
                                              fontWeight: 600
                                            }}>
                                              +{log.points}
                                            </span>
                                            <span style={{ color: '#374151' }}>
                                              {log.label}
                                            </span>
                                            {log.comment && (
                                              <span style={{ color: '#6b7280' }}>
                                                - {log.comment}
                                              </span>
                                            )}
                                            {log.severity && (
                                              <span style={{ 
                                                padding: '0.125rem 0.375rem',
                                                background: '#f3f4f6',
                                                color: '#6b7280',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem'
                                              }}>
                                                {log.severity}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Penalties */}
                                    {dayGroup.penalties.length > 0 && (
                                      <div>
                                        <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.5rem' }}>
                                          PENALTIES
                                        </h5>
                                        {dayGroup.penalties.map((log, idx) => (
                                          <div key={idx} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem',
                                            padding: '0.25rem 0',
                                            fontSize: '0.8125rem'
                                          }}>
                                            <span style={{ color: '#6b7280', minWidth: '80px' }}>
                                              {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </span>
                                            <span style={{ 
                                              padding: '0.125rem 0.375rem',
                                              background: '#fee2e2',
                                              color: '#dc2626',
                                              borderRadius: '0.25rem',
                                              fontSize: '0.75rem',
                                              fontWeight: 600
                                            }}>
                                              {log.points > 0 ? `+${log.points}` : log.points}
                                            </span>
                                            <span style={{ color: '#374151' }}>
                                              {log.label}
                                            </span>
                                            {log.comment && (
                                              <span style={{ color: '#6b7280' }}>
                                                - {log.comment}
                                              </span>
                                            )}
                                            {log.severity && (
                                              <span style={{ 
                                                padding: '0.125rem 0.375rem',
                                                background: '#f3f4f6',
                                                color: '#6b7280',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem'
                                              }}>
                                                {log.severity}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ 
                            padding: '2rem', 
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '0.875rem'
                          }}>
                            Loading student history...
                          </div>
                        )}
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
