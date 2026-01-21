import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

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

const MoreVerticalIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="12" cy="5" r="1"/>
    <circle cx="12" cy="19" r="1"/>
  </svg>
);

export default function StudentRoster({ students, onStudentSelect, selectedStudentId }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAttendanceBadge = (status) => {
    const styles = {
      present: { background: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' },
      late: { background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' },
      absent: { background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' },
    };

    const labels = {
      present: 'Pres',
      late: 'Late',
      absent: 'Abs',
    };

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        border: `1px solid ${styles[status].borderColor}`,
        ...styles[status]
      }}>
        {labels[status]}
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
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#111827',
            margin: 0
          }}>
            STUDENT ROSTER
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '0.25rem',
            marginBottom: 0
          }}>
            {students.length} Students
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
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '16rem' }}
            />
          </div>
          <Button variant="ghost" size="icon">
            <FilterIcon style={{ width: '1rem', height: '1rem' }} />
          </Button>
          <Button variant="ghost" size="icon">
            <DownloadIcon style={{ width: '1rem', height: '1rem' }} />
          </Button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Student Name
              </th>
              <th style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Attendance Status
              </th>
              <th style={{
                textAlign: 'center',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Part.
              </th>
              <th style={{
                textAlign: 'center',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Behav.
              </th>
              <th style={{
                textAlign: 'center',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Penalty
              </th>
              <th style={{
                textAlign: 'center',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => {
              const avatarColor = getAvatarColor(student.name);
              return (
                <tr
                  key={student.id}
                  onClick={() => onStudentSelect(student)}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {student.isPinned && (
                        <StarIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} filled />
                      )}
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
                          ID: {student.studentId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getAttendanceBadge(student.attendance)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
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
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.5rem',
                      fontWeight: 500,
                      background: '#f3f4f6',
                      color: '#374151'
                    }}>
                      {student.behavior}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVerticalIcon style={{ width: '1rem', height: '1rem' }} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Student</DropdownMenuItem>
                          <DropdownMenuItem>Mark Attendance</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '1.5rem'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          Showing {filteredStudents.length} of {students.length} students
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm">
            Previous
          </Button>
          <Button variant="ghost" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
