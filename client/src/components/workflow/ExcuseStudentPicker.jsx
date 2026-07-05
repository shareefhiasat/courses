import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { getStudentsByClass } from '@services/business/enrollmentService';
import { getAttendanceByClass } from '@services/business/attendanceService';
import { getStatusCodeFromRecord, getLocalizedAttendanceLabel } from '@constants/attendanceTypes';
import { Checkbox, SimpleLoading } from '@ui';
import { getLocalizedUserName } from '@utils/localizedUserName';
import CompactAttendanceStatusIcon from './CompactAttendanceStatusIcon';

/**
 * Multi-select student picker for excuse workflows with same-day attendance status icons.
 */
export default function ExcuseStudentPicker({
  classId,
  date = null,
  value = [],
  onChange,
  disabled = false,
}) {
  const { t, lang } = useLang();
  const [students, setStudents] = useState([]);
  const [attendanceByUserId, setAttendanceByUserId] = useState({});
  const [loading, setLoading] = useState(false);

  const selectedIds = useMemo(() => new Set((value || []).map((id) => Number(id))), [value]);

  const loadStudents = useCallback(async () => {
    if (!classId) {
      setStudents([]);
      return;
    }
    setLoading(true);
    try {
      const result = await getStudentsByClass(classId, { status: 'active' });
      setStudents(result.success ? (result.data || []) : []);
    } catch (err) {
      console.error('[ExcuseStudentPicker] load failed', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const loadAttendance = useCallback(async () => {
    if (!classId || !date) {
      setAttendanceByUserId({});
      return;
    }
    try {
      const result = await getAttendanceByClass(classId, { date });
      const rows = result?.data || [];
      const map = {};
      rows.forEach((row) => {
        const uid = row.userId || row.studentId;
        if (uid) map[uid] = getStatusCodeFromRecord(row);
      });
      setAttendanceByUserId(map);
    } catch (err) {
      console.error('[ExcuseStudentPicker] attendance load failed', err);
      setAttendanceByUserId({});
    }
  }, [classId, date]);

  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const toggleStudent = (userId) => {
    const id = Number(userId);
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange?.(Array.from(next));
  };

  if (!classId) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('workflow.classStudent.selectClassFirst', 'Select program, subject, and class first.')}
      </p>
    );
  }

  if (loading) return <SimpleLoading size="sm" />;

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('no_students_found', 'No students found')}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border, #e5e7eb)', borderRadius: '0.5rem', padding: '0.5rem' }}>
      {students.map((row) => {
        const user = row.user || row.student || row;
        const userId = user?.id || row.userId || row.studentId;
        const name = getLocalizedUserName(user, lang, user?.studentNumber || `#${userId}`);
        const status = attendanceByUserId[userId] || null;
        const statusLabel = status ? getLocalizedAttendanceLabel(status, lang) : t('none', 'None');
        const checked = selectedIds.has(Number(userId));

        return (
          <label
            key={userId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.5rem',
              borderRadius: '0.375rem',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: checked ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <Checkbox
              checked={checked}
              onChange={() => !disabled && toggleStudent(userId)}
              disabled={disabled}
            />
            <CompactAttendanceStatusIcon status={status} size={14} lang={lang} title={statusLabel} />
            <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', fontWeight: checked ? 600 : 400 }}>
              {name}
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted, #6b7280)' }}>
              {statusLabel}
            </span>
          </label>
        );
      })}
    </div>
  );
}
