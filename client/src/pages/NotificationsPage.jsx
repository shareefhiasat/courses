import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToNotifications,
  archiveNotification,
  markNotificationUnread,
  deleteNotification,
  markNotificationRead,
  markAllNotificationsRead
} from '../firebase/notifications';
import { useLang } from '../contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Bell, CheckCircle2, AlertTriangle, XCircle, Megaphone, FileText, BarChart3, Info, Search, Archive, Check, X, Trash2, Eye, EyeOff, MessageCircle, Mail, Clock, UserCheck } from 'lucide-react';
import { formatDateTime } from '../utils/date';
import { Button, Input, Select, Badge, Container } from '../components/ui';
import ToggleSwitch from '../components/ToggleSwitch';
import { PENALTY_TYPES, ABSENCE_TYPES } from '../firebase/penalties';
import { ATTENDANCE_STATUS } from '../firebase/attendance';
import { getPrograms, getSubjects } from '../firebase/programs';
import { getClasses } from '../firebase/firestore';

const NotificationsPage = () => {
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
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
    }, true);
    return unsubscribe;
  }, [user]);

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

  // Load programs, subjects, classes for filters
  useEffect(() => {
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
  }, []);

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
    const iconProps = { size: 18 };
    const colorClass = isDark ? 'text-white' : 'text-gray-700';
    switch (type) {
      case 'success': return <CheckCircle2 {...iconProps} className="text-green-600" />;
      case 'warning': return <AlertTriangle {...iconProps} className="text-yellow-600" />;
      case 'error': return <XCircle {...iconProps} className="text-red-600" />;
      case 'announcement': return <Megaphone {...iconProps} className="text-purple-600" />;
      case 'newsletter': return <Mail {...iconProps} className="text-purple-600" />;
      case 'grade': return <BarChart3 {...iconProps} className="text-blue-600" />;
      case 'activity': return <FileText {...iconProps} className="text-indigo-600" />;
      case 'message': case 'chat': return <MessageCircle {...iconProps} className="text-pink-600" />;
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

  const handleMarkAsRead = async (notificationId) => {
    setLoading(true);
    try {
      await markNotificationRead(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    setLoading(true);
    try {
      await markNotificationUnread(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (notificationId) => {
    setLoading(true);
    try {
      await archiveNotification(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId) => {
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

  if (!user) return null;

  return (
    <Container maxWidth="xl" style={{ padding: '2rem', minHeight: '100vh', background: isDark ? '#0f0f1e' : '#f9fafb' }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        background: isDark ? '#1a1a2e' : '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: isDark ? '#fff' : '#111' }}>
            Notifications
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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

        {/* Search */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '1rem',
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
                paddingLeft: '3rem',
                background: isDark ? '#0f0f1e' : '#fff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                color: isDark ? '#fff' : '#111'
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
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
            fullWidth
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
            fullWidth
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
              fullWidth
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
              fullWidth
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
              fullWidth
            />
          )}
        </div>
        
        {/* Academic Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
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
      </div>

      {/* Notifications List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {filteredNotifications.length === 0 ? (
          <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: isDark ? '#1a1a2e' : '#ffffff',
            borderRadius: '12px',
            color: isDark ? '#9ca3af' : '#6b7280'
          }}>
            <Bell size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>
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
                padding: '1rem',
                borderRadius: '12px',
                background: notification.read 
                  ? (isDark ? 'rgba(255,255,255,0.02)' : '#ffffff')
                  : (isDark ? 'rgba(128,0,32,0.15)' : '#f0f4ff'),
                border: `1px solid ${notification.read 
                  ? (isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb')
                  : (isDark ? 'rgba(128,0,32,0.3)' : '#c7d2fe')}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark 
                  ? 'rgba(255,255,255,0.05)' 
                  : '#f3f4f6';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = notification.read 
                  ? (isDark ? 'rgba(255,255,255,0.02)' : '#ffffff')
                  : (isDark ? 'rgba(128,0,32,0.15)' : '#f0f4ff');
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                {getNotificationIcon(notification.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    fontWeight: notification.read ? 500 : 600,
                    fontSize: '1rem',
                    color: isDark ? '#fff' : '#111',
                    lineHeight: 1.4
                  }}>
                    {notification.title}
                  </div>
                  {!notification.read && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      background: '#800020',
                      borderRadius: '50%',
                      flexShrink: 0,
                      marginTop: '0.25rem'
                    }} />
                  )}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  lineHeight: 1.5,
                  marginBottom: '0.5rem',
                  wordBreak: 'break-word'
                }}>
                  {notification.message}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: isDark ? '#6b7280' : '#9ca3af',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{formatTime(notification.createdAt)}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    {!notification.read ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        title="Mark as read"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#9ca3af' : '#6b7280',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsUnread(notification.id);
                        }}
                        title="Mark as unread"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#9ca3af' : '#6b7280',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <EyeOff size={16} />
                      </button>
                    )}
                    {!notification.archived ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(notification.id);
                        }}
                        title="Archive"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#9ca3af' : '#6b7280',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Archive size={16} />
                      </button>
                    ) : null}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      title="Delete"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#9ca3af' : '#6b7280',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Container>
  );
};

export default NotificationsPage;
