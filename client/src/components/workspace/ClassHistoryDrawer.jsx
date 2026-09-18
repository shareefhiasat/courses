import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Star, MessageSquare, FilePenLine, GitBranch, CheckCircle, XCircle, FileText, FileSpreadsheet } from 'lucide-react';
import { resolveUserRole } from '@utils/userUtils';
import RoleBadge from '@pages/communications/chat/components/RoleBadge.jsx';
import ClassHistorySearchInput from '@components/workspace/ClassHistorySearchInput';
import useResizableDrawer from '@hooks/useResizableDrawer';
import ExportHistoryDrawer from '@pages/operations/attendance/ExportHistoryDrawer';
import LectureLogDrawer, { DateGroupedList, DayFilterBanner } from '@components/workspace/LectureLogDrawer';
import { getParticipationsByClassAndDate } from '@services/business/participationService.js';
import { getLectureLog } from '@services/business/attendanceLogService.js';
import { getClassAttendanceByDate } from '@services/business/attendanceServiceUnified.js';
import { fetchWorkflowHistory } from '@services/business/operationsBoardService.js';
import { getDailyWorkflowHistory, getWeeklyWorkflowHistory, getWeekRange, getWarningWorkflowHistory } from '@services/business/workflowSnapshotService.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { getLocalizedAttendanceLabel } from '@constants/attendanceTypes.js';
import { formatDateTime } from '@utils/date-formatter.js';
import { BOARD_PARTICIPATION_COLOR, BOARD_COMMENT_COLOR } from '@constants/workspaceStatusColors.js';
import DriveUserAvatar from '@components/ui/DriveTimeline/DriveUserAvatar.jsx';

const TABS = {
  EXPORT: 'export',
  LECTURE: 'lecture',
  ACTIVITY: 'activity',
  WORKFLOWS: 'workflows',
};

