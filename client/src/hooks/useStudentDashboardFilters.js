import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { getUsers } from '@services/business/userService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import logger from '@utils/logger';

const useStudentDashboardFilters = ({ enableStudentList = false } = {}) => {
  const { isAdmin, isInstructor, isHR } = useAuth();
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const shouldLoadStudents = enableStudentList || isAdmin || isInstructor || isHR;

  const loadFilters = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, programsRes, subjectsRes, classesRes] = await Promise.allSettled([
        shouldLoadStudents ? getUsers() : Promise.resolve({ success: true, data: [] }),
        getPrograms(),
        getSubjects(),
        getClasses()
      ]);

      const studentsData = studentsRes.status === 'fulfilled' ? (studentsRes.value?.data || []) : [];
      const programsData = programsRes.status === 'fulfilled' ? (programsRes.value?.data || []) : [];
      const subjectsData = subjectsRes.status === 'fulfilled' ? (subjectsRes.value?.data || []) : [];
      const classesData = classesRes.status === 'fulfilled' ? (classesRes.value?.data || []) : [];

      setStudents(shouldLoadStudents ? studentsData.filter(user => user.role === 'student') : []);
      setPrograms(programsData);
      setSubjects(subjectsData);
      setClasses(classesData);
    } catch (error) {
      logger.error('Failed to load dashboard filters', error);
    } finally {
      setLoading(false);
    }
  }, [shouldLoadStudents]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  return {
    students,
    programs,
    subjects,
    classes,
    loading,
    reload: loadFilters
  };
};

export default useStudentDashboardFilters;
