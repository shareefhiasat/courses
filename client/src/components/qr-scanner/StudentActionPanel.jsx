import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '../../utils/logger';
import { Star, Mail, QrCode, Users, AlertCircle, Zap, ChevronDown, ExternalLink, Trophy, Grid, List } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { ATTENDANCE_STATUS_LABELS } from '../../firebase/attendance';
import { getAttendanceByStudent } from '../../firebase/attendance';
import { deleteAttendance } from '../../firebase/attendance';
import { getPenalties } from '../../firebase/penalties';
import { deletePenalty } from '../../firebase/penalties';
import { getFunctions } from '../../firebase/config';
import { generateReferenceId, generateStudentQRCode } from '../../utils/qrCode';
import { BEHAVIOR_TYPES, PARTICIPATION_TYPES } from '../../constants/behaviorParticipation';
import eventBus, { EVENTS } from '../../utils/eventBus';
import { FancyLoading } from '../ui/FancyLoading/FancyLoading';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const XIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const HistoryIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v5h5" />
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
  </svg>
);

const renderIcon = (iconName, style) => {
  const icons = {
    MessageSquare: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    Bed: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /></svg>,
    Smartphone: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>,
    Users: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    AlertTriangle: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    Clock: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    CheckCircle: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    Award: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
    FileText: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>,
    Star: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  };
  return icons[iconName] || icons.MessageSquare;
};

