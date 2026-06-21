import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { getAuthToken } from '@utils/authHelpers';

const EMPTY_SCOPE = {
  unrestricted: false,
  categoryIds: [],
  programIds: [],
  subjectIds: [],
  classIds: [],
  source: 'empty',
};

/**
 * Load effective data scope for the logged-in user (category/program/subject/class).
 */
export function useDataScope() {
  const { user, isSuperAdmin, isHR } = useAuth();
  const [scope, setScope] = useState(EMPTY_SCOPE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setScope(EMPTY_SCOPE);
      setLoading(false);
      return;
    }

    if (isSuperAdmin || isHR) {
      setScope({ ...EMPTY_SCOPE, unrestricted: true, source: isSuperAdmin ? 'super_admin' : 'hr' });
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = getAuthToken();
        const base = import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1';
        const res = await fetch(`${base}/me/data-scope`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setScope(json.data || EMPTY_SCOPE);
        } else if (!cancelled) {
          setScope(EMPTY_SCOPE);
        }
      } catch {
        if (!cancelled) setScope(EMPTY_SCOPE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, isSuperAdmin, isHR]);

  const filterItems = useCallback((items, fieldMap) => {
    if (scope.unrestricted) return items || [];
    const {
      idField = 'id',
      categoryField = 'categoryId',
      programField = 'programId',
      subjectField = 'subjectId',
      classField = 'classId',
    } = fieldMap || {};

    return (items || []).filter((item) => {
      const cid = item[classField] ?? item[idField];
      if (cid != null && scope.classIds.includes(Number(cid))) return true;
      if (item[subjectField] != null && scope.subjectIds.includes(Number(item[subjectField]))) return true;
      if (item[programField] != null && scope.programIds.includes(Number(item[programField]))) return true;
      if (item[categoryField] != null && scope.categoryIds.includes(Number(item[categoryField]))) return true;
      return false;
    });
  }, [scope.unrestricted, scope.classIds, scope.subjectIds, scope.programIds, scope.categoryIds]);

  const canAccessRecord = useCallback((record = {}) => {
    if (scope.unrestricted) return true;
    const classId = record.classId ?? record.class_id;
    const subjectId = record.subjectId ?? record.subject_id;
    const programId = record.programId ?? record.program_id;
    const categoryId = record.categoryId ?? record.category_id;
    if (classId != null && scope.classIds.includes(Number(classId))) return true;
    if (subjectId != null && scope.subjectIds.includes(Number(subjectId))) return true;
    if (programId != null && scope.programIds.includes(Number(programId))) return true;
    if (categoryId != null && scope.categoryIds.includes(Number(categoryId))) return true;
    return false;
  }, [scope.unrestricted, scope.classIds, scope.subjectIds, scope.programIds, scope.categoryIds]);

  return { scope, loading, filterItems, canAccessRecord, isUnrestricted: scope.unrestricted };
}

export default useDataScope;
