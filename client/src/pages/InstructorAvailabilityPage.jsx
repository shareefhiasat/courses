import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Card, CardBody, Modal, Input, Checkbox, Select, DeleteModal } from '@ui';
import { useDeleteModal } from '@hooks/useDeleteModal.js';
import instructorAvailabilityService from '@services/business/instructorAvailabilityService.js';

const InstructorAvailabilityPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  const [availabilities, setAvailabilities] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(null);
  
  const [formData, setFormData] = useState({
    instructorUserId: '',
    availableDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    unavailableDates: [],
    maxSessionsPerDay: 3,
    maxHoursPerWeek: '',
    status: 'Active',
  });
  
  const [newUnavailableDate, setNewUnavailableDate] = useState('');
  
  const loadInstructors = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/users?role=instructor');
      const result = await response.json();
      if (result.success) {
        setInstructors(result.data);
      }
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  }, []);
  
  const loadAvailabilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await instructorAvailabilityService.getAllInstructorAvailabilities();
      if (result.success) {
        setAvailabilities(result.data);
      } else {
        setError(result.error);
        toast.error(result.error || 'Failed to load availabilities');
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Failed to load availabilities');
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadInstructors();
    loadAvailabilities();
  }, [loadInstructors, loadAvailabilities]);
  
  const handleNewAvailability = () => {
    setEditingAvailability(null);
    setFormData({
      instructorUserId: '',
      availableDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      unavailableDates: [],
      maxSessionsPerDay: 3,
      maxHoursPerWeek: null,
      status: 'Active',
    });
    setShowDialog(true);
  };
  
  const handleEditAvailability = (availability) => {
    setEditingAvailability(availability);
    setFormData({
      instructorUserId: availability.instructorUserId.toString(),
      availableDays: availability.availableDays || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      unavailableDates: availability.unavailableDates || [],
      maxSessionsPerDay: availability.maxSessionsPerDay || 3,
      maxHoursPerWeek: availability.maxHoursPerWeek || null,
      status: availability.status || 'Active',
    });
    setShowDialog(true);
  };
  
  const handleSaveAvailability = async () => {
    try {
      const payload = {
        ...formData,
        instructorUserId: parseInt(formData.instructorUserId),
        unavailableDates: formData.unavailableDates.map(d => new Date(d)),
        maxHoursPerWeek: formData.maxHoursPerWeek ? parseInt(formData.maxHoursPerWeek) : null,
        createdBy: user.dbId,
      };
      
      let result;
      if (editingAvailability) {
        result = await instructorAvailabilityService.updateInstructorAvailability(editingAvailability.instructorUserId, { ...payload, updatedBy: user.dbId });
      } else {
        result = await instructorAvailabilityService.createInstructorAvailability(payload);
      }
      
      if (result.success) {
        toast.success(editingAvailability ? 'Availability updated' : 'Availability created');
        setShowDialog(false);
        loadAvailabilities();
      } else {
        toast.error(result.error || 'Failed to save availability');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save availability');
    }
  };
  
  const handleDeleteAvailability = async (availability) => {
    const instructor = instructors.find(i => i.id === availability.instructorUserId);
    const instructorName = instructor?.displayName || instructor?.firstName || 'Instructor';
    
    deleteEntity('instructor availability', availability, async () => {
      const result = await instructorAvailabilityService.deleteInstructorAvailability(availability.instructorUserId);
      if (result.success) {
        toast.success('Availability deleted');
        loadAvailabilities();
      } else {
        toast.error(result.error || 'Failed to delete availability');
      }
    });
  };
  
  const toggleAvailableDay = (day) => {
    setFormData({
      ...formData,
      availableDays: formData.availableDays.includes(day)
        ? formData.availableDays.filter(d => d !== day)
        : [...formData.availableDays, day]
    });
  };
  
  const addUnavailableDate = (date) => {
    if (date && !formData.unavailableDates.includes(date)) {
      setFormData({
        ...formData,
        unavailableDates: [...formData.unavailableDates, date]
      });
    }
  };
  
  const removeUnavailableDate = (date) => {
    setFormData({
      ...formData,
      unavailableDates: formData.unavailableDates.filter(d => d !== date)
    });
  };
  
  const hasPermission = isAdmin || isHR || isSuperAdmin;
  
  if (!hasPermission) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.5rem' }}>
          You need admin or HR privileges to manage instructor availability.
        </div>
      </div>
    );
  }
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Instructor Availability
          </h1>
          <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            Manage instructor availability, vacation days, and workload limits
          </p>
        </div>
        
        <Button onClick={handleNewAvailability}>
          New Availability
        </Button>
      </div>
      
      {loading ? (
        <SimpleLoading />
      ) : error ? (
        <div style={{ padding: '1rem', color: 'red' }}>
          {error}
        </div>
      ) : (
        <Card>
          <CardBody>
            {availabilities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {availabilities.map((availability) => (
                  <div
                    key={availability.id}
                    style={{
                      padding: '1rem',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '1rem' }}>
                        {availability.instructor?.displayName || availability.instructor?.firstName}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '0.25rem' }}>
                        Available days: {availability.availableDays?.join(', ') || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        Max sessions/day: {availability.maxSessionsPerDay}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="outline" size="sm" onClick={() => handleEditAvailability(availability)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteAvailability(availability)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                No instructor availabilities configured
              </div>
            )}
          </CardBody>
        </Card>
      )}
      
      <Modal
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={editingAvailability ? 'Edit Availability' : 'New Availability'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Instructor</label>
            <Select
              value={formData.instructorUserId}
              onChange={(e) => setFormData({ ...formData, instructorUserId: e.target.value })}
              options={[
                { value: '', label: 'Select instructor' },
                ...instructors.map(instructor => ({
                  value: instructor.id.toString(),
                  label: instructor.displayName || instructor.firstName
                }))
              ]}
              disabled={!!editingAvailability}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Available Days</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {daysOfWeek.map(day => (
                <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Checkbox
                    checked={formData.availableDays.includes(day)}
                    onChange={() => toggleAvailableDay(day)}
                  />
                  <span style={{ fontSize: '0.875rem' }}>{day}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Max Sessions Per Day</label>
            <Input
              type="number"
              value={formData.maxSessionsPerDay}
              onChange={(e) => setFormData({ ...formData, maxSessionsPerDay: parseInt(e.target.value) || 0 })}
              min="1"
              max="10"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Max Hours Per Week (Optional)</label>
            <Input
              type="number"
              value={formData.maxHoursPerWeek}
              onChange={(e) => setFormData({ ...formData, maxHoursPerWeek: e.target.value })}
              min="1"
              max="40"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Unavailable Dates (Vacation/Off Days)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Input
                type="date"
                value={newUnavailableDate}
                onChange={(e) => setNewUnavailableDate(e.target.value)}
              />
              <Button variant="outline" onClick={() => {
                addUnavailableDate(newUnavailableDate);
                setNewUnavailableDate('');
              }}>
                Add
              </Button>
            </div>
            {formData.unavailableDates.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {formData.unavailableDates.map((date, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {date}
                    <button
                      onClick={() => removeUnavailableDate(date)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme === 'dark' ? '#fca5a5' : '#dc2626',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Status</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ]}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAvailability}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
      
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityType={deleteModal.entityType}
        entityName={deleteModal.entityName}
        loading={false}
        theme={theme}
        t={t}
      />
    </div>
  );
};

export default InstructorAvailabilityPage;
