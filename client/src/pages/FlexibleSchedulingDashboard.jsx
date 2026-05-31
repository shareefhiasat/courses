import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@mui/material/styles';
import { SimpleLoading, useToast, ContextMenu, Modal, Input, Select, Button } from '@ui';
import ClassroomCalendar from '@components/ClassroomCalendar';
import ViewFilterBar from '@components/ViewFilterBar';
import { getAllClassrooms } from '@services/business/classroomService.js';
import { getAllUsers } from '@services/business/userService.js';
import classroomAvailabilityService from '@services/business/classroomAvailabilityService.js';
import instructorAvailabilityService from '@services/business/instructorAvailabilityService.js';
import { getThemedIcon } from '@constants/iconTypes';

/**
 * FlexibleSchedulingDashboard - unified hub for classroom, instructor, and workload views
 * Supports ClickUp-style filtering and right-click context menu actions
 */
const FlexibleSchedulingDashboard = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t, isRTL } = useLang();
  const muiTheme = useTheme();
  const toast = useToast();

  const [currentView, setCurrentView] = useState('classroom');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data for different views
  const [classrooms, setClassrooms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [classroomAvailabilities, setClassroomAvailabilities] = useState([]);
  const [instructorAvailabilities, setInstructorAvailabilities] = useState([]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    actions: [],
    cellContext: null,
  });

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    data: null,
  });

  // Form state for availability modal
  const [formData, setFormData] = useState({
    classroomId: '',
    instructorUserId: '',
    availableDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    unavailableDates: [],
    maxSessionsPerDay: 5,
    maxHoursPerWeek: null,
    status: 'Active',
  });

  const views = [
    {
      id: 'classroom',
      label: 'Classroom Availability',
      icon: getThemedIcon('ui', 'home', 16, muiTheme.palette.mode),
    },
    {
      id: 'instructor',
      label: 'Instructor Availability',
      icon: getThemedIcon('ui', 'users', 16, muiTheme.palette.mode),
    },
    {
      id: 'workload',
      label: 'Workload View',
      icon: getThemedIcon('ui', 'bar_chart3', 16, muiTheme.palette.mode),
    },
  ];

  // Load data based on current view
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Always load classrooms and instructors for all views
      const [classroomsResult, instructorsResult] = await Promise.all([
        getAllClassrooms(),
        getAllUsers(),
      ]);

      if (classroomsResult.success) {
        setClassrooms(classroomsResult.data);
      }

      if (instructorsResult.success) {
        // Filter for instructors only
        const instructorUsers = instructorsResult.data.filter(u => {
          const roles = u.roleAssignments?.map(ra => ra.role?.code?.toLowerCase()) || [];
          return roles.includes('instructor') || roles.includes('teacher');
        });
        setInstructors(instructorUsers);
      }

      // Load availability data based on view
      if (currentView === 'classroom') {
        const availResult = await classroomAvailabilityService.getAllClassroomAvailabilities();
        if (availResult.success) {
          setClassroomAvailabilities(availResult.data);
        }
      } else if (currentView === 'instructor') {
        const availResult = await instructorAvailabilityService.getAllInstructorAvailabilities();
        if (availResult.success) {
          setInstructorAvailabilities(availResult.data);
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error(t('error_loading_data') || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [currentView, t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Transform availability data into cell data format
  const getCellData = useCallback(() => {
    if (currentView === 'classroom') {
      const cellData = {};
      classroomAvailabilities.forEach((avail) => {
        if (avail.availableDays) {
          avail.availableDays.forEach((day) => {
            const key = `${avail.classroomId}_${day}`;
            cellData[key] = {
              status: 'available',
              ...avail,
            };
          });
        }
      });
      return cellData;
    } else if (currentView === 'instructor') {
      const cellData = {};
      instructorAvailabilities.forEach((avail) => {
        if (avail.availableDays) {
          avail.availableDays.forEach((day) => {
            const key = `${avail.instructorUserId}_${day}`;
            cellData[key] = {
              status: 'available',
              ...avail,
            };
          });
        }
      });
      return cellData;
    }
    return {};
  }, [currentView, classroomAvailabilities, instructorAvailabilities]);

  // Handle right-click on calendar cell
  const handleCellRightClick = useCallback((e, row, day, cellStatus) => {
    e.preventDefault();
    e.stopPropagation();

    const actions = [];

    if (currentView === 'classroom') {
      actions.push({
        label: 'add_availability',
        onClick: () => handleAddAvailability(row, day),
        icon: getThemedIcon('ui', 'plus', 16, muiTheme.palette.mode),
      });
      if (cellStatus.status === 'available') {
        actions.push({
          label: 'edit_availability',
          onClick: () => handleEditAvailability(row, day, cellStatus),
          icon: getThemedIcon('ui', 'edit', 16, muiTheme.palette.mode),
        });
        actions.push({
          label: 'delete_availability',
          onClick: () => handleDeleteAvailability(row, day, cellStatus),
          icon: getThemedIcon('ui', 'trash', 16, muiTheme.palette.mode),
          danger: true,
        });
      }
    } else if (currentView === 'instructor') {
      actions.push({
        label: 'add_availability',
        onClick: () => handleAddAvailability(row, day),
        icon: getThemedIcon('ui', 'plus', 16, muiTheme.palette.mode),
      });
      if (cellStatus.status === 'available') {
        actions.push({
          label: 'edit_availability',
          onClick: () => handleEditAvailability(row, day, cellStatus),
          icon: getThemedIcon('ui', 'edit', 16, muiTheme.palette.mode),
        });
        actions.push({
          label: 'delete_availability',
          onClick: () => handleDeleteAvailability(row, day, cellStatus),
          icon: getThemedIcon('ui', 'trash', 16, muiTheme.palette.mode),
          danger: true,
        });
      }
    } else if (currentView === 'workload') {
      actions.push({
        label: 'view_details',
        onClick: () => handleViewDetails(row, day),
        icon: getThemedIcon('ui', 'info', 16, muiTheme.palette.mode),
      });
    }

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      actions,
      cellContext: { row, day, cellStatus },
    });
  }, [currentView, muiTheme.palette.mode]);

  // Handle cell click (optional - could open modal directly)
  const handleCellClick = useCallback((row, day, cellStatus) => {
    // For now, just log - can be expanded to open modal on click
    console.log('Cell clicked:', { row, day, cellStatus });
  }, []);

  // Context menu action handlers
  const handleAddAvailability = useCallback((row, day) => {
    setFormData({
      classroomId: currentView === 'classroom' ? row.id.toString() : '',
      instructorUserId: currentView === 'instructor' ? row.dbId?.toString() || row.id?.toString() : '',
      availableDays: [day],
      unavailableDates: [],
      maxSessionsPerDay: 5,
      maxHoursPerWeek: null,
      status: 'Active',
    });
    setModalState({
      isOpen: true,
      type: 'add',
      data: { row, day },
    });
  }, [currentView]);

  const handleEditAvailability = useCallback((row, day, cellStatus) => {
    setFormData({
      classroomId: currentView === 'classroom' ? row.id.toString() : '',
      instructorUserId: currentView === 'instructor' ? row.dbId?.toString() || row.id?.toString() : '',
      availableDays: cellStatus.availableDays || [day],
      unavailableDates: cellStatus.unavailableDates || [],
      maxSessionsPerDay: cellStatus.maxSessionsPerDay || 5,
      maxHoursPerWeek: cellStatus.maxHoursPerWeek || null,
      status: cellStatus.status || 'Active',
    });
    setModalState({
      isOpen: true,
      type: 'edit',
      data: { row, day, cellStatus },
    });
  }, [currentView]);

  const handleDeleteAvailability = useCallback((row, day, cellStatus) => {
    setModalState({
      isOpen: true,
      type: 'delete',
      data: { row, day, cellStatus },
    });
  }, []);

  const handleViewDetails = useCallback((row, day) => {
    setModalState({
      isOpen: true,
      type: 'details',
      data: { row, day },
    });
  }, []);

  const handleSaveAvailability = async () => {
    try {
      const payload = {
        ...formData,
        classroomId: currentView === 'classroom' ? parseInt(formData.classroomId) : null,
        instructorUserId: currentView === 'instructor' ? parseInt(formData.instructorUserId) : null,
        unavailableDates: formData.unavailableDates.map(d => new Date(d)),
        createdBy: user.dbId,
      };

      let result;
      if (modalState.type === 'edit') {
        if (currentView === 'classroom') {
          result = await classroomAvailabilityService.updateClassroomAvailability(
            parseInt(formData.classroomId),
            { ...payload, updatedBy: user.dbId }
          );
        } else {
          result = await instructorAvailabilityService.updateInstructorAvailability(
            parseInt(formData.instructorUserId),
            { ...payload, updatedBy: user.dbId }
          );
        }
      } else {
        if (currentView === 'classroom') {
          result = await classroomAvailabilityService.createClassroomAvailability(payload);
        } else {
          result = await instructorAvailabilityService.createInstructorAvailability(payload);
        }
      }

      if (result.success) {
        toast.success(modalState.type === 'edit' ? 'Availability updated' : 'Availability created');
        hideModal();
        loadData();
      } else {
        toast.error(result.error || 'Failed to save availability');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save availability');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const { row, cellStatus } = modalState.data;
      let result;

      if (currentView === 'classroom') {
        result = await classroomAvailabilityService.deleteClassroomAvailability(row.id);
      } else {
        result = await instructorAvailabilityService.deleteInstructorAvailability(row.dbId || row.id);
      }

      if (result.success) {
        toast.success('Availability deleted');
        hideModal();
        loadData();
      } else {
        toast.error(result.error || 'Failed to delete availability');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete availability');
    }
  };

  const toggleAvailableDay = (day) => {
    setFormData({
      ...formData,
      availableDays: formData.availableDays.includes(day)
        ? formData.availableDays.filter(d => d !== day)
        : [...formData.availableDays, day]
    });
  };

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const hideModal = useCallback(() => {
    setModalState({
      isOpen: false,
      type: null,
      data: null,
    });
  }, []);

  // Permission check
  const hasPermission = isAdmin || isHR || isSuperAdmin;

  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: muiTheme.palette.text.primary }}>
          {t('access_denied') || 'Access Denied'}
        </div>
        <div style={{ fontSize: '0.875rem', color: muiTheme.palette.text.secondary, marginTop: '0.5rem' }}>
          {t('need_admin_privileges') || 'You need admin or HR privileges to access this page.'}
        </div>
      </div>
    );
  }

  if (loading) {
    return <SimpleLoading />;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: muiTheme.palette.error.main }}>
        {error}
      </div>
    );
  }

  const rows = currentView === 'classroom' ? classrooms : instructors;
  const cellData = getCellData();

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '1.5rem', color: muiTheme.palette.text.primary }}>
        {t('flexible_scheduling') || 'Flexible Scheduling'}
      </h1>

      <ViewFilterBar
        views={views}
        activeView={currentView}
        onViewChange={setCurrentView}
        t={t}
        theme={muiTheme}
      />

      <ClassroomCalendar
        rows={rows}
        cellData={cellData}
        onCellClick={handleCellClick}
        onCellRightClick={handleCellRightClick}
        t={t}
        theme={muiTheme}
      />

      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={hideContextMenu}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        actions={contextMenu.actions}
        t={t}
        theme={muiTheme}
      />

      {/* Availability Modal */}
      <Modal
        isOpen={modalState.isOpen && (modalState.type === 'add' || modalState.type === 'edit')}
        onClose={hideModal}
        title={modalState.type === 'edit' ? t('edit_availability') || 'Edit Availability' : t('add_availability') || 'Add Availability'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentView === 'classroom' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                {t('classroom') || 'Classroom'}
              </label>
              <Select
                value={formData.classroomId}
                onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                options={[
                  { value: '', label: t('select_classroom') || 'Select classroom' },
                  ...classrooms.map(c => ({ value: c.id.toString(), label: c.nameEn || c.name }))
                ]}
                disabled={modalState.type === 'edit'}
              />
            </div>
          )}

          {currentView === 'instructor' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                {t('instructor') || 'Instructor'}
              </label>
              <Select
                value={formData.instructorUserId}
                onChange={(e) => setFormData({ ...formData, instructorUserId: e.target.value })}
                options={[
                  { value: '', label: t('select_instructor') || 'Select instructor' },
                  ...instructors.map(i => ({ value: (i.dbId || i.id).toString(), label: i.displayName || i.firstName }))
                ]}
                disabled={modalState.type === 'edit'}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              {t('available_days') || 'Available Days'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Button
                  key={day}
                  onClick={() => toggleAvailableDay(day)}
                  variant={formData.availableDays.includes(day) ? 'primary' : 'outline'}
                  size="small"
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              {t('max_sessions_per_day') || 'Max Sessions Per Day'}
            </label>
            <Input
              type="number"
              value={formData.maxSessionsPerDay}
              onChange={(e) => setFormData({ ...formData, maxSessionsPerDay: parseInt(e.target.value) || 0 })}
              min="1"
              max="10"
            />
          </div>

          {currentView === 'instructor' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                {t('max_hours_per_week') || 'Max Hours Per Week'}
              </label>
              <Input
                type="number"
                value={formData.maxHoursPerWeek || ''}
                onChange={(e) => setFormData({ ...formData, maxHoursPerWeek: e.target.value ? parseInt(e.target.value) : null })}
                min="0"
                max="80"
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              {t('status') || 'Status'}
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'Active', label: t('active') || 'Active' },
                { value: 'Inactive', label: t('inactive') || 'Inactive' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button onClick={handleSaveAvailability} variant="primary">
              {modalState.type === 'edit' ? t('update') || 'Update' : t('create') || 'Create'}
            </Button>
            <Button onClick={hideModal} variant="outline">
              {t('cancel') || 'Cancel'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modalState.isOpen && modalState.type === 'delete'}
        onClose={hideModal}
        title={t('delete_availability') || 'Delete Availability'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p>
            {t('delete_availability_confirm') || 'Are you sure you want to delete this availability?'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button onClick={handleConfirmDelete} variant="primary" style={{ backgroundColor: muiTheme.palette.error.main }}>
              {t('delete') || 'Delete'}
            </Button>
            <Button onClick={hideModal} variant="outline">
              {t('cancel') || 'Cancel'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={modalState.isOpen && modalState.type === 'details'}
        onClose={hideModal}
        title={t('availability_details') || 'Availability Details'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p><strong>{t('row') || 'Row'}:</strong> {modalState.data?.row?.nameEn || modalState.data?.row?.displayName}</p>
          <p><strong>{t('day') || 'Day'}:</strong> {modalState.data?.day}</p>
          <p><strong>{t('status') || 'Status'}:</strong> {modalState.data?.cellStatus?.status}</p>
          <Button onClick={hideModal} variant="outline" style={{ marginTop: '1rem' }}>
            {t('close') || 'Close'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default FlexibleSchedulingDashboard;
