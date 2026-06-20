import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounced live validation for availability edit/delete against scheduled sessions.
 */
export function useAvailabilityChangeValidation({
  validateFn,
  formData,
  editingAvailabilityId,
  instructorUserId = null,
  classroomId = null,
  enabled = true
}) {
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const timerRef = useRef(null);

  const runValidation = useCallback(async (action = 'update', payload = {}) => {
    if (!validateFn) return { valid: true, conflicts: [] };

    setValidating(true);
    try {
      const body = {
        availabilityId: editingAvailabilityId || payload.availabilityId || null,
        action,
        dayOfWeek: payload.dayOfWeek ?? formData.dayOfWeek,
        slots: payload.slots ?? formData.slots,
        startDate: payload.startDate ?? formData.startDate,
        endDate: payload.endDate ?? formData.endDate,
        instructorUserId: payload.instructorUserId ?? instructorUserId ?? formData.instructorUserId,
        classroomId: payload.classroomId ?? classroomId ?? formData.classroomId,
        ...payload
      };

      const result = await validateFn(body);
      if (result.success) {
        const next = {
          valid: result.valid,
          conflicts: result.conflicts || [],
          blockingCount: result.blockingCount || (result.conflicts || []).length
        };
        setValidation(next);
        return next;
      }
      const fallback = { valid: false, conflicts: [{ message: result.error }], blockingCount: 0 };
      setValidation(fallback);
      return fallback;
    } catch (err) {
      const fallback = { valid: false, conflicts: [{ message: err.message }], blockingCount: 0 };
      setValidation(fallback);
      return fallback;
    } finally {
      setValidating(false);
    }
  }, [validateFn, formData, editingAvailabilityId, instructorUserId, classroomId]);

  useEffect(() => {
    if (!enabled || !editingAvailabilityId) {
      setValidation(null);
      return undefined;
    }

    const hasMinimum =
      (formData.instructorUserId || formData.classroomId) &&
      formData.dayOfWeek?.length > 0 &&
      formData.slots?.length > 0 &&
      formData.startDate &&
      formData.endDate;

    if (!hasMinimum) {
      setValidation(null);
      return undefined;
    }

    timerRef.current = setTimeout(() => {
      runValidation('update');
    }, 450);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    enabled,
    editingAvailabilityId,
    formData.instructorUserId,
    formData.classroomId,
    formData.dayOfWeek,
    formData.slots,
    formData.startDate,
    formData.endDate,
    runValidation
  ]);

  const clearValidation = useCallback(() => setValidation(null), []);

  return { validation, validating, runValidation, clearValidation };
}
