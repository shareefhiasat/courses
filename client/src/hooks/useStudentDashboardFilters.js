import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { getUsers } from '@services/business/userService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import useDataScope from '@hooks/useDataScope';
import usePersistentState from '@hooks/usePersistentState';
import { info, error, warn, debug } from '@services/utils/logger.js';

const DEEP_LINK_KEYS = ['studentId', 'programId', 'subjectId', 'classId'];

const readUrlFilter = (key) => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
};

const readStoredFilter = (storageKey, defaultVal, normalize) => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      return normalize(JSON.parse(saved), defaultVal);
    }
  } catch {}
  return defaultVal;
};

/** Normalize cascade filter ids (program/subject/class). Empty → 'all'. */
export const normalizeCascadeFilterId = (val, emptyAs = 'all') => {
  if (val === null || val === undefined) return emptyAs;
  if (typeof val === 'object') {
    const extracted = val.value ?? val.id ?? val.target?.value;
    if (extracted === null || extracted === undefined || extracted === '') return emptyAs;
    return String(extracted);
  }
  if (val === '') return emptyAs;
  return String(val);
};

/** Normalize student id filter. Empty stays empty. */
const normalizeStudentFilterId = (val) => {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'object') {
    const extracted = val.value ?? val.id ?? val.target?.value ?? '';
    return extracted === '' ? '' : String(extracted);
  }
  return String(val);
};

const getInitialFilter = (urlKey, storageKey, defaultVal, normalize) => {
  const urlVal = readUrlFilter(urlKey);
  if (urlVal) return normalize(urlVal, defaultVal);
  return readStoredFilter(storageKey, defaultVal, normalize);
};

const useDashboardFilterState = (storageKey, urlKey, defaultVal, normalize) => {
  const [value, setValue] = useState(() => getInitialFilter(urlKey, storageKey, defaultVal, normalize));

  const setPersistentValue = useCallback((next) => {
    setValue((prev) => {
      const resolved = normalize(typeof next === 'function' ? next(prev) : next, defaultVal);
      try {
        localStorage.setItem(storageKey, JSON.stringify(resolved));
      } catch {}
      return resolved;
    });
  }, [storageKey, defaultVal, normalize]);

  return [value, setPersistentValue];
};

/**
 * Manages cascading program → subject → class → student selection for the
 * Student Dashboard. For non-student roles, enforces "selection-first" so
 * heavy data queries only fire after a context is chosen.
 *
 * Returns:
 *  - Raw lists: programs, subjects, classes, students
 *  - Filtered lists based on current cascade: filteredSubjects, filteredClasses, filteredStudents
 *  - Selection state: selectedProgramId, selectedSubjectId, selectedClassId, selectedStudentId
 *  - Setters that cascade resets downstream
 *  - grouping: 'year' | 'class' | 'term'
 *  - hasSelection: true when enough context is chosen to load data
 *  - loading, reload
 */
