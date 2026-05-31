import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, SimpleLoading, useToast, Card, CardBody, Modal, Input, Select, DeleteModal } from '@ui';
import { useDeleteModal } from '@hooks/useDeleteModal.js';
import classroomAvailabilityService from '@services/business/classroomAvailabilityService.js';
import { getAllClassrooms } from '@services/business/classroomService.js';

const ClassroomAvailabilityPage = () => {
  const { user, isAdmin, isHR, isSuperAdmin } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);
  
  const [availabilities, setAvailabilities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(null);
  
  const [formData, setFormData] = useState({
    classroomId: '',
    availableDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    unavailableDates: [],
    maxSessionsPerDay: 5,
    status: 'Active',
  });
  
  const [newUnavailableDate, setNewUnavailableDate] = useState('');
  
  const loadClassrooms = useCallback(async () => {
    try {
      const result = await getAllClassrooms();
      if (result.success) {
        setClassrooms(result.data);
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
    }
  }, []);
  
  const loadAvailabilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await classroomAvailabilityService.getAllClassroomAvailabilities();
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
    loadClassrooms();
    loadAvailabilities();
  }, [loadClassrooms, loadAvailabilities]);
  
  const handleNewAvailability = () => {
    setEditingAvailability(null);
    setFormData({
      classroomId: '',
      availableDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      unavailableDates: [],
      maxSessionsPerDay: 5,
      status: 'Active',
    });
    setShowDialog(true);
  };
  
  const handleEditAvailability = (availability) => {
    setEditingAvailability(availability);
    setFormData({
      classroomId: availability.classroomId.toString(),
      availableDays: availability.availableDays || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      unavailableDates: availability.unavailableDates || [],
      maxSessionsPerDay: availability.maxSessionsPerDay || 5,
      status: availability.status || 'Active',
    });
    setShowDialog(true);
  };
  
  const handleSaveAvailability = async () => {
    try {
      const payload = {
        ...formData,
        classroomId: parseInt(formData.classroomId),
        unavailableDates: formData.unavailableDates.map(d => new Date(d)),
        createdBy: user.dbId,
      };
      
      let result;
      if (editingAvailability) {
        result = await classroomAvailabilityService.updateClassroomAvailability(editingAvailability.classroomId, { ...payload, updatedBy: user.dbId });
      } else {
        result = await classroomAvailabilityService.createClassroomAvailability(payload);
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
    const classroom = classrooms.find(c => c.id === availability.classroomId);
    const classroomName = classroom?.nameEn || classroom?.name || 'Classroom';
    
    deleteEntity('classroom availability', availability, async () => {
      const result = await classroomAvailabilityService.deleteClassroomAvailability(availability.classroomId);
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
          You need admin or HR privileges to manage classroom availability.
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
            Classroom Availability
          </h1>
          <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
            Manage classroom availability, maintenance days, and session limits
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
                        {availability.classroom?.name || 'Unknown Classroom'}
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
                No classroom availabilities configured
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
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Classroom</label>
            <Select
              value={formData.classroomId}
              onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
              options={[
                { value: '', label: 'Select classroom' },
                ...classrooms.map(classroom => ({
                  value: classroom.id.toString(),
                  label: classroom.name
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
                  <input
                    type="checkbox"
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
              max="15"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Unavailable Dates (Maintenance/Off Days)</label>
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

export default ClassroomAvailabilityPage;
