import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { ROLE_STRINGS } from '@constants';
import { Button, Select, Modal, Card } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import WidgetConfigurationService from '@services/widgetConfigurationService';
import logger from '@utils/logger';

/**
 * WidgetAssignmentManager
 * Allows super admins to configure which widgets appear on which dashboards
 */
const WidgetAssignmentManager = ({ isOpen, onClose, onSave }) => {
  const { t } = useLang();
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState(ROLE_STRINGS.STUDENT);
  const [selectedDashboard, setSelectedDashboard] = useState('overview');
  const [assignedWidgets, setAssignedWidgets] = useState([]);
  const [availableWidgets, setAvailableWidgets] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Role options for dropdown
  const roleOptions = useMemo(() => [
    { value: ROLE_STRINGS.STUDENT, label: t('roles.student') || 'Student' },
    { value: ROLE_STRINGS.INSTRUCTOR, label: t('roles.instructor') || 'Instructor' },
    { value: ROLE_STRINGS.HR, label: t('roles.hr') || 'HR' },
    { value: ROLE_STRINGS.ADMIN, label: t('roles.admin') || 'Admin' },
    { value: ROLE_STRINGS.SUPER_ADMIN, label: t('roles.super_admin') || 'Super Admin' }
  ], [t]);

  // Dashboard options
  const dashboardOptions = useMemo(() => [
    { value: 'overview', label: t('dashboard.overview') || 'Overview' },
    { value: 'performance', label: t('dashboard.performance') || 'Performance' }
  ], [t]);

  // Load widgets when role/dashboard changes
  React.useEffect(() => {
    if (!isOpen) return;
    
    const defaultWidgets = WidgetConfigurationService.getDefaultWidgets(selectedRole, selectedDashboard);
    setAssignedWidgets(defaultWidgets);
    
    // TODO: Load available widget templates from a service
    setAvailableWidgets([
      {
        id: 'template_count',
        title: 'Count Widget',
        description: 'Displays a simple count',
        chartType: 'count',
        icon: 'hash'
      },
      {
        id: 'template_bar',
        title: 'Bar Chart',
        description: 'Compare values across categories',
        chartType: 'bar',
        icon: 'bar_chart'
      },
      {
        id: 'template_line',
        title: 'Line Chart',
        description: 'Show trends over time',
        chartType: 'line',
        icon: 'line_chart'
      },
      {
        id: 'template_pie',
        title: 'Pie Chart',
        description: 'Show proportions',
        chartType: 'pie',
        icon: 'pie_chart'
      }
    ]);
  }, [selectedRole, selectedDashboard, isOpen]);

  // Add a widget to the dashboard
  const handleAddWidget = useCallback((template) => {
    const newWidget = {
      ...template,
      id: `${template.id}_${Date.now()}`,
      dataSource: 'enrollments', // Default data source
      layout: { x: 0, y: 0, w: 4, h: 3 },
      isCustom: true
    };
    
    setAssignedWidgets(prev => [...prev, newWidget]);
    logger.log(`[WidgetAssignmentManager] Added widget: ${template.title}`);
  }, []);

  // Remove a widget from the dashboard
  const handleRemoveWidget = useCallback((widgetId) => {
    setAssignedWidgets(prev => prev.filter(w => w.id !== widgetId));
    logger.log(`[WidgetAssignmentManager] Removed widget: ${widgetId}`);
  }, []);

  // Save widget assignments
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // Save to Firestore or configuration service
      await onSave?.({
        role: selectedRole,
        dashboard: selectedDashboard,
        widgets: assignedWidgets
      });
      
      logger.log(`[WidgetAssignmentManager] Saved configuration for ${selectedRole}_${selectedDashboard}`);
      onClose();
    } catch (error) {
      logger.error('[WidgetAssignmentManager] Error saving configuration:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedRole, selectedDashboard, assignedWidgets, onSave, onClose]);

  // Reorder widgets
  const moveWidget = useCallback((index, direction) => {
    setAssignedWidgets(prev => {
      const newWidgets = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex >= 0 && newIndex < newWidgets.length) {
        [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];
      }
      
      return newWidgets;
    });
  }, []);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('widget_assignment_manager') || 'Widget Assignment Manager'}
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
        
        {/* Role and Dashboard Selection */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            options={roleOptions}
            label={t('select_role') || 'Select Role'}
          />
          
          <Select
            value={selectedDashboard}
            onChange={e => setSelectedDashboard(e.target.value)}
            options={dashboardOptions}
            label={t('select_dashboard') || 'Select Dashboard'}
          />
        </div>

        {/* Widget Configuration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Available Widgets */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
              {t('available_widgets') || 'Available Widgets'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {availableWidgets.map(template => (
                <Card
                  key={template.id}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleAddWidget(template)}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--hover)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--panel)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {getThemedIcon('ui', template.icon, 20, theme)}
                    <div>
                      <div style={{ fontWeight: 600 }}>{template.title}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                        {template.description}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Assigned Widgets */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
              {t('assigned_widgets') || 'Assigned Widgets'}
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
                ({assignedWidgets.length})
              </span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {assignedWidgets.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  border: '2px dashed var(--border)',
                  borderRadius: '8px'
                }}>
                  {t('no_widgets_assigned') || 'No widgets assigned yet'}
                </div>
              ) : (
                assignedWidgets.map((widget, index) => (
                  <Card
                    key={widget.id}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {getThemedIcon('ui', 'grip_vertical', 16, theme)}
                        <div>
                          <div style={{ fontWeight: 600 }}>{widget.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {widget.chartType} • {widget.dataSource}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          onClick={() => moveWidget(index, 'up')}
                          disabled={index === 0}
                          style={{
                            padding: '0.25rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            opacity: index === 0 ? 0.5 : 1
                          }}
                        >
                          {getThemedIcon('ui', 'chevron_up', 16, theme)}
                        </button>
                        
                        <button
                          onClick={() => moveWidget(index, 'down')}
                          disabled={index === assignedWidgets.length - 1}
                          style={{
                            padding: '0.25rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: index === assignedWidgets.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: index === assignedWidgets.length - 1 ? 0.5 : 1
                          }}
                        >
                          {getThemedIcon('ui', 'chevron_down', 16, theme)}
                        </button>
                        
                        <button
                          onClick={() => handleRemoveWidget(widget.id)}
                          style={{
                            padding: '0.25rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--error)'
                          }}
                        >
                          {getThemedIcon('ui', 'x', 16, theme)}
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            {t('cancel') || 'Cancel'}
          </Button>
          
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={assignedWidgets.length === 0}
          >
            {t('save_configuration') || 'Save Configuration'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WidgetAssignmentManager;
