import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  subscribeToNotifications,
  archiveNotification,
  markNotificationUnread,
  deleteNotification
} from '../firebase/notifications';
import { useLang } from '../contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getPrograms, getSubjects } from '../firebase/programs';
import { getClasses } from '../firebase/firestore';
import { Bell, CheckCircle2, AlertTriangle, XCircle, Megaphone, FileText, BarChart3, Info, Search, Archive, Check, X, Filter, MoreVertical, Trash2, Eye, EyeOff, MessageCircle, Mail, UserCheck, ExternalLink } from 'lucide-react';
import { formatDateTime } from '../utils/date';
import { Button, Input, Select, Badge } from './ui';
import ToggleSwitch from './ToggleSwitch';
import { PENALTY_TYPES, ABSENCE_TYPES } from '../firebase/penalties';
import { ATTENDANCE_STATUS } from '../firebase/attendance';

const NotificationDrawer = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useLang();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, unread, read, archived
  const [filterCategory, setFilterCategory] = useState('all'); // all, activity, message, announcement, grade, etc.
  const [filterPenaltyType, setFilterPenaltyType] = useState('all');
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState('all');
  const [filterAbsenceType, setFilterAbsenceType] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const prevUnreadRef = useRef(0);
  const drawerRef = useRef(null);
  const { isRTL } = useLang();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!user || !isOpen) return () => {}; // Return empty cleanup function
    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
    }, true); // Always include archived, we'll filter in the component
    return unsubscribe || (() => {}); // Ensure we always return a function
  }, [user, isOpen]);

  // Load programs, subjects, classes for filters
  useEffect(() => {
    if (!isOpen) return;
    const loadFilters = async () => {
      try {
        const [programsRes, subjectsRes, classesRes] = await Promise.all([
          getPrograms(),
          getSubjects(),
          getClasses()
        ]);
        if (programsRes.success) setPrograms(programsRes.data || []);
        if (subjectsRes.success) setSubjects(subjectsRes.data || []);
        if (classesRes.success) setClasses(classesRes.data || []);
      } catch {}
    };
    loadFilters();
  }, [isOpen]);

  useEffect(() => {
    if (!user) return;
    const loadPref = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() : {};
        setSoundEnabled(data.notificationSoundEnabled !== false);
      } catch {}
    };
    loadPref();
  }, [user]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by read status
    if (filterType === 'unread') {
      filtered = filtered.filter(n => !n.read && !n.archived);
    } else if (filterType === 'read') {
      filtered = filtered.filter(n => n.read && !n.archived);
    } else if (filterType === 'archived') {
      filtered = filtered.filter(n => n.archived);
    } else if (!showArchived) {
      filtered = filtered.filter(n => !n.archived);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(n => n.type === filterCategory);
    }

    // Filter by penalty type
    if (filterPenaltyType !== 'all' && filterCategory === 'penalty') {
      filtered = filtered.filter(n => n.metadata?.penaltyType === filterPenaltyType);
    }

    // Filter by attendance status
    if (filterAttendanceStatus !== 'all' && filterCategory === 'attendance') {
      filtered = filtered.filter(n => n.metadata?.attendanceStatus === filterAttendanceStatus);
    }

    // Filter by absence type
    if (filterAbsenceType !== 'all' && filterCategory === 'absence') {
      filtered = filtered.filter(n => n.metadata?.absenceType === filterAbsenceType);
    }

    // Filter by program/subject/class/year/semester
    if (filterProgram !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        const subjectId = n.data?.subjectId || n.metadata?.subjectId;
        if (classId) {
          const classItem = classes.find(c => (c.id || c.docId) === classId);
          if (classItem?.subjectId) {
            const subject = subjects.find(s => (s.docId || s.id) === classItem.subjectId);
            return subject?.programId === filterProgram;
          }
        }
        if (subjectId) {
          const subject = subjects.find(s => (s.docId || s.id) === subjectId);
          return subject?.programId === filterProgram;
        }
        return false;
      });
    }

    if (filterSubject !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        const subjectId = n.data?.subjectId || n.metadata?.subjectId;
        if (classId) {
          const classItem = classes.find(c => (c.id || c.docId) === classId);
          return classItem?.subjectId === filterSubject;
        }
        return subjectId === filterSubject;
      });
    }

    if (filterClass !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        return classId === filterClass;
      });
    }

    if (filterYear !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        if (classId) {
          const classItem = classes.find(c => (c.id || c.docId) === classId);
          if (classItem?.year && String(classItem.year) === filterYear) return true;
          if (classItem?.term) {
            const parts = classItem.term.split(' ');
            if (parts.length > 1 && parts[parts.length - 1] === filterYear) return true;
          }
        }
        return false;
      });
    }

    if (filterSemester !== 'all') {
      filtered = filtered.filter(n => {
        const subjectId = n.data?.subjectId || n.metadata?.subjectId;
        if (subjectId) {
          const subject = subjects.find(s => (s.docId || s.id) === subjectId);
          return subject?.semester === filterSemester;
        }
        return false;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        (n.title || '').toLowerCase().includes(term) ||
        (n.message || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [notifications, filterType, filterCategory, filterPenaltyType, filterAttendanceStatus, filterAbsenceType, filterProgram, filterSubject, filterClass, filterYear, filterSemester, searchTerm, showArchived, programs, subjects, classes]);

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
  const archivedCount = notifications.filter(n => n.archived).length;

  const getNotificationIcon = (type) => {
    const iconProps = { size: 16 };
    switch (type) {
      case 'success': return <CheckCircle2 {...iconProps} className="text-green-600" />;
      case 'warning': return <AlertTriangle {...iconProps} className="text-yellow-600" />;
      case 'error': return <XCircle {...iconProps} className="text-red-600" />;
      case 'announcement': return <Megaphone {...iconProps} className="text-purple-600" />;
      case 'grade': return <BarChart3 {...iconProps} className="text-blue-600" />;
      case 'activity': return <FileText {...iconProps} className="text-indigo-600" />;
      case 'message': case 'chat': return <MessageCircle {...iconProps} className="text-pink-600" />;
      case 'newsletter': return <Mail {...iconProps} className="text-purple-600" />;
      case 'attendance': return <UserCheck {...iconProps} className="text-blue-600" />;
      case 'penalty': return <AlertTriangle {...iconProps} className="text-orange-600" />;
      case 'absence': return <XCircle {...iconProps} className="text-red-600" />;
      default: return <Info {...iconProps} className="text-gray-600" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return formatDateTime(date);
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e?.stopPropagation();
    setLoading(true);
    try {
      await markNotificationRead(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUnread = async (notificationId, e) => {
    e?.stopPropagation();
    setLoading(true);
    try {
      await markNotificationUnread(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (notificationId, e) => {
    e?.stopPropagation();
    setLoading(true);
    try {
      await archiveNotification(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e?.stopPropagation();
    if (!confirm('Delete this notification?')) return;
    setLoading(true);
    try {
      await deleteNotification(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      await markAllNotificationsRead(user.uid);
    } finally {
      setLoading(false);
    }
  };

  const gotoFromNotification = (n) => {
    if (!n.read) handleMarkAsRead(n.id);
    
    // Activity, quiz, homework, resource notifications
    if (n.type === 'activity' || n.type === 'submission') {
      const activityId = n.data?.activityId;
      const activityTitle = n.title || n.message || '';
      if (activityId) {
        navigate(`/activity/${activityId}`);
      } else {
        // Auto-search with activity title
        const searchTerm = activityTitle.replace(/^(New Activity|Activity):\s*/i, '').trim();
        navigate(`/?mode=activities${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`);
      }
    } else if (n.type === 'quiz') {
      const quizId = n.data?.quizId;
      const quizTitle = n.title || n.message || '';
      if (quizId) {
        navigate(`/quiz/${quizId}`);
      } else {
        // Auto-search with quiz title
        const searchTerm = quizTitle.replace(/^(New Quiz|Quiz):\s*/i, '').trim();
        navigate(`/?mode=quizzes${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`);
      }
    } else if (n.type === 'resource') {
      const resourceTitle = n.title || n.message || '';
      // Auto-search with resource title
      const searchTerm = resourceTitle.replace(/^(New Resource|Resource):\s*/i, '').trim();
      navigate(`/?mode=resources${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`);
    } else if (n.type === 'grade') {
      navigate('/?mode=quizzes');
    } else if (n.type === 'message' || n.type === 'chat' || n.data?.messageId || n.data?.roomId) {
      // Chat/message notifications
      let dest = 'global';
      if (n.data?.classId) dest = n.data.classId;
      if (n.data?.roomId) dest = `dm:${n.data.roomId}`;
      const msgId = n.data?.messageId;
      const url = msgId 
        ? `/chat?dest=${encodeURIComponent(dest)}&msgId=${msgId}`
        : `/chat?dest=${encodeURIComponent(dest)}`;
      navigate(url);
    } else if (n.type === 'attendance' || n.type === 'absence') {
      // Attendance/absence - navigate to student dashboard for now
      navigate('/student-dashboard');
    } else if (n.type === 'penalty') {
      // Penalty - navigate to student dashboard for now
      navigate('/student-dashboard');
    } else if (n.type === 'announcement' || n.type === 'newsletter') {
      // Announcements and newsletters don't navigate anywhere
      return;
    } else {
      navigate('/');
    }
  };

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 999,
          backdropFilter: 'blur(2px)'
        }}
      />
      
      {/* Drawer - Always on opposite side from SideDrawer */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0,
          [isRTL ? 'left' : 'right']: 0, // Opposite side from SideDrawer
          height: '100vh',
          width: 'min(420px, 90vw)',
          background: isDark ? '#1a1a2e' : '#ffffff',
          boxShadow: isRTL ? '2px 0 20px rgba(0,0,0,0.15)' : '-2px 0 20px rgba(0,0,0,0.15)',
          zIndex: 1002, // Higher than SideDrawer (1001) to appear on top
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : (isRTL ? 'translateX(-100%)' : 'translateX(100%)'),
          transition: 'transform 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
          background: isDark ? '#0f0f1e' : '#f9fafb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: isDark ? '#fff' : '#111' }}>
              Notifications
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('/notifications', '_blank');
                }}
                title="Open in new tab"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#fff' : '#666',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ExternalLink size={18} />
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#fff' : '#666',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDark ? '#9ca3af' : '#6b7280'
              }} />
              <Input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '2.5rem',
                  background: isDark ? '#0f0f1e' : '#fff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                  color: isDark ? '#fff' : '#111'
                }}
              />
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'unread', label: `Unread (${unreadCount})` },
                { value: 'read', label: 'Read' },
                { value: 'archived', label: `Archived (${archivedCount})` }
              ]}
              size="small"
              style={{ flex: 1, minWidth: '100px' }}
            />
            <Select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterPenaltyType('all');
                setFilterAttendanceStatus('all');
                setFilterAbsenceType('all');
              }}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'activity', label: 'Activities' },
                { value: 'message', label: 'Messages' },
                { value: 'chat', label: 'Chats' },
                { value: 'announcement', label: 'Announcements' },
                { value: 'newsletter', label: 'Newsletter' },
                { value: 'grade', label: 'Grades' },
                { value: 'attendance', label: 'Attendance' },
                { value: 'absence', label: 'Absences' },
                { value: 'penalty', label: 'Penalties' },
                { value: 'success', label: 'Success' },
                { value: 'warning', label: 'Warning' },
                { value: 'error', label: 'Error' }
              ]}
              size="small"
              style={{ flex: 1, minWidth: '100px' }}
            />
            {filterCategory === 'penalty' && (
              <Select
                value={filterPenaltyType}
                onChange={(e) => setFilterPenaltyType(e.target.value)}
                options={[
                  { value: 'all', label: 'All Penalty Types' },
                  ...PENALTY_TYPES.map(pt => ({ value: pt.id, label: pt.label_en }))
                ]}
                size="small"
                style={{ flex: 1, minWidth: '100px' }}
              />
            )}
            {filterCategory === 'attendance' && (
              <Select
                value={filterAttendanceStatus}
                onChange={(e) => setFilterAttendanceStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: ATTENDANCE_STATUS.PRESENT, label: 'Present' },
                  { value: ATTENDANCE_STATUS.LATE, label: 'Late' },
                  { value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: 'Absent (No Excuse)' },
                  { value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: 'Absent (With Excuse)' },
                  { value: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: 'Excused Leave' },
                  { value: ATTENDANCE_STATUS.HUMAN_CASE, label: 'Human Case' }
                ]}
                size="small"
                style={{ flex: 1, minWidth: '100px' }}
              />
            )}
            {filterCategory === 'absence' && (
              <Select
                value={filterAbsenceType}
                onChange={(e) => setFilterAbsenceType(e.target.value)}
                options={[
                  { value: 'all', label: 'All Absence Types' },
                  ...ABSENCE_TYPES.map(at => ({ value: at.id, label: at.label_en }))
                ]}
                size="small"
                style={{ flex: 1, minWidth: '100px' }}
              />
            )}
          </div>
          
          {/* Academic Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Select
              value={filterProgram}
              onChange={(e) => {
                setFilterProgram(e.target.value);
                setFilterSubject('all');
                setFilterClass('all');
              }}
              options={[
                { value: 'all', label: 'All Programs' },
                ...(programs || []).map(p => ({
                  value: p.docId || p.id,
                  label: p.name_en || p.name || p.code || p.docId
                }))
              ]}
              size="small"
              searchable
              fullWidth
            />
            <Select
              value={filterSubject}
              onChange={(e) => {
                setFilterSubject(e.target.value);
                setFilterClass('all');
              }}
              options={[
                { value: 'all', label: 'All Subjects' },
                ...(subjects || [])
                  .filter(s => filterProgram === 'all' || s.programId === filterProgram)
                  .map(s => ({
                    value: s.docId || s.id,
                    label: `${s.code || ''} - ${s.name_en || s.name || s.docId}`.trim()
                  }))
              ]}
              size="small"
              searchable
              fullWidth
            />
            <Select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              options={[
                { value: 'all', label: 'All Classes' },
                ...(classes || [])
                  .filter(c => {
                    if (filterSubject !== 'all' && c.subjectId !== filterSubject) return false;
                    if (filterProgram !== 'all') {
                      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                      if (!subject || subject.programId !== filterProgram) return false;
                    }
                    return true;
                  })
                  .map(c => ({
                    value: c.id || c.docId,
                    label: `${c.name || c.code || 'Unnamed'}${c.term ? ` (${c.term})` : ''}`
                  }))
              ]}
              size="small"
              searchable
              fullWidth
            />
            <Select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              options={[
                { value: 'all', label: 'All Years' },
                ...Array.from(new Set((classes || []).map(c => {
                  if (c.year) return String(c.year);
                  if (c.term) {
                    const parts = c.term.split(' ');
                    if (parts.length > 1 && !isNaN(parts[parts.length - 1])) {
                      return parts[parts.length - 1];
                    }
                  }
                  return null;
                }).filter(Boolean))).sort((a, b) => Number(b) - Number(a)).map(y => ({ value: y, label: y }))
              ]}
              size="small"
              fullWidth
            />
            <Select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              options={[
                { value: 'all', label: 'All Semesters' },
                ...Array.from(new Set((subjects || []).map(s => s.semester).filter(Boolean))).map(v => ({ value: v, label: v }))
              ]}
              size="small"
              fullWidth
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ToggleSwitch
                label="Sound"
                checked={soundEnabled}
                onChange={async (checked) => {
                  setSoundEnabled(checked);
                  try {
                    if (user) await setDoc(doc(db, 'users', user.uid), { notificationSoundEnabled: checked }, { merge: true });
                  } catch {}
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem'
        }}>
          {filteredNotifications.length === 0 ? (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: isDark ? '#9ca3af' : '#6b7280'
            }}>
              <Bell size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                  ? 'No notifications match your filters'
                  : 'No notifications yet'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => gotoFromNotification(notification)}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: '8px',
                  background: notification.read 
                    ? (isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb')
                    : (isDark ? 'rgba(128,0,32,0.15)' : '#f0f4ff'),
                  border: `1px solid ${notification.read 
                    ? (isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb')
                    : (isDark ? 'rgba(128,0,32,0.3)' : '#c7d2fe')}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark 
                    ? 'rgba(255,255,255,0.05)' 
                    : '#f3f4f6';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notification.read 
                    ? (isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb')
                    : (isDark ? 'rgba(128,0,32,0.15)' : '#f0f4ff');
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <div style={{
                        fontWeight: notification.read ? 500 : 600,
                        fontSize: '0.875rem',
                        color: isDark ? '#fff' : '#111',
                        lineHeight: 1.4
                      }}>
                        {notification.title}
                      </div>
                      {!notification.read && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          background: '#800020',
                          borderRadius: '50%',
                          flexShrink: 0,
                          marginTop: '0.25rem'
                        }} />
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: isDark ? '#9ca3af' : '#6b7280',
                      lineHeight: 1.4,
                      marginBottom: '0.25rem',
                      wordBreak: 'break-word'
                    }}>
                      {notification.message}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: isDark ? '#6b7280' : '#9ca3af',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{formatTime(notification.createdAt)}</span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {!notification.read ? (
                          <button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            title="Mark as read"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isDark ? '#9ca3af' : '#6b7280',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleMarkAsUnread(notification.id, e)}
                            title="Mark as unread"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isDark ? '#9ca3af' : '#6b7280',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <EyeOff size={14} />
                          </button>
                        )}
                        {!notification.archived ? (
                          <button
                            onClick={(e) => handleArchive(notification.id, e)}
                            title="Archive"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isDark ? '#9ca3af' : '#6b7280',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Archive size={14} />
                          </button>
                        ) : null}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          title="Delete"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isDark ? '#9ca3af' : '#6b7280',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDrawer;