const useStudentDashboardFilters = ({ isStaff = false } = {}) => {
  const { user, isAdmin, isInstructor, isHR, isSuperAdmin } = useAuth();
  const { scope: dataScope, filterItems: filterByScope, isUnrestricted } = useDataScope();

  const shouldLoadStudents = isStaff || isAdmin || isInstructor || isHR || isSuperAdmin;

  // Raw data lists
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cascade selections (persisted; URL deep-link wins on first load only)
  const [selectedProgramId, setSelectedProgramIdRaw] = useDashboardFilterState(
    'sd_filter_program', 'programId', 'all', normalizeCascadeFilterId
  );
  const [selectedSubjectId, setSelectedSubjectIdRaw] = useDashboardFilterState(
    'sd_filter_subject', 'subjectId', 'all', normalizeCascadeFilterId
  );
  const [selectedClassId, setSelectedClassIdRaw] = useDashboardFilterState(
    'sd_filter_class', 'classId', 'all', normalizeCascadeFilterId
  );
  const [selectedStudentId, setSelectedStudentIdRaw] = useDashboardFilterState(
    'sd_filter_student', 'studentId', '', normalizeStudentFilterId
  );

  // Grouping mode (persisted)
  const [grouping, setGrouping] = usePersistentState('sd_filter_grouping', 'class');

  // Strip deep-link query params after first paint so manual filter changes work normally
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStripped = useRef(false);
  useEffect(() => {
    if (urlStripped.current) return;
    const hasDeepLink = DEEP_LINK_KEYS.some((key) => searchParams.get(key));
    if (!hasDeepLink) {
      urlStripped.current = true;
      return;
    }
    urlStripped.current = true;
    const next = new URLSearchParams(searchParams);
    DEEP_LINK_KEYS.forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Cascade: selecting program resets downstream
  const setSelectedProgramId = useCallback((id) => {
    setSelectedProgramIdRaw(normalizeCascadeFilterId(id, 'all'));
    setSelectedSubjectIdRaw('all');
    setSelectedClassIdRaw('all');
    setSelectedStudentIdRaw('');
  }, [setSelectedProgramIdRaw, setSelectedSubjectIdRaw, setSelectedClassIdRaw, setSelectedStudentIdRaw]);

  const setSelectedSubjectId = useCallback((id) => {
    setSelectedSubjectIdRaw(normalizeCascadeFilterId(id, 'all'));
    setSelectedClassIdRaw('all');
    setSelectedStudentIdRaw('');
  }, [setSelectedSubjectIdRaw, setSelectedClassIdRaw, setSelectedStudentIdRaw]);

  const setSelectedClassId = useCallback((id) => {
    setSelectedClassIdRaw(normalizeCascadeFilterId(id, 'all'));
    setSelectedStudentIdRaw('');
  }, [setSelectedClassIdRaw, setSelectedStudentIdRaw]);

  const setSelectedStudentId = useCallback((id) => {
    setSelectedStudentIdRaw(normalizeStudentFilterId(id));
  }, [setSelectedStudentIdRaw]);

  // Load all reference data on mount
  const loadFilters = useCallback(async () => {
    setLoading(true);
    try {
      info('[StudentDashboardFilters] Loading filters data...');
      const [programsRes, subjectsRes, classesRes, studentsRes] = await Promise.allSettled([
        getPrograms(),
        getSubjects(),
        getClasses(),
        shouldLoadStudents ? getUsers() : Promise.resolve({ success: true, data: [] }),
      ]);

      const programsData = programsRes.status === 'fulfilled' ? (programsRes.value?.data || []) : [];
      const subjectsData = subjectsRes.status === 'fulfilled' ? (subjectsRes.value?.data || []) : [];
      const classesData = classesRes.status === 'fulfilled' ? (classesRes.value?.data || []) : [];
      const studentsData = studentsRes.status === 'fulfilled' ? (studentsRes.value?.data || []) : [];

      info('[StudentDashboardFilters] Raw data counts:', {
        programs: programsData.length,
        subjects: subjectsData.length,
        classes: classesData.length,
        students: studentsData.length,
        shouldLoadStudents
      });

      setPrograms(programsData);
      setSubjects(subjectsData);
      setClasses(classesData);
      
      // Don't filter by role here - let UserSelect component handle role filtering
      // This matches the enrollment page pattern
      const allUsers = shouldLoadStudents ? studentsData : [];
      info('[StudentDashboardFilters] Loaded users (no role filter):', allUsers.length);
      setStudents(allUsers);
    } catch (error) {
      error('Failed to load dashboard filters', error);
    } finally {
      setLoading(false);
    }
  }, [shouldLoadStudents]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Derived: subjects filtered by selected program (and data scope for normal admin)
  const filteredSubjects = useMemo(() => {
    let result = subjects;
    if (!isUnrestricted) {
      result = filterByScope(result, {
        idField: 'id',
        categoryField: 'categoryId',
        programField: 'programId',
        subjectField: 'id',
        classField: 'id',
      });
    }
    if (!selectedProgramId || selectedProgramId === 'all') return result;
    return result.filter(s => {
      const subProgramId = s.programId || s.program || '';
      return subProgramId === selectedProgramId;
    });
  }, [subjects, selectedProgramId, isUnrestricted, filterByScope]);

  // Derived: classes filtered by selected subject (and program if no subject) and data scope
  const filteredClasses = useMemo(() => {
    let result = classes;
    if (!isUnrestricted) {
      result = filterByScope(result, {
        idField: 'id',
        categoryField: 'categoryId',
        programField: 'programId',
        subjectField: 'subjectId',
        classField: 'id',
      });
    }
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      result = result.filter(c => c.subjectId === selectedSubjectId);
    } else if (selectedProgramId && selectedProgramId !== 'all') {
      const subjectIds = new Set(filteredSubjects.map(s => s.id || s.docId));
      result = result.filter(c => subjectIds.has(c.subjectId));
    }
    return result;
  }, [classes, selectedSubjectId, selectedProgramId, filteredSubjects, isUnrestricted, filterByScope]);

  // Derived: students filtered by selected class/subject/program
  const filteredStudents = useMemo(() => {
    // If class is selected, filter students enrolled in that class
    if (selectedClassId && selectedClassId !== 'all') {
      const filtered = students.filter(s => {
        if (s.enrollments && Array.isArray(s.enrollments)) {
          return s.enrollments.some(enrollment => String(enrollment.classId) === String(selectedClassId));
        }
        return String(s.classId) === String(selectedClassId)
          || s.enrolledClasses?.some(cid => String(cid) === String(selectedClassId))
          || s.enrolledClassIds?.includes(selectedClassId);
      });
      info('[StudentDashboardFilters] Filtered students for class', selectedClassId, ':', filtered.length, 'from', students.length);
      return filtered;
    }
    
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      info('[StudentDashboardFilters] Subject selected but no class, showing all students:', students.length);
      return students;
    }
    
    if (selectedProgramId && selectedProgramId !== 'all') {
      info('[StudentDashboardFilters] Program selected but no class, showing all students:', students.length);
      return students;
    }
    
    info('[StudentDashboardFilters] No filters selected, returning all students:', students.length);
    return students;
  }, [students, selectedClassId, selectedSubjectId, selectedProgramId]);

  // hasSelection: for staff, at least a class must be selected to trigger data load
  const hasSelection = useMemo(() => {
    if (!isStaff && !isAdmin && !isInstructor && !isHR && !isSuperAdmin) {
      // Student: always has selection (own data)
      return true;
    }
    // Staff: need at least a class or a student selected
    return (selectedClassId && selectedClassId !== 'all') ||
      (selectedStudentId && selectedStudentId !== '');
  }, [isStaff, isAdmin, isInstructor, isHR, isSuperAdmin, selectedClassId, selectedStudentId]);

  // Effective class IDs for data queries
  const effectiveClassIds = useMemo(() => {
    if (selectedClassId && selectedClassId !== 'all') return [selectedClassId];
    return filteredClasses.map(c => c.id || c.docId).filter(Boolean);
  }, [selectedClassId, filteredClasses]);

  return {
    // Raw lists
    programs,
    subjects,
    classes,
    students,

    // Filtered lists (cascade-aware)
    filteredSubjects,
    filteredClasses,
    filteredStudents,

    // Selections
    selectedProgramId,
    selectedSubjectId,
    selectedClassId,
    selectedStudentId,

    // Setters (cascade-aware)
    setSelectedProgramId,
    setSelectedSubjectId,
    setSelectedClassId,
    setSelectedStudentId,

    // Grouping
    grouping,
    setGrouping,

    // Derived
    hasSelection,
    effectiveClassIds,

    // Meta
    loading,
    reload: loadFilters,

    // Data scope
    dataScope,
    isUnrestricted,
  };
};

export default useStudentDashboardFilters;
