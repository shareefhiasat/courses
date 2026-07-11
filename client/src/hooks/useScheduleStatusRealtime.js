import { useEffect, useCallback, useRef } from 'react';
import chatSocket from '@services/realtime/chatSocket.js';
import { getScheduleStatus } from '@services/business/attendanceWorkspaceService.js';

function toIsoDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

/**
 * Keep schedule statusMap in sync via WebSocket board events and tab focus.
 */
export default function useScheduleStatusRealtime({
  classIds = [],
  weekDates = [],
  setStatusMap,
  active = true,
  refreshOnActivate = false,
}) {
  const classIdSetRef = useRef(new Set());
  const weekDateSetRef = useRef(new Set());

  useEffect(() => {
    classIdSetRef.current = new Set(classIds.map(String));
    weekDateSetRef.current = new Set(weekDates.map(toIsoDate).filter(Boolean));
  }, [classIds, weekDates]);

  const patchStatusForClassDate = useCallback(async (classId, dateIso) => {
    if (!classId || !dateIso || !setStatusMap) return;
    if (!classIdSetRef.current.has(String(classId))) return;
    if (!weekDateSetRef.current.has(dateIso)) return;

    const result = await getScheduleStatus([classId], dateIso);
    if (!result.success || !result.data) return;
    const status = result.data[classId] ?? result.data[String(classId)];
    if (!status) return;

    setStatusMap((prev) => ({
      ...prev,
      [`${dateIso}:${classId}`]: status,
    }));
  }, [setStatusMap]);

  const refreshWeek = useCallback(async () => {
    if (!setStatusMap || classIds.length === 0 || weekDates.length === 0) return;
    const results = await Promise.all(
      weekDates.map((d) => getScheduleStatus(classIds, d)),
    );
    const combined = {};
    results.forEach((result, index) => {
      if (!result.success || !result.data) return;
      const iso = toIsoDate(weekDates[index]);
      Object.entries(result.data).forEach(([classId, status]) => {
        combined[`${iso}:${classId}`] = status;
      });
    });
    setStatusMap((prev) => ({ ...prev, ...combined }));
  }, [classIds, weekDates, setStatusMap]);

  useEffect(() => {
    if (!active) return undefined;

    const handleBoardEvent = (payload) => {
      const dateIso = toIsoDate(payload?.date);
      const classId = payload?.classId;
      if (classId && dateIso) {
        patchStatusForClassDate(classId, dateIso);
      }
    };

    chatSocket.on('board:workflow_updated', handleBoardEvent);
    chatSocket.on('board:attendance_updated', handleBoardEvent);

    return () => {
      chatSocket.off('board:workflow_updated', handleBoardEvent);
      chatSocket.off('board:attendance_updated', handleBoardEvent);
    };
  }, [active, patchStatusForClassDate]);

  useEffect(() => {
    if (!active || !refreshOnActivate) return;
    refreshWeek();
  }, [active, refreshOnActivate, refreshWeek]);

  return { refreshWeek, patchStatusForClassDate };
}
