import React from 'react';
import { XIcon, HistoryIcon, TypeIcon } from './Icons';
import { BEHAVIOR_TYPES, getBehaviorColor } from '../../constants/behaviorTypes';
import { PARTICIPATION_TYPES, getParticipationColor } from '../../constants/participationTypes';

export default {
  title: 'Shared/Icons',
  component: TypeIcon,
  parameters: {
    layout: 'centered',
  },
};

export const XIconStory = {
  args: {
    size: 24,
    color: '#ef4444'
  },
  render: (args) => <XIcon {...args} />
};

export const HistoryIconStory = {
  args: {
    size: 24,
    color: '#3b82f6'
  },
  render: (args) => <HistoryIcon {...args} />
};

export const AllIcons = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <XIcon size={32} color="#ef4444" />
        <p>XIcon</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <HistoryIcon size={32} color="#3b82f6" />
        <p>HistoryIcon</p>
      </div>
      {['MessageSquare', 'Bed', 'Users', 'Smartphone', 'AlertTriangle', 'Clock', 'CheckCircle', 'Award', 'FileText', 'Star', 'XCircle', 'HelpCircle'].map(iconName => (
        <div key={iconName} style={{ textAlign: 'center' }}>
          <TypeIcon iconName={iconName} size={32} />
          <p>{iconName}</p>
        </div>
      ))}
    </div>
  )
};

export const BehaviorIcons = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', padding: '2rem' }}>
      {BEHAVIOR_TYPES.map(type => (
        <div key={type.id} style={{ textAlign: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <TypeIcon 
            iconName={type.icon} 
            size={32} 
            fromConstants={{
              getColor: getBehaviorColor
            }}
          />
          <p style={{ fontSize: '0.875rem', margin: '0.5rem 0' }}>{type.label_en}</p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{type.points} points</p>
        </div>
      ))}
    </div>
  )
};

export const ParticipationIcons = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', padding: '2rem' }}>
      {PARTICIPATION_TYPES.slice(0, 6).map(type => (
        <div key={type.id} style={{ textAlign: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <TypeIcon 
            iconName={type.icon} 
            size={32} 
            fromConstants={{
              getColor: getParticipationColor
            }}
          />
          <p style={{ fontSize: '0.875rem', margin: '0.5rem 0' }}>{type.label_en}</p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{type.points} points</p>
        </div>
      ))}
    </div>
  )
};

export const IconSizes = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <h3>Icon Sizes</h3>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <TypeIcon iconName="Star" size={12} />
          <p>12px</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TypeIcon iconName="Star" size={16} />
          <p>16px</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TypeIcon iconName="Star" size={24} />
          <p>24px</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TypeIcon iconName="Star" size={32} />
          <p>32px</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TypeIcon iconName="Star" size={48} />
          <p>48px</p>
        </div>
      </div>
    </div>
  )
};
