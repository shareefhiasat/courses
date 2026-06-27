import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { apiService } from '@services/api/apiService';
import { Checkbox, SimpleLoading } from '@ui';
import { format } from 'date-fns';

/**
 * Multi-select picker for attendance records linked to excuse / approval workflows.
 */
const AttendancePicker = ({
  classId,
  userId,
  dateFrom,
  dateTo,
  value = [],
  onChange,
  disabled = false,
}) => {
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedIds = useMemo(() => new Set(value.map((id) => Number(id))), [value]);

  const loadRows = useCallback(async () => {
    if (!classId) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('classId', String(classId));
      if (userId) params.append('userId', String(userId));
      params.append('limit', '500');

      const response = await apiService.get(`/attendance?${params.toString()}`);
      let data = response?.data || [];

      if (dateFrom || dateTo) {
        const fromMs = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
        const toMs = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;
        data = data.filter((row) => {
          const ms = new Date(row.date).getTime();
          if (fromMs && ms < fromMs) return false;
          if (toMs && ms > toMs) return false;
          return true;
        });
      }

      setRows(data);
    } catch (err) {
      console.error('[AttendancePicker] load failed', err);
      setError(t('workflow.attendancePicker.loadError', 'Failed to load attendance records'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [classId, userId, dateFrom, dateTo, t]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const toggleRow = (attendanceId) => {
    if (disabled) return;
    const id = Number(attendanceId);
    if (selectedIds.has(id)) {
      onChange?.(value.filter((v) => Number(v) !== id));
    } else {
      onChange?.([...value, id]);
    }
  };

  if (!classId) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('workflow.attendancePicker.selectClass', 'Select a class to load attendance records.')}
      </p>
    );
  }

  if (loading) {
    return <SimpleLoading size="sm" />;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('workflow.attendancePicker.empty', 'No attendance records found for the selected filters.')}
      </p>
    );
  }

  return (
    <div
      className="max-h-48 overflow-y-auto rounded-md border border-border p-2 space-y-1"
      data-testid="attendance-picker-list"
    >
      {rows.map((row) => {
        const studentName = row.user?.displayName
          || [row.user?.firstName, row.user?.lastName].filter(Boolean).join(' ')
          || `#${row.userId}`;
        const statusLabel = row.status?.nameEn || row.status?.code || '';
        const dateLabel = row.date ? format(new Date(row.date), 'yyyy-MM-dd') : '';
        const excused = Boolean(row.excuseApprovedAt);

        return (
          <label
            key={row.id}
            className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
          >
            <Checkbox
              checked={selectedIds.has(row.id)}
              onChange={() => toggleRow(row.id)}
              disabled={disabled}
            />
            <span className="text-sm flex-1">
              {studentName} · {dateLabel} · {statusLabel}
              {excused && (
                <span className="ml-1 text-xs text-green-600">
                  ({t('workflow.attendancePicker.excused', 'excused')})
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default AttendancePicker;
