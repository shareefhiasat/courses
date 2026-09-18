import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Joyride from 'react-joyride';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import {
  Users, Layers, BookOpen, GraduationCap, DoorOpen, Eye, Shield, Plus, Trash2,
  Sparkles, ChevronRight, Save, Search, GitBranch, ClipboardList, Calendar, MessageSquare,
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { usePermissions } from '@hooks/usePermissions';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { Button, useToast, CategorySelect, Select, DeleteModal, MultiSelect } from '@ui';
import { useDeleteModal } from '@hooks/useDeleteModal.js';
import userCategoryAccessService from '@services/business/userCategoryAccessService.js';
import userDataScopeService from '@services/business/userDataScopeService.js';
import { getAccessScopeCategories } from '@services/business/categoryService.js';
import { getAllUsers, getUserRoles } from '@services/business/userService.js';
import { getAllPrograms } from '@services/business/programService.js';
import { getAllSubjects } from '@services/business/subjectService.js';
import { getAllClasses } from '@services/business/classService.js';
import { getAllClassrooms } from '@services/business/classroomService.js';
import { getUserDisplayName } from '@services/business/authService';
import { createDM } from '@services/business/chatService.js';
import AvatarWithRoleBadge from '@pages/communications/chat/components/AvatarWithRoleBadge.jsx';
import RoleBadge from '@pages/communications/chat/components/RoleBadge.jsx';
import { resolveUserRole, ROLE_STRINGS } from '@utils/userUtils';
import { scheduleTourStart, registerPageTour, registerTourAvailability, notifyPageTourFinished, requestTourStart, releaseTour } from '@utils/tourScheduler';
import { getIconWithColor, getUserRoleColor } from '@constants/iconTypes';
import {
  sortSubjectsByCode,
  sortClassesForSelect,
  getProgramOptionLabel,
  getSubjectOptionLabel,
  getClassOptionLabel,
  getProgramSubtextLines,
  getSubjectSubtextLines,
  getClassSubtextLines,
} from '@utils/academicSelectOptions.js';

const isUserSuperAdmin = (u) => {
  const roles = getUserRoles(u);
  return roles.includes(ROLE_STRINGS.SUPER_ADMIN) || u?.isSuperAdmin;
};

const MODES = ['UCA', 'ALL', 'EXPLICIT'];

const DIMENSIONS = [
  { key: 'programs', labelKey: 'programs', modeField: 'programsMode', grantKey: 'programIds', icon: Layers, accent: '#2563eb' },
  { key: 'subjects', labelKey: 'subjects', modeField: 'subjectsMode', grantKey: 'subjectIds', icon: BookOpen, accent: '#7c3aed' },
  { key: 'classes', labelKey: 'scope_classes', modeField: 'classesMode', grantKey: 'classIds', icon: GraduationCap, accent: '#059669' },
  { key: 'instructors', labelKey: 'instructors', modeField: 'instructorsMode', grantKey: 'instructorIds', icon: Users, accent: '#dc2626' },
  { key: 'rooms', labelKey: 'rooms', modeField: 'roomsMode', grantKey: 'roomIds', icon: DoorOpen, accent: '#d97706' },
];

const ROLE_CHIPS = [
  { key: 'all', labelKey: 'chat_all', icon: null, color: null },
  { key: 'super_admin', labelKey: 'role_label_super_admin', icon: 'super_admin', colorKey: 'super_admin' },
  { key: 'hr', labelKey: 'chat_filter_hr', icon: 'hr', colorKey: 'hr' },
  { key: 'admin', labelKey: 'chat_filter_admins', icon: 'admin', colorKey: 'admin' },
  { key: 'instructor', labelKey: 'chat_filter_instructors', icon: 'instructor', colorKey: 'instructor' },
];

function StatChip({ icon: Icon, label, value, color }) {
  if (!value) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 'var(--font-size-xs)', padding: '2px 8px', borderRadius: 999,
      background: `${color}12`, color, border: `1px solid ${color}40`, fontWeight: 600,
    }}>
      <Icon size={11} />
      {value} {label}
    </span>
  );
}

