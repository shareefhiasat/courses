import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button } from '@ui';
import {
  Clock, MapPin, User, DoorOpen, BookOpen, X,
  Calendar as CalendarIcon, CheckCircle2, XCircle
} from 'lucide-react';
import { STATUS_COLORS } from '../constants/schedulingConstants.js';
import {
  getRoomName,
  getLocationText,
  formatSessionDuration,
  formatSchedulingDateOnly,
  formatSchedulingTimeOnly,
  getLocalizedClassName,
  getLocalizedInstructorName
} from '../utils/schedulingDisplayUtils.js';
import { getLocalizedName } from '../utils/languageHelpers.js';

const STATUS_ICONS = {
  scheduled: CalendarIcon,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: XCircle
};

const SchedulingCalendarPopup = ({ session, onClose, onEdit, onDelete, onChangeStatus }) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();

  if (!session) return null;

  const textPrimary = theme === 'dark' ? '#f3f4f6' : '#1f2937';
  const textMuted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const borderColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';
  const surfaceMuted = theme === 'dark' ? '#374151' : '#f9fafb';

  const statusColor = STATUS_COLORS[session.status] || '#6b7280';
  const StatusIcon = STATUS_ICONS[session.status] || CalendarIcon;
  const roomName = getRoomName(session, lang);
  const locationText = getLocationText(session, lang);
  const durationText = formatSessionDuration(session.startDateTime, session.endDateTime);
  const sameDay = new Date(session.startDateTime).toDateString() === new Date(session.endDateTime).toDateString();

  const formatDatePart = (date) => formatSchedulingDateOnly(date, lang);
  const formatTimePart = (date) => formatSchedulingTimeOnly(date, lang);

  const programName = session.class?.program
    ? getLocalizedName(session.class.program, lang)
    : null;

  const DetailRow = ({ icon: Icon, label, children, iconColor = textMuted }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', minWidth: 0 }}>
      <Icon size={15} color={iconColor} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
      <div style={{ minWidth: 0 }}>
        {label && (
          <div style={{ fontSize: '0.6875rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.125rem' }}>
            {label}
          </div>
        )}
        <div style={{ fontSize: '0.8125rem', color: textPrimary, lineHeight: 1.4 }}>{children}</div>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      border: `1px solid ${borderColor}`,
      zIndex: 1000,
      minWidth: '320px',
      maxWidth: '400px',
      width: '90vw'
    }}>
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', margin: 0, color: textPrimary }}>
          {t('session_details')}
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: textMuted }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '0.75rem 1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '0.625rem'
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <BookOpen size={15} color="#3b82f6" style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: '600', fontSize: '0.875rem', color: textPrimary }}>
                {getLocalizedClassName(session.class, lang, t('class'))}
              </span>
            </div>
            {programName && (
              <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: '0.125rem', paddingLeft: '1.25rem' }}>
                {programName}
              </div>
            )}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '1rem',
            backgroundColor: `${statusColor}20`,
            border: `1px solid ${statusColor}`,
            fontSize: '0.75rem',
            fontWeight: '500',
            color: statusColor,
            flexShrink: 0
          }}>
            <StatusIcon size={12} />
            <span>{t(session.status)}</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          marginBottom: '0.625rem',
          padding: '0.5rem 0.625rem',
          backgroundColor: surfaceMuted,
          borderRadius: '0.375rem'
        }}>
          <Clock size={15} color={textMuted} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
          <div>
            <div style={{ fontSize: '0.8125rem', color: textPrimary, fontWeight: '500' }}>
              {sameDay
                ? `${formatDatePart(session.startDateTime)} · ${formatTimePart(session.startDateTime)} – ${formatTimePart(session.endDateTime)}`
                : `${formatDatePart(session.startDateTime)} ${formatTimePart(session.startDateTime)} – ${formatDatePart(session.endDateTime)} ${formatTimePart(session.endDateTime)}`}
            </div>
            <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: '0.125rem' }}>
              {durationText}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem 0.75rem',
          marginBottom: session.notes ? '0.625rem' : 0
        }}>
          <DetailRow icon={User} label={t('instructor')}>
            {getLocalizedInstructorName(session.instructor, lang, t('not_assigned'))}
          </DetailRow>
          <DetailRow icon={DoorOpen} label={t('room')}>
            {roomName || t('not_assigned')}
          </DetailRow>
          <div style={{ gridColumn: '1 / -1' }}>
            <DetailRow icon={MapPin} label={t('location')}>
              {locationText || t('not_assigned')}
            </DetailRow>
          </div>
        </div>

        {session.notes && (
          <div style={{
            padding: '0.5rem 0.625rem',
            backgroundColor: surfaceMuted,
            borderRadius: '0.375rem',
            fontSize: '0.8125rem',
            color: textMuted,
            lineHeight: 1.4
          }}>
            {session.notes}
          </div>
        )}
      </div>

      <div style={{
        padding: '0.75rem 1rem',
        borderTop: `1px solid ${borderColor}`,
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'flex-end',
        flexWrap: 'wrap'
      }}>
        <Button
          onClick={() => onChangeStatus && onChangeStatus(session)}
          style={{
            padding: '0.4rem 0.75rem',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.8125rem'
          }}
        >
          {t('change_status')}
        </Button>
        <Button
          onClick={() => onEdit && onEdit(session)}
          style={{
            padding: '0.4rem 0.75rem',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.8125rem'
          }}
        >
          {t('edit')}
        </Button>
        <Button
          onClick={() => onDelete && onDelete(session)}
          style={{
            padding: '0.4rem 0.75rem',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.8125rem'
          }}
        >
          {t('delete')}
        </Button>
      </div>
    </div>
  );
};

export default SchedulingCalendarPopup;
