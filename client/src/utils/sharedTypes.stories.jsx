import React from 'react';
import { 
  TYPE_CATEGORIES, 
  getTypeLabel, 
  getTypeIcon, 
  getTypeColor, 
  getAllTypes, 
  createTypeOptions,
  getFormattedTypeDisplay,
  getAutoTypeLabel,
  getAutoTypeIcon,
  getAutoTypeColor
} from './sharedTypes';

export default {
  title: 'Utils/SharedTypes',
  component: null,
  parameters: {
    layout: 'centered',
  },
};

export const TypeCategories = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <h3>Type Categories</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {Object.values(TYPE_CATEGORIES).map(category => (
          <div key={category} style={{ 
            padding: '1rem', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            backgroundColor: '#f9fafb'
          }}>
            <h4>{category}</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Unified category for consistent type management
            </p>
          </div>
        ))}
      </div>
    </div>
  )
};

export const BehaviorTypes = {
  render: () => {
    const types = getAllTypes(TYPE_CATEGORIES.BEHAVIOR);
    return (
      <div style={{ padding: '2rem' }}>
        <h3>Behavior Types</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {types.map(type => (
            <div key={type.id} style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              borderLeft: `4px solid ${getTypeColor(TYPE_CATEGORIES.BEHAVIOR, type.id)}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(TYPE_CATEGORIES.BEHAVIOR, type.id)}</span>
                <strong>{getTypeLabel(TYPE_CATEGORIES.BEHAVIOR, type.id, 'en')}</strong>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {getTypeLabel(TYPE_CATEGORIES.BEHAVIOR, type.id, 'ar')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Points: {type.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
};

export const ParticipationTypes = {
  render: () => {
    const types = getAllTypes(TYPE_CATEGORIES.PARTICIPATION);
    return (
      <div style={{ padding: '2rem' }}>
        <h3>Participation Types</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {types.slice(0, 6).map(type => (
            <div key={type.id} style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              borderLeft: `4px solid ${getTypeColor(TYPE_CATEGORIES.PARTICIPATION, type.id)}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(TYPE_CATEGORIES.PARTICIPATION, type.id)}</span>
                <strong>{getTypeLabel(TYPE_CATEGORIES.PARTICIPATION, type.id, 'en')}</strong>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {getTypeLabel(TYPE_CATEGORIES.PARTICIPATION, type.id, 'ar')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Points: {type.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
};

export const AbsenceTypes = {
  render: () => {
    const types = getAllTypes(TYPE_CATEGORIES.ABSENCE);
    return (
      <div style={{ padding: '2rem' }}>
        <h3>Absence Types</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {types.map(type => (
            <div key={type.id} style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              borderLeft: `4px solid ${getTypeColor(TYPE_CATEGORIES.ABSENCE, type.id)}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(TYPE_CATEGORIES.ABSENCE, type.id)}</span>
                <strong>{getTypeLabel(TYPE_CATEGORIES.ABSENCE, type.id, 'en')}</strong>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {getTypeLabel(TYPE_CATEGORIES.ABSENCE, type.id, 'ar')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Deduction: {type.deduction || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
};

export const PenaltyTypes = {
  render: () => {
    const types = getAllTypes(TYPE_CATEGORIES.PENALTY);
    return (
      <div style={{ padding: '2rem' }}>
        <h3>Penalty Types</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {types.slice(0, 6).map(type => (
            <div key={type.id} style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              borderLeft: `4px solid ${getTypeColor(TYPE_CATEGORIES.PENALTY, type.id)}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(TYPE_CATEGORIES.PENALTY, type.id)}</span>
                <strong>{getTypeLabel(TYPE_CATEGORIES.PENALTY, type.id, 'en')}</strong>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {getTypeLabel(TYPE_CATEGORIES.PENALTY, type.id, 'ar')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Points: {type.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
};

export const AutoDetection = {
  render: () => {
    const testIds = [
      'talk_in_class',
      'explain_lesson', 
      'with_excuse',
      'cheating',
      'present',
      'absent'
    ];
    
    return (
      <div style={{ padding: '2rem' }}>
        <h3>Auto-Detection Examples</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {testIds.map(id => {
            const category = testIds.indexOf(id) % 2 === 0 ? 'en' : 'ar';
            return (
              <div key={id} style={{ 
                padding: '1rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {getAutoTypeIcon(id)}
                  </span>
                  <div>
                    <strong>ID: {id}</strong>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Label: {getAutoTypeLabel(id, category)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      Color: {getAutoTypeColor(id)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )
  }
};

export const FormattedDisplay = {
  render: () => {
    const displays = [
      getFormattedTypeDisplay(TYPE_CATEGORIES.BEHAVIOR, 'talk_in_class', 'en', { includePoints: true }),
      getFormattedTypeDisplay(TYPE_CATEGORIES.PARTICIPATION, 'explain_lesson', 'en', { includePoints: true }),
      getFormattedTypeDisplay(TYPE_CATEGORIES.ABSENCE, 'with_excuse', 'en', { includeDeduction: true }),
      getFormattedTypeDisplay(TYPE_CATEGORIES.PENALTY, 'cheating', 'en', { includePoints: true })
    ];
    
    return (
      <div style={{ padding: '2rem' }}>
        <h3>Formatted Display Examples</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {displays.map((display, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              backgroundColor: '#f9fafb'
            }}>
              <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
                {JSON.stringify(display, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    )
  }
};

