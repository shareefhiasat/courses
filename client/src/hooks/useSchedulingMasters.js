import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import * as classroomService from '@services/business/classroomService';
import * as timeSlotService from '@services/business/timeSlotService';
import * as holidayService from '@services/business/holidayService';
import * as teacherAvailabilityService from '@services/business/teacherAvailabilityService';
import { info, error, warn, debug } from '@services/utils/logger.js';

export const useSchedulingMasters = (programId = null) => {
  const { user } = useAuth();
  
  // Classrooms state
  const [classrooms, setClassrooms] = useState([]);
  const [classroomsLoading, setClassroomsLoading] = useState(false);
  const [classroomsError, setClassroomsError] = useState(null);
  
  // Time slots state
  const [timeSlots, setTimeSlots] = useState([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [timeSlotsError, setTimeSlotsError] = useState(null);
  
  // Holidays state
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [holidaysError, setHolidaysError] = useState(null);
  
  // Teacher availability state
  const [teacherAvailabilities, setTeacherAvailabilities] = useState([]);
  const [teacherAvailabilitiesLoading, setTeacherAvailabilitiesLoading] = useState(false);
  const [teacherAvailabilitiesError, setTeacherAvailabilitiesError] = useState(null);
  
  // Load classrooms
  const loadClassrooms = useCallback(async () => {
    setClassroomsLoading(true);
    setClassroomsError(null);
    try {
      const params = programId ? { programId } : {};
      const result = await classroomService.getAllClassrooms(params);
      if (result.success) {
        setClassrooms(result.data);
      } else {
        setClassroomsError(result.error);
      }
    } catch (error) {
      setClassroomsError(error.message);
    } finally {
      setClassroomsLoading(false);
    }
  }, [programId]);
  
  // Load time slots
  const loadTimeSlots = useCallback(async () => {
    setTimeSlotsLoading(true);
    setTimeSlotsError(null);
    try {
      const params = programId ? { programId } : {};
      const result = await timeSlotService.getAllTimeSlots(params);
      if (result.success) {
        setTimeSlots(result.data);
      } else {
        setTimeSlotsError(result.error);
      }
    } catch (error) {
      setTimeSlotsError(error.message);
    } finally {
      setTimeSlotsLoading(false);
    }
  }, [programId]);
  
  // Load holidays
  const loadHolidays = useCallback(async () => {
    setHolidaysLoading(true);
    setHolidaysError(null);
    try {
      const params = programId ? { programId } : {};
      const result = await holidayService.getAllHolidays(params);
      if (result.success) {
        setHolidays(result.data);
      } else {
        setHolidaysError(result.error);
      }
    } catch (error) {
      setHolidaysError(error.message);
    } finally {
      setHolidaysLoading(false);
    }
  }, [programId]);
  
  // Load teacher availabilities
  const loadTeacherAvailabilities = useCallback(async () => {
    setTeacherAvailabilitiesLoading(true);
    setTeacherAvailabilitiesError(null);
    try {
      const result = await teacherAvailabilityService.getAllTeacherAvailabilities();
      if (result.success) {
        setTeacherAvailabilities(result.data);
      } else {
        setTeacherAvailabilitiesError(result.error);
      }
    } catch (error) {
      setTeacherAvailabilitiesError(error.message);
    } finally {
      setTeacherAvailabilitiesLoading(false);
    }
  }, []);
  
  // Create classroom
  const createClassroom = useCallback(async (data) => {
    try {
      const result = await classroomService.createClassroom(data, user);
      if (result.success) {
        await loadClassrooms();
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadClassrooms]);
  
  // Update classroom
  const updateClassroom = useCallback(async (id, data) => {
    try {
      const result = await classroomService.updateClassroom(id, data, user);
      if (result.success) {
        await loadClassrooms();
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadClassrooms]);
  
  // Delete classroom
  const deleteClassroom = useCallback(async (id) => {
    try {
      const result = await classroomService.deleteClassroom(id, user);
      if (result.success) {
        await loadClassrooms();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadClassrooms]);
  
  // Create time slot
  const createTimeSlot = useCallback(async (data) => {
    try {
      const result = await timeSlotService.createTimeSlot(data, user);
      if (result.success) {
        await loadTimeSlots();
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadTimeSlots]);
  
  // Update time slot
  const updateTimeSlot = useCallback(async (id, data) => {
    try {
      const result = await timeSlotService.updateTimeSlot(id, data, user);
      if (result.success) {
        await loadTimeSlots();
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadTimeSlots]);
  
  // Delete time slot
  const deleteTimeSlot = useCallback(async (id) => {
    try {
      const result = await timeSlotService.deleteTimeSlot(id, user);
      if (result.success) {
        await loadTimeSlots();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadTimeSlots]);
  
  // Create holiday
  const createHoliday = useCallback(async (data) => {
    try {
      const result = await holidayService.createHoliday(data, user);
      if (result.success) {
        await loadHolidays();
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadHolidays]);
  
  // Update holiday
  const updateHoliday = useCallback(async (id, data) => {
    try {
      const result = await holidayService.updateHoliday(id, data, user);
      if (result.success) {
        await loadHolidays();
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadHolidays]);
  
  // Delete holiday
  const deleteHoliday = useCallback(async (id) => {
    try {
      const result = await holidayService.deleteHoliday(id, user);
      if (result.success) {
        await loadHolidays();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadHolidays]);
  
  // Create teacher availability
  const createTeacherAvailability = useCallback(async (data) => {
    try {
      const result = await teacherAvailabilityService.createTeacherAvailability(data, user);
      if (result.success) {
        await loadTeacherAvailabilities();
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadTeacherAvailabilities]);
  
  // Update teacher availability
  const updateTeacherAvailability = useCallback(async (id, data) => {
    try {
      const result = await teacherAvailabilityService.updateTeacherAvailability(id, data, user);
      if (result.success) {
        await loadTeacherAvailabilities();
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadTeacherAvailabilities]);
  
  // Delete teacher availability
  const deleteTeacherAvailability = useCallback(async (id) => {
    try {
      const result = await teacherAvailabilityService.deleteTeacherAvailability(id, user);
      if (result.success) {
        await loadTeacherAvailabilities();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [user, loadTeacherAvailabilities]);
  
  // Bulk initialize time slots
  const bulkInitTimeSlots = useCallback(async () => {
    if (!programId) {
      return { success: false, error: 'Program ID is required' };
    }
    try {
      const result = await timeSlotService.bulkInitDefaults({ programId });
      if (result.success) {
        await loadTimeSlots();
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [programId, loadTimeSlots]);
  
  // Load all masters on mount
  useEffect(() => {
    loadClassrooms();
    loadTimeSlots();
    loadHolidays();
    loadTeacherAvailabilities();
  }, [loadClassrooms, loadTimeSlots, loadHolidays, loadTeacherAvailabilities]);
  
  return {
    // Classrooms
    classrooms,
    classroomsLoading,
    classroomsError,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    loadClassrooms,
    
    // Time slots
    timeSlots,
    timeSlotsLoading,
    timeSlotsError,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    loadTimeSlots,
    bulkInitTimeSlots,
    
    // Holidays
    holidays,
    holidaysLoading,
    holidaysError,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    loadHolidays,
    
    // Teacher availability
    teacherAvailabilities,
    teacherAvailabilitiesLoading,
    teacherAvailabilitiesError,
    createTeacherAvailability,
    updateTeacherAvailability,
    deleteTeacherAvailability,
    loadTeacherAvailabilities
  };
};

export default useSchedulingMasters;
