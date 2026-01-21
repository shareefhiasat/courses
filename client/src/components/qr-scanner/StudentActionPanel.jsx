import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

const XIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const MessageSquareIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const MoonIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
);

const SmartphoneIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);

const UserXIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="17" y1="8" x2="22" y2="13"/>
    <line x1="22" y1="8" x2="17" y2="13"/>
  </svg>
);

const HistoryIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v5h5"/>
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
  </svg>
);

export default function StudentActionPanel({ student, onClose, onBehaviorSubmit }) {
  const [selectedBehaviors, setSelectedBehaviors] = useState([]);
  const [internalNote, setInternalNote] = useState('');
  const [activeTab, setActiveTab] = useState('behavior');

  if (!student) return null;

  const behaviorOptions = [
    {
      type: 'talking',
      label: 'Talking',
      icon: <MessageSquareIcon style={{ width: '1.25rem', height: '1.25rem' }} />,
      points: -1,
      color: { bg: '#fed7aa', text: '#9a3412', border: '#fdba74' },
    },
    {
      type: 'sleeping',
      label: 'Sleeping',
      icon: <MoonIcon style={{ width: '1.25rem', height: '1.25rem' }} />,
      points: 0,
      color: { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' },
    },
    {
      type: 'phone_use',
      label: 'Phone Use',
      icon: <SmartphoneIcon style={{ width: '1.25rem', height: '1.25rem' }} />,
      points: -2,
      color: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
    },
    {
      type: 'out_of_seat',
      label: 'Out of Seat',
      icon: <UserXIcon style={{ width: '1.25rem', height: '1.25rem' }} />,
      points: -1,
      color: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    },
  ];

  const toggleBehavior = (type) => {
    setSelectedBehaviors((prev) =>
      prev.includes(type) ? prev.filter((b) => b !== type) : [...prev, type]
    );
  };

  const handleApply = () => {
    if (selectedBehaviors.length === 0) return;

    const actions = selectedBehaviors.map((type) => {
      const option = behaviorOptions.find((o) => o.type === type);
      return {
        type,
        points: option?.points || 0,
        timestamp: new Date(),
      };
    });

    onBehaviorSubmit(student.id, actions, internalNote);
    setSelectedBehaviors([]);
    setInternalNote('');
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

  const avatarColor = getAvatarColor(student.name);

  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      border: '1px solid #e5e7eb',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
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
              {getInitials(student.name)}
            </div>
            <div>
              <h3 style={{ fontWeight: 600, color: '#111827', margin: 0 }}>
                {student.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  background: '#10b981',
                  borderRadius: '9999px'
                }} />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Present • {student.participation} Points
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon style={{ width: '1rem', height: '1rem' }} />
          </Button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            variant={activeTab === 'participation' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('participation')}
          >
            Participation
          </Button>
          <Button
            variant={activeTab === 'behavior' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('behavior')}
          >
            Behavior
          </Button>
          <Button
            variant={activeTab === 'penalty' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('penalty')}
          >
            Penalty
          </Button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
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
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem'
          }}>
            {behaviorOptions.map((option) => {
              const isSelected = selectedBehaviors.includes(option.type);
              return (
                <button
                  key={option.type}
                  onClick={() => toggleBehavior(option.type)}
                  type="button"
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: `2px solid ${isSelected ? '#8b5cf6' : '#e5e7eb'}`,
                    background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '0.5rem',
                      background: option.color.bg,
                      color: option.color.text,
                      border: `1px solid ${option.color.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {option.icon}
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#111827'
                    }}>
                      {option.label}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: option.points < 0 ? '#dc2626' : '#6b7280'
                    }}>
                      {option.points}
                    </span>
                  </div>
                </button>
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
            style={{ minHeight: '6rem', resize: 'none' }}
          />
        </div>

        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <HistoryIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0
            }}>
              History for Today
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {student.behaviorHistory && student.behaviorHistory.length > 0 ? (
              student.behaviorHistory.map((action, index) => (
                <div
                  key={`${action.type}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      background: '#10b981',
                      borderRadius: '9999px'
                    }} />
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#111827',
                      textTransform: 'capitalize'
                    }}>
                      {action.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: action.points > 0 ? '#10b981' : '#dc2626'
                  }}>
                    {action.points > 0 ? '+' : ''}{action.points}
                  </span>
                </div>
              ))
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: '#f9fafb',
                borderRadius: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    background: '#10b981',
                    borderRadius: '9999px'
                  }} />
                  <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                    Active Participation
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Volunteered for demo
                  </span>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981' }}>
                  +1
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            style={{ flex: 1, background: 'transparent' }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            style={{ flex: 1 }}
            onClick={handleApply}
            disabled={selectedBehaviors.length === 0}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