function UserAccessStudio() {
  const { user, isSuperAdmin } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const { canAccessScreen } = usePermissions();
  const toast = useToast();
  const { deleteModal, deleteEntity, handleDeleteConfirm, hideDeleteModal } = useDeleteModal(t);

  const canUseChat = canAccessScreen('chat');
  const selfUserIds = useMemo(
    () => [user?.dbId, user?.uid, user?.id].filter(Boolean).map(String),
    [user],
  );

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const muted = isDark ? '#9ca3af' : '#6b7280';
  const text = isDark ? '#f3f4f6' : '#111827';

  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `userAccessStudioTourSeen_${lang}`;

  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [accesses, setAccesses] = useState([]);
  const [ucaStats, setUcaStats] = useState({});
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(null);
  const [activePanel, setActivePanel] = useState('boundary');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    programsMode: 'UCA', subjectsMode: 'UCA', classesMode: 'UCA',
    instructorsMode: 'ALL', roomsMode: 'ALL', notes: '',
  });
  const [grants, setGrants] = useState({
    programIds: [], subjectIds: [], classIds: [], instructorIds: [], roomIds: [],
  });
  const [ucaForm, setUcaForm] = useState({
    categoryId: '', programId: '', subjectId: '', classId: '',
  });
  const [showUserDrawer, setShowUserDrawer] = useState(false);

  const modeLabel = useCallback((mode) => {
    if (mode === 'ALL') return t('scope_mode_all');
    if (mode === 'EXPLICIT') return t('scope_mode_pick');
    return t('scope_mode_uca');
  }, [t]);

  const localizedName = useCallback((entity) => {
    if (!entity) return '—';
    return lang === 'ar'
      ? (entity.nameAr || entity.nameEn || entity.name || entity.code)
      : (entity.nameEn || entity.nameAr || entity.name || entity.code);
  }, [lang]);

  const scopedUsers = useMemo(() => users.filter((u) => {
    const roles = getUserRoles(u);
    return roles.includes('admin') || roles.includes('hr') || roles.includes('instructor') || roles.includes('super_admin');
  }), [users]);

  const filteredUsers = useMemo(() => {
    let list = scopedUsers;
    if (roleFilter) {
      list = list.filter((u) => resolveUserRole(u) === roleFilter);
    }
    const q = userSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => {
      const name = getUserDisplayName(u, [], lang).toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q) || String(u.id).includes(q);
    });
  }, [scopedUsers, userSearch, lang, roleFilter]);

  const selectedUser = useMemo(
    () => scopedUsers.find((u) => String(u.id) === String(selectedUserId)),
    [scopedUsers, selectedUserId],
  );

  const selectedIsSuperAdmin = useMemo(
    () => Boolean(selectedUser && isUserSuperAdmin(selectedUser)),
    [selectedUser],
  );

  const userAccesses = useMemo(
    () => accesses.filter((a) => String(a.userId) === String(selectedUserId)),
    [accesses, selectedUserId],
  );

  const buildTourSteps = useCallback(() => [
    { target: '[data-tour="access-studio-header"]', content: t('tour.access_studio_header'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="access-studio-user-picker"]', content: t('tour.access_studio_user_picker'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="access-studio-panels"]', content: t('tour.access_studio_panels'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="access-studio-boundary"]', content: t('tour.access_studio_boundary'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="access-studio-uca-list"]', content: t('tour.access_studio_uca_list'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="access-studio-lens"]', content: t('tour.access_studio_lens'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="access-studio-preview"]', content: t('tour.access_studio_preview'), disableBeacon: true, placement: 'top' },
  ].filter((s) => !!document.querySelector(s.target)), [t]);

  const getTourStepCount = useCallback(() => buildTourSteps().length, [buildTourSteps]);

  const startTour = useCallback(() => {
    const steps = buildTourSteps();
    if (!steps.length) return;
    requestTourStart('user-access-studio', () => {
      setTourSteps(steps);
      setRunTour(true);
    });
  }, [buildTourSteps]);

  useEffect(() => registerPageTour('user-access-studio', startTour, getTourStepCount), [startTour, getTourStepCount]);

  useEffect(() => registerTourAvailability('user-access-studio', {
    tourSeenKey: (l) => `userAccessStudioTourSeen_${l}`,
    getStepCount: getTourStepCount,
  }), [getTourStepCount]);

  useEffect(() => scheduleTourStart(tourSeenKey, lang, startTour), [tourSeenKey, lang, startTour]);

  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunTour(false);
      try { localStorage.setItem(tourSeenKey, 'true'); } catch { /* ignore */ }
      releaseTour('user-access-studio');
      notifyPageTourFinished({ id: 'user-access-studio' });
    }
  }, [tourSeenKey]);

  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);

  const loadReferenceData = useCallback(async () => {
    const [u, p, s, cl, cr] = await Promise.all([
      getAllUsers(), getAllPrograms(), getAllSubjects(), getAllClasses(), getAllClassrooms(),
    ]);
    if (u.success) setUsers(u.data || []);
    if (p.success) {
      setPrograms(p.data || []);
      const programCategoryIds = [...new Set((p.data || []).map((prog) => prog.categoryId).filter(Boolean))];
      const c = await getAccessScopeCategories({ programCategoryIds });
      if (c.success) setCategories(c.data || []);
    }
    if (s.success) setSubjects(s.data || []);
    if (cl.success) setClasses(cl.data || []);
    if (cr.success) setClassrooms(cr.data || []);
  }, []);

  const loadAccesses = useCallback(async () => {
    const result = await userCategoryAccessService.getAllUserCategoryAccesses(
      selectedUserId ? { userId: selectedUserId } : {},
    );
    if (result.success) setAccesses(result.data || []);
  }, [selectedUserId]);

  const loadUcaStats = useCallback(async () => {
    if (!selectedUserId) {
      setUcaStats({});
      return;
    }
    const result = await userCategoryAccessService.getUcaActivityStats(selectedUserId);
    if (result.success) {
      const map = {};
      (result.data || []).forEach((row) => { map[row.accessId] = row; });
      setUcaStats(map);
    }
  }, [selectedUserId]);

  const loadVisibility = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const result = await userDataScopeService.getUserDataScope(selectedUserId);
      if (result.success && result.data) {
        const { profile: p, grants: g } = result.data;
        setProfile({
          programsMode: p.programsMode || 'UCA',
          subjectsMode: p.subjectsMode || 'UCA',
          classesMode: p.classesMode || 'UCA',
          instructorsMode: p.instructorsMode || 'ALL',
          roomsMode: p.roomsMode || 'ALL',
          notes: p.notes || '',
        });
        setGrants({
          programIds: (g.programs || []).map((x) => x.programId),
          subjectIds: (g.subjects || []).map((x) => x.subjectId),
          classIds: (g.classes || []).map((x) => x.classId),
          instructorIds: (g.instructors || []).map((x) => x.instructorUserId),
          roomIds: (g.rooms || []).map((x) => x.classroomId),
        });
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, toast]);

  useEffect(() => { loadReferenceData(); }, [loadReferenceData]);
  useEffect(() => { loadAccesses(); loadUcaStats(); }, [loadAccesses, loadUcaStats]);
  useEffect(() => { loadVisibility(); }, [loadVisibility]);

  useEffect(() => {
    if (!selectedUserId && filteredUsers.length) {
      setSelectedUserId(String(filteredUsers[0].id));
    }
  }, [filteredUsers, selectedUserId]);

  const instructorOptions = useMemo(() => scopedUsers
    .filter((u) => getUserRoles(u).includes('instructor'))
    .map((u) => ({ value: u.id, label: getUserDisplayName(u, [], lang) })),
  [scopedUsers, lang]);

  const grantOptions = useMemo(() => ({
    programIds: programs.map((p) => ({ value: p.id, label: localizedName(p) })),
    subjectIds: subjects.map((s) => ({ value: s.id, label: localizedName(s) })),
    classIds: classes.map((c) => ({ value: c.id, label: localizedName(c) })),
    instructorIds: instructorOptions,
    roomIds: classrooms.map((r) => ({ value: r.id, label: `${r.code} — ${localizedName(r)}` })),
  }), [programs, subjects, classes, instructorOptions, classrooms, localizedName]);

  const filteredSubjectsForForm = useMemo(() => {
    if (!ucaForm.programId) return subjects;
    return subjects.filter((s) => s.programId === parseInt(ucaForm.programId, 10));
  }, [subjects, ucaForm.programId]);

  const filteredClassesForForm = useMemo(() => {
    let list = classes;
    if (ucaForm.programId) list = list.filter((c) => c.programId === parseInt(ucaForm.programId, 10));
    if (ucaForm.subjectId) list = list.filter((c) => c.subjectId === parseInt(ucaForm.subjectId, 10));
    return list;
  }, [classes, ucaForm.programId, ucaForm.subjectId]);

  const programOptions = useMemo(() => [
    { value: '', label: t('access_studio_program_placeholder'), displayLabel: t('access_studio_program_placeholder') },
    ...programs.map((p) => ({
      value: String(p.id),
      label: getProgramOptionLabel(p, lang),
      displayLabel: getProgramOptionLabel(p, lang),
      subtext: getProgramSubtextLines(p, lang, t, { classes, subjects }),
    })),
  ], [programs, classes, subjects, lang, t]);

  const subjectOptions = useMemo(() => [
    { value: '', label: t('access_studio_subject_placeholder'), displayLabel: t('access_studio_subject_placeholder') },
    ...sortSubjectsByCode(filteredSubjectsForForm).map((s) => ({
      value: String(s.id),
      label: getSubjectOptionLabel(s, lang),
      displayLabel: getSubjectOptionLabel(s, lang),
      subtext: getSubjectSubtextLines(s, lang, t, { classes }),
    })),
  ], [filteredSubjectsForForm, classes, lang, t]);

  const classOptions = useMemo(() => [
    { value: '', label: t('access_studio_class_placeholder'), displayLabel: t('access_studio_class_placeholder') },
    ...sortClassesForSelect(filteredClassesForForm, lang).map((c) => ({
      value: String(c.id),
      label: getClassOptionLabel(c, lang),
      displayLabel: getClassOptionLabel(c, lang),
      subtext: getClassSubtextLines(c, lang, t),
    })),
  ], [filteredClassesForForm, lang, t]);

  const handleSaveVisibility = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const result = await userDataScopeService.saveUserDataScope(selectedUserId, { profile, grants });
      if (result.success) {
        toast.success(t('scope_saved'));
        loadVisibility();
      } else {
        toast.error(result.error || t('failed_to_save_access'));
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddUca = async () => {
    if (!selectedUserId || !ucaForm.categoryId) {
      toast.error(t('access_studio_category_required'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        userId: parseInt(selectedUserId, 10),
        categoryId: parseInt(ucaForm.categoryId, 10),
        programId: ucaForm.programId ? parseInt(ucaForm.programId, 10) : null,
        subjectId: ucaForm.subjectId ? parseInt(ucaForm.subjectId, 10) : null,
        classId: ucaForm.classId ? parseInt(ucaForm.classId, 10) : null,
        createdBy: user.dbId,
      };
      const result = await userCategoryAccessService.createUserCategoryAccess(payload);
      if (result.success) {
        toast.success(t('access_created'));
        setUcaForm({ categoryId: '', programId: '', subjectId: '', classId: '' });
        loadAccesses();
        loadUcaStats();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleMessageUser = useCallback(async (targetUser, e) => {
    e?.stopPropagation?.();
    if (!canUseChat || !targetUser?.id) return;
    if (selfUserIds.includes(String(targetUser.id))) return;
    try {
      const result = await createDM(targetUser.id);
      if (result.success && result.data?.id) {
        window.open(`/chat?dest=dm:${result.data.id}`, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(t('chat_dm_failed'));
      }
    } catch (err) {
      toast.error(`${t('chat_dm_failed')}: ${err.message}`);
    }
  }, [canUseChat, selfUserIds, toast, t]);

  const handleSelectUser = useCallback((userId) => {
    setSelectedUserId(String(userId));
    setShowUserDrawer(false);
  }, []);

  const renderUserRow = (u) => {
    const active = String(u.id) === String(selectedUserId);
    const ucaCount = accesses.filter((a) => String(a.userId) === String(u.id)).length;
    const showDm = canUseChat && !selfUserIds.includes(String(u.id));
    return (
      <div
        key={u.id}
        role="button"
        tabIndex={0}
        onClick={() => handleSelectUser(u.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectUser(u.id); }}
        style={{
          width: '100%', textAlign: 'start', padding: '0.65rem 0.75rem', marginBottom: 4,
          borderRadius: 10, border: active ? '2px solid var(--color-primary,#800020)' : `1px solid ${border}`,
          background: active ? (isDark ? '#374151' : '#fef2f2') : 'transparent',
          cursor: 'pointer', color: text, display: 'flex', gap: 10, alignItems: 'center',
        }}
      >
        <AvatarWithRoleBadge user={u} size={36} badgeSize={14} iconSize={8} t={t} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <RoleBadge user={u} size={10} showLabel />
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getUserDisplayName(u, [], lang)}
            </span>
          </div>
          {u.email && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {u.email}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
            {(u._count?.enrollments !== undefined) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: muted, background: isDark ? '#1f2937' : '#f3f4f6', padding: '1px 8px', borderRadius: 10, border: `1px solid ${border}` }}>
                <GraduationCap size={10} />
                {u._count.enrollments} {t('classes')}
              </span>
            )}
            {(u._count?.chatRoomParticipations !== undefined) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: muted, background: isDark ? '#1f2937' : '#f3f4f6', padding: '1px 8px', borderRadius: 10, border: `1px solid ${border}` }}>
                <MessageSquare size={10} />
                {u._count.chatRoomParticipations} {t('groups')}
              </span>
            )}
            {ucaCount > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: muted, background: isDark ? '#1f2937' : '#f3f4f6', padding: '1px 8px', borderRadius: 10, border: `1px solid ${border}` }}>
                <Shield size={10} />
                {ucaCount} {t('access_rows')}
              </span>
            )}
          </div>
        </div>
        {showDm && (
          <ColoredTooltip title={t('message_user')}>
            <button
              type="button"
              aria-label={t('message_user')}
              onClick={(e) => handleMessageUser(u, e)}
              style={{
                flexShrink: 0, border: `1px solid ${border}`, borderRadius: 8,
                background: isDark ? '#111827' : '#fff', padding: '6px 8px', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', color: 'var(--color-primary,#800020)',
              }}
            >
              <MessageSquare size={14} />
            </button>
          </ColoredTooltip>
        )}
      </div>
    );
  };

  const handleDeleteUca = async (row) => {
    setSaving(true);
    try {
      const result = await userCategoryAccessService.deleteUserCategoryAccess(row.id);
      if (result.success) {
        toast.success(t('access_deleted'));
        loadAccesses();
        loadUcaStats();
      }
    } finally {
      setSaving(false);
    }
  };

  const previewText = useMemo(() => {
    if (!selectedUser) return '';
    if (selectedIsSuperAdmin) return t('access_studio_super_admin_preview');
    const parts = DIMENSIONS.map((d) => `${t(d.labelKey)}: ${modeLabel(profile[d.modeField])}`);
    return `${getUserDisplayName(selectedUser, [], lang)} · ${t('uca_rows_count', { count: userAccesses.length })} · ${parts.join(' · ')}`;
  }, [selectedUser, selectedIsSuperAdmin, profile, userAccesses, t, lang, modeLabel]);

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: text }}>
        <Shield size={40} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
        <div>{t('super_admin_required')}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '70vh' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <Joyride
        continuous
        run={runTour && tourSteps.length > 0}
        steps={tourSteps}
        callback={handleTourCallback}
        scrollOffset={100}
        scrollToFirstStep
        showSkipButton
        showProgress
        tooltipComponent={TourTooltipComponent}
        locale={{
          back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'),
          next: t('tour_next'), skip: t('tour_skip'),
        }}
        styles={{
          options: {
            primaryColor: 'var(--color-primary,#800020)',
            textColor: isDark ? '#e5e7eb' : '#111',
            backgroundColor: isDark ? '#1f2937' : '#fff',
            zIndex: 10000,
          },
        }}
      />

      <div
        data-tour="access-studio-header"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap',
          padding: '0.75rem 1rem', borderRadius: 12,
          background: isDark ? 'linear-gradient(135deg,#1e3a5f,#1f2937)' : 'linear-gradient(135deg,#eff6ff,#fdf2f8)',
          border: `1px solid ${border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <Sparkles size={22} color="var(--color-primary,#800020)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: text }}>
              {t('user_access_studio')}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: muted }}>
              {t('user_access_studio_sub')}
            </div>
          </div>
        </div>
        <button
          type="button"
          data-tour="access-studio-user-picker"
          onClick={() => setShowUserDrawer(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
            padding: '0.5rem 0.85rem', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${border}`, background: cardBg, color: text, maxWidth: 320,
          }}
        >
          {selectedUser ? (
            <>
              <AvatarWithRoleBadge user={selectedUser} size={28} badgeSize={12} iconSize={7} t={t} />
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getUserDisplayName(selectedUser, [], lang)}
              </span>
              <RoleBadge user={selectedUser} size={9} />
            </>
          ) : (
            <>
              <Users size={18} color="var(--color-primary,#800020)" />
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{t('access_studio_select_user')}</span>
            </>
          )}
        </button>
      </div>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {selectedIsSuperAdmin && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: 10,
              background: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.08)',
              border: `1px solid ${isDark ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.25)'}`,
              color: text, fontSize: 'var(--font-size-sm)', display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <Shield size={18} color="#8b5cf6" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>{t('access_studio_super_admin_title')}</strong>
                <div style={{ color: muted, marginTop: 4 }}>{t('access_studio_super_admin_notice')}</div>
              </div>
            </div>
          )}

          <div data-tour="access-studio-panels" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'boundary', label: t('academic_boundary'), icon: Shield, tour: 'access-studio-boundary' },
              { id: 'lens', label: t('visibility_lens'), icon: Eye, tour: 'access-studio-lens' },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActivePanel(id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '0.45rem 0.85rem', borderRadius: 999, cursor: 'pointer',
                  border: activePanel === id ? '2px solid var(--color-primary,#800020)' : `1px solid ${border}`,
                  background: activePanel === id ? (isDark ? '#374151' : '#fff1f2') : cardBg,
                  color: text, fontWeight: activePanel === id ? 600 : 400,
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {activePanel === 'boundary' && (
            <div data-tour="access-studio-boundary" style={{
              background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: '1rem',
              opacity: selectedIsSuperAdmin ? 0.55 : 1, pointerEvents: selectedIsSuperAdmin ? 'none' : 'auto',
            }}>
              <p style={{ color: muted, fontSize: 'var(--font-size-sm)', marginTop: 0 }}>
                {t('uca_boundary_help')}
              </p>
              <p style={{ color: muted, fontSize: 'var(--font-size-xs)', marginTop: 0, marginBottom: '0.75rem' }}>
                {t('category_purpose_help')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <CategorySelect
                  categories={categories}
                  value={ucaForm.categoryId}
                  onChange={(e) => setUcaForm({ ...ucaForm, categoryId: e.target.value, programId: '', subjectId: '', classId: '' })}
                  theme={theme}
                  placeholder={t('access_studio_category_placeholder')}
                  disabled={selectedIsSuperAdmin}
                  purpose="access"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
                  <Select
                    value={ucaForm.programId}
                    onChange={(e) => {
                      const val = e?.value ?? e?.target?.value ?? e ?? '';
                      setUcaForm({ ...ucaForm, programId: val, subjectId: '', classId: '' });
                    }}
                    options={programOptions}
                    placeholder={t('access_studio_program_placeholder')}
                    disabled={selectedIsSuperAdmin}
                  />
                  <Select
                    value={ucaForm.subjectId}
                    onChange={(e) => {
                      const val = e?.value ?? e?.target?.value ?? e ?? '';
                      setUcaForm({ ...ucaForm, subjectId: val, classId: '' });
                    }}
                    options={subjectOptions}
                    placeholder={t('access_studio_subject_placeholder')}
                    disabled={selectedIsSuperAdmin || !ucaForm.programId}
                  />
                  <Select
                    value={ucaForm.classId}
                    onChange={(e) => {
                      const val = e?.value ?? e?.target?.value ?? e ?? '';
                      setUcaForm({ ...ucaForm, classId: val });
                    }}
                    options={classOptions}
                    placeholder={t('access_studio_class_placeholder')}
                    disabled={selectedIsSuperAdmin || (!ucaForm.subjectId && !ucaForm.programId)}
                  />
                </div>
              </div>
              <Button type="button" onClick={handleAddUca} disabled={saving || !selectedUserId || selectedIsSuperAdmin} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                <Plus size={16} style={{ flexShrink: 0 }} /> {t('add_access_row')}
              </Button>

              <div data-tour="access-studio-uca-list" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {userAccesses.length === 0 && (
                  <div style={{ color: muted, fontSize: 'var(--font-size-sm)', padding: '1rem', textAlign: 'center' }}>
                    {t('no_uca_rows')}
                  </div>
                )}
                {userAccesses.map((row) => {
                  const stats = ucaStats[row.id] || {};
                  const path = [localizedName(row.category), localizedName(row.program), localizedName(row.subject), localizedName(row.class)]
                    .filter((x) => x && x !== '—')
                    .join(' → ') || localizedName(row.category);
                  return (
                    <div key={row.id} style={{
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
                      padding: '0.65rem 0.85rem', borderRadius: 10,
                      border: `1px solid ${border}`, background: isDark ? '#111827' : '#f9fafb',
                    }}>
                      <ChevronRight size={14} color={muted} />
                      <span style={{ flex: '1 1 200px', fontSize: 'var(--font-size-sm)', color: text, fontWeight: 500 }}>
                        {path}
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        <StatChip icon={GraduationCap} label={t('uca_stat_classes')} value={stats.classes} color="#059669" />
                        <StatChip icon={GitBranch} label={t('uca_stat_workflows')} value={stats.workflows} color="#7c3aed" />
                        <StatChip icon={ClipboardList} label={t('uca_stat_attendance')} value={stats.attendances} color="#2563eb" />
                        <StatChip icon={Calendar} label={t('uca_stat_sessions')} value={stats.sessions} color="#d97706" />
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteEntity('access', row, () => handleDeleteUca(row))} disabled={selectedIsSuperAdmin}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activePanel === 'lens' && (
            <div data-tour="access-studio-lens" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: selectedIsSuperAdmin ? 0.55 : 1, pointerEvents: selectedIsSuperAdmin ? 'none' : 'auto' }}>
              <p style={{ color: muted, fontSize: 'var(--font-size-sm)', margin: 0 }}>
                {t('visibility_lens_help')}
              </p>
              {DIMENSIONS.map((dim) => {
                const Icon = dim.icon;
                const mode = profile[dim.modeField];
                return (
                  <div key={dim.key} style={{
                    background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: '1rem',
                    borderInlineStart: `4px solid ${dim.accent}`,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={18} color={dim.accent} />
                        <span style={{ fontWeight: 600, color: text }}>
                          {t(dim.labelKey)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: mode === 'EXPLICIT' ? '0.75rem' : 0 }}>
                      {MODES.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setProfile((prev) => ({ ...prev, [dim.modeField]: m }))}
                          style={{
                            padding: '0.35rem 0.75rem', borderRadius: 999, cursor: 'pointer', fontSize: 'var(--font-size-xs)',
                            border: mode === m ? `2px solid ${dim.accent}` : `1px solid ${border}`,
                            background: mode === m ? (isDark ? '#374151' : `${dim.accent}14`) : 'transparent',
                            color: text, fontWeight: mode === m ? 600 : 400,
                          }}
                        >
                          {modeLabel(m)}
                        </button>
                      ))}
                      </div>
                    </div>
                    {mode === 'EXPLICIT' && (
                      <MultiSelect
                        options={grantOptions[dim.grantKey] || []}
                        value={grants[dim.grantKey] || []}
                        onChange={(vals) => setGrants((prev) => ({ ...prev, [dim.grantKey]: vals }))}
                        placeholder={t('pick_specific')}
                      />
                    )}
                  </div>
                );
              })}
              <Button type="button" onClick={handleSaveVisibility} disabled={saving || loading || !selectedUserId || selectedIsSuperAdmin}>
                <Save size={16} /> {t('save_visibility')}
              </Button>
            </div>
          )}
      </main>

      {showUserDrawer && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setShowUserDrawer(false)}
          role="presentation"
        >
          <div
            data-tour="access-studio-roster"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: 0, insetInlineEnd: 0, height: '100%', width: 'min(420px, 100vw)',
              background: cardBg, boxShadow: isRTL ? '4px 0 16px rgba(0,0,0,0.15)' : '-4px 0 16px rgba(0,0,0,0.15)',
              padding: '1rem', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 12 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', insetInlineStart: 10, top: 10, color: muted }} />
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('search_users')}
                  style={{
                    width: '100%', padding: '0.5rem 0.65rem', paddingInlineStart: '2rem', borderRadius: 8,
                    border: `1px solid ${border}`, background: isDark ? '#111827' : '#f9fafb', color: text,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowUserDrawer(false)}
                aria-label={t('close')}
                style={{ background: 'transparent', border: 'none', fontSize: 'var(--font-size-lg)', cursor: 'pointer', color: text, padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>
            <div data-tour="access-studio-role-filter" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {ROLE_CHIPS.map((chip) => {
                const isActive = (chip.key === 'all' && !roleFilter) || roleFilter === chip.key;
                const chipColor = chip.colorKey ? getUserRoleColor(chip.colorKey) : '#6b7280';
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setRoleFilter(chip.key === 'all' ? null : chip.key)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      padding: '3px 10px', borderRadius: 12, cursor: 'pointer',
                      border: `1px solid ${isActive ? chipColor : border}`,
                      background: isActive ? `${chipColor}15` : 'transparent',
                      color: isActive ? chipColor : text,
                      fontSize: 'var(--font-size-xs)', fontWeight: 600,
                    }}
                  >
                    {chip.icon && getIconWithColor('user_role', chip.icon, 12, isActive ? chipColor : muted)}
                    {t(chip.labelKey)}
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredUsers.map((u) => renderUserRow(u))}
            </div>
          </div>
        </div>
      )}

      <div
        data-tour="access-studio-preview"
        style={{
          position: 'sticky', bottom: 0, padding: '0.75rem 1rem', borderRadius: 12,
          background: isDark ? '#111827' : '#f0fdf4', border: `1px solid ${isDark ? '#374151' : '#bbf7d0'}`,
          fontSize: 'var(--font-size-sm)', color: text,
        }}
      >
        <strong>{t('effective_preview')}:</strong>{' '}
        {previewText || '—'}
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={hideDeleteModal}
        onConfirm={handleDeleteConfirm}
        entityName={deleteModal.entityName}
        loading={saving}
      />
    </div>
  );
}

export default UserAccessStudio;
