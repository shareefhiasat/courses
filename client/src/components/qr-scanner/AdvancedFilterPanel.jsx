import React, { useState, useMemo, useCallback } from 'react';
import { Button, Card, CardBody } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import PortalTooltip from '@ui/PortalTooltip';


import { info, error, warn, debug } from '@services/utils/logger.js';const AdvancedFilterPanel = ({
  students,
  onFilterChange,
  isOpen,
  onClose,
  t
}) => {
  const { theme } = useTheme();
  const { lang, isRTL } = useLang();
  
  // Filter states
  const [selectedFilters, setSelectedFilters] = useState({
    attendanceStatus: [], // present, absent, late, excused
    participationRange: [0, 100], // Min-Max percentage
    behaviorCount: [0, 10], // Min-Max behavior incidents
    penaltyCount: [0, 5], // Min-Max penalties
    activityTypes: [], // quiz, homework, training, etc.
    dateRange: 'all', // today, week, month, semester, all
    riskLevel: 'all', // low, medium, high, critical
    performanceTier: 'all', // excellent, good, average, poor
    engagementLevel: 'all' // high, medium, low
  });

  // Business intelligence calculations
  const analytics = useMemo(() => {
    if (!students || students.length === 0) {
      return {
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        excusedLeaveCount: 0,
        humanCaseCount: 0,
        noneCount: 0,
        participationTotal: 0
      };
    }

    const totalStudents = students.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let excusedLeaveCount = 0;
    let humanCaseCount = 0;
    let noneCount = 0;
    let participationTotal = 0;

    students.forEach(student => {
      // Count attendance statuses
      const status = student.attendanceStatus || student.status || 'none';
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'late') lateCount++;
      else if (status === 'excused') excusedCount++;
      else if (status === 'excused_leave') excusedLeaveCount++;
      else if (status === 'human_case') humanCaseCount++;
      else if (status === 'none' || status === null || status === undefined) noneCount++;
      
      // Calculate participation total
      participationTotal += student.participationScore || 0;
    });

    console.log('📊 Analytics calculation:', {
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      excusedLeaveCount,
      humanCaseCount,
      noneCount,
      participationTotal
    });

    return {
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      excusedLeaveCount,
      humanCaseCount,
      noneCount,
      participationTotal
    };
  }, [students]);

  // Filter application
  const applyFilters = useCallback(() => {
    const filteredStudents = students.filter(student => {
      // Attendance status filter
      if (selectedFilters.attendanceStatus.length > 0) {
        if (!selectedFilters.attendanceStatus.includes(student.attendanceStatus)) {
          return false;
        }
      }
      
      // Participation range filter
      const participation = student.participationScore || 0;
      if (participation < selectedFilters.participationRange[0] || 
          participation > selectedFilters.participationRange[1]) {
        return false;
      }
      
      // Behavior count filter
      const behaviorCount = student.behaviorIncidents || 0;
      if (behaviorCount < selectedFilters.behaviorCount[0] || 
          behaviorCount > selectedFilters.behaviorCount[1]) {
        return false;
      }
      
      // Penalty count filter
      const penaltyCount = student.penaltyCount || 0;
      if (penaltyCount < selectedFilters.penaltyCount[0] || 
          penaltyCount > selectedFilters.penaltyCount[1]) {
        return false;
      }
      
      return true;
    });
    
    onFilterChange(filteredStudents);
  }, [students, selectedFilters, onFilterChange]);

  // Reset filters
  const resetFilters = () => {
    setSelectedFilters({
      attendanceStatus: [],
      participationRange: [0, 100],
      behaviorCount: [0, 10],
      penaltyCount: [0, 5],
      activityTypes: [],
      dateRange: 'all',
      riskLevel: 'all',
      performanceTier: 'all',
      engagementLevel: 'all'
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <Card style={{ 
        maxWidth: '900px', 
        width: '90%', 
        maxHeight: '85vh', 
        overflow: 'auto',
        direction: isRTL ? 'rtl' : 'ltr'
      }}>
        <CardBody>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
              {getThemedIcon('ui', 'filter', 20, theme)}
              <span style={{ marginLeft: '0.5rem' }}>
                {t('advanced_filters') || 'Advanced Filters'}
              </span>
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                {getThemedIcon('ui', 'refresh', 16, theme)}
                <span style={{ marginLeft: '0.25rem' }}>
                  {t('reset') || 'Reset'}
                </span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                {getThemedIcon('ui', 'x', 16, theme)}
              </Button>
            </div>
          </div>

          {/* Analytics Overview */}
          <div style={{ 
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            <AnalyticsCard
              title={t('participation_total') || 'Participation Total'}
              value={analytics.participationTotal}
              icon="trending_up"
              color="#8b5cf6"
              trend={null}
            />
            <AnalyticsCard
              title={t('present_total') || 'Present Total'}
              value={analytics.presentCount}
              icon="check_circle"
              color="#10b981"
              trend={null}
            />
            <AnalyticsCard
              title={t('late_total') || 'Late Total'}
              value={analytics.lateCount}
              icon="clock"
              color="#f59e0b"
              trend={null}
            />
            <AnalyticsCard
              title={t('absent_total') || 'Absent Total'}
              value={analytics.absentCount}
              icon="x_circle"
              color="#ef4444"
              trend={null}
            />
            <AnalyticsCard
              title={t('excused_total') || 'Excused Total'}
              value={analytics.excusedCount}
              icon="calendar"
              color="#6b7280"
              trend={null}
            />
            <AnalyticsCard
              title={t('excused_leave_total') || 'Excused Leave Total'}
              value={analytics.excusedLeaveCount}
              icon="home"
              color="#3b82f6"
              trend={null}
            />
            <AnalyticsCard
              title={t('human_case_total') || 'Human Case Total'}
              value={analytics.humanCaseCount}
              icon="user"
              color="#ec4899"
              trend={null}
            />
            <AnalyticsCard
              title={t('none_total') || 'None Total'}
              value={analytics.noneCount}
              icon="help_circle"
              color="#9ca3af"
              trend={null}
            />
          </div>

          {/* Filter Categories */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Attendance Status Filter */}
            <FilterSection title={t('attendance_status') || 'Attendance Status'}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {[
                  { value: 'present', label: t('present') || 'Present', color: '#10b981', count: analytics.presentCount, icon: 'check_circle' },
                  { value: 'absent', label: t('absent') || 'Absent', color: '#ef4444', count: analytics.absentCount, icon: 'x_circle' },
                  { value: 'late', label: t('late') || 'Late', color: '#f59e0b', count: analytics.lateCount, icon: 'clock' },
                  { value: 'excused', label: t('excused') || 'Excused', color: '#6b7280', count: analytics.excusedCount, icon: 'calendar' },
                  { value: 'excused_leave', label: t('excused_leave') || 'Excused Leave', color: '#3b82f6', count: analytics.excusedLeaveCount, icon: 'home' },
                  { value: 'human_case', label: t('human_case') || 'Human Case', color: '#ec4899', count: analytics.humanCaseCount, icon: 'user' },
                  { value: 'none', label: t('none') || 'None', color: '#9ca3af', count: analytics.noneCount, icon: 'help_circle' }
                ].map(status => (
                  <StatusCard
                    key={status.value}
                    title={status.label}
                    count={status.count}
                    color={status.color}
                    icon={status.icon}
                    isSelected={selectedFilters.attendanceStatus.includes(status.value)}
                    onClick={() => {
                      info('🔍 Status card clicked:', status.value);
                      setSelectedFilters(prev => ({
                        ...prev,
                        attendanceStatus: prev.attendanceStatus.includes(status.value)
                          ? prev.attendanceStatus.filter(s => s !== status.value)
                          : [...prev.attendanceStatus, status.value]
                      }));
                    }}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Participation Range Filter */}
            <FilterSection title={t('participation_range') || 'Participation Range'}>
              <RangeSlider
                min={0}
                max={100}
                value={selectedFilters.participationRange}
                onChange={(value) => setSelectedFilters(prev => ({ ...prev, participationRange: value }))}
                unit="%"
                color="#f59e0b"
                t={t}
              />
            </FilterSection>

            {/* Behavior Count Filter */}
            <FilterSection title={t('behavior_incidents') || 'Behavior Incidents'}>
              <RangeSlider
                min={0}
                max={10}
                value={selectedFilters.behaviorCount}
                onChange={(value) => setSelectedFilters(prev => ({ ...prev, behaviorCount: value }))}
                unit={t('incidents') || 'incidents'}
                color="#ef4444"
                t={t}
              />
            </FilterSection>

            {/* Penalty Count Filter */}
            <FilterSection title={t('penalty_count') || 'Penalty Count'}>
              <RangeSlider
                min={0}
                max={5}
                value={selectedFilters.penaltyCount}
                onChange={(value) => setSelectedFilters(prev => ({ ...prev, penaltyCount: value }))}
                unit={t('penalties') || 'penalties'}
                color="#8b5cf6"
                t={t}
              />
            </FilterSection>

            {/* Quick Filters */}
            <FilterSection title={t('quick_filters') || 'Quick Filters'}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {[
                  { value: 'present', label: t('show_present') || 'Show Present', color: '#10b981', count: analytics.presentCount, icon: 'check_circle' },
                  { value: 'absent', label: t('show_absent') || 'Show Absent', color: '#ef4444', count: analytics.absentCount, icon: 'x_circle' },
                  { value: 'excused', label: t('show_excused') || 'Show Excused', color: '#6b7280', count: analytics.excusedCount, icon: 'calendar' },
                  { value: 'excused_leave', label: t('show_excused_leave') || 'Show Excused Leave', color: '#3b82f6', count: analytics.excusedLeaveCount, icon: 'home' },
                  { value: 'human_case', label: t('show_human_case') || 'Show Human Case', color: '#ec4899', count: analytics.humanCaseCount, icon: 'user' }
                ].map(filter => (
                  <StatusCard
                    key={filter.value}
                    title={filter.label}
                    count={filter.count}
                    color={filter.color}
                    icon={filter.icon}
                    isSelected={selectedFilters.attendanceStatus.includes(filter.value)}
                    onClick={() => {
                      info('🔍 Quick filter clicked:', filter.value);
                      setSelectedFilters(prev => ({
                        ...prev,
                        attendanceStatus: prev.attendanceStatus.includes(filter.value)
                          ? prev.attendanceStatus.filter(s => s !== filter.value)
                          : [filter.value] // Replace with single selection for quick filters
                      }));
                    }}
                  />
                ))}
              </div>
            </FilterSection>

          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '0.75rem',
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <Button variant="outline" onClick={onClose}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button 
              variant="primary" 
              onClick={applyFilters}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {getThemedIcon('ui', 'check', 16, 'white')}
              {t('apply_filters') || 'Apply Filters'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

// Helper Components
const AnalyticsCard = ({ title, value, icon, color, trend }) => {
  const trendIcon = trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : null;
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : null;
  
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            {title}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
            {value}
          </div>
        </div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '50%', 
          background: `${color}20`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {getThemedIcon('ui', icon, 20, color)}
        </div>
      </div>
      {trend && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem',
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: trendColor
        }}>
          {getThemedIcon('ui', trendIcon, 12, trendColor)}
          <span>{trend === 'up' ? 'Improving' : 'Needs Attention'}</span>
        </div>
      )}
    </div>
  );
};

const FilterSection = ({ title, children }) => (
  <div>
    <h3 style={{ 
      margin: '0 0 1rem 0', 
      fontSize: '1rem', 
      fontWeight: 600, 
      color: '#374151' 
    }}>
      {title}
    </h3>
    {children}
  </div>
);

const FilterChip = ({ label, color, isSelected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '0.5rem 0.75rem',
      borderRadius: '9999px',
      border: `2px solid ${isSelected ? color : '#e5e7eb'}`,
      background: isSelected ? color : 'white',
      color: isSelected ? 'white' : '#374151',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 500,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    }}
    onMouseOver={(e) => {
      if (!isSelected) {
        e.currentTarget.style.background = `${color}10`;
        e.currentTarget.style.borderColor = color;
      }
    }}
    onMouseOut={(e) => {
      if (!isSelected) {
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }
    }}
  >
    {isSelected && <span>✓</span>}
    {label}
  </div>
);

const StatusCard = ({ title, count, color, icon, isSelected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '1rem',
      borderRadius: '0.5rem',
      border: `2px solid ${isSelected ? color : '#e5e7eb'}`,
      background: isSelected ? `${color}10` : 'white',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textAlign: 'center',
      boxShadow: isSelected ? `0 4px 6px ${color}30` : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
    onMouseOver={(e) => {
      if (!isSelected) {
        e.currentTarget.style.background = '#f9fafb';
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }
    }}
    onMouseOut={(e) => {
      if (!isSelected) {
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.borderColor = '#e5e7eb';
        e.currentTarget.style.transform = 'translateY(0)';
      }
    }}
  >
    <div style={{ 
      width: '32px', 
      height: '32px', 
      borderRadius: '50%', 
      background: `${color}20`, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      margin: '0 auto 0.5rem'
    }}>
      {getThemedIcon('ui', icon, 16, color)}
    </div>
    <div style={{ 
      fontSize: '1.25rem', 
      fontWeight: 700, 
      color: isSelected ? color : '#111827',
      marginBottom: '0.25rem'
    }}>
      {count}
    </div>
    <div style={{ 
      fontSize: '0.75rem', 
      color: isSelected ? color : '#6b7280',
      fontWeight: 500
    }}>
      {title}
    </div>
  </div>
);

const RangeSlider = ({ min, max, value, onChange, unit, color, t }) => {
  const [localValue, setLocalValue] = useState(value);
  
  const handleChange = (newValue) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMinChange = (e) => {
    const newValue = parseInt(e.target.value);
    if (newValue <= localValue[1]) {
      handleChange([newValue, localValue[1]]);
    }
  };

  const handleMaxChange = (e) => {
    const newValue = parseInt(e.target.value);
    if (newValue >= localValue[0]) {
      handleChange([localValue[0], newValue]);
    }
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>
              {t ? (t('min') || 'Min') : 'Min'}
            </label>
            <input
              type="number"
              min={min}
              max={max}
              value={localValue[0]}
              onChange={handleMinChange}
              style={{
                width: '60px',
                padding: '0.25rem 0.5rem',
                border: `1px solid ${color}`,
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}
            />
          </div>
          <span style={{ color: '#6b7280' }}>-</span>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>
              {t ? (t('max') || 'Max') : 'Max'}
            </label>
            <input
              type="number"
              min={min}
              max={max}
              value={localValue[1]}
              onChange={handleMaxChange}
              style={{
                width: '60px',
                padding: '0.25rem 0.5rem',
                border: `1px solid ${color}`,
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}
            />
          </div>
          <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
            {unit}
          </span>
        </div>
      </div>
      
      {/* Visual Range Slider */}
      <div style={{ position: 'relative', height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${((localValue[0] - min) / (max - min)) * 100}%`,
            background: '#e5e7eb',
            borderRadius: '4px 0 0 4px'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${((localValue[0] - min) / (max - min)) * 100}%`,
            top: 0,
            height: '100%',
            width: `${((localValue[1] - localValue[0]) / (max - min)) * 100}%`,
            background: color,
            borderRadius: '4px'
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: `${100 - ((localValue[1] - min) / (max - min)) * 100}%`,
            background: '#e5e7eb',
            borderRadius: '0 4px 4px 0'
          }}
        />
      </div>
    </div>
  );
};

export default AdvancedFilterPanel;
