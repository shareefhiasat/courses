import React, { useState } from 'react';
import { Button } from './ui/button';
import { XIcon, StarIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { markAttendance } from '../../firebase/attendance';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '../../firebase/attendance';
import { BEHAVIOR_TYPES, PARTICIPATION_TYPES } from '../../constants/behaviorParticipation';

export default function StudentActionPanelNew({
  student,
  onClose,
  onBehaviorSubmit,
  onParticipationSubmit,
  onPenaltySubmit,
  selectedDate
}) {
  console.log('StudentActionPanelNew rendering for:', student);
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    behavior: false,
    participation: false,
    penalty: false
  });

  // Get current attendance status
  const attendanceStatus = ATTENDANCE_STATUS_LABELS[student.attendance] || ATTENDANCE_STATUS_LABELS.present;

  // Avatar color helper
  const getAvatarColor = (name) => {
    const colors = [
      { bg: '#fef3c7', color: '#92400e' },
      { bg: '#dbeafe', color: '#1e40af' },
      { bg: '#dcfce7', color: '#166534' },
      { bg: '#fce7f3', color: '#9f1239' },
      { bg: '#e9d5ff', color: '#6b21a8' },
      { bg: '#fed7aa', color: '#9a3412' }
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const avatarColor = getAvatarColor(student.displayName || student.realName || student.name || '');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '100%',
      maxWidth: '28rem',
      height: '100%',
      background: 'white',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
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
              <h3 style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '1rem' }}>
                {student.displayName || student.realName || student.name || student.email || 'Unknown Student'}
              </h3>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '0.25rem',
                fontFamily: 'monospace',
                background: '#f3f4f6',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                display: 'inline-block'
              }}>
                ID: STU-{student.studentNumber || student.id?.slice(-4) || '0000'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    background: attendanceStatus.color,
                    borderRadius: '9999px'
                  }} />
                  {attendanceStatus.en}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </Button>
        </div>
      </div>

      {/* Action Sections */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        {/* Behavior Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => toggleSection('behavior')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#92400e' }}>
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              <span style={{ fontWeight: 600, color: '#92400e' }}>Add Behavior</span>
            </div>
            {expandedSections.behavior ? (
              <ChevronDownIcon style={{ width: '1rem', height: '1rem', color: '#92400e' }} />
            ) : (
              <ChevronRightIcon style={{ width: '1rem', height: '1rem', color: '#92400e' }} />
            )}
          </button>
          
          {expandedSections.behavior && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              {/* Behavior form will go here */}
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Behavior form coming soon...</p>
            </div>
          )}
        </div>

        {/* Participation Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => toggleSection('participation')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: '#dbeafe',
              border: '1px solid #3b82f6',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1e40af' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span style={{ fontWeight: 600, color: '#1e40af' }}>Add Participation</span>
            </div>
            {expandedSections.participation ? (
              <ChevronDownIcon style={{ width: '1rem', height: '1rem', color: '#1e40af' }} />
            ) : (
              <ChevronRightIcon style={{ width: '1rem', height: '1rem', color: '#1e40af' }} />
            )}
          </button>
          
          {expandedSections.participation && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              {/* Participation form will go here */}
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Participation form coming soon...</p>
            </div>
          )}
        </div>

        {/* Penalty Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => toggleSection('penalty')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#b91c1c' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span style={{ fontWeight: 600, color: '#b91c1c' }}>Add Penalty</span>
            </div>
            {expandedSections.penalty ? (
              <ChevronDownIcon style={{ width: '1rem', height: '1rem', color: '#b91c1c' }} />
            ) : (
              <ChevronRightIcon style={{ width: '1rem', height: '1rem', color: '#b91c1c' }} />
            )}
          </button>
          
          {expandedSections.penalty && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              {/* Penalty form will go here */}
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Penalty form coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            onClick={() => {
              // Save all actions
              alert('Save functionality coming soon...');
            }}
            style={{ flex: 1, fontSize: '0.875rem' }}
          >
            Save Actions
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            style={{ fontSize: '0.875rem' }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