// Separate component for historical logs to avoid hooks order issues
const HistoricalLogsList = React.memo(({ 
  groupedLogs, 
  expandedDays, 
  activeFilters, 
  toggleDayExpansion, 
  handleDeleteAttendance, 
  handleDeletePenalty, 
  t, 
  isRTL 
}) => {
  return groupedLogs.map((dayGroup, dayIndex) => {
    const dateObj = new Date(dayGroup.date);
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const isDayExpanded = expandedDays.has(dayGroup.date);
    const filteredCounts = {
      attendance: activeFilters.attendance ? dayGroup.attendance.length : 0,
      participation: activeFilters.participation ? dayGroup.participation.length : 0,
      behavior: activeFilters.behavior ? (dayGroup.behavior ? dayGroup.behavior.length : 0) : 0,
      penalties: activeFilters.penalties ? dayGroup.penalties.length : 0
    };
    const hasVisibleItems = filteredCounts.attendance + filteredCounts.participation + filteredCounts.behavior + filteredCounts.penalties > 0;

    return (
      <div key={dayIndex} style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.375rem',
        overflow: 'hidden',
        marginBottom: '0.25rem',
        display: hasVisibleItems ? 'block' : 'none'
      }}>
        {/* Day Header */}
        <div
          onClick={() => toggleDayExpansion(dayGroup.date)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            background: '#f9fafb',
            cursor: 'pointer',
            borderBottom: isDayExpanded ? '1px solid #e5e7eb' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>
              {dateStr}
            </span>
            <div style={{ display: 'flex', gap: '0.15', alignItems: 'center' }}>
              {filteredCounts.attendance > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.15',
                  padding: '0.25rem 0.15rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#166534'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {filteredCounts.attendance}
                </div>
              )}
              {filteredCounts.participation > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  background: '#dbeafe',
                  border: '1px solid #93c5fd',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#1e40af'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                  {filteredCounts.participation}
                </div>
              )}
              {filteredCounts.behavior > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  background: '#fed7aa',
                  border: '1px solid #fdba74',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#9a3412'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  {filteredCounts.behavior}
                </div>
              )}
              {filteredCounts.penalties > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#991b1b'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {filteredCounts.penalties}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {isDayExpanded ? t('hide_details') : t('show_details')}
            </span>
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                transform: isDayExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isDayExpanded && (
          <div style={{ padding: '0.75rem' }}>
            {/* Attendance */}
            {activeFilters.attendance && dayGroup.attendance.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                {dayGroup.attendance.map((log, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.375rem 0',
                    fontSize: '0.8125rem',
                    borderBottom: idx === dayGroup.attendance.length - 1 ? 'none' : '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                        {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: log.color || '#22c55e', [isRTL ? 'marginLeft' : 'marginRight']: '0.5rem' }}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span style={{ color: '#374151', fontWeight: 500 }}>
                        {log.label}
                      </span>
                      {log.comment && (
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          - {log.comment}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAttendance(log.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={t('delete_attendance_record')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Participation */}
            {activeFilters.participation && dayGroup.participation.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                {dayGroup.participation.map((log, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.375rem 0',
                    fontSize: '0.8125rem',
                    borderBottom: idx === dayGroup.participation.length - 1 ? 'none' : '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                        {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: log.color || '#3b82f6', [isRTL ? 'marginLeft' : 'marginRight']: '0.5rem' }}>
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                        <path d="M4 22h16" />
                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                      </svg>
                      <span style={{ color: '#374151', fontWeight: 500 }}>
                        {log.label}
                      </span>
                      {log.comment && (
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          - {log.comment}
                        </span>
                      )}
                      {log.points && (
                        <span style={{
                          padding: '0.125rem 0.375rem',
                          background: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          +{log.points}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAttendance(log.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={t('delete_attendance_record')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Behavior */}
            {activeFilters.behavior && dayGroup.behavior && dayGroup.behavior.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                {dayGroup.behavior.map((log, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.375rem 0',
                    fontSize: '0.8125rem',
                    borderBottom: idx === dayGroup.behavior.length - 1 ? 'none' : '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                        {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: log.color || '#f97316', [isRTL ? 'marginLeft' : 'marginRight']: '0.5rem' }}>
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                      <span style={{ color: '#374151', fontWeight: 500 }}>
                        {log.label}
                      </span>
                      {log.comment && (
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          - {log.comment}
                        </span>
                      )}
                      {log.points && (
                        <span style={{
                          padding: '0.125rem 0.375rem',
                          background: '#fed7aa',
                          color: '#9a3412',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          +{log.points}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAttendance(log.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={t('delete_attendance_record')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Penalties */}
            {activeFilters.penalties && dayGroup.penalties.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                {dayGroup.penalties.map((log, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.375rem 0',
                    fontSize: '0.8125rem',
                    borderBottom: idx === dayGroup.penalties.length - 1 ? 'none' : '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                        {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: log.color || '#ef4444', [isRTL ? 'marginLeft' : 'marginRight']: '0.5rem' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span style={{ color: '#374151', fontWeight: 500 }}>
                        {log.label}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeletePenalty(log.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={t('delete_penalty_record')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  });
});

HistoricalLogsList.displayName = 'HistoricalLogsList';

const StudentActionPanel = React.memo(function StudentActionPanel({
  student,
  onClose,
  onBehaviorSubmit,
  onMarkAttendance,
  behaviorTypes,
  participationTypes,
  showFavoritesOnly = false,
  onToggleFavorites,
  favoriteBehaviors = [],
  onToggleFavorite,
  sendNotifications = false,
  onToggleNotifications
}) {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
  const [selectedActions, setSelectedActions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [deleteLogId, setDeleteLogId] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionPoints, setActionPoints] = useState({});
  const [internalNote, setInternalNote] = useState('');
  const [activeTab, setActiveTab] = useState('behavior');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [todayLogs, setTodayLogs] = useState([]);
  const [historicalLogs, setHistoricalLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [sendingQRCode, setSendingQRCode] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    behavior: false,
    participation: false,
    penalty: false
  });
  const [activeFilters, setActiveFilters] = useState({
    attendance: true,
    participation: true,
    behavior: true,
    penalties: true
  });

  // Debounced resize handler for performance
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Send QR code email
  const sendQRCodeEmail = async () => {
    if (!student?.id || !student?.email) {
      logger.error('Student information missing');
      return;
    }

    setSendingQRCode(true);
    try {
      const functions = getFunctions();
      const sendQRCodeEmail = functions.httpsCallable('sendQRCodeEmail');

      const result = await sendQRCodeEmail({
        studentId: student.id,
        studentEmail: student.email
      });

      if (result.success) {
        logger.debug('QR code email sent successfully');
      } else {
        logger.error('Failed to send QR code email:', result.message);
      }
    } catch (error) {
      logger.error('Error sending QR code email:', error);
    } finally {
      setSendingQRCode(false);
    }
  };

  // Send student summary email
  const sendStudentSummaryEmail = async () => {
    if (!student?.id || !student?.email) {
      logger.error('Student information missing');
      return;
    }

    setSendingSummary(true);
    try {
      // Calculate statistics from the logs we already have
      const attendanceStats = {
        present: logs.filter(log => log.type === 'attendance' && log.data.status === 'present').length,
        late: logs.filter(log => log.type === 'attendance' && log.data.status === 'late').length,
        absent: logs.filter(log => log.type === 'attendance' && log.data.status === 'absent').length,
        percentage: 0 // Will be calculated
      };

      const totalAttendance = attendanceStats.present + attendanceStats.late + attendanceStats.absent;
      if (totalAttendance > 0) {
        attendanceStats.percentage = Math.round((attendanceStats.present / totalAttendance) * 100);
      }

      const participationStats = {
        total: student.participation || 0,
        positive: logs.filter(log => log.type === 'participation' && log.points > 0).reduce((sum, log) => sum + log.points, 0),
        neutral: logs.filter(log => log.type === 'participation' && log.points === 0).length
      };

      const behaviorStats = {
        total: student.behavior || 0,
        positive: logs.filter(log => log.type === 'behavior' && log.points > 0).reduce((sum, log) => sum + log.points, 0),
        negative: Math.abs(logs.filter(log => log.type === 'behavior' && log.points < 0).reduce((sum, log) => sum + log.points, 0))
      };

      const penaltyStats = {
        total: logs.filter(log => log.type === 'penalty').length,
        minor: logs.filter(log => log.type === 'penalty' && log.severity === 'minor').length,
        major: logs.filter(log => log.type === 'penalty' && log.severity === 'major').length,
        recentPenalties: logs.filter(log => log.type === 'penalty').slice(0, 3).map(log =>
          `${log.label} (${new Date(log.time).toLocaleDateString()})`
        ).join(', ')
      };

      // Calculate overall grade based on all factors
      const attendanceScore = attendanceStats.percentage;
      const participationScore = Math.min(100, participationStats.total * 2);
      const behaviorScore = Math.max(0, Math.min(100, 50 + behaviorStats.total));
      const penaltyDeduction = penaltyStats.total * 5;

      const overallScore = Math.max(0, Math.min(100,
        (attendanceScore * 0.4) +
        (participationScore * 0.3) +
        (behaviorScore * 0.2) +
        (100 - penaltyDeduction) * 0.1
      ));

      let overallGrade = 'F';
      if (overallScore >= 90) overallGrade = 'A+';
      else if (overallScore >= 85) overallGrade = 'A';
      else if (overallScore >= 80) overallGrade = 'B+';
      else if (overallScore >= 75) overallGrade = 'B';
      else if (overallScore >= 70) overallGrade = 'C+';
      else if (overallScore >= 65) overallGrade = 'C';
      else if (overallScore >= 60) overallGrade = 'D+';
      else if (overallScore >= 55) overallGrade = 'D';

      const functions = getFunctions();
      const sendSummaryEmail = functions.httpsCallable('sendSummaryEmail');

      const result = await sendSummaryEmail({
        to: student.email,
        templateId: 'student_summary_report',
        templateData: {
          studentName: student.displayName || student.realName || student.name,
          studentEmail: student.email,
          studentId: student.studentNumber || student.id,
          className: selectedClass?.name || selectedClass?.code || 'Class',
          attendanceStats,
          participationStats,
          behaviorStats,
          penaltyStats,
          overallGrade,
          reportPeriod: 'This Term',
          siteName: 'CS Learning Hub',
          currentDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }
      });

      if (result.success) {
        logger.debug('Student summary email sent successfully');
      } else {
        logger.error('Failed to send student summary email:', result.message);
      }
    } catch (error) {
      logger.error('Error sending student summary email:', error);
    } finally {
      setSendingSummary(false);
    }
  };

  const toggleDayExpansion = useCallback((dayKey) => {
    setExpandedDays(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(dayKey)) {
        newExpanded.delete(dayKey);
      } else {
        newExpanded.add(dayKey);
      }
      return newExpanded;
    });
  }, []);

  const toggleSectionExpansion = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Memoized detailed statistics calculation for performance
  const getDetailedStats = useCallback(() => {
    const stats = {
      behavior: {},
      participation: {},
      penalty: {}
    };

    // Calculate behavior stats
    BEHAVIOR_TYPES.forEach(type => {
      stats.behavior[type.id] = {
        count: 0,
        totalPoints: 0,
        label: type.label_en,
        color: type.color,
        icon: type.icon
      };
    });

    // Calculate participation stats
    PARTICIPATION_TYPES.forEach(type => {
      stats.participation[type.id] = {
        count: 0,
        totalPoints: 0,
        label: type.label_en,
        color: '#3b82f6',
        icon: type.icon
      };
    });

    // Calculate penalty stats (same as behavior but for negative points)
    BEHAVIOR_TYPES.filter(bt => bt.points < 0).forEach(type => {
      stats.penalty[type.id] = {
        count: 0,
        totalPoints: 0,
        label: type.label_en,
        color: type.color,
        icon: type.icon
      };
    });

    // Process logs to calculate stats
    todayLogs.forEach((log) => {
      if (log.type === 'behavior') {
        const behaviorType = log.data.type || 'other';

        if (stats.behavior[behaviorType]) {
          stats.behavior[behaviorType].count++;
          stats.behavior[behaviorType].totalPoints += log.points || 0;
        }
        // Also add to penalty if it's a negative behavior
        if (log.points < 0 && stats.penalty[behaviorType]) {
          stats.penalty[behaviorType].count++;
          stats.penalty[behaviorType].totalPoints += log.points || 0;
        }
      } else if (log.type === 'participation') {
        const participationType = log.data.type || 'other';

        if (stats.participation[participationType]) {
          stats.participation[participationType].count++;
          stats.participation[participationType].totalPoints += log.points || 0;
        }
      } else if (log.type === 'penalty') {
        const penaltyType = log.data.type || 'other';

        if (stats.penalty[penaltyType]) {
          stats.penalty[penaltyType].count++;
          stats.penalty[penaltyType].totalPoints += log.points || 0;
        }
      }
    });

    return stats;
  }, [todayLogs]);

  // Fetch historical logs for student - defined before usage
  const fetchHistoricalLogs = useCallback(async () => {
    if (!student?.id) return;

    setLogsLoading(true);
    try {
      // Small delay to ensure Firestore has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get all attendance records for this student (no date filter)
      const attendanceResponse = await getAttendanceByStudent(student.id);
      const attendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];

      // Get all penalties for this student
      const penaltiesResponse = await getPenalties();
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      const studentPenalties = allPenalties.filter(p => p.studentId === student.id);

      // Combine and format logs with date information
      const logs = [
        ...attendanceRecords.map(record => ({
          id: record.id || record.docId,
          type: record.category || (record.delta ? (record.delta > 0 ? 'participation' : 'behavior') : 'attendance'),
          date: record.date || (record.timestamp?.toDate ? record.timestamp.toDate().toISOString().split('T')[0] : new Date(record.timestamp).toISOString().split('T')[0]),
          time: record.timestamp || record.date,
          data: record,
          label: ATTENDANCE_STATUS_LABELS[record.status]?.en || record.status,
          points: record.delta || 0,
          comment: record.reason || record.notes || '',
          severity: 'low',
          color: ATTENDANCE_STATUS_LABELS[record.status]?.color || '#6b7280'
        })),
        ...studentPenalties.map(penalty => ({
          id: penalty.id || penalty.docId,
          type: 'penalty',
          date: penalty.date || (penalty.createdAt?.toDate ? penalty.createdAt.toDate().toISOString().split('T')[0] : new Date(penalty.createdAt).toISOString().split('T')[0]),
          time: penalty.createdAt,
          data: penalty,
          label: penalty.reason || 'Penalty',
          points: penalty.points || 0,
          comment: penalty.comment || '',
          severity: penalty.severity || 'medium',
          color: penalty.points > 0 ? '#dcfce7' : '#fee2e2'
        }))
      ].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Most recent first
      });

      setHistoricalLogs(logs);
      setLogsError('');
    } catch (error) {
      logger.error('Error fetching historical logs:', error);
      setLogsError('Failed to load history');
      setHistoricalLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [student?.id]);

  // Fetch today's logs when student changes or manual refresh triggered
  useEffect(() => {
    // Reset when student changes
    setSelectedActions([]);
    setActionPoints({});
    setInternalNote('');

    // Fetch historical logs for the student
    if (student?.id) {
      fetchHistoricalLogs();
    }
  }, [student?.id, historyRefreshKey, fetchHistoricalLogs]);

  // Real-time updates for history
  useEffect(() => {
    if (!student?.id) return;

    const unsubscribeAttendance = eventBus.on(EVENTS.ATTENDANCE_MARKED, (data) => {
      if (data.studentId === student.id) fetchHistoricalLogs();
    });

    const unsubscribeBehavior = eventBus.on(EVENTS.BEHAVIOR_LOGGED, (data) => {
      if (data.studentId === student.id) fetchHistoricalLogs();
    });

    const unsubscribeParticipation = eventBus.on(EVENTS.PARTICIPATION_ADDED, (data) => {
      if (data.studentId === student.id) fetchHistoricalLogs();
    });

    const unsubscribePenalty = eventBus.on(EVENTS.PENALTY_ASSIGNED, (data) => {
      if (data.studentId === student.id) fetchHistoricalLogs();
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeBehavior();
      unsubscribeParticipation();
      unsubscribePenalty();
    };
  }, [student?.id, fetchHistoricalLogs]);

  // Fetch real data from Firebase - memoized
  const handleMarkAttendance = useCallback(async (studentId, status) => {
    setShowLoadingOverlay(true);
    try {
      await onMarkAttendance(studentId, status);
      // Force refresh the history by incrementing the key
      setHistoryRefreshKey(prev => prev + 1);
      // Refresh data after marking attendance
      await fetchHistoricalLogs();
    } catch (error) {
      logger.error('Error marking attendance:', error);
    } finally {
      setShowLoadingOverlay(false);
    }
  }, [onMarkAttendance, fetchHistoricalLogs]);

  // Delete attendance log
  const handleDeleteAttendance = useCallback((logId) => {
    setDeleteType('attendance');
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  }, []);

  // Delete penalty log
  const handleDeletePenalty = useCallback((logId) => {
    setDeleteType('penalty');
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  }, []);

  // Handle actual deletion after confirmation - memoized
  const handleConfirmDelete = useCallback(async () => {
    setDeleteLoading(true);
    try {
      let result;
      if (deleteType === 'attendance') {
        result = await deleteAttendance(deleteLogId);
        if (result.success) {
          // Refresh the history
          setHistoryRefreshKey(prev => prev + 1);
          await fetchHistoricalLogs();
          
          // Emit event for real-time updates
          eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
            studentId: student.id,
            classId: student.classId,
            status: 'deleted',
            performedBy: user,
            timestamp: new Date()
          });
        } else {
          console.error('Failed to delete attendance record:', result.error);
          alert('Failed to delete attendance record: ' + result.error);
        }
      } else if (deleteType === 'penalty') {
        result = await deletePenalty(deleteLogId);
        if (result.success) {
          // Refresh the history
          setHistoryRefreshKey(prev => prev + 1);
          await fetchHistoricalLogs();
          
          // Emit event for real-time updates
          eventBus.emit(EVENTS.PENALTY_ASSIGNED, {
            studentId: student.id,
            classId: student.classId,
            status: 'deleted',
            performedBy: user,
            timestamp: new Date()
          });
        } else {
          logger.error('Failed to delete penalty record:', result.error);
          alert('Failed to delete penalty record: ' + result.error);
        }
      }
    } catch (error) {
      logger.error(`Error deleting ${deleteType} record:`, error);
      alert(`Error deleting ${deleteType} record: ` + error.message);
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setDeleteType('');
      setDeleteLogId('');
    }
  }, [deleteType, deleteLogId, student, user, fetchHistoricalLogs]);

  // Memoized group logs by day for performance
  const groupLogsByDay = useCallback((logs) => {
    const grouped = {};

    logs.forEach(log => {
      const date = log.date;
      if (!grouped[date]) {
        grouped[date] = {
          date: date,
          attendance: [],
          penalties: [],
          participation: [],
          behavior: []
        };
      }

      if (log.type === 'attendance') {
        grouped[date].attendance.push(log);
      } else if (log.type === 'penalty') {
        grouped[date].penalties.push(log);
      } else if (log.type === 'participation') {
        grouped[date].participation.push(log);
      } else if (log.type === 'behavior') {
        grouped[date].behavior.push(log);
      } else if (log.points > 0) {
        // Fallback for older records
        grouped[date].participation.push(log);
      } else if (log.points < 0) {
        // Fallback for older records
        grouped[date].penalties.push(log);
      }
    });

    return Object.values(grouped);
  }, []);

  // Memoized grouped logs for display
  const memoizedGroupedLogs = useMemo(() => groupLogsByDay(historicalLogs), [historicalLogs, groupLogsByDay]);

  if (!student) return null;

  // Memoized available options for performance
  const options = useMemo(() => {
    if (activeTab === 'participation') {
      return participationTypes.map(pt => ({
        ...pt,
        category: 'participation'
      }));
    } else if (activeTab === 'behavior') {
      return behaviorTypes.filter(bt => bt.points !== 0).map(bt => ({
        ...bt,
        category: 'behavior'
      }));
    } else if (activeTab === 'penalty') {
      return behaviorTypes.filter(bt => bt.points < 0).map(bt => ({
        ...bt,
        category: 'penalty'
      }));
    }
    return [];
  }, [activeTab, participationTypes, behaviorTypes]);

  const toggleAction = useCallback((option) => {
    setSelectedActions((prev) => {
      const exists = prev.find(a => a.id === option.id);
      if (exists) {
        // Remove action and its points
        setActionPoints(prevPoints => {
          const newPoints = { ...prevPoints };
          delete newPoints[option.id];
          return newPoints;
        });
        return prev.filter(a => a.id !== option.id);
      } else {
        // Add action with default points
        setActionPoints(prev => ({
          ...prev,
          [option.id]: option.points || 0
        }));
        return [...prev, option];
      }
    });
  }, []);

  const handlePointsChange = useCallback((optionId, value) => {
    const numValue = parseInt(value) || 0;
    setActionPoints(prev => ({
      ...prev,
      [optionId]: numValue
    }));
  }, []);

  const handleApply = useCallback(() => {
    if (selectedActions.length === 0) return;

    const actions = selectedActions.map((action) => ({
      type: action.id,
      points: actionPoints[action.id] || 0, // Use the mandatory points field
      timestamp: new Date(),
      category: action.category
    }));

    onBehaviorSubmit(student.id, actions, internalNote);
    setSelectedActions([]);
    setActionPoints({});
    setInternalNote('');
  }, [selectedActions, actionPoints, internalNote, student.id, onBehaviorSubmit]);

  const toggleFilter = useCallback((filter) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  }, []);

  const getInitials = useCallback((name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getAvatarColor = (name) => {
    const colors = [
      { bg: '#e9d5ff', color: '#6b21a8' },
      { bg: '#fed7aa', color: '#9a3412' },
      { bg: '#fecaca', color: '#991b1b' },
      { bg: '#d1fae5', color: '#065f46' },
      { bg: '#dbeafe', color: '#1e40af' },
      { bg: '#f3e8ff', color: '#6b21a8' }
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Memoized computed values for performance
  const avatarColor = useMemo(() => getAvatarColor(student?.name || ''), [student?.name, getAvatarColor]);
  const attendanceStatus = useMemo(() => {
    if (!student?.attendance) {
      return {
        en: t('nothing_yet') || 'NOTHING YET',
        ar: t('nothing_yet') || 'لا شيء بعد',
        color: '#fbbf24'
      };
    }
    return ATTENDANCE_STATUS_LABELS[student?.attendance] || ATTENDANCE_STATUS_LABELS.absent_no_excuse;
  }, [student?.attendance, t]);

  // Memoized attendance statistics calculation (TODAY ONLY)
  const attendanceStats = useMemo(() => {
    return todayLogs.reduce((acc, log) => {
      if (log.type === 'attendance') {
        const status = log.data?.status;
        if (status === 'present') acc.present++;
        else if (status === 'absent_no_excuse') acc.absent_no_excuse++;
        else if (status === 'absent_with_excuse') acc.absent_with_excuse++;
        else if (status === 'late') acc.late++;
        else if (status === 'excused_leave') acc.excused_leave++;
        else if (status === 'human_case') acc.human_case++;
      }
      return acc;
    }, { present: 0, late: 0, absent_no_excuse: 0, absent_with_excuse: 0, excused_leave: 0, human_case: 0 });
  }, [todayLogs]);

  // Memoized TOTAL attendance statistics calculation (ALL TIME)
  const totalAttendanceStats = useMemo(() => {
    return historicalLogs.reduce((acc, log) => {
      if (log.type === 'attendance') {
        const status = log.data?.status;
        if (status === 'present') acc.present++;
        else if (status === 'absent_no_excuse') acc.absent_no_excuse++;
        else if (status === 'absent_with_excuse') acc.absent_with_excuse++;
        else if (status === 'late') acc.late++;
        else if (status === 'excused_leave') acc.excused_leave++;
        else if (status === 'human_case') acc.human_case++;
      }
      return acc;
    }, { present: 0, late: 0, absent_no_excuse: 0, absent_with_excuse: 0, excused_leave: 0, human_case: 0 });
  }, [historicalLogs]);

  const totalPoints = useMemo(() => 
    (student?.participation || 0) + (student?.behavior || 0) + (student?.penalty || 0),
    [student?.participation, student?.behavior, student?.penalty]
  );

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--overlay, rgba(0, 0, 0, 0.5))',
          zIndex: 1999
        }}
        onClick={onClose}
      />
      
      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--panel, white)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FancyLoading />
        </div>
      )}
      
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{
        position: 'fixed',
        top: 0,
        [isRTL ? 'left' : 'right']: 0,
        width: isMobile ? '100%' : '100%',
        maxWidth: isMobile ? '100%' : '28rem',
        height: '100%',
        background: 'var(--panel, white)',
        boxShadow: isRTL ? '4px 0 24px rgba(0,0,0,0.1)' : '-4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '0.8rem', borderBottom: '1px solid var(--border, #e5e7eb)', paddingBottom: '0.15rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--text, #111827)', margin: 0, fontSize: '1rem' }}>
                    {student.displayName || student.realName || student.name || student.email || t('unknown_student')}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      background: attendanceStatus.color,
                      borderRadius: '9999px'
                    }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {lang === 'ar' ? (attendanceStatus.ar || attendanceStatus.en) : attendanceStatus.en}
                    </span>
                  </div>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #6b7280)',
                  marginTop: '0.25rem',
                  fontFamily: 'monospace',
                  background: 'var(--panel-hover, #f3f4f6)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  display: 'inline-block'
                }}>
                  ID: STU-{student.studentNumber || student.id?.slice(-4) || '0000'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }}>
              <div
                onClick={onToggleNotifications}
                title={sendNotifications ? t('notifications_on') : t('notifications_off')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.25rem 0.5rem',
                  background: sendNotifications ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  border: `1px solid ${sendNotifications ? '#bbf7d0' : '#fecaca'}`,
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  width: '1.75rem',
                  height: '0.875rem',
                  background: sendNotifications ? '#10b981' : '#ef4444',
                  borderRadius: '1rem',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}>
                  <div style={{
                    width: '0.625rem',
                    height: '0.625rem',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '0.125rem',
                    left: sendNotifications ? (isRTL ? '0.125rem' : '1rem') : (isRTL ? '1rem' : '0.125rem'),
                    transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>
                <span style={{ 
                  fontSize: '0.5rem', 
                  fontWeight: 600, 
                  color: sendNotifications ? '#166534' : '#991b1b',
                }}>
                  {t('notifs')}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={async () => {
                  const referenceId = student.studentNumber ? `STU-${student.studentNumber}` : generateReferenceId(student.id || student.docId);
                  const qrDataUrl = await generateStudentQRCode(referenceId, { width: 512, margin: 4 });
                  const newTab = window.open();
                  newTab.document.write(`<html><head><title>QR Code</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f3f4f6;"><img src="${qrDataUrl}" style="width:300px;height:300px;"/><h1 style="margin:1rem 0 0;">${student.displayName || student.name}</h1></body></html>`);
                }}
                title={t('open_qr_code')}
              >
                <ExternalLink style={{ width: '1.25rem', height: '1.25rem' }} />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} title={t('close')}>
                <XIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              </Button>
            </div>
          </div>

          {/* Attendance Status - Moved to top */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text, #111827)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              {/*Attendance Status*/}
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '0.25rem'
            }}>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'present');
                }}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #10b981',
                  background: student.attendance === 'present' ? '#10b981' : 'white',
                  color: student.attendance === 'present' ? 'white' : '#10b981',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {attendanceStats.present && Number(attendanceStats.present) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'present' ? 'white' : '#10b981',
                      background: student.attendance === 'present' ? '#10b981' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.present}
                    </span>
                  )}
                </div>
                <div>{t('present')}</div>
              </button>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'late');
                }}
                disabled={showLoadingOverlay}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #f59e0b',
                  background: student.attendance === 'late' ? '#f59e0b' : 'white',
                  color: student.attendance === 'late' ? 'white' : '#f59e0b',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 12 12"></polyline>
                  </svg>
                  {attendanceStats.late && Number(attendanceStats.late) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'late' ? 'white' : '#f59e0b',
                      background: student.attendance === 'late' ? '#f59e0b' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.late}
                    </span>
                  )}
                </div>
                <div>{t('late')}</div>
              </button>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'absent_no_excuse');
                }}
                disabled={showLoadingOverlay}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #ef4444',
                  background: student.attendance === 'absent_no_excuse' ? '#ef4444' : 'white',
                  color: student.attendance === 'absent_no_excuse' ? 'white' : '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  {attendanceStats.absent_no_excuse && Number(attendanceStats.absent_no_excuse) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'absent_no_excuse' ? 'white' : '#ef4444',
                      background: student.attendance === 'absent_no_excuse' ? '#ef4444' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.absent_no_excuse}
                    </span>
                  )}
                </div>
                <div>{t('absent')}</div>
              </button>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'absent_with_excuse');
                }}
                disabled={showLoadingOverlay}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #ef4444',
                  background: student.attendance === 'absent_with_excuse' ? '#ef4444' : 'white',
                  color: student.attendance === 'absent_with_excuse' ? 'white' : '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  {attendanceStats.absent_with_excuse && Number(attendanceStats.absent_with_excuse) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'absent_with_excuse' ? 'white' : '#ef4444',
                      background: student.attendance === 'absent_with_excuse' ? '#ef4444' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.absent_with_excuse}
                    </span>
                  )}
                </div>
                <div>{t('absent_excused')}</div>
              </button>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'excused_leave');
                }}
                disabled={showLoadingOverlay}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #ef4444',
                  background: student.attendance === 'excused_leave' ? '#ef4444' : 'white',
                  color: student.attendance === 'excused_leave' ? 'white' : '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                  {attendanceStats.excused_leave && Number(attendanceStats.excused_leave) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'excused_leave' ? 'white' : '#ef4444',
                      background: student.attendance === 'excused_leave' ? '#ef4444' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.excused_leave}
                    </span>
                  )}
                </div>
                <div>{t('excused_leave')}</div>
              </button>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'human_case');
                }}
                disabled={showLoadingOverlay}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #8b5cf6',
                  background: student.attendance === 'human_case' ? '#8b5cf6' : 'white',
                  color: student.attendance === 'human_case' ? 'white' : '#8b5cf6',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {attendanceStats.human_case && Number(attendanceStats.human_case) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'human_case' ? 'white' : '#8b5cf6',
                      background: student.attendance === 'human_case' ? '#8b5cf6' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.human_case}
                    </span>
                  )}
                </div>
                <div>{t('human_case')}</div>
              </button>
            </div>
          </div>

          {/* Points Summary */}
          <div style={{ marginBottom: '0.15rem' }}>
            {/* 4 Total Cards Only - without Late */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.15rem',
              marginBottom: '0.5rem'
            }}>
              {/* Total Present */}
              <div style={{
                padding: '0.375rem',
                background: '#16a34a',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {totalAttendanceStats.present}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'white', fontWeight: 500 }}>
                  {t('present')}
                </div>
              </div>

              {/* Total Penalty */}
              <div style={{
                padding: '0.5rem',
                background: '#dc2626',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {student.penalty || 0}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'white', fontWeight: 500 }}>
                  {t('penalty')}
                </div>
              </div>

              {/* Total Behavior */}
              <div style={{
                padding: '0.5rem',
                background: '#f97316',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {student.behavior >= 0 ? '+' : ''}{student.behavior || 0}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'white', fontWeight: 500 }}>
                  {t('behavior')}
                </div>
              </div>

              {/* Total Participation */}
              <div style={{
                padding: '0.5rem',
                background: '#3b82f6',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {student.participation || 0}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'white', fontWeight: 500 }}>
                  {t('participation')}
                </div>
              </div>
            </div>

            {/* Additional Attendance Totals Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.25rem',
              marginBottom: '0.5rem'
            }}>
              {/* Total Late */}
              <div style={{
                padding: '0.5rem',
                background: '#eab308',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {totalAttendanceStats.late}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'white', fontWeight: 500 }}>
                  {t('late')}
                </div>
              </div>

              {/* Total Human Case */}
              <div style={{
                padding: '0.5rem',
                background: '#8b5cf6',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {attendanceStats.human_case}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'white', fontWeight: 500 }}>
                  {t('human_case')}
                </div>
              </div>

              {/* Total Excused Leave */}
              <div style={{
                padding: '0.5rem',
                background: '#06b6d4',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {attendanceStats.excused_leave}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'white', fontWeight: 500 }}>
                  {t('excused_leave')}
                </div>
              </div>

              {/* Total Absent (Excused) */}
              <div style={{
                padding: '0.5rem',
                background: '#f59e0b',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {attendanceStats.absent_with_excuse}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'white', fontWeight: 500 }}>
                  {t('absent_excused')}
                </div>
              </div>

              {/* Total Absent (No Excuse) */}
              <div style={{
                padding: '0.5rem',
                background: '#ef4444',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {attendanceStats.absent_no_excuse}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'white', fontWeight: 500 }}>
                  {t('absent')}
                </div>
              </div>
            </div>

            {/* Behavior Section */}
            <div style={{ marginBottom: '0.15rem' }}>
              <div
                onClick={() => toggleSectionExpansion('behavior')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#f97316',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  marginBottom: '0.15rem'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                  {t('behavior_details')} ({student.behavior || 0} {t('points')}, {(() => {
                    const stats = getDetailedStats();
                    return BEHAVIOR_TYPES.reduce((sum, type) => sum + (stats.behavior[type.id]?.count || 0), 0);
                  })()} {t('entries')})
                </span>
                <ChevronDown
                  style={{
                    width: '16px',
                    height: '16px',
                    transform: expandedSections.behavior ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </div>

              {expandedSections.behavior && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  {(() => {
                    const stats = getDetailedStats();
                    return BEHAVIOR_TYPES.map(type => {
                      const stat = stats.behavior[type.id];
                      return (
                        <div key={type.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: type.color,
                          borderRadius: '0.375rem',
                          opacity: stat.count > 0 ? 1 : 0.8
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'white',
                            flex: 1
                          }}>
                            {lang === 'ar' ? (type.label_ar || type.label_en) : type.label_en}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'white',
                            minWidth: '3rem',
                            textAlign: 'center'
                          }}>
                            {t('total')}: {stat.totalPoints >= 0 ? '+' : ''}{stat.totalPoints}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'white',
                            minWidth: '3rem',
                            textAlign: isRTL ? 'left' : 'right'
                          }}>
                            {t('count')}: ({stat.count})
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Total Behavior Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: '#f97316',
                    borderRadius: '0.375rem',
                    marginTop: '0.25rem'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'white',
                      flex: 1
                    }}>
                      {t('behavior')}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: 'center'
                    }}>
                      {t('total')}: {student.behavior > 0 ? '+' : ''}{student.behavior || 0}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: isRTL ? 'left' : 'right'
                    }}>
                      {t('count')}: ({(() => {
                        const stats = getDetailedStats();
                        return BEHAVIOR_TYPES.reduce((sum, type) => sum + (stats.behavior[type.id]?.count || 0), 0);
                      })()})
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Participation Section */}
            <div style={{ marginBottom: '0.15rem' }}>
              <div
                onClick={() => toggleSectionExpansion('participation')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#3b82f6',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  marginBottom: '0.15rem'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                  {t('participation_details')} ({student.participation || 0} {t('points')}, {(() => {
                    const stats = getDetailedStats();
                    return PARTICIPATION_TYPES.reduce((sum, type) => sum + (stats.participation[type.id]?.count || 0), 0);
                  })()} {t('entries')})
                </span>
                <ChevronDown
                  style={{
                    width: '16px',
                    height: '16px',
                    transform: expandedSections.participation ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </div>

              {expandedSections.participation && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  {(() => {
                    const stats = getDetailedStats();
                    return PARTICIPATION_TYPES.map(type => {
                      const stat = stats.participation[type.id];
                      return (
                        <div key={type.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: '#3b82f6',
                          borderRadius: '0.375rem',
                          opacity: stat.count > 0 ? 1 : 0.8
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'white',
                            flex: 1
                          }}>
                            {lang === 'ar' ? (type.label_ar || type.label_en) : type.label_en}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'white',
                            minWidth: '3rem',
                            textAlign: 'center'
                          }}>
                            {t('total')}: +{stat.totalPoints}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'white',
                            minWidth: '3rem',
                            textAlign: isRTL ? 'left' : 'right'
                          }}>
                            {t('count')}: ({stat.count})
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Total Participation Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: '#3b82f6',
                    borderRadius: '0.375rem',
                    marginTop: '0.25rem',
                    border: '2px solid white'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'white',
                      flex: 1
                    }}>
                      Participation
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: 'center'
                    }}>
                      Total: {student.participation || 0}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: isRTL ? 'left' : 'right'
                    }}>
                      {t('count')}: ({(() => {
                        const stats = getDetailedStats();
                        return PARTICIPATION_TYPES.reduce((sum, type) => sum + (stats.participation[type.id]?.count || 0), 0);
                      })()})
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Penalty Section */}
            <div style={{ marginBottom: '1rem' }}>
              <div
                onClick={() => toggleSectionExpansion('penalty')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#dc2626',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  marginBottom: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                  {t('penalty_details')} ({student.penalty || 0} {t('points')}, {(() => {
                    const stats = getDetailedStats();
                    const penaltyTypes = BEHAVIOR_TYPES.filter(bt => bt.points < 0);
                    return penaltyTypes.reduce((sum, type) => sum + (stats.penalty[type.id]?.count || 0), 0);
                  })()} {t('entries')})
                </span>
                <ChevronDown
                  style={{
                    width: '16px',
                    height: '16px',
                    transform: expandedSections.penalty ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </div>

              {expandedSections.penalty && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  {(() => {
                    const stats = getDetailedStats();
                    const penaltyTypes = BEHAVIOR_TYPES.filter(bt => bt.points < 0);

                    return penaltyTypes.map(type => {
                      const stat = stats.penalty[type.id];
                      return (
                        <div key={type.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: '#fee2e2',
                          borderRadius: '0.375rem',
                          border: '1px solid #dc2626',
                          opacity: stat.count > 0 ? 1 : 0.8
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#dc2626',
                            flex: 1
                          }}>
                            {lang === 'ar' ? (type.label_ar || type.label_en) : type.label_en}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#991b1b',
                            minWidth: '3rem',
                            textAlign: 'center'
                          }}>
                            Total: {stat.totalPoints}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#dc2626',
                            minWidth: '3rem',
                            textAlign: 'right'
                          }}>
                            Count: ({stat.count})
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Total Penalty Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: '#dc2626',
                    borderRadius: '0.375rem',
                    marginTop: '0.25rem'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'white',
                      flex: 1
                    }}>
                      {t('penalty')}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: 'center'
                    }}>
                      {t('total')}: {student.penalty || 0}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: isRTL ? 'left' : 'right'
                    }}>
                      {t('count')}: ({(() => {
                        const stats = getDetailedStats();
                        const penaltyTypes = BEHAVIOR_TYPES.filter(bt => bt.points < 0);
                        return penaltyTypes.reduce((sum, type) => sum + (stats.penalty[type.id]?.count || 0), 0);
                      })()})
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', position: 'relative' }}>
            <button
              onClick={() => setActiveTab('participation')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0',
                background: activeTab === 'participation' ? '#3b82f6' : '#f8fafc',
                color: activeTab === 'participation' ? 'white' : '#64748b',
                cursor: 'pointer',
                boxShadow: activeTab === 'participation' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Users style={{ width: '14px', height: '14px' }} />
              {t('participation')}
            </button>
            <button
              onClick={() => setActiveTab('behavior')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0',
                background: activeTab === 'behavior' ? '#f97316' : '#f8fafc',
                color: activeTab === 'behavior' ? 'white' : '#64748b',
                cursor: 'pointer',
                boxShadow: activeTab === 'behavior' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Zap style={{ width: '14px', height: '14px' }} />
              {t('behavior')}
            </button>
            <button
              onClick={() => setActiveTab('penalty')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0',
                background: activeTab === 'penalty' ? '#dc2626' : '#f8fafc',
                color: activeTab === 'penalty' ? 'white' : '#64748b',
                cursor: 'pointer',
                boxShadow: activeTab === 'penalty' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <AlertCircle style={{ width: '14px', height: '14px' }} />
              {t('penalty')}
            </button>
            <div style={{ position: 'absolute', right: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#64748b',
                  cursor: 'pointer',
                  boxShadow: 'none'
                }}
                title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                {viewMode === 'grid' ? <List style={{ width: '14px', height: '14px' }} /> : <Grid style={{ width: '14px', height: '14px' }} />}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem'
            }}>
              Select Reason
            </h4>
            <div style={{
              display: viewMode === 'grid' ? 'grid' : 'flex',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(3, 1fr)' : 'none',
              flexDirection: viewMode === 'list' ? 'column' : 'row',
              gap: viewMode === 'grid' ? '0.5rem' : '0.125rem'
            }}>
              {options.map((option) => {
                const isSelected = selectedActions.some(a => a.id === option.id);

                return (
                  <div
                    key={option.id}
                    style={{
                      padding: viewMode === 'grid' ? '0.75rem' : '0.5rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${isSelected ? '#8b5cf6' : '#e5e7eb'}`,
                      background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                      transition: 'all 0.2s',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleAction(option)}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: viewMode === 'grid' ? 'column' : 'row',
                      alignItems: viewMode === 'grid' ? 'center' : 'center',
                      gap: viewMode === 'grid' ? '0.25rem' : '0.5rem',
                      textAlign: viewMode === 'grid' ? 'center' : 'left'
                    }}>
                      <div style={{
                        width: viewMode === 'grid' ? '2rem' : '1.5rem',
                        height: viewMode === 'grid' ? '2rem' : '1.5rem',
                        borderRadius: '0.375rem',
                        background: option.color + '20',
                        color: option.color,
                        border: `1px solid ${option.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {renderIcon(option.icon, { width: viewMode === 'grid' ? '1rem' : '0.875rem', height: viewMode === 'grid' ? '1rem' : '0.875rem' })}
                      </div>
                      <span style={{
                        fontSize: viewMode === 'grid' ? '0.75rem' : '0.8125rem',
                        fontWeight: 500,
                        color: 'var(--text, #111827)',
                        lineHeight: '1.2',
                        flex: 1
                      }}>
                        {option.label_en}
                      </span>
                      <div style={{
                        fontSize: viewMode === 'grid' ? '0.75rem' : '0.8125rem',
                        fontWeight: 600,
                        color: (actionPoints[option.id] || 0) >= 0 ? '#059669' : '#dc2626',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {(actionPoints[option.id] || 0) >= 0 ? '+' : ''}{actionPoints[option.id] || 0}
                        
                        {/* Favorite Toggle - positioned to avoid overlap */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(option.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.125rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={favoriteBehaviors.includes(option.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star
                            size={viewMode === 'grid' ? 10 : 12}
                            fill={favoriteBehaviors.includes(option.id) ? '#fbbf24' : 'none'}
                            color={favoriteBehaviors.includes(option.id) ? '#fbbf24' : '#d1d5db'}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Points Input - Always show when selected */}
                    {isSelected && (
                      <div style={{
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span style={{ fontSize: '0.5rem', color: '#6b7280', fontWeight: 500 }}>
                          Points:
                        </span>
                        <input
                          type="number"
                          min="-10"
                          max="10"
                          value={actionPoints[option.id] || 0}
                          onChange={(e) => {
                            const value = Math.max(-10, Math.min(10, parseInt(e.target.value) || 0));
                            handlePointsChange(option.id, value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="0"
                          required
                          style={{
                            width: '2.5rem',
                            height: '1.5rem',
                            padding: '0.125rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            fontSize: '0.5rem',
                            textAlign: 'center',
                            fontWeight: 500
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem'
            }}>
              Internal Note
            </h4>
            <Textarea
              placeholder="Add details..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              style={{ minHeight: '6rem', resize: 'none', fontSize: '0.875rem' }}
            />
          </div>

          <div>
          {/*      const isSelected = selectedActions.some(a => a.id === option.id);*/}

          {/*      return (*/}
          {/*        <div*/}
          {/*          key={option.id}*/}
          {/*          style={{*/}
          {/*            padding: '0.75rem',*/}
          {/*            borderRadius: '0.5rem',*/}
          {/*            border: `2px solid ${isSelected ? '#8b5cf6' : '#e5e7eb'}`,*/}
          {/*            background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'transparent',*/}
          {/*            transition: 'all 0.2s',*/}
          {/*            position: 'relative'*/}
          {/*          }}*/}
          {/*        >*/}
          {/*          <button*/}
          {/*            onClick={() => toggleAction(option)}*/}
          {/*            type="button"*/}
          {/*            style={{*/}
          {/*              width: '100%',*/}
          {/*              background: 'none',*/}
          {/*              border: 'none',*/}
          {/*              cursor: 'pointer',*/}
          {/*              padding: 0*/}
          {/*            }}*/}
          {/*          >*/}
          {/*            <div style={{*/}
          {/*              display: 'flex',*/}
          {/*              flexDirection: 'column',*/}
          {/*              alignItems: 'center',*/}
          {/*              gap: '0.25rem',*/}
          {/*              textAlign: 'center'*/}
          {/*            }}>*/}
          {/*              <div style={{*/}
          {/*                width: '2rem',*/}
          {/*                height: '2rem',*/}
          {/*                borderRadius: '0.375rem',*/}
          {/*                background: option.color + '20',*/}
          {/*                color: option.color,*/}
          {/*                border: `1px solid ${option.color}40`,*/}
          {/*                display: 'flex',*/}
          {/*                alignItems: 'center',*/}
          {/*                justifyContent: 'center'*/}
          {/*              }}>*/}
          {/*                {renderIcon(option.icon, { width: '1rem', height: '1rem' })}*/}
          {/*              </div>*/}
          {/*              <span style={{*/}
          {/*                fontSize: '0.75rem',*/}
          {/*                fontWeight: 500,*/}
          {/*                color: 'var(--text, #111827)',*/}
          {/*                lineHeight: '1.2'*/}
          {/*              }}>*/}
          {/*                {option.label_en}*/}
          {/*              </span>*/}
          {/*              <div style={{*/}
          {/*                fontSize: '0.75rem',*/}
          {/*                fontWeight: 600,*/}
          {/*                color: (actionPoints[option.id] || 0) >= 0 ? '#059669' : '#dc2626'*/}
          {/*              }}>*/}
          {/*                {(actionPoints[option.id] || 0) >= 0 ? '+' : ''}{actionPoints[option.id] || 0}*/}
          {/*              </div>*/}
          {/*            </div>*/}
          {/*          </button>*/}

          {/*          /!* Favorite Toggle *!/*/}
          {/*          <button*/}
          {/*            onClick={(e) => {*/}
          {/*              e.stopPropagation();*/}
          {/*              onToggleFavorite(option.id);*/}
          {/*            }}*/}
          {/*            style={{*/}
          {/*              position: 'absolute',*/}
          {/*              top: '0.25rem',*/}
          {/*              right: '0.25rem',*/}
          {/*              background: 'none',*/}
          {/*              border: 'none',*/}
          {/*              cursor: 'pointer',*/}
          {/*              padding: '0.125rem'*/}
          {/*            }}*/}
          {/*          >*/}
          {/*            <Star*/}
          {/*              size={12}*/}
          {/*              fill={favoriteBehaviors.includes(option.id) ? '#fbbf24' : 'none'}*/}
          {/*              color={favoriteBehaviors.includes(option.id) ? '#fbbf24' : '#d1d5db'}*/}
          {/*            />*/}
          {/*          </button>*/}

          {/*          /!* Points Input - Always show when selected *!/*/}
          {/*          {isSelected && (*/}
          {/*            <div style={{*/}
          {/*              marginTop: '0.25rem',*/}
          {/*              display: 'flex',*/}
          {/*              alignItems: 'center',*/}
          {/*              gap: '0.25rem'*/}
          {/*            }}>*/}
          {/*              <span style={{ fontSize: '0.5rem', color: '#6b7280', fontWeight: 500 }}>*/}
          {/*                Points:*/}
          {/*              </span>*/}
          {/*              <input*/}
          {/*                type="number"*/}
          {/*                min="-10"*/}
          {/*                max="10"*/}
          {/*                value={actionPoints[option.id] || 0}*/}
          {/*                onChange={(e) => {*/}
          {/*                  const value = Math.max(-10, Math.min(10, parseInt(e.target.value) || 0));*/}
          {/*                  handlePointsChange(option.id, value);*/}
          {/*                }}*/}
          {/*                onClick={(e) => e.stopPropagation()}*/}
          {/*                placeholder="0"*/}
          {/*                required*/}
          {/*                style={{*/}
          {/*                  width: '2.5rem',*/}
          {/*                  height: '1.5rem',*/}
          {/*                  padding: '0.125rem',*/}
          {/*                  border: '1px solid #d1d5db',*/}
          {/*                  borderRadius: '0.25rem',*/}
          {/*                  fontSize: '0.5rem',*/}
          {/*                  textAlign: 'center',*/}
          {/*                  fontWeight: 500*/}
          {/*                }}*/}
          {/*              />*/}
          {/*            </div>*/}
          {/*          )}*/}
          {/*        </div>*/}

          {/*      );*/}
          {/*    })}*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/*<div style={{ marginBottom: '1.5rem' }}>*/}
          {/*  <h4 style={{*/}
          {/*    fontSize: '0.875rem',*/}
          {/*    fontWeight: 500,*/}
          {/*    color: '#6b7280',*/}
          {/*    textTransform: 'uppercase',*/}
          {/*    letterSpacing: '0.05em',*/}
          {/*    marginBottom: '0.75rem'*/}
          {/*  }}>*/}
          {/*    Internal Note*/}
          {/*  </h4>*/}
          {/*  <Textarea*/}
          {/*    placeholder="Add details..."*/}
          {/*    value={internalNote}*/}
          {/*    onChange={(e) => setInternalNote(e.target.value)}*/}
          {/*    style={{ minHeight: '6rem', resize: 'none', fontSize: '0.875rem' }}*/}
          {/*  />*/}
          {/*</div>*/}

          <div>
            {/*<div style={{*/}
            {/*  display: 'flex',*/}
            {/*  alignItems: 'center',*/}
            {/*  gap: '0.5rem',*/}
            {/*  marginBottom: '1rem'*/}
            {/*}}>*/}
            {/*  <div style={{*/}
            {/*    width: '3px',*/}
            {/*    height: '24px',*/}
            {/*    background: '#8b5cf6',*/}
            {/*    borderRadius: '1.5px'*/}
            {/*  }} />*/}
            {/*  <h4 style={{*/}
            {/*    fontSize: '0.875rem',*/}
            {/*    fontWeight: 600,*/}
            {/*    color: '#111827',*/}
            {/*    textTransform: 'uppercase',*/}
            {/*    letterSpacing: '0.05em',*/}
            {/*    margin: 0*/}
            {/*  }}>*/}
            {/*    Student History*/}
            {/*  </h4>*/}
            {/*</div>*/}
            {/* History Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              padding: '0.5rem',
              background: 'var(--panel-hover, #f8fafc)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light, #e2e8f0)'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary, #374151)',
                margin: 0
              }}>
                {/*{t('history')}*/}
              </h4>
              <div style={{
                display: 'flex',
                gap: '0.25rem'
              }}>
                <button
                  onClick={() => toggleFilter('attendance')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-light, #e2e8f0)',
                    background: activeFilters.attendance ? '#065f46' : 'var(--panel, #ffffff)',
                    color: activeFilters.attendance ? 'white' : 'var(--text-muted, #64748b)',
                    cursor: 'pointer',
                    boxShadow: activeFilters.attendance ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  {t('attendance')}
                </button>
                <button
                  onClick={() => toggleFilter('participation')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-light, #e2e8f0)',
                    background: activeFilters.participation ? '#3b82f6' : 'var(--panel, #ffffff)',
                    color: activeFilters.participation ? 'white' : 'var(--text-muted, #64748b)',
                    cursor: 'pointer',
                    boxShadow: activeFilters.participation ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  {t('participation')}
                </button>
                <button
                  onClick={() => toggleFilter('behavior')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-light, #e2e8f0)',
                    background: activeFilters.behavior ? '#f97316' : 'var(--panel, #ffffff)',
                    color: activeFilters.behavior ? 'white' : 'var(--text-muted, #64748b)',
                    cursor: 'pointer',
                    boxShadow: activeFilters.behavior ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  {t('behavior')}
                </button>
                <button
                  onClick={() => toggleFilter('penalties')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0',
                    background: activeFilters.penalties ? '#dc2626' : '#ffffff',
                    color: activeFilters.penalties ? 'white' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: activeFilters.penalties ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {t('penalties')}
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem'
            }}>
              {logsLoading ? (
                <div style={{
                  padding: '1rem',
                  color: 'var(--text-muted, #9ca3af)',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}>
                  {t('loading')}...
                </div>
              ) : historicalLogs.length === 0 ? (
                <div style={{
                  padding: '1rem',
                  color: 'var(--text-muted, #9ca3af)',
                  fontSize: '0.875rem'
                }}>
                  {t('no_history_found')}
                </div>
              ) : (
                <HistoricalLogsList 
                  groupedLogs={memoizedGroupedLogs}
                  expandedDays={expandedDays}
                  activeFilters={activeFilters}
                  toggleDayExpansion={toggleDayExpansion}
                  handleDeleteAttendance={handleDeleteAttendance}
                  handleDeletePenalty={handleDeletePenalty}
                  t={t}
                  isRTL={isRTL}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('delete_activity_title', { type: deleteType === 'attendance' ? t('attendance') : t('penalty') })}
        message={t('delete_activity_msg', { studentName: student.displayName || student.name || t('this_student') })}
        loading={deleteLoading}
      />
    </>
  );
});

export default StudentActionPanel;
