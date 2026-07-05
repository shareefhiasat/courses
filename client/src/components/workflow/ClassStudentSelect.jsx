import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { getStudentsByClass } from '@services/business/enrollmentService';
import { getAttendanceByClass } from '@services/business/attendanceService';
import { getStatusCodeFromRecord, getLocalizedAttendanceLabel } from '@constants/attendanceTypes';
import { Select, SimpleLoading } from '@ui';
import { getLocalizedUserName } from '@utils/localizedUserName';
import CompactAttendanceStatusIcon from './CompactAttendanceStatusIcon';

/**
 * Student picker scoped to a class enrollment roster with same-day attendance status icons.
 */
export default function ClassStudentSelect({
  classId,
  date = null,
  value,
  onChange,
  disabled = false,
  placeholder,
}) {
  const { t, lang } = useLang();
  const [students, setStudents] = useState([]);
  const [attendanceByUserId, setAttendanceByUserId] = useState({});
  const [loading, setLoading] = useState(false);

  const loadStudents = useCallback(async () => {
    if (!classId) {
      setStudents([]);
      return;
    }
    setLoading(true);
    try {
      const result = await getStudentsByClass(classId, { status: 'active' });
      if (result.success) {
        setStudents(result.data || []);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('[ClassStudentSelect] load failed', err);
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
      const rows = result?.data || result?.payload || [];
      const map = {};
      rows.forEach((row) => {
        const uid = row.userId || row.studentId;
        if (!uid) return;
        map[uid] = getStatusCodeFromRecord(row);
      });
      setAttendanceByUserId(map);
    } catch (err) {
      console.error('[ClassStudentSelect] attendance load failed', err);
      setAttendanceByUserId({});
    }
  }, [classId, date]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const options = useMemo(() => students.map((row) => {
    const user = row.user || row.student || row;
    const userId = user?.id || row.userId || row.studentId;
    const name = getLocalizedUserName(user, lang, user?.studentNumber || `#${userId}`);
    const status = attendanceByUserId[userId] || null;
    const statusLabel = status
      ? getLocalizedAttendanceLabel(status, lang)
      : t('none', 'None');

    return {
      value: String(userId),
      label: name,
      subtext: date ? statusLabel : undefined,
      icon: (
        <CompactAttendanceStatusIcon
          status={status}
          size={14}
          lang={lang}
          title={statusLabel}
        />
      ),
      searchText: `${name} ${statusLabel}`.toLowerCase(),
    };
  }), [students, lang, attendanceByUserId, date, t]);

  if (!classId) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('workflow.classStudent.selectClassFirst', 'Select program, subject, and class first.')}
      </p>
    );
  }

  if (loading) return <SimpleLoading size="sm" />;

  return (
    <Select
      value={value ? String(value) : ''}
      onChange={(e) => onChange?.(e.value ? Number(e.value) : null)}
      options={[{ value: '', label: placeholder || t('workflow.dialog.selectTargetStudent', 'Select student') }, ...options]}
      disabled={disabled || options.length === 0}
      placeholder={placeholder || t('workflow.dialog.selectTargetStudent', 'Select student')}
      fullWidth
    />
  );
}