const ClassHistoryDrawer = ({
  isOpen,
  onClose,
  classInfo: classInfoProp,
  date: dateProp,
  initialTab = null,
  card = null,
  lane = null,
  onRefresh = null,
  onCardUpdated = null,
  onParticipationRefresh = null,
  onActionBanner = null,
  roleContext = {},
  drawerTab = null,
  view = 'kanban',
}) => {
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const isCardMode = Boolean(card);
  const userRole = resolveUserRole(user);
  const canViewNotes = ['super_admin', 'admin'].includes(userRole);
  const classInfo = useMemo(() => classInfoProp || (card ? {
    id: card.classId,
    nameEn: card.classNameEn || card.className,
    nameAr: card.classNameAr,
    programId: card.programId,
  } : null), [classInfoProp, card]);
  const date = useMemo(() => dateProp || card?.date || null, [dateProp, card?.date]);
  const resolvedInitialTab = useMemo(() => {
    if (drawerTab) {
      const map = {
        comments: TABS.ACTIVITY,
        participation: TABS.ACTIVITY,
        lecture: TABS.LECTURE,
        lecture_log: TABS.LECTURE,
        export: TABS.EXPORT,
        notes: TABS.ACTIVITY,
        activity: TABS.ACTIVITY,
        workflows: TABS.EXPORT,
        workflow: TABS.EXPORT,
      };
      return map[drawerTab] || TABS.LECTURE;
    }
    return initialTab || (isCardMode ? TABS.LECTURE : TABS.EXPORT);
  }, [drawerTab, initialTab, isCardMode]);
  const [activeTab, setActiveTab] = useState(resolvedInitialTab);
  const [participationList, setParticipationList] = useState([]);
  const [participationLoading, setParticipationLoading] = useState(false);
  const [attendanceNotesList, setAttendanceNotesList] = useState([]);
  const [attendanceNotesLoading, setAttendanceNotesLoading] = useState(false);
  const [workflowComments, setWorkflowComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [workflowList, setWorkflowList] = useState([]);
  const [workflowListLoading, setWorkflowListLoading] = useState(false);

  const classId = classInfo?.id;
  const dateStr = date ? new Date(date).toISOString().split('T')[0] : null;
  const cardStudentId = card?.type === 'attendance' ? card?.userId : null;
  const cardWorkflowId = card?.type === 'workflow' ? card?.rawId : null;
  const studentFilter = useMemo(() => ({
    id: cardStudentId,
    name: card?.studentName || card?.name,
  }), [cardStudentId, card?.studentName, card?.name]);

  const loadParticipation = useCallback(async () => {
    if (!classId || !dateStr) return;
    setParticipationLoading(true);
    try {
      const res = await getParticipationsByClassAndDate(classId, dateStr);
      const list = res?.data || res || [];
      setParticipationList(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('[ClassHistoryDrawer] Failed to load participation', e);
    } finally {
      setParticipationLoading(false);
    }
  }, [classId, dateStr]);

  const loadAttendanceNotes = useCallback(async () => {
    if (!classId || !dateStr) return;
    setAttendanceNotesLoading(true);
    try {
      const res = await getClassAttendanceByDate(classId, dateStr);
      const records = res?.data?.regular || res?.data || res || [];
      const list = Array.isArray(records) ? records : [];
      const notes = list
        .filter((r) => r && r.notes && r.notes.trim())
        .map((r) => ({
          id: r.id,
          userId: r.userId,
          user: r.user,
          notes: r.notes.trim(),
          creator: r.creator,
          updater: r.updater,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      setAttendanceNotesList(notes);
    } catch (e) {
      console.error('[ClassHistoryDrawer] Failed to load attendance notes', e);
      setAttendanceNotesList([]);
    } finally {
      setAttendanceNotesLoading(false);
    }
  }, [classId, dateStr]);

  const loadWorkflows = useCallback(async () => {
    if (!classId) return;
    setWorkflowListLoading(true);
    try {
      const programId = classInfo?.programId;
      const promises = [getWarningWorkflowHistory({ classId, programId })];
      if (dateStr) {
        const dailyPromise = getDailyWorkflowHistory({ date: dateStr, classId, programId });
        const { weekFrom, weekTo } = getWeekRange(dateStr);
        const weeklyPromise = programId
          ? getWeeklyWorkflowHistory({ weekFrom, weekTo, classId, programId })
          : Promise.resolve({ success: true, data: [] });
        promises.push(dailyPromise, weeklyPromise);
      }
      const [warningRes, ...rest] = await Promise.all(promises);
      const warnings = Array.isArray(warningRes?.data) ? warningRes.data : [];
      const others = rest.flatMap((res) => (Array.isArray(res?.data) ? res.data : []));
      const merged = [...warnings, ...others].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setWorkflowList(merged);
    } catch (e) {
      console.error('[ClassHistoryDrawer] Failed to load workflows', e);
      setWorkflowList([]);
    } finally {
      setWorkflowListLoading(false);
    }
  }, [classId, dateStr, classInfo?.programId]);

  const loadComments = useCallback(async () => {
    if (!classId || !dateStr) return;
    setCommentsLoading(true);
    setWorkflowComments([]);
    try {
      if (cardWorkflowId) {
        const res = await fetchWorkflowHistory(cardWorkflowId);
        if (res?.success) {
          const comments = (res.data?.comments || []).map((c) => ({ ...c, workflowId: cardWorkflowId, workflow: res.data?.document }));
          const history = (res.data?.history || []).map((h) => ({ ...h, workflowId: cardWorkflowId, workflow: res.data?.document }));
          const merged = [...comments, ...history].sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0));
          setWorkflowComments(merged);
        }
      } else {
        const logRes = await getLectureLog(classId, dateStr);
        const log = logRes?.data || [];
        const logIds = [...new Set(log
          .filter((e) => e.type === 'workflow_status_change')
          .map((e) => e.id || e.workflowId || e.workflowDocumentId)
          .filter(Boolean))];

        // Also load recent workflows for this class so comments made on other dates are visible.
        const programId = classInfo?.programId;
        const [dailyRes, warningRes] = await Promise.all([
          getDailyWorkflowHistory({ classId, programId }),
          getWarningWorkflowHistory({ classId, programId }),
        ]);
        const daily = Array.isArray(dailyRes?.data) ? dailyRes.data : [];
        const warnings = Array.isArray(warningRes?.data) ? warningRes.data : [];
        const recentWorkflows = [...warnings, ...daily]
          .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
          .slice(0, 25);
        const workflowIds = [...new Set([...logIds, ...recentWorkflows.map((w) => w.id).filter(Boolean)])];

        const comments = [];
        await Promise.all(workflowIds.slice(0, 25).map(async (wid) => {
          const res = await fetchWorkflowHistory(wid);
          if (res?.success) {
            const doc = res.data?.document;
            (res.data?.comments || []).forEach((c) => comments.push({ ...c, workflowId: wid, workflow: doc }));
            (res.data?.history || []).forEach((h) => comments.push({ ...h, workflowId: wid, workflow: doc }));
          }
        }));
        comments.sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0));
        setWorkflowComments(comments);
      }
    } catch (e) {
      console.error('[ClassHistoryDrawer] Failed to load comments', e);
    } finally {
      setCommentsLoading(false);
    }
  }, [classId, dateStr, cardWorkflowId, classInfo?.programId]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(resolvedInitialTab);
    }
  }, [isOpen, resolvedInitialTab]);

  useEffect(() => {
    if (isOpen) {
      loadParticipation();
      loadAttendanceNotes();
      loadComments();
      loadWorkflows();
    }
  }, [isOpen, loadParticipation, loadAttendanceNotes, loadComments, loadWorkflows, card?.id, card?.notes]);

  const { width: drawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: 'class_history_drawer_width',
    defaultWidth: 720,
    minWidth: 360,
    maxWidth: 900,
    isRTL,
  });

  if (!isOpen) return null;

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 11990,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          insetInlineEnd: 0,
          width: `${drawerWidth}px`,
          maxWidth: '100vw',
          height: '100vh',
          background: isDark ? '#0f172a' : '#ffffff',
          borderInlineStart: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          zIndex: 12000,
          display: 'flex',
          flexDirection: 'column',
          dir: lang === 'ar' ? 'rtl' : 'ltr',
        }}
        data-testid="class-history-drawer"
      >
        <div {...resizeHandleProps} />
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: isDark ? '#f1f5f9' : '#1e293b' }}>
              {t('workspace_class_history')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {getThemedIcon('ui', 'close', 20, isDark ? 'inverse' : 'primary')}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          }}
        >
          {[
            { key: TABS.LECTURE, label: t('workspace_lookup_previous'), icon: 'clipboard_list' },
            { key: TABS.ACTIVITY, label: t('activity') || 'Activity', icon: 'message' },
            { key: TABS.EXPORT, label: (t('documents') || 'Documents').replace(/^./, (c) => c.toUpperCase()), icon: 'download' },
          ].map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${active ? 'var(--color-primary, #3b82f6)' : (isDark ? '#334155' : '#e2e8f0')}`,
                    background: active ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)') : 'transparent',
                    color: active ? 'var(--color-primary, #3b82f6)' : (isDark ? '#94a3b8' : '#64748b'),
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                  data-testid={`class-history-tab-${tab.key}`}
                >
                  {getThemedIcon('ui', tab.icon, 18, active ? 'primary' : theme)}
                  {tab.label}
                </button>
              );
            })}
          </div>

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <>
            {activeTab === TABS.EXPORT && (
                <ClassDocumentsPanel
                  workflows={workflowList}
                  workflowLoading={workflowListLoading}
                  classInfo={classInfo}
                  date={date}
                  t={t}
                  lang={lang}
                  isDark={isDark}
                  theme={theme}
                  onClose={onClose}
                  classId={classInfo?.id}
                />
              )}
              {activeTab === TABS.LECTURE && (
                <LectureLogDrawer
                  isOpen
                  onClose={onClose}
                  classInfo={classInfo}
                  date={date}
                  studentId={cardStudentId}
                  workflowId={cardWorkflowId}
                  embedded
                />
              )}
              {activeTab === TABS.ACTIVITY && (
                <div style={{ overflow: 'auto', height: '100%' }}>
                  <ClassActivityPanel
                    list={participationList}
                    comments={workflowComments}
                    loading={participationLoading || commentsLoading || attendanceNotesLoading}
                    t={t}
                    lang={lang}
                    isDark={isDark}
                    canViewNotes={canViewNotes}
                    studentFilter={studentFilter}
                    isCardMode={isCardMode}
                    date={date}
                    attendanceNotes={attendanceNotesList}
                  />
                </div>
              )}
            </>
        </div>
      </div>
    </>
  );
};

const ClassDocumentsPanel = ({ workflows: _workflows = [], workflowLoading: _workflowLoading, classInfo, date, t, lang, isDark, theme, onClose, classId }) => {
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState('');
  const [docSubtype, setDocSubtype] = useState('all');
  const [docStatus, setDocStatus] = useState('all');
  const [docFormat, setDocFormat] = useState('all');
  const className = useMemo(() => {
    if (!classInfo) return t('class') || 'Class';
    if (lang === 'ar' && classInfo.nameAr) return classInfo.nameAr;
    return classInfo.nameEn || classInfo.name || classInfo.code || (t('class') || 'Class');
  }, [classInfo, lang, t]);
  const [exportCount, setExportCount] = useState(0);
  const count = exportCount;

  const exportType = docSubtype === 'DAILY' ? 'attendance_daily_official' : (docSubtype === 'WEEKLY' ? 'official_attendance' : 'all');

  const chips = [
    { key: 'DAILY', label: t('workflow_subtype_daily') || 'Daily', color: '#3b82f6', icon: FilePenLine, active: docSubtype === 'DAILY', onClick: () => setDocSubtype(docSubtype === 'DAILY' ? 'all' : 'DAILY') },
    { key: 'WEEKLY', label: t('workflow_subtype_weekly_summary') === 'workflow_subtype_weekly_summary' ? 'Weekly' : t('workflow_subtype_weekly_summary'), color: '#8b5cf6', icon: GitBranch, active: docSubtype === 'WEEKLY', onClick: () => setDocSubtype(docSubtype === 'WEEKLY' ? 'all' : 'WEEKLY') },
    { key: 'APPROVED', label: t('workflow.status.approved') || 'Approved', color: '#22c55e', icon: CheckCircle, active: docStatus === 'APPROVED', onClick: () => setDocStatus(docStatus === 'APPROVED' ? 'all' : 'APPROVED') },
    { key: 'REJECTED', label: t('workflow.status.rejected') || 'Rejected', color: '#ef4444', icon: XCircle, active: docStatus === 'REJECTED', onClick: () => setDocStatus(docStatus === 'REJECTED' ? 'all' : 'REJECTED') },
    { key: 'PDF', label: 'PDF', color: '#dc2626', icon: FileText, active: docFormat === 'PDF', onClick: () => setDocFormat(docFormat === 'PDF' ? 'all' : 'PDF') },
    { key: 'EXCEL', label: 'EXCEL', color: '#16a34a', icon: FileSpreadsheet, active: docFormat === 'EXCEL', onClick: () => setDocFormat(docFormat === 'EXCEL' ? 'all' : 'EXCEL') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
          color: isDark ? '#e2e8f0' : '#334155',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          margin: '12px 16px 4px',
          width: 'fit-content',
        }}
        data-testid="class-documents-toggle"
      >
        <span>{className}</span>
        <span style={{ padding: '2px 8px', borderRadius: '999px', background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: isDark ? '#94a3b8' : '#64748b', fontSize: '13px', fontWeight: 700 }}>
          {count}
        </span>
        {getThemedIcon('ui', expanded ? 'chevron_up' : 'chevron_down', 20, theme)}
      </button>
      {expanded && (
        <>
          {date && <DayFilterBanner date={date} lang={lang} t={t} isDark={isDark} />}
          <ClassHistorySearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search') || 'Search...'}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 16px', alignItems: 'center' }}>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: `1px solid ${chip.active ? chip.color : (isDark ? '#334155' : '#e2e8f0')}`,
                  background: chip.active ? `${chip.color}15` : 'transparent',
                  color: chip.active ? chip.color : (isDark ? '#94a3b8' : '#64748b'),
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {chip.icon && <chip.icon size={12} color={chip.active ? chip.color : (isDark ? '#94a3b8' : '#64748b')} />}
                {chip.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <ExportHistoryDrawer
              isOpen
              onClose={onClose}
              lang={lang}
              t={t}
              theme={theme}
              classId={classId}
              classInfo={classInfo}
              date={date}
              scope="class"
              embedded
              minimal
              search={search}
              onSearchChange={setSearch}
              typeFilter={exportType}
              onTypeFilterChange={setDocSubtype}
              formatFilter={docFormat}
              onFormatFilterChange={setDocFormat}
              statusFilter={docStatus}
              onStatusFilterChange={setDocStatus}
              onVisibleCount={setExportCount}
            />
          </div>
        </>
      )}
    </div>
  );
};

const ClassActivityPanel = ({ list = [], comments = [], attendanceNotes = [], loading, t, lang, isDark, canViewNotes = true, studentFilter, isCardMode, date }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const activityItems = useMemo(() => {
    let data = [];
    if (studentFilter?.id) {
      data = list.filter((p) => String(p.userId) === String(studentFilter.id) || String(p.studentId) === String(studentFilter.id));
    } else {
      data = list;
    }

    const visibleComments = canViewNotes ? comments : comments.filter((c) => c.action !== 'NOTE');

    const noteRecords = canViewNotes
      ? (studentFilter?.id
          ? attendanceNotes.filter((r) => String(r.userId) === String(studentFilter.id))
          : attendanceNotes)
      : [];

    const mapped = [
      ...data.map((p) => ({
        id: p.id,
        type: 'participation',
        user: p.creator || p.user,
        recipient: p.user,
        text: p.descriptionEn || p.descriptionAr || p.description || p.notes || p.comment || t('operations_board_participation') || 'Participation',
        timestamp: p.createdAt,
        color: BOARD_PARTICIPATION_COLOR,
        label: t('operations_board_participation') || 'Participation',
      })),
      ...visibleComments.map((c) => {
        const isNote = c.action === 'NOTE';
        return {
          id: c.id || `comment-${(c.createdAt || c.timestamp || '').toString().replace(/\D/g, '')}`,
          type: isNote ? 'note' : 'comment',
          user: c.author || c.changedByUser || c.actor,
          recipient: c.student || c.user || c.workflow?.metadata?.student || c.workflow?.metadata?.studentName || null,
          text: c.comment || c.text || c.notes || c.status || '',
          timestamp: c.createdAt || c.timestamp,
          color: isNote ? '#ef4444' : BOARD_COMMENT_COLOR,
          label: isNote ? (t('note') || 'Note') : (t('comment') || 'Comment'),
        };
      }),
      ...noteRecords.map((r) => ({
        id: `note-${r.id}`,
        type: 'note',
        user: r.updater || r.creator,
        recipient: r.user,
        text: r.notes,
        timestamp: r.updatedAt || r.createdAt,
        color: '#ef4444',
        label: t('note') || 'Note',
      })),
    ];

    const withText = mapped.filter((item) => (item.text || '').trim());
    const term = (searchTerm || '').toLowerCase().trim();
    if (!term) return withText.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return withText.filter((item) => {
      const name = getLocalizedUserName(item.user, lang, '').toLowerCase();
      const text = (item.text || '').toLowerCase();
      const label = (item.label || '').toLowerCase();
      return name.includes(term) || text.includes(term) || label.includes(term);
    }).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [list, comments, attendanceNotes, canViewNotes, studentFilter, searchTerm, lang, t]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b' }}>
        {t('loading') || 'Loading...'}
      </div>
    );
  }

  return (
    <div style={{ padding: '12px' }}>
      {date && <DayFilterBanner date={date} lang={lang} t={t} isDark={isDark} />}
      <ClassHistorySearchInput
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t('search') || 'Search...'}
      />
      {activityItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {getThemedIcon('ui', 'inbox', 40, isDark ? 'inverse' : 'primary')}
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            {isCardMode
              ? (t('class_history_no_card_comments') || 'No notes or comments for this record')
              : (t('class_history_no_class_comments') || 'No activity for this class/day')}
          </p>
        </div>
      )}
      <DateGroupedList
        items={activityItems}
        filterDefs={[
          { id: 'all', label: t('all') || 'All', color: '#6b7280', match: () => true },
          { id: 'participation', label: t('operations_board_participation') || 'Participation', color: BOARD_PARTICIPATION_COLOR, match: (item) => item.type === 'participation' },
          { id: 'comment', label: t('comment') || 'Comment', color: BOARD_COMMENT_COLOR, match: (item) => item.type === 'comment' },
          ...(canViewNotes ? [{ id: 'note', label: t('note') || 'Note', color: '#ef4444', match: (item) => item.type === 'note' }] : []),
        ]}
        renderItem={(item) => {
          const author = item.user;
          const name = getLocalizedUserName(author, lang, author?.email || t('operations_board_unknown_user'));
          const at = item.timestamp;
          const Icon = item.type === 'participation' || item.type === 'note' ? Star : MessageSquare;
          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={12} color={item.color} fill={item.color} />
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: item.color }}>
                    {item.label}
                  </span>
                </div>
                {at && (
                  <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>
                    {formatDateTime(at, lang)}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ transform: 'scale(0.72)', transformOrigin: 'center', flexShrink: 0, lineHeight: 0 }}>
                  <DriveUserAvatar user={author} displayName={name} size="sm" showRoleBadge={false} />
                </span>
                <RoleBadge user={author} size={10} showLabel={false} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{name}</span>
                {item.recipient && (
                  <>
                    <span style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>→</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#e2e8f0' : '#334155' }}>
                      {getLocalizedUserName(item.recipient, lang, item.recipient?.email || '')}
                    </span>
                  </>
                )}
              </div>
              <div style={{ fontSize: '13px', color: isDark ? '#cbd5e1' : '#475569', wordBreak: 'break-word' }}>
                {item.text}
              </div>
            </div>
          );
        }}
        isDark={isDark}
        t={t}
      />
    </div>
  );
};

const ClassParticipationPanel = ({ list, loading, studentFilter, t, lang, isDark }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const displayList = useMemo(() => {
    let data = studentFilter?.id
      ? list.filter((p) => String(p.userId) === String(studentFilter.id) || String(p.studentId) === String(studentFilter.id))
      : list;
    const term = (searchTerm || '').toLowerCase().trim();
    if (term) {
      data = data.filter((p) => {
        const creator = p.creator || p.user;
        const name = getLocalizedUserName(creator, lang).toLowerCase();
        const text = (p.descriptionEn || p.descriptionAr || p.description || p.notes || p.comment || t('operations_board_participation') || '').toLowerCase();
        return name.includes(term) || text.includes(term);
      });
    }
    return data;
  }, [list, studentFilter, searchTerm, lang, t]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b' }}>
        {t('loading') || 'Loading...'}
      </div>
    );
  }

  return (
    <div style={{ padding: '12px' }}>
      <ClassHistorySearchInput
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t('search') || 'Search...'}
      />
      {displayList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {getThemedIcon('ui', 'inbox', 40, isDark ? 'inverse' : 'primary')}
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            {t('class_history_no_participation') || 'No participation recorded for this class/day'}
          </p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayList.map((p) => {
          const creator = p.creator || p.user;
          const name = getLocalizedUserName(creator, lang);
          const text = p.descriptionEn || p.descriptionAr || p.description || p.notes || p.comment || t('operations_board_participation');
          const at = p.createdAt || p.timestamp;
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
              }}
            >
              <span style={{ transform: 'scale(0.72)', transformOrigin: 'center', flexShrink: 0, lineHeight: 0 }}>
                <DriveUserAvatar user={creator} displayName={name} size="sm" showRoleBadge={false} />
              </span>
              <RoleBadge user={creator} size={10} showLabel={false} style={{ marginLeft: '4px' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{name}</span>
                  {at && (
                    <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                      {formatDateTime(at, lang)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: BOARD_PARTICIPATION_COLOR, flexShrink: 0, marginTop: '5px' }} />
                  <span style={{ fontSize: '13px', color: isDark ? '#e2e8f0' : '#334155', wordBreak: 'break-word' }}>{text}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ClassCommentsPanel = ({ comments, loading, t, lang, isDark, isCardMode, canViewNotes = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const displayedComments = useMemo(() => {
    const visibleComments = canViewNotes ? comments : comments.filter((c) => c.action !== 'NOTE');
    const term = (searchTerm || '').toLowerCase().trim();
    if (!term) return visibleComments;
    return visibleComments.filter((c) => {
      const author = c.author || c.changedByUser || c.actor;
      const name = (typeof author === 'object' ? getLocalizedUserName(author, lang) : (author || t('operations_board_unknown_user'))).toLowerCase();
      const text = (c.comment || c.text || c.notes || '').toLowerCase();
      return name.includes(term) || text.includes(term);
    });
  }, [comments, searchTerm, lang, t, canViewNotes]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b' }}>
        {t('loading') || 'Loading...'}
      </div>
    );
  }

  return (
    <div style={{ padding: '12px' }}>
      <ClassHistorySearchInput
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t('search') || 'Search...'}
      />
      {displayedComments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {getThemedIcon('ui', 'inbox', 40, isDark ? 'inverse' : 'primary')}
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            {isCardMode
              ? (t('class_history_no_card_comments') || 'No comments or notes for this record')
              : (t('class_history_no_class_comments') || 'No workflow comments for this class/day')}
          </p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayedComments.map((c, idx) => {
          const author = c.author || c.changedByUser || c.actor;
          const name = typeof author === 'object' ? getLocalizedUserName(author, lang) : (author || t('operations_board_unknown_user'));
          const isNote = c.action === 'NOTE';
          const dotColor = isNote ? '#f59e0b' : 'var(--color-primary, #3b82f6)';
          const at = c.createdAt || c.timestamp;
          return (
            <div
              key={c.id || `comment-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
              }}
            >
              <span style={{ transform: 'scale(0.72)', transformOrigin: 'center', flexShrink: 0, lineHeight: 0 }}>
                <DriveUserAvatar user={author} displayName={name} size="sm" showRoleBadge={false} />
              </span>
              <RoleBadge user={author} size={10} showLabel={false} style={{ marginLeft: '4px' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{name}</span>
                  <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {isNote ? (t('operations_board_note') || 'Note') : (t('operations_board_comment') || 'Comment')}
                  </span>
                  {at && (
                    <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                      {formatDateTime(at, lang)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: '5px' }} />
                  <span style={{ fontSize: '13px', color: isDark ? '#e2e8f0' : '#334155', wordBreak: 'break-word' }}>
                    {c.comment || c.text || c.notes || ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default ClassHistoryDrawer;
