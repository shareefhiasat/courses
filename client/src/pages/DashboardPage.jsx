 
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getActivities,
  addActivity,
  updateActivity,
  deleteActivity,
  getAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getAllowlist,
  updateAllowlist,
  sendEmail,
  getEmailLogs,
  deleteEmailLog,
  addEmailLog,
  getClasses,
  addClass,
  updateClass,
  deleteClass,
  getEnrollments,
  addEnrollment,
  deleteEnrollment,
  getSubmissions,
  gradeSubmission,
  getResources,
  addResource,
  updateResource,
  deleteResource,
  getSMTPConfig,
  updateSMTPConfig
} from '../firebase/firestore';
import { getLoginLogs, getCourses, setCourse, deleteCourse } from '../firebase/firestore';
import { notifyAllUsers, notifyUsersByClass } from '../firebase/notifications';
import Loading from '../components/Loading';
import SmartGrid from '../components/SmartGrid';
import EmailManager from '../components/EmailManager';
import EmailComposer from '../components/EmailComposer';
import EmailSettings from '../components/EmailSettings';
import EmailTemplates from '../components/EmailTemplates';
import EmailLogs from '../components/EmailLogs';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import './DashboardPage.css';
import { useLang } from '../contexts/LangContext';
import DateTimePicker from '../components/DateTimePicker';
import ToggleSwitch from '../components/ToggleSwitch';

const DashboardPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('dashboardActiveTab') || 'activities';
    return saved === 'courses' ? 'categories' : saved;
  });
  const [loading, setLoading] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [submissionFilter, setSubmissionFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [userQuickFilter, setUserQuickFilter] = useState('all');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('dashboardActiveTab', tab);
  };

  // Load email logs when newsletter tab is opened
  useEffect(() => {
    const loadLogs = async () => {
      const res = await getEmailLogs();
      if (res.success) setEmailLogs(res.data || []);
    };
    if (activeTab === 'newsletter') loadLogs();
  }, [activeTab]);
  
  // Validation functions
  const validateActivityForm = () => {
    const errors = {};
    if (!activityForm.id.trim()) errors.id = 'Activity ID is required';
    if (!activityForm.title_en.trim()) errors.title_en = 'English title is required';
    if (!activityForm.url.trim()) errors.url = 'URL is required';
    
    // Check if ID already exists (for new activities)
    if (!editingActivity && activities.some(a => a.id === activityForm.id)) {
      errors.id = 'Activity ID already exists';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Edit handlers
  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setActivityForm({ ...activity });
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
    setActivityForm({
      id: '', title_en: '', title_ar: '', description_en: '', description_ar: '',
      course: 'python', type: 'quiz', difficulty: 'beginner', url: '', dueDate: '',
      image: '', order: 0, show: true, allowRetake: false, classId: '', featured: false
    });
    setFormErrors({});
  };
  
  // Data states
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [allowlist, setAllowlist] = useState({ allowedEmails: [], adminEmails: [] });
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [resources, setResources] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loginSearch, setLoginSearch] = useState('');
  const [loginUserFilter, setLoginUserFilter] = useState('all');
  const [loginFrom, setLoginFrom] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [loginTo, setLoginTo] = useState('');
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({ id: '', name_en: '', name_ar: '', order: 0 });
  const [editingCourse, setEditingCourse] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  // Add Category modal
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: 587, secure: false, user: '', password: '', senderName: 'CS Learning Hub', __loaded: false });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  
  // Derived: filtered activity logs
  const filteredLoginLogs = () => {
    const q = (loginSearch || '').trim().toLowerCase();
    let list = loginLogs.slice();
    
    // Filter by activity type
    if (activityTypeFilter !== 'all') {
      list = list.filter(l => l.type === activityTypeFilter);
    }
    
    if (q) {
      list = list.filter(l =>
        (l.email||'').toLowerCase().includes(q) ||
        (l.displayName||'').toLowerCase().includes(q) ||
        (l.userAgent||'').toLowerCase().includes(q) ||
        (l.type||'').toLowerCase().includes(q)
      );
    }
    if (loginUserFilter !== 'all') {
      list = list.filter(l => (l.email || l.userId) === loginUserFilter);
    }
    if (loginFrom) {
      const fromDate = new Date(loginFrom).getTime();
      list = list.filter(l => {
        const logDate = l.when?.seconds ? l.when.seconds * 1000 : new Date(l.when).getTime();
        return logDate >= fromDate;
      });
    }
    if (loginTo) {
      const toDate = new Date(loginTo).getTime() + 86400000;
      list = list.filter(l => {
        const logDate = l.when?.seconds ? l.when.seconds * 1000 : new Date(l.when).getTime();
        return logDate <= toDate;
      });
    }
    return list;
  };
  // Filter announcements by date
  const filteredAnnouncements = announcements.filter(announcement => {
    if (announcementFilter === 'all') return true;
    
    const createdAt = announcement.createdAt?.seconds ? 
      new Date(announcement.createdAt.seconds * 1000) : 
      new Date(announcement.createdAt);
    const now = new Date();
    
    switch (announcementFilter) {
      case 'today':
        const isToday = createdAt.toDateString() === now.toDateString();
        console.log('Today filter:', createdAt.toDateString(), 'vs', now.toDateString(), '=', isToday);
        return isToday;
      case '7days':
        const daysDiff = (now - createdAt) / (24 * 60 * 60 * 1000);
        const isWithin7Days = daysDiff <= 7;
        console.log('7 days filter:', daysDiff, 'days ago, within 7?', isWithin7Days);
        return isWithin7Days;
      case '30days':
        const daysDiff30 = (now - createdAt) / (24 * 60 * 60 * 1000);
        const isWithin30Days = daysDiff30 <= 30;
        console.log('30 days filter:', daysDiff30, 'days ago, within 30?', isWithin30Days);
        return isWithin30Days;
      default:
        return true;
    }
  });
  
  // Form states
  const [activityForm, setActivityForm] = useState({
    id: '',
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    course: 'python',
    type: 'quiz',
    difficulty: 'beginner',
    url: '',
    dueDate: '',
    image: '',
    maxScore: 100,
    show: true,
    allowRetake: false,
    classId: '',
    featured: false
  });
  
  const [emailOptions, setEmailOptions] = useState({
    sendEmail: false,
    createAnnouncement: false,
    emailLang: 'both' // 'en' | 'ar' | 'both'
  });
  
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    content_ar: '',
    target: 'global'
  });
  const [announcementEmailOptions, setAnnouncementEmailOptions] = useState({ sendEmail: false, lang: 'both' });
  
  const [classForm, setClassForm] = useState({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '' });
  const [enrollmentForm, setEnrollmentForm] = useState({ userId: '', classId: '', role: 'student' });
  const [userForm, setUserForm] = useState({ email: '', displayName: '', role: 'student' });
  const [autoAddToAllowlist, setAutoAddToAllowlist] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    url: '',
    type: 'link',
    dueDate: '',
    optional: false
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
      return;
    }
    
    if (user && isAdmin) {
      loadData();
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activitiesRes, announcementsRes, usersRes, allowlistRes, classesRes, enrollmentsRes, submissionsRes, resourcesRes, loginLogsRes, coursesRes] = await Promise.all([
        getActivities(),
        getAnnouncements(),
        getUsers(),
        getAllowlist(),
        getClasses(),
        getEnrollments(),
        getSubmissions(),
        getResources(),
        getLoginLogs(),
        getCourses()
      ]);
      
      if (activitiesRes.success) setActivities(activitiesRes.data);
      if (announcementsRes.success) setAnnouncements(announcementsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (allowlistRes.success) setAllowlist(allowlistRes.data);
      if (classesRes.success) setClasses(classesRes.data);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data);
      if (submissionsRes.success) setSubmissions(submissionsRes.data);
      if (resourcesRes.success) setResources(resourcesRes.data);
      if (loginLogsRes.success) setLoginLogs(loginLogsRes.data);
      if (coursesRes.success) setCourses(coursesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validation functions for deletion
  const validateUserDeletion = async (user) => {
    const userEnrollments = enrollments.filter(e => e.userId === user.docId);
    const userSubmissions = submissions.filter(s => s.userId === user.docId);
    
    if (userEnrollments.length > 0 || userSubmissions.length > 0) {
      return {
        canDelete: false,
        hasChildren: true,
        message: `Cannot delete user. This user has ${userEnrollments.length} enrollment(s) and ${userSubmissions.length} submission(s) that must be deleted first.`
      };
    }
    
    return { canDelete: true };
  };

  const validateClassDeletion = async (classItem) => {
    const effectiveId = classItem.docId || classItem.id;
    const classEnrollments = enrollments.filter(e => e.classId === effectiveId);
    const relatedActivities = activities.filter(a => (a.classId || '') === effectiveId);
    
    if (classEnrollments.length > 0 || relatedActivities.length > 0) {
      return {
        canDelete: false,
        hasChildren: true,
        message: `Cannot delete class. This class has ${classEnrollments.length} student(s) enrolled and ${relatedActivities.length} linked activity(ies) that must be removed first.`
      };
    }
    
    return { canDelete: true };
  };

  const validateActivityDeletion = async (activity) => {
    const activitySubmissions = submissions.filter(s => s.activityId === activity.id);
    
    if (activitySubmissions.length > 0) {
      return {
        canDelete: false,
        hasChildren: true,
        message: `Cannot delete activity. This activity has ${activitySubmissions.length} submission(s) that must be deleted first.`
      };
    }
    
    return { canDelete: true };
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    
    if (!validateActivityForm()) {
      toast?.showError('Please fix the form errors before submitting.');
      return;
    }
    
    setLoading(true);
    try {
      // Localize fallbacks: if AR missing, default to EN; same for description
      const normalized = {
        ...activityForm,
        title_ar: activityForm.title_ar?.trim() || activityForm.title_en?.trim() || activityForm.id,
        description_ar: activityForm.description_ar?.trim() || activityForm.description_en?.trim() || ''
      };
      const result = editingActivity ? 
        await updateActivity(editingActivity.docId, normalized) :
        await addActivity(normalized);
      
      if (result.success) {
        // Handle email notifications if checked
        if (!editingActivity && emailOptions.sendEmail) {
          await sendActivityEmail(activityForm);
        }
        
        // Handle announcement creation if checked
        if (!editingActivity && emailOptions.createAnnouncement) {
          await createActivityAnnouncement(activityForm);
        }
        // Send in-app notifications for new activities
        if (!editingActivity) {
          try {
            const previewTitle = activityForm.title_en || activityForm.title_ar || activityForm.id;
            if (activityForm.classId) {
              await notifyUsersByClass(
                activityForm.classId,
                `🎯 ${previewTitle}`,
                activityForm.description_en || activityForm.description_ar || 'New activity',
                'activity'
              );
            } else {
              await notifyAllUsers(
                `🎯 ${previewTitle}`,
                activityForm.description_en || activityForm.description_ar || 'New activity',
                'activity'
              );
            }
          } catch (e) {
            console.warn('Activity notification failed', e);
          }
        }
        
        await loadData();
        handleCancelEdit();
        
        // Reset email options
        setEmailOptions({ sendEmail: false, createAnnouncement: false });
        
        toast?.showSuccess(editingActivity ? 'Activity updated successfully!' : 'Activity created successfully!');
      } else {
        toast?.showError('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      toast?.showError('Error saving activity: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Send activity email notification
  const sendActivityEmail = async (activity) => {
    try {
      // Get class enrollments
      const enrollmentsResult = await getEnrollments();
      const classStudents = enrollmentsResult.data?.filter(e => 
        e.classId === activity.classId
      ) || [];
      
      if (classStudents.length === 0) {
        toast?.showInfo('No students found in this class');
        return;
      }
      
      // Get student emails
      const studentEmails = classStudents.map(enrollment => {
        const user = users.find(u => u.docId === enrollment.userId);
        return user?.email;
      }).filter(Boolean);
      
      if (studentEmails.length === 0) {
        toast?.showInfo('No student emails found');
        return;
      }
      
      // Format email
      const dueDate = activity.dueDate 
        ? new Date(activity.dueDate).toLocaleDateString('en-GB')
        : 'No deadline';
      
      const buildEn = () => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">📚 New Activity Assigned</h2>
          <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
            <h3 style="margin-top: 0;">${activity.title_en || ''}</h3>
            <p><strong>Type:</strong> ${activity.type}</p>
            <p><strong>Level:</strong> ${activity.difficulty}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p><strong>Retakes:</strong> ${activity.allowRetake ? 'Allowed ✅' : 'Not allowed ❌'}</p>
            ${activity.optional ? '<p><strong>Status:</strong> Optional 💡</p>' : '<p><strong>Status:</strong> Required 📌</p>'}
          </div>
          <p>${activity.description_en || ''}</p>
          <a href="${activity.url}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;border-radius:8px;margin-top:1rem;">Start Activity 🎯</a>
        </div>`;
      const buildAr = () => `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align:right">
          <h2 style="color: #667eea;">📚 واجب/نشاط جديد</h2>
          <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
            <h3 style="margin-top: 0;">${activity.title_ar || activity.title_en || ''}</h3>
            <p><strong>النوع:</strong> ${activity.type}</p>
            <p><strong>المستوى:</strong> ${activity.difficulty}</p>
            <p><strong>تاريخ التسليم:</strong> ${dueDate}</p>
            <p><strong>إعادة المحاولة:</strong> ${activity.allowRetake ? 'مسموح ✅' : 'غير مسموح ❌'}</p>
            ${activity.optional ? '<p><strong>الحالة:</strong> اختياري 💡</p>' : '<p><strong>الحالة:</strong> إلزامي 📌</p>'}
          </div>
          <p>${activity.description_ar || ''}</p>
          <a href="${activity.url}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;border-radius:8px;margin-top:1rem;">ابدأ النشاط 🎯</a>
        </div>`;

      let emailBody = '';
      if (emailOptions.emailLang === 'en') emailBody = buildEn();
      else if (emailOptions.emailLang === 'ar') emailBody = buildAr();
      else emailBody = [buildEn(), '<hr/>', buildAr()].join('');
      
      // Send email via Firebase function
      const sendResult = await sendEmail({
        to: studentEmails,
        subject: `New Activity: ${activity.title_en || activity.title_ar || ''}`,
        html: emailBody
      });
      
      if (sendResult.success) {
        toast?.showSuccess(`Email sent to ${studentEmails.length} students`);
      } else {
        toast?.showError('Failed to send email: ' + sendResult.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast?.showError('Error sending email notification');
    }
  };
  
  // Create announcement from activity
  const createActivityAnnouncement = async (activity) => {
    try {
      const dueDate = activity.dueDate 
        ? new Date(activity.dueDate).toLocaleDateString('en-GB')
        : 'No deadline';
      
      const announcement = {
        title: `New ${activity.type}: ${activity.title_en}`,
        content: `
📚 ${activity.title_en}

${activity.description_en || 'No description'}

📅 Due Date: ${dueDate}
🎯 Level: ${activity.difficulty}
${activity.allowRetake ? '🔄 Retakes allowed' : '⚠️ No retakes'}
${activity.optional ? '💡 Optional activity' : '📌 Required activity'}

🔗 Link: ${activity.url}
        `.trim(),
        priority: activity.optional ? 'normal' : 'high',
        classId: activity.classId || null
      };
      
      const result = await addAnnouncement(announcement);
      
      if (result.success) {
        toast?.showSuccess('Announcement created successfully');
      } else {
        toast?.showError('Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast?.showError('Error creating announcement');
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = editingAnnouncement ? 
        await updateAnnouncement(editingAnnouncement.docId, announcementForm) :
        await addAnnouncement(announcementForm);
        
      if (result.success) {
        // Send notifications only for new announcements
        if (!editingAnnouncement) {
          if (announcementForm.target === 'global') {
            await notifyAllUsers(
              `📢 ${announcementForm.title}`,
              announcementForm.content,
              'announcement'
            );
          } else if (announcementForm.target.startsWith('class:')) {
            const classId = announcementForm.target.replace('class:', '');
            await notifyUsersByClass(
              classId,
              `📢 ${announcementForm.title}`,
              announcementForm.content,
              'announcement'
            );
          }
          // Optional email blast
          if (announcementEmailOptions.sendEmail) {
            const buildBody = () => {
              const en = announcementForm.content?.trim();
              const ar = announcementForm.content_ar?.trim();
              if (announcementEmailOptions.lang === 'en') return en || '';
              if (announcementEmailOptions.lang === 'ar') return `<div dir="rtl" style="text-align:right">${ar || ''}</div>`;
              // both
              return [`<div>${en || ''}</div>`, ar ? `<hr/><div dir="rtl" style="text-align:right">${ar}</div>` : ''].join('');
            };
            const recipients = users.map(u => u.email).filter(Boolean);
            if (recipients.length > 0) {
              const sendRes = await sendEmail({
                to: recipients,
                subject: `📢 ${announcementForm.title}`,
                html: buildBody(),
                type: 'announcement'
              });
              if (!sendRes.success) {
                console.warn('Announcement email failed:', sendRes.error);
                toast?.showError('Announcement created, but email failed: ' + sendRes.error);
              }
            }
          }
        }
        
        await loadData();
        setAnnouncementForm({ title: '', content: '', content_ar: '', target: 'global' });
        setAnnouncementEmailOptions({ sendEmail: false, lang: 'both' });
        setEditingAnnouncement(null);
        toast?.showSuccess(editingAnnouncement ? 
          'Announcement updated successfully!' : 
          'Announcement created and notifications sent!'
        );
      } else {
        toast?.showError(`Error ${editingAnnouncement ? 'updating' : 'creating'} announcement: ` + result.error);
      }
    } catch (error) {
      console.error('Error with announcement:', error);
      toast?.showError(`Error ${editingAnnouncement ? 'updating' : 'creating'} announcement: ` + error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleAllowlistSave = async () => {
    setLoading(true);
    try {
      const result = await updateAllowlist(allowlist);
      if (result.success) {
        toast?.showSuccess('Allowlist updated successfully');
      } else {
        toast?.showError('Error updating allowlist: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating allowlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <Loading message="Checking permissions..." />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="dashboard-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Compact header removed to save vertical space */}

      <div className="dashboard-content">
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => handleTabChange('activities')}
          >
            {t('activities')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => handleTabChange('announcements')}
          >
            {t('announcements')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            {t('users')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'allowlist' ? 'active' : ''}`}
            onClick={() => handleTabChange('allowlist')}
          >
            {t('allowlist')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => handleTabChange('classes')}
          >
            {t('classes')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`}
            onClick={() => handleTabChange('enrollments')}
          >
            {t('enrollments')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => handleTabChange('submissions')}
          >
            {t('submissions')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => handleTabChange('resources')}
          >
            {t('resources')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'smtp' ? 'active' : ''}`}
            onClick={() => handleTabChange('smtp')}
          >
            {t('smtp')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'newsletter' ? 'active' : ''}`}
            onClick={() => handleTabChange('newsletter')}
          >
            {t('newsletter')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
          >
            {t('activity_tab')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleTabChange('categories')}
          >
            {t('categories')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'emailTemplates' ? 'active' : ''}`}
            onClick={() => handleTabChange('emailTemplates')}
          >
            📧 {t('email_management')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'emailLogs' ? 'active' : ''}`}
            onClick={() => handleTabChange('emailLogs')}
          >
            📊 {t('email_logs')}
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'activities' && (
            <div className="activities-tab">
              {editingActivity && (
                <div className="edit-mode-indicator">
                  📝 Editing Activity: {editingActivity.id} - {editingActivity.title_en}
                </div>
              )}

              <form onSubmit={handleActivitySubmit} className="activity-form">
                <div className="form-row">
                  <div>
                    <input
                      type="text"
                      placeholder={t('activity_id') || 'Activity ID'}
                      value={activityForm.id}
                      onChange={(e) => setActivityForm({...activityForm, id: e.target.value})}
                      disabled={editingActivity} // Can't change ID when editing
                      required
                      style={{ borderColor: formErrors.id ? '#dc3545' : '#ddd' }}
                    />
                    {formErrors.id && <div className="error-text">{formErrors.id}</div>}
                  </div>
                  <select
                    value={activityForm.classId || ''}
                    onChange={(e) => setActivityForm({ ...activityForm, classId: e.target.value })}
                  >
                    <option value="">{t('general_no_class')}</option>
                    {classes.map(cls => (
                      <option key={cls.docId} value={cls.docId}>
                        {(lang==='ar' ? (cls.name_ar || cls.name) : cls.name)}{cls.code?` (${cls.code})`:''}
                      </option>
                    ))}
                  </select>
                  <select
                    value={activityForm.course}
                    onChange={(e) => setActivityForm({...activityForm, course: e.target.value})}
                  >
                    {(courses && courses.length > 0 ? courses : [
                      { docId: 'programming', name_en: 'Programming', name_ar: 'البرمجة' },
                      { docId: 'computing', name_en: 'Computing', name_ar: 'الحوسبة' },
                      { docId: 'algorithm', name_en: 'Algorithm', name_ar: 'الخوارزميات' },
                      { docId: 'general', name_en: 'General', name_ar: 'عام' },
                    ]).map(c => (
                      <option key={c.docId} value={c.docId}>{lang==='ar' ? (c.name_ar || c.name_en || c.docId) : (c.name_en || c.docId)}</option>
                    ))}
                  </select>
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({...activityForm, type: e.target.value})}
                  >
                    <option value="quiz">{t('quiz')}</option>
                    <option value="homework">{t('homework')}</option>
                    <option value="training">{t('training')}</option>
                  </select>
                  <select
                    value={activityForm.difficulty}
                    onChange={(e) => setActivityForm({...activityForm, difficulty: e.target.value})}
                  >
                    <option value="beginner">{t('beginner')}</option>
                    <option value="intermediate">{t('intermediate')}</option>
                    <option value="advanced">{t('advanced')}</option>
                  </select>
                </div>
                
                <div className="form-row">
                  <div>
                    <input
                      type="text"
                      placeholder={t('title_english') || t('title_en') || 'Title (English)'}
                      value={activityForm.title_en}
                      onChange={(e) => setActivityForm({...activityForm, title_en: e.target.value})}
                      required
                      style={{ borderColor: formErrors.title_en ? '#dc3545' : '#ddd' }}
                    />
                    {formErrors.title_en && <div className="error-text">{formErrors.title_en}</div>}
                  </div>
                  <input
                    type="text"
                    placeholder={t('title_arabic') || t('title_ar') || 'Title (Arabic)'}
                    value={activityForm.title_ar}
                    onChange={(e) => setActivityForm({...activityForm, title_ar: e.target.value})}
                  />
                </div>
                
                <div className="form-row">
                  <textarea
                    placeholder={t('description_english') || t('description_en') || 'Description (English)'}
                    value={activityForm.description_en}
                    onChange={(e) => setActivityForm({...activityForm, description_en: e.target.value})}
                    rows="3"
                  />
                  <textarea
                    placeholder={t('description_arabic') || t('description_ar') || 'Description (Arabic)'}
                    value={activityForm.description_ar}
                    onChange={(e) => setActivityForm({...activityForm, description_ar: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="form-row">
                  <div>
                    <input
                      type="url"
                      placeholder={t('activity_url_label') || 'Activity URL'}
                      value={activityForm.url}
                      onChange={(e) => setActivityForm({...activityForm, url: e.target.value})}
                      required
                      style={{ borderColor: formErrors.url ? '#dc3545' : '#ddd' }}
                    />
                    {formErrors.url && <div className="error-text">{formErrors.url}</div>}
                  </div>
                  <DateTimePicker
                    value={activityForm.dueDate}
                    onChange={(iso) => setActivityForm({...activityForm, dueDate: iso})}
                    placeholder={t('pick_due_date') || 'Pick due date & time'}
                  />
                  <input
                    type="url"
                    placeholder={t('image_url') || 'Image URL'}
                    value={activityForm.image}
                    onChange={(e) => setActivityForm({...activityForm, image: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder={t('max_score') || 'Max Score'}
                    value={activityForm.maxScore}
                    onChange={(e) => setActivityForm({...activityForm, maxScore: Math.max(1, parseInt(e.target.value||'0'))})}
                  />
                </div>
                
                <div className="form-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={activityForm.show}
                      onChange={(e) => setActivityForm({...activityForm, show: e.target.checked})}
                    />
                    {t('show_to_students') || 'Show to students'}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={activityForm.allowRetake}
                      onChange={(e) => setActivityForm({...activityForm, allowRetake: e.target.checked})}
                    />
                    {t('allow_retakes') || 'Allow retakes'}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={activityForm.featured}
                      onChange={(e) => setActivityForm({ ...activityForm, featured: e.target.checked })}
                    />
                    {t('featured') || 'Featured'}
                  </label>
                </div>
                
                {/* Email Notification Options */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f0f8ff',
                  borderRadius: '8px',
                  border: '2px solid #667eea'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={emailOptions.sendEmail}
                      onChange={(e) => setEmailOptions({...emailOptions, sendEmail: e.target.checked})}
                    />
                    <span>📧 {t('send_email_to_students') || 'Send email to students'}</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={emailOptions.createAnnouncement}
                      onChange={(e) => setEmailOptions({...emailOptions, createAnnouncement: e.target.checked})}
                    />
                    <span>📢 {t('create_announcement') || 'Create announcement'}</span>
                  </label>
                  {emailOptions.sendEmail && (
                    <div>
                      <small>{t('language') || 'Language'}</small>
                      <select value={emailOptions.emailLang} onChange={(e)=> setEmailOptions({ ...emailOptions, emailLang: e.target.value })}>
                        <option value="en">{lang === 'ar' ? 'الإنجليزية' : 'English'}</option>
                        <option value="ar">{lang === 'ar' ? 'العربية' : 'Arabic'}</option>
                        <option value="both">{lang === 'ar' ? 'ثنائي اللغة (ع/إ)' : 'Bilingual (EN + AR)'}</option>
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading 
                      ? (editingActivity ? (t('updating') || 'Updating...') : (t('creating') || 'Creating...')) 
                      : (editingActivity ? (t('update_activity') || 'Update Activity') : (t('create_activity') || 'Create Activity'))}
                  </button>
                  {editingActivity && (
                    <button type="button" onClick={handleCancelEdit} className="cancel-btn">
                      {t('cancel') || 'Cancel'}
                    </button>
                  )}
                </div>
              </form>
              
              <SmartGrid
                data={activities}
                title={t('existing_activities')}
                quickFilters={{
                  active: activityFilter,
                  onFilterChange: setActivityFilter,
                  buttons: [
                    { 
                      key: 'all', 
                      label: t('all'),
                      count: activities.length,
                      filter: () => true 
                    },
                    { 
                      key: 'python', 
                      label: `🐍 ${t('python')}`,
                      count: activities.filter(a => a.course === 'python').length,
                      filter: (a) => a.course === 'python'
                    },
                    { 
                      key: 'computing', 
                      label: `💻 ${t('computing')}`,
                      count: activities.filter(a => a.course === 'computing').length,
                      filter: (a) => a.course === 'computing'
                    },
                    { 
                      key: 'training', 
                      label: `🏋️ ${t('training')}`,
                      count: activities.filter(a => a.type === 'training').length,
                      filter: (a) => a.type === 'training'
                    },
                    { 
                      key: 'homework', 
                      label: `📝 ${t('homework')}`,
                      count: activities.filter(a => a.type === 'homework').length,
                      filter: (a) => a.type === 'homework'
                    },
                    { 
                      key: 'quiz', 
                      label: `🧩 ${t('quiz')}`,
                      count: activities.filter(a => a.type === 'quiz').length,
                      filter: (a) => a.type === 'quiz'
                    },
                    { 
                      key: 'beginner', 
                      label: `🌟 ${t('beginner')}`,
                      count: activities.filter(a => a.difficulty === 'beginner').length,
                      filter: (a) => a.difficulty === 'beginner'
                    }
                  ]
                }}
                columns={[
                  { header: t('id_col'), accessor: 'id' },
                  { header: t('title_en_col'), accessor: 'title_en' },
                  { header: t('course_col'), accessor: 'course' },
                  { header: t('type_col'), accessor: 'type' },
                  { header: t('difficulty_col'), accessor: 'difficulty' },
                  { 
                    header: t('assignment_due_date_col'), 
                    accessor: 'dueDate',
                    render: (value) => {
                      if (!value) return t('no_deadline_set');
                      // Firestore Timestamp
                      if (typeof value === 'object' && value.seconds) {
                        return new Date(value.seconds * 1000).toLocaleDateString('en-GB');
                      }
                      const str = String(value);
                      const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                      if (ddmmyyyy.test(str)) return str; // already DD/MM/YYYY
                      const d = new Date(str);
                      return isNaN(d.getTime()) ? str : d.toLocaleDateString('en-GB');
                    }
                  },
                  { 
                    header: t('visible') || 'Visible', 
                    accessor: 'show',
                    render: (value) => value ? `✅ ${t('yes')||'Yes'}` : `❌ ${t('no')||'No'}`
                  }
                ]}
                onEdit={handleEditActivity}
                onDelete={async (activity) => {
                  // Optimistic update - remove from UI immediately
                  setActivities(prev => prev.filter(a => a.docId !== activity.docId));
                  
                  try {
                    const result = await deleteActivity(activity.docId);
                    if (result.success) {
                      toast?.showSuccess('Activity deleted successfully!');
                    } else {
                      // Revert optimistic update on error
                      setActivities(prev => [...prev, activity].sort((a, b) => a.order - b.order));
                      toast?.showError('Error deleting activity: ' + result.error);
                    }
                  } catch (error) {
                    // Revert optimistic update on error
                    setActivities(prev => [...prev, activity].sort((a, b) => a.order - b.order));
                    toast?.showError('Error deleting activity: ' + error.message);
                  }
                }}
                searchPlaceholder={t('search_activities') || 'Search activities...'}
              />
            </div>
          )}

          {activeTab === 'newsletter' && (
            <div className="newsletter-tab">
              <h2>{t('newsletter')}</h2>
              <p style={{ color:'#666' }}>{t('send_bulk_emails_view')}</p>
              {(!emailLogs || emailLogs.length === 0) ? (
                <div style={{ padding:'1rem', background:'#f8f9fa', border:'1px dashed #ddd', borderRadius:8 }}>
                  {t('no_email_logs_yet') || 'No email logs yet. Use the email composer to send a newsletter.'}
                </div>
              ) : (
                <div style={{ overflowX:'auto', marginTop:'1rem' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign:'left', padding:'8px', borderBottom:'2px solid #ddd' }}>{t('when')}</th>
                        <th style={{ textAlign:'left', padding:'8px', borderBottom:'2px solid #ddd' }}>{t('subject')}</th>
                        <th style={{ textAlign:'left', padding:'8px', borderBottom:'2px solid #ddd' }}>{t('to')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailLogs.map(l => (
                        <tr key={l.docId}>
                          <td style={{ padding:'8px', borderBottom:'1px solid #f3f3f3' }}>{l.timestamp?.seconds ? new Date(l.timestamp.seconds*1000).toLocaleString('en-GB') : ''}</td>
                          <td style={{ padding:'8px', borderBottom:'1px solid #f3f3f3' }}>{l.subject || '—'}</td>
                          <td style={{ padding:'8px', borderBottom:'1px solid #f3f3f3' }}>{Array.isArray(l.to) ? l.to.join(', ') : (l.to || '—')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="announcements-tab">
              <h2>{t('announcements_management')}</h2>
              
              {editingAnnouncement && (
                <div className="edit-mode-indicator">
                  📝 Editing Announcement: {editingAnnouncement.title}
                </div>
              )}
              
              <form onSubmit={handleAnnouncementSubmit} className="announcement-form">
                <input
                  type="text"
                  placeholder={t('announcement_title')}
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                  required
                />
                <textarea
                  placeholder={t('announcement_content_english')}
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                  rows="4"
                  required
                />
                <textarea
                  placeholder={t('announcement_content_arabic')}
                  value={announcementForm.content_ar}
                  onChange={(e) => setAnnouncementForm({...announcementForm, content_ar: e.target.value})}
                  rows="4"
                  style={{ direction: 'rtl' }}
                />
                <select
                  value={announcementForm.target}
                  onChange={(e) => setAnnouncementForm({...announcementForm, target: e.target.value})}
                >
                  <option value="global">{t('all_users')}</option>
                </select>
                {/* Email options for announcement */}
                <div className="form-row" style={{ marginTop: '0.5rem' }}>
                  <ToggleSwitch
                    checked={announcementEmailOptions.sendEmail}
                    onChange={(val)=> setAnnouncementEmailOptions({ ...announcementEmailOptions, sendEmail: val })}
                    label={t('send_email_notification')}
                  />
                  {announcementEmailOptions.sendEmail && (
                    <select
                      value={announcementEmailOptions.lang}
                      onChange={(e)=> setAnnouncementEmailOptions({ ...announcementEmailOptions, lang: e.target.value })}
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="both">Bilingual (EN + AR)</option>
                    </select>
                  )}
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (editingAnnouncement ? t('updating_generic') : t('creating')) : (editingAnnouncement ? t('update_announcement_btn') : t('create_announcement_btn'))}
                  </button>
                  {editingAnnouncement && (
                    <button type="button" onClick={() => {
                      setEditingAnnouncement(null);
                      setAnnouncementForm({ title: '', content: '', content_ar: '', target: 'global' });
                    }} className="cancel-btn">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
              
              <SmartGrid
                data={announcements}
                title={t('recent_announcements')}
                quickFilters={{
                  active: announcementFilter,
                  onFilterChange: setAnnouncementFilter,
                  buttons: [
                    { 
                      key: 'all', 
                      label: t('all'),
                      count: announcements.length,
                      filter: () => true 
                    },
                    { 
                      key: 'today', 
                      label: t('today'),
                      count: announcements.filter(a => {
                        const date = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
                        const today = new Date();
                        return date.toDateString() === today.toDateString();
                      }).length,
                      filter: (a) => {
                        const date = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
                        const today = new Date();
                        return date.toDateString() === today.toDateString();
                      }
                    },
                    { 
                      key: '7days', 
                      label: t('last7'),
                      count: announcements.filter(a => {
                        const date = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        return date >= weekAgo;
                      }).length,
                      filter: (a) => {
                        const date = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        return date >= weekAgo;
                      }
                    },
                    { 
                      key: '30days', 
                      label: t('last30'),
                      count: announcements.filter(a => {
                        const date = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
                        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        return date >= monthAgo;
                      }).length,
                      filter: (a) => {
                        const date = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
                        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        return date >= monthAgo;
                      }
                    }
                  ]
                }}
                columns={[
                  { header: 'Title', accessor: 'title' },
                  { 
                    header: 'Content', 
                    accessor: 'content',
                    render: (content) => content ? (content.length > 100 ? content.substring(0, 100) + '...' : content) : 'No content'
                  },
                  { 
                    header: 'Target', 
                    accessor: 'target',
                    render: (target) => target === 'global' ? 'All Users' : target
                  },
                  { 
                    header: 'Created', 
                    accessor: 'createdAt',
                    render: (createdAt) => {
                      if (!createdAt) return 'Unknown';
                      const date = createdAt.seconds ? 
                        new Date(createdAt.seconds * 1000) : 
                        new Date(createdAt);
                      return date.toLocaleString('en-GB');
                    }
                  }
                ]}
                allowEdit={true}
                allowDelete={true}
                onEdit={(announcement) => {
                  setEditingAnnouncement(announcement);
                  setAnnouncementForm({
                    title: announcement.title || '',
                    content: announcement.content || '',
                    content_ar: announcement.content_ar || '',
                    target: announcement.target || 'global'
                  });
                }}
                onDelete={async (announcement) => {
                  setAnnouncements(prev => prev.filter(a => a.docId !== announcement.docId));
                  
                  try {
                    const result = await deleteAnnouncement(announcement.docId);
                    if (result.success) {
                      toast?.showSuccess('Announcement deleted successfully!');
                    } else {
                      setAnnouncements(prev => [...prev, announcement].sort((a, b) => 
                        new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt) - 
                        new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt)
                      ));
                      toast?.showError('Error deleting announcement: ' + result.error);
                    }
                  } catch (error) {
                    setAnnouncements(prev => [...prev, announcement].sort((a, b) => 
                      new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt) - 
                      new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt)
                    ));
                    toast?.showError('Error deleting announcement: ' + error.message);
                  }
                }}
                searchPlaceholder={t('search_announcements')}
              />
            </div>
          )}

          {activeTab === 'login' && (
            <div className="login-activity-tab">
              <h2>{t('activity_logs')}</h2>
              <div style={{ display:'flex', gap:12, alignItems:'center', margin:'0.5rem 0 1rem', flexWrap:'wrap' }}>
                <select value={activityTypeFilter} onChange={(e)=>setActivityTypeFilter(e.target.value)} style={{ padding:'8px 10px', border:'1px solid #ddd', borderRadius:8, fontWeight: 600, flex:'1 1 180px' }}>
                  <option value="all">{t('all_activity_types')}</option>
                  <option value="login">🔐 Login</option>
                  <option value="signup">✨ Signup</option>
                  <option value="profile_update">👤 Profile Update</option>
                  <option value="password_change">🔑 Password Change</option>
                  <option value="email_change">📧 Email Change</option>
                  <option value="session_timeout">⏱️ Session Timeout</option>
                </select>
                <input
                  type="text"
                  placeholder={t('search_by_email_name_ua')}
                  value={loginSearch}
                  onChange={(e)=>setLoginSearch(e.target.value)}
                  style={{ padding:'8px 10px', border:'1px solid #ddd', borderRadius:8, flex:'1 1 280px' }}
                />
                <select value={loginUserFilter} onChange={(e)=>setLoginUserFilter(e.target.value)} style={{ padding:'8px 10px', border:'1px solid #ddd', borderRadius:8, flex:'1 1 180px' }}>
                  <option value="all">{t('all_users')}</option>
                  {users.map(u => (
                    <option key={u.docId} value={u.email || u.docId}>{u.displayName ? `${u.displayName} (${u.email||u.docId})` : (u.email || u.docId)}</option>
                  ))}
                </select>
                <label style={{ color:'#666', display:'flex', alignItems:'center', gap:4 }}>{t('from') || 'From'} <input type="date" value={loginFrom} onChange={(e)=>setLoginFrom(e.target.value)} style={{ padding:'6px' }} /></label>
                <label style={{ color:'#666', display:'flex', alignItems:'center', gap:4 }}>{t('to') || 'To'} <input type="date" value={loginTo} onChange={(e)=>setLoginTo(e.target.value)} style={{ padding:'6px' }} /></label>
                <button onClick={loadData} style={{ padding:'8px 16px', border:'1px solid #ddd', borderRadius:8, cursor:'pointer', background:'#667eea', color:'white', fontWeight:600 }}>{t('refresh')}</button>
              </div>
              {(() => {
                const list = filteredLoginLogs();
                return (
                  <div style={{ overflowX:'auto' }}>
                    <table className="table" style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign:'left', padding:'8px', borderBottom:'1px solid #eee' }}>{t('type')}</th>
                          <th style={{ textAlign:'left', padding:'8px', borderBottom:'1px solid #eee' }}>{t('when')}</th>
                          <th style={{ textAlign:'left', padding:'8px', borderBottom:'1px solid #eee' }}>{t('user_col')}</th>
                          <th style={{ textAlign:'left', padding:'8px', borderBottom:'1px solid #eee' }}>{t('email_col')}</th>
                          <th style={{ textAlign:'left', padding:'8px', borderBottom:'1px solid #eee' }}>{t('user_agent_col')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.slice(0, 500).map((l) => {
                          const typeIcons = {
                            login: '🔐',
                            signup: '✨',
                            profile_update: '👤',
                            password_change: '🔑',
                            email_change: '📧',
                            session_timeout: '⏱️',
                            message_sent: '📤',
                            message_received: '📥',
                            submission: '📝',
                            announcement_read: '📢'
                          };
                          return (
                            <tr key={l.docId}>
                              <td style={{ padding:'8px', borderBottom:'1px solid #f3f3f3', whiteSpace:'nowrap' }}>
                                <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>{typeIcons[l.type] || '📋'}</span>
                                <span style={{ fontSize: '0.85rem' }}>{l.type || 'login'}</span>
                              </td>
                              <td style={{ padding:'8px', borderBottom:'1px solid #f3f3f3', whiteSpace:'nowrap' }}>{l.when?.seconds ? new Date(l.when.seconds*1000).toLocaleString('en-GB') : new Date(l.when).toLocaleString('en-GB')}</td>
                              <td style={{ padding:'8px', borderBottom:'1px solid #f3f3f3' }}>{l.displayName || '—'}</td>
                              <td style={{ padding:'8px', borderBottom:'1px solid #f3f3f3' }}>{l.email || '—'}</td>
                              <td style={{ padding:'8px', borderBottom:'1px solid #f3f3f3' }}>
                                <div style={{ maxWidth: 520, overflow:'hidden', textOverflow:'ellipsis' }}>{l.userAgent || '—'}</div>
                              </td>
                            </tr>
                          );
                        })}
                        {list.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ padding:'1rem', color:'#888' }}>{t('no_activity_logs_yet')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="classes-tab">
              <h2>{t('classes_management')}</h2>
              
              {editingClass && (
                <div className="edit-mode-indicator">
                  📝 Editing Class: {editingClass.name} ({editingClass.code})
                </div>
              )}
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!classForm.name.trim()) {
                  toast?.showError(t('class_name') + ' is required');
                  return;
                }
                
                setLoading(true);
                try {
                  const result = editingClass ? 
                    await updateClass(editingClass.docId, classForm) : 
                    await addClass(classForm);
                    
                  if (result.success) {
                    await loadData();
                    setEditingClass(null);
                    setClassForm({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '' });
                    toast?.showSuccess(editingClass ? 'Class updated successfully!' : 'Class created successfully!');
                  } else {
                    toast?.showError('Error: ' + result.error);
                  }
                } catch (error) {
                  toast?.showError('Error: ' + error.message);
                } finally {
                  setLoading(false);
                }
              }} className="activity-form">
                <div className="form-row">
                  <input 
                    placeholder={t('class_name')}
                    value={classForm.name} 
                    onChange={e => setClassForm({...classForm, name: e.target.value})} 
                    required 
                  />
                  <input 
                    placeholder={t('class_name_arabic')}
                    value={classForm.nameAr || ''} 
                    onChange={e => setClassForm({...classForm, nameAr: e.target.value})} 
                    dir="rtl"
                  />
                  <input 
                    placeholder={t('class_code') + ' (' + t('optional') + ')'} 
                    value={classForm.code} 
                    onChange={e => setClassForm({...classForm, code: e.target.value})} 
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      value={classForm.term?.split(' ')[0] || ''} 
                      onChange={e => {
                        const year = classForm.term?.split(' ')[1] || new Date().getFullYear();
                        setClassForm({...classForm, term: e.target.value ? `${e.target.value} ${year}` : ''});
                      }}
                      required
                    >
                      <option value="">{t('term')}</option>
                      <option value="Fall">{t('fall')}</option>
                      <option value="Spring">{t('spring')}</option>
                      <option value="Summer">{t('summer')}</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder={t('year')||'Year'} 
                      min="2020" 
                      max="2030" 
                      value={classForm.term?.split(' ')[1] || ''} 
                      onChange={e => {
                        const semester = classForm.term?.split(' ')[0] || '';
                        setClassForm({...classForm, term: semester ? `${semester} ${e.target.value}` : e.target.value});
                      }}
                      required
                      style={{ width: '100px' }}
                    />
                  </div>
                  <select 
                    value={classForm.ownerEmail} 
                    onChange={e => setClassForm({...classForm, ownerEmail: e.target.value})} 
                    required
                  >
                    <option value="">{t('select_owner')}</option>
                    {users.filter(user => user.role === 'admin').map(admin => (
                      <option key={admin.docId || admin.id} value={admin.email}>
                        {admin.displayName || admin.email} ({admin.email})
                      </option>
                    ))}
                    {allowlist?.adminEmails?.filter(email => 
                      !users.some(u => u.email === email)
                    ).map(email => (
                      <option key={email} value={email}>
                        {email} (from allowlist)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (editingClass ? t('updating') : t('creating')) : (editingClass ? t('update') + ' Class' : t('create_class'))}
                  </button>
                  {editingClass && (
                    <button type="button" onClick={() => {
                      setEditingClass(null);
                      setClassForm({ id: '', name: '', nameAr: '', code: '', term: '', ownerEmail: '' });
                    }} className="cancel-btn">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
              
              <SmartGrid
                data={classes}
                title={t('existing_classes')}
                columns={[
                  { header: t('name') || 'Name', accessor: 'name' },
                  { header: t('code') || 'Code', accessor: 'code' },
                  { header: t('term') || 'Term', accessor: 'term' },
                  { header: t('owner') || 'Owner', accessor: 'ownerEmail' },
                  { 
                    header: t('students') || 'Students', 
                    accessor: 'docId',
                    render: (docId, classItem) => {
                      const effectiveId = docId || classItem?.id;
                      const classEnrollments = enrollments.filter(e => e.classId === effectiveId);
                      return `${classEnrollments.length} ${t('enrolled') || 'enrolled'}`;
                    }
                  }
                ]}
                onEdit={(classItem) => {
                  setEditingClass(classItem);
                  setClassForm({
                    id: classItem.id,
                    name: classItem.name || '',
                    code: classItem.code || '',
                    term: classItem.term || '',
                    ownerEmail: classItem.ownerEmail || ''
                  });
                }}
                validateDelete={validateClassDeletion}
                onDelete={async (classItem) => {
                  // Optimistic update - remove from UI immediately
                  setClasses(prev => prev.filter(c => c.docId !== classItem.docId));
                  
                  try {
                    const result = await deleteClass(classItem.docId);
                    if (result.success) {
                      // Also delete enrollments
                      const classEnrollments = enrollments.filter(e => e.classId === classItem.docId);
                      for (const enrollment of classEnrollments) {
                        await deleteEnrollment(enrollment.docId);
                      }
                      await loadData();
                      toast?.showSuccess('Class deleted successfully!');
                    } else {
                      // Revert optimistic update on error
                      setClasses(prev => [...prev, classItem].sort((a, b) => a.name.localeCompare(b.name)));
                      toast?.showError('Error deleting class: ' + result.error);
                    }
                  } catch (error) {
                    // Revert optimistic update on error
                    setClasses(prev => [...prev, classItem].sort((a, b) => a.name.localeCompare(b.name)));
                    toast?.showError('Error deleting class: ' + error.message);
                  }
                }}
                searchPlaceholder={t('search_classes') || 'Search classes by name or code...'}
              />
            </div>
          )}

          {activeTab === 'enrollments' && (
            <div className="enrollments-tab">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!enrollmentForm.userId || !enrollmentForm.classId) {
                  toast?.showError('Please select both user and class');
                  return;
                }
                
                // Check if enrollment already exists
                const existingEnrollment = enrollments.find(e => 
                  e.userId === enrollmentForm.userId && e.classId === enrollmentForm.classId
                );
                
                if (existingEnrollment) {
                  toast?.showError('This user is already enrolled in this class');
                  return;
                }
                
                setLoading(true);
                try {
                  const result = await addEnrollment(enrollmentForm);
                  if (result.success) {
                    await loadData();
                    setEnrollmentForm({ userId: '', classId: '', role: 'student' });
                    toast?.showSuccess('Enrollment added successfully!');
                  } else {
                    toast?.showError('Error: ' + result.error);
                  }
                } catch (error) {
                  toast?.showError('Error: ' + error.message);
                } finally {
                  setLoading(false);
                }
              }} className="activity-form">
                <div className="form-row">
                  <select 
                    value={enrollmentForm.userId} 
                    onChange={e => setEnrollmentForm({...enrollmentForm, userId: e.target.value})} 
                    required
                  >
                    <option value="">{t('select_user')}</option>
                    {users.map(u => (
                      <option key={u.docId || u.id} value={u.docId || u.id}>
                        {u.email} {u.displayName ? `(${u.displayName})` : ''}
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    value={enrollmentForm.classId} 
                    onChange={e => setEnrollmentForm({...enrollmentForm, classId: e.target.value})} 
                    required
                  >
                    <option value="">{t('select_class')}</option>
                    {classes.map(c => (
                      <option key={c.docId || c.id} value={c.docId || c.id}>
                        {c.name} ({c.code}) - {c.term}
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    value={enrollmentForm.role} 
                    onChange={e => setEnrollmentForm({...enrollmentForm, role: e.target.value})}
                  >
                    <option value="student">{t('student')}</option>
                    <option value="ta">{t('teaching_assistant') || 'Teaching Assistant'}</option>
                    <option value="instructor">{t('instructor')}</option>
                  </select>
                </div>
                
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? t('adding') : t('add_enrollment')}
                </button>
              </form>
              
              <SmartGrid
                data={enrollments}
                title={t('current_enrollments_title')}
                columns={[
                  { 
                    header: t('user_col'), 
                    accessor: 'userId',
                    render: (userId) => {
                      const user = users.find(u => (u.docId || u.id) === userId);
                      return user ? `${user.email}${user.displayName ? ` (${user.displayName})` : ''}` : userId;
                    }
                  },
                  { 
                    header: t('class_col'), 
                    accessor: 'classId',
                    render: (classId) => {
                      const classItem = classes.find(c => (c.docId || c.id) === classId);
                      return classItem ? `${classItem.name} (${classItem.code})` : classId;
                    }
                  },
                  { 
                    header: t('role_col'), 
                    accessor: 'role',
                    render: (role) => {
                      const roleMap = {
                        'student': '👨‍🎓 Student',
                        'ta': '👨‍🏫 TA',
                        'instructor': '👩‍🏫 Instructor'
                      };
                      return roleMap[role] || role;
                    }
                  },
                  { 
                    header: t('enrolled_col'), 
                    accessor: 'createdAt',
                    render: (value) => {
                      if (!value) return 'Unknown';
                      const date = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
                      return date.toLocaleDateString('en-GB');
                    }
                  }
                ]}
                onDelete={async (enrollment) => {
                  const result = await deleteEnrollment(enrollment.docId);
                  if (result.success) {
                    await loadData();
                    toast?.showSuccess('Enrollment removed successfully!');
                  } else {
                    toast?.showError('Error: ' + result.error);
                  }
                }}
                deleteMessage={(enrollment) => {
                  const user = users.find(u => u.docId === enrollment.userId);
                  const classItem = classes.find(c => c.docId === enrollment.classId);
                  const userName = user ? user.email : enrollment.userId;
                  const className = classItem ? classItem.name : enrollment.classId;
                  return `Remove ${userName} from ${className}? This action cannot be undone.`;
                }}
                allowEdit={false}
                searchPlaceholder={t('search_enrollments')}
              />
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="submissions-tab">
              <SmartGrid
                data={submissions}
                title={t('student_submissions')}
                quickFilters={{
                  active: submissionFilter,
                  onFilterChange: setSubmissionFilter,
                  buttons: [
                    { 
                      key: 'all', 
                      label: t('all'),
                      count: submissions.length,
                      filter: () => true 
                    },
                    { 
                      key: 'pending', 
                      label: '⏳ Pending',
                      count: submissions.filter(s => s.status === 'pending' || s.status === 'submitted' || !s.status).length,
                      filter: (s) => s.status === 'pending' || s.status === 'submitted' || !s.status
                    },
                    { 
                      key: 'graded', 
                      label: '✅ Graded',
                      count: submissions.filter(s => s.status === 'graded').length,
                      filter: (s) => s.status === 'graded'
                    },
                    { 
                      key: 'late', 
                      label: '⏰ Late',
                      count: submissions.filter(s => s.status === 'late').length,
                      filter: (s) => s.status === 'late'
                    }
                  ]
                }}
                columns={[
                  { 
                    header: t('activity_col'), 
                    accessor: 'activityId',
                    render: (activityId) => {
                      const activity = activities.find(a => a.id === activityId);
                      return activity ? activity.title_en : activityId;
                    }
                  },
                  { 
                    header: t('student_col'), 
                    accessor: 'userId',
                    render: (userId) => {
                      const user = users.find(u => u.id === userId);
                      return user ? user.email : userId;
                    }
                  },
                  { 
                    header: t('status_col'), 
                    accessor: 'status',
                    render: (status) => {
                      const statusMap = {
                        'submitted': '📝 Submitted',
                        'graded': '✅ Graded',
                        'late': '⏰ Late',
                        'pending': '⏳ Pending'
                      };
                      return statusMap[status] || status || '📝 Submitted';
                    }
                  },
                  { 
                    header: t('score_col'), 
                    accessor: 'score',
                    render: (score, row) => {
                      // Find activity max score
                      const act = activities.find(a => a.id === row.activityId || a.docId === row.activityId);
                      const maxScore = act?.maxScore || 100;
                      return score !== null && score !== undefined ? `${score} / ${maxScore}` : 'Not graded yet';
                    }
                  },
                  { 
                    header: t('submitted_at_col'), 
                    accessor: 'submittedAt',
                    render: (submittedAt) => {
                      if (!submittedAt) return t('unknown');
                      const date = submittedAt.seconds ? 
                        new Date(submittedAt.seconds * 1000) : 
                        new Date(submittedAt);
                      return date.toLocaleString('en-GB');
                    }
                  },
                  { 
                    header: t('files_col'), 
                    accessor: 'files',
                    render: (files) => {
                      if (!files || files.length === 0) return t('no_files');
                      return (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {files.map((file, i) => (
                            <a 
                              key={i} 
                              href={file} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{
                                background: '#e3f2fd',
                                color: '#1976d2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                fontSize: '0.8rem'
                              }}
                            >
                              File {i + 1}
                            </a>
                          ))}
                        </div>
                      );
                    }
                  }
                ]}
                onEdit={async (submission) => {
                  const newScore = prompt(`Enter score for this submission (0-100):`, submission.score || '');
                  if (newScore !== null && !isNaN(newScore)) {
                    const score = Math.max(0, Math.min(100, Number(newScore)));
                    setLoading(true);
                    try {
                      const result = await gradeSubmission(submission.id, { 
                        score: score, 
                        status: 'graded' 
                      });
                      if (result.success) {
                        await loadData();
                        // Notify student
                        try {
                          const act = activities.find(a => a.id === submission.activityId || a.docId === submission.activityId);
                          const maxScore = act?.maxScore || 100;
                          await notifyAllUsers; // noop to ensure import used
                        } catch {}
                        try {
                          const { addNotification } = await import('../firebase/notifications');
                          const act = activities.find(a => a.id === submission.activityId || a.docId === submission.activityId);
                          const maxScore = act?.maxScore || 100;
                          await addNotification({
                            userId: submission.userId,
                            title: '📊 Activity Reviewed',
                            message: `Your submission for ${submission.activityId} was graded: ${score} / ${maxScore}.`,
                            type: 'grade',
                            data: { activityId: submission.activityId, submissionId: submission.id }
                          });
                        } catch (e) { console.warn('Failed to send grade notification', e); }
                        alert(`Submission graded with score: ${score}`);
                      } else {
                        alert('Error grading submission: ' + result.error);
                      }
                    } catch (error) {
                      alert('Error: ' + error.message);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                allowDelete={false}
                searchPlaceholder={t('search_submissions')}
                pageSize={15}
              />
            </div>
          )}
          {activeTab === 'users' && (
            <div className="users-tab">
              <p style={{ color: '#555', marginBottom:'1rem' }}>{t('invite_users_blurb')}</p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!userForm.email.trim()) {
                  toast?.showError('Email is required');
                  return;
                }
                
                setLoading(true);
                try {
                  if (editingUser) {
                    const result = await updateUser(editingUser.docId, userForm);
                    if (!result.success) throw new Error(result.error || 'Failed to update user');
                    toast?.showSuccess('User updated successfully!');
                  } else {
                    // Add to allowlist if checkbox is checked
                    if (autoAddToAllowlist && userForm.email) {
                      const targetList = userForm.role === 'admin' ? 'adminEmails' : 'allowedEmails';
                      const currentEmails = allowlist[targetList] || [];
                      
                      if (!currentEmails.includes(userForm.email)) {
                        const updatedAllowlist = {
                          ...allowlist,
                          [targetList]: [...currentEmails, userForm.email]
                        };
                        setAllowlist(updatedAllowlist);
                        
                        // Save to Firestore
                        try {
                          await updateAllowlist(updatedAllowlist);
                        } catch (allowlistError) {
                          toast?.showWarning('Failed to update allowlist: ' + allowlistError.message);
                        }
                      }
                      toast?.showSuccess(`Invite prepared. ${userForm.email} added to ${userForm.role} allowlist. Ask them to sign up.`);
                    } else {
                      toast?.showInfo('No changes saved. Provide an email or enable allowlist option.');
                    }
                  }
                    
                  await loadData();
                  setEditingUser(null);
                  setUserForm({ email: '', displayName: '', realName: '', studentNumber: '', role: 'student' });
                } catch (error) {
                  toast?.showError('Error: ' + error.message);
                } finally {
                  setLoading(false);
                }
              }} className="activity-form">
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <input
                    type="email"
                    placeholder={t('user_email_placeholder')}
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder={t('user_display_name_placeholder')}
                    value={userForm.displayName}
                    onChange={(e) => setUserForm({...userForm, displayName: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder={t('real_name_placeholder') || 'Real Name (First Last)'}
                    value={userForm.realName || ''}
                    onChange={(e) => setUserForm({...userForm, realName: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder={t('student_number_placeholder') || 'Student Number (Optional)'}
                    value={userForm.studentNumber || ''}
                    onChange={(e) => setUserForm({...userForm, studentNumber: e.target.value})}
                  />
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  >
                    <option value="student">{t('student')}</option>
                    <option value="admin">{t('admin')}</option>
                  </select>
                </div>
                
                {!editingUser && (
                  <div className="form-row">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={autoAddToAllowlist}
                        onChange={(e) => setAutoAddToAllowlist(e.target.checked)}
                      />
                      Auto-add email to student allowlist
                    </label>
                  </div>
                )}
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (editingUser ? t('updating_generic') : t('adding')) : (editingUser ? t('update_user_btn') : t('add_user_btn'))}
                  </button>
                  {editingUser && (
                    <button type="button" onClick={() => {
                      setEditingUser(null);
                      setUserForm({ email: '', displayName: '', role: 'student' });
                    }} className="cancel-btn">
                      {t('cancel')}
                    </button>
                  )}
                </div>
              </form>
              
              <SmartGrid
                data={users}
                title={t('registered_users')}
                quickFilters={{
                  active: userQuickFilter,
                  onFilterChange: (key) => setUserQuickFilter(key),
                  buttons: [
                    { 
                      key: 'all', 
                      label: t('all_users'),
                      count: users.length,
                      filter: () => true 
                    },
                    { 
                      key: 'students', 
                      label: `👨‍🎓 ${t('students')}`,
                      count: users.filter(u => (u.role || 'student') === 'student').length,
                      filter: (u) => (u.role || 'student') === 'student'
                    },
                    { 
                      key: 'admins', 
                      label: `👨‍💼 ${t('admins')}`,
                      count: users.filter(u => u.role === 'admin').length,
                      filter: (u) => u.role === 'admin'
                    }
                  ]
                }}
                columns={[
                  { header: t('email_col'), accessor: 'email' },
                  { header: t('display_name_col'), accessor: 'displayName' },
                  { header: t('role_col'), accessor: 'role', render: (value) => value || t('student') },
                  { 
                    header: t('enrolled_classes_col'), 
                    accessor: 'enrolledClasses',
                    render: (value, user) => {
                      const userEnrollments = enrollments.filter(e => e.userId === user.docId || (e.userEmail || e.email) === user.email);
                      return userEnrollments.length;
                    }
                  },
                  { 
                    header: t('progress'), 
                    accessor: 'progress',
                    render: (value, user) => {
                      const userSubmissions = submissions.filter(s => s.userId === user.id);
                      const completedCount = userSubmissions.filter(s => s.status === 'graded').length;
                      const totalActivities = activities.length;
                      
                      return (
                        <a 
                          href={`/student-progress?userId=${user.docId}`} 
                          style={{ 
                            color: '#667eea', 
                            textDecoration: 'none',
                            fontWeight: '600'
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/student-progress?userId=${user.docId}`;
                          }}
                        >
                          {completedCount}/{totalActivities} activities →
                        </a>
                      );
                    }
                  },
                  { 
                    header: t('joined'), 
                    accessor: 'createdAt',
                    render: (value) => {
                      if (!value) return t('unknown');
                      const d = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
                      return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
                    }
                  },
                  {
                    header: t('actions_col'),
                    accessor: 'docId',
                    render: (value, user) => (
                      <button
                        onClick={async () => {
                          try {
                            const { sendPasswordResetEmail } = await import('firebase/auth');
                            const { auth } = await import('../firebase/config');
                            
                            await sendPasswordResetEmail(auth, user.email);
                            toast?.showSuccess(`Password reset email sent to ${user.email}`);
                          } catch (error) {
                            console.error('Error:', error);
                            toast?.showError('Failed: ' + error.message);
                          }
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        🔑
                      </button>
                    )
                  }
                ]}
                onEdit={(user) => {
                  setEditingUser(user);
                  setUserForm({
                    email: user.email || '',
                    displayName: user.displayName || '',
                    realName: user.realName || '',
                    studentNumber: user.studentNumber || '',
                    role: user.role || 'student'
                  });
                }}
                searchPlaceholder={t('search_users')}
                validateDelete={validateUserDeletion}
                onDelete={async (user) => {
                  // Optimistic update - remove from UI immediately
                  setUsers(prev => prev.filter(u => u.docId !== user.docId));
                  
                  try {
                    const result = await deleteUser(user.docId);
                    if (result.success) {
                      // Also delete their enrollments
                      const userEnrollments = enrollments.filter(e => e.userId === user.docId);
                      for (const enrollment of userEnrollments) {
                        await deleteEnrollment(enrollment.docId);
                      }
                      await loadData();
                      toast?.showSuccess('User deleted successfully!');
                    } else {
                      // Revert optimistic update on error
                      setUsers(prev => [...prev, user].sort((a, b) => a.email.localeCompare(b.email)));
                      toast?.showError('Error deleting user: ' + result.error);
                    }
                  } catch (error) {
                    // Revert optimistic update on error
                    setUsers(prev => [...prev, user].sort((a, b) => a.email.localeCompare(b.email)));
                    toast?.showError('Error deleting user: ' + error.message);
                  }
                }}
                searchPlaceholder={t('search_users')}
              />
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="resources-tab">
              <h2>{t('resources_management')}</h2>
              
              {editingResource && (
                <div className="edit-mode-indicator">
                  📝 Editing Resource: {editingResource.title}
                </div>
              )}
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!resourceForm.title.trim() || !resourceForm.url.trim()) {
                  toast?.showError('Title and URL are required');
                  return;
                }
                
                setLoading(true);
                try {
                  const result = editingResource ? 
                    await updateResource(editingResource.docId, resourceForm) :
                    await addResource(resourceForm);
                    
                  if (result.success) {
                    await loadData();
                    setResourceForm({ title: '', description: '', url: '', type: 'link', dueDate: '', optional: false });
                    setEditingResource(null);
                    toast?.showSuccess(editingResource ? 'Resource updated successfully!' : 'Resource created successfully!');
                  } else {
                    toast?.showError(`Error ${editingResource ? 'updating' : 'creating'} resource: ` + result.error);
                  }
                } catch (error) {
                  toast?.showError(`Error ${editingResource ? 'updating' : 'creating'} resource: ` + error.message);
                } finally {
                  setLoading(false);
                }
              }} className="activity-form">
                <div className="form-row">
                  <input
                    type="text"
                    placeholder={t('resource_title') + ' (EN)'}
                    value={resourceForm.title_en || resourceForm.title || ''}
                    onChange={(e) => setResourceForm({...resourceForm, title_en: e.target.value, title: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder={t('resource_title') + ' (AR)'}
                    value={resourceForm.title_ar || ''}
                    onChange={(e) => setResourceForm({...resourceForm, title_ar: e.target.value})}
                  />
                  <select
                    value={resourceForm.type}
                    onChange={(e) => setResourceForm({...resourceForm, type: e.target.value})}
                  >
                    <option value="document">📄 Document</option>
                    <option value="link">🔗 Link</option>
                    <option value="video">📺 Video</option>
                  </select>
                </div>
                
                <div className="form-row">
                  <textarea
                    placeholder={t('resource_description') + ' (EN)'}
                    value={resourceForm.description_en || resourceForm.description || ''}
                    onChange={(e) => setResourceForm({...resourceForm, description_en: e.target.value, description: e.target.value})}
                    rows="3"
                  />
                  <textarea
                    placeholder={t('resource_description') + ' (AR)'}
                    value={resourceForm.description_ar || ''}
                    onChange={(e) => setResourceForm({...resourceForm, description_ar: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="form-row">
                  <input
                    type="url"
                    placeholder={t('resource_url')}
                    value={resourceForm.url}
                    onChange={(e) => setResourceForm({...resourceForm, url: e.target.value})}
                    required
                  />
                  <DateTimePicker
                    value={resourceForm.dueDate}
                    onChange={(iso) => setResourceForm({...resourceForm, dueDate: iso})}
                    placeholder={t('due_date') + ' (' + t('optional') + ')'}
                  />
                </div>
                
                <div className="form-row">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={resourceForm.optional}
                      onChange={(e) => setResourceForm({...resourceForm, optional: e.target.checked})}
                    />
{t('optional_resource')}
                  </label>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (editingResource ? t('updating') : t('creating')) : (editingResource ? t('update') + ' Resource' : t('create_resource'))}
                  </button>
                  {editingResource && (
                    <button type="button" onClick={() => {
                      setEditingResource(null);
                      setResourceForm({ title: '', description: '', url: '', type: 'link', dueDate: '', optional: false });
                    }} className="cancel-btn">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
              
              <SmartGrid
                data={resources}
                title={t('learning_resources_title')}
                columns={[
                  { header: t('title_col'), accessor: 'title' },
                  { header: t('type_col'), accessor: 'type', render: (type) => {
                    const typeMap = {
                      'document': '📄 Document',
                      'link': '🔗 Link',
                      'video': '📺 Video'
                    };
                    return typeMap[type] || type;
                  }},
                  { 
                    header: t('description_col'), 
                    accessor: 'description',
                    render: (desc) => desc ? (desc.length > 50 ? desc.substring(0, 50) + '...' : desc) : t('no_description')
                  },
                  { 
                    header: t('due_date_col'), 
                    accessor: 'dueDate',
                    render: (val) => {
                      if (!val) return t('no_deadline');
                      if (typeof val === 'object' && val.seconds) {
                        return new Date(val.seconds * 1000).toLocaleDateString('en-GB');
                      }
                      const str = String(val);
                      const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                      if (ddmmyyyy.test(str)) return str;
                      const d = new Date(str);
                      return isNaN(d.getTime()) ? str : d.toLocaleDateString('en-GB');
                    }
                  },
                  { 
                    header: t('required_col'), 
                    accessor: 'optional',
                    render: (optional) => optional ? t('required_optional') : t('required_yes')
                  },
                  { 
                    header: 'Created', 
                    accessor: 'createdAt',
                    render: (createdAt) => {
                      if (!createdAt) return 'Unknown';
                      const date = createdAt.seconds ? 
                        new Date(createdAt.seconds * 1000) : 
                        new Date(createdAt);
                      return date.toLocaleDateString('en-GB');
                    }
                  }
                ]}
                onEdit={(resource) => {
                  setEditingResource(resource);
                  setResourceForm({
                    title: resource.title || '',
                    description: resource.description || '',
                    url: resource.url || '',
                    type: resource.type || 'link',
                    dueDate: resource.dueDate || '',
                    optional: resource.optional || false
                  });
                }}
                onDelete={async (resource) => {
                  setResources(prev => prev.filter(r => r.docId !== resource.docId));
                  
                  try {
                    const result = await deleteResource(resource.docId);
                    if (result.success) {
                      toast?.showSuccess('Resource deleted successfully!');
                    } else {
                      setResources(prev => [...prev, resource].sort((a, b) => 
                        new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt) - 
                        new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt)
                      ));
                      toast?.showError('Error deleting resource: ' + result.error);
                    }
                  } catch (error) {
                    setResources(prev => [...prev, resource].sort((a, b) => 
                      new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt) - 
                      new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt)
                    ));
                    toast?.showError('Error deleting resource: ' + error.message);
                  }
                }}
                searchPlaceholder={t('search_resources')}
              />
            </div>
          )}

          {activeTab === 'smtp' && (
            <div className="smtp-tab">
              <div style={{ background:'white', border:'1px solid #eee', borderRadius:12, padding:'1.5rem', maxWidth:760 }}>
                {(() => {
                  if (!smtpLoading && !smtpConfig.__loaded) {
                    (async () => {
                      setSmtpLoading(true);
                      const r = await getSMTPConfig();
                      if (r.success && r.data) setSmtpConfig({ ...r.data, __loaded: true });
                      else setSmtpConfig(s => ({ ...s, __loaded: true }));
                      setSmtpLoading(false);
                    })();
                  }
                  return null;
                })()}
                <div style={{ display:'grid', gap:12 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={{ fontWeight:600, fontSize:'0.9rem', display:'block', marginBottom:4 }}>SMTP Host</label>
                      <input value={smtpConfig.host} onChange={(e)=>setSmtpConfig({...smtpConfig, host:e.target.value})} placeholder="smtp.gmail.com" style={{ width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:6 }} />
                    </div>
                    <div>
                      <label style={{ fontWeight:600, fontSize:'0.9rem', display:'block', marginBottom:4 }}>SMTP Port</label>
                      <input type="number" value={smtpConfig.port} onChange={(e)=>setSmtpConfig({...smtpConfig, port:parseInt(e.target.value||'0')})} placeholder="587" style={{ width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:6 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontWeight:600, fontSize:'0.9rem', display:'block', marginBottom:4 }}>Email Address</label>
                    <input type="email" value={smtpConfig.user} onChange={(e)=>setSmtpConfig({...smtpConfig, user:e.target.value})} placeholder="your-email@gmail.com" style={{ width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:6 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight:600, fontSize:'0.9rem', display:'block', marginBottom:4 }}>App Password</label>
                    <input type="password" value={smtpConfig.password} onChange={(e)=>setSmtpConfig({...smtpConfig, password:e.target.value})} placeholder="16-character app password" style={{ width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:6 }} />
                  </div>
                  <div>
                    <label style={{ fontWeight:600, fontSize:'0.9rem', display:'block', marginBottom:4 }}>Sender Name</label>
                    <input value={smtpConfig.senderName} onChange={(e)=>setSmtpConfig({...smtpConfig, senderName:e.target.value})} style={{ width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:6 }} />
                  </div>
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setSmtpTesting(true);
                          const { httpsCallable } = await import('firebase/functions');
                          const { functions } = await import('../firebase/config');
                          const testSMTP = httpsCallable(functions, 'testSMTP');
                          const result = await testSMTP({ to: user?.email || smtpConfig.user });
                          if (result.data.success) {
                            toast?.showSuccess('Test email sent! Check your inbox.');
                          } else {
                            toast?.showError('Test failed: ' + result.data.error);
                          }
                        } catch (error) {
                          toast?.showError('Test failed: ' + (error.message || 'Unknown error'));
                        } finally {
                          setSmtpTesting(false);
                        }
                      }}
                      style={{ padding:'10px 20px', background:'#28a745', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}
                      disabled={smtpTesting}
                    >
                      {smtpTesting ? 'Testing...' : '📧 Test SMTP'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setSmtpSaving(true);
                          const payload = {
                            host: smtpConfig.host,
                            port: smtpConfig.port,
                            secure: smtpConfig.secure,
                            user: smtpConfig.user,
                            password: smtpConfig.password,
                            senderName: smtpConfig.senderName,
                          };
                          const r = await updateSMTPConfig(payload);
                          if (r.success) toast?.showSuccess('SMTP configuration saved!');
                          else toast?.showError('Failed: ' + r.error);
                        } finally {
                          setSmtpSaving(false);
                        }
                      }}
                      style={{ padding:'10px 20px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}
                    >
                      {smtpSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="courses-tab">
              <p style={{ color:'#666', marginBottom:'1rem' }}>{t('manage_categories')}</p>
              
              {courses.length === 0 && (
                <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: 8, marginBottom: '1rem', textAlign: 'center' }}>
                  <p style={{ marginBottom: '0.75rem', color:'#555' }}>{t('no_categories_yet')}</p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await setCourse('programming', { name_en: 'Programming', name_ar: 'البرمجة', order: 1 });
                        await setCourse('computing', { name_en: 'Computing', name_ar: 'الحوسبة', order: 2 });
                        await setCourse('algorithm', { name_en: 'Algorithm', name_ar: 'الخوارزميات', order: 3 });
                        await setCourse('general', { name_en: 'General', name_ar: 'عام', order: 4 });
                        toast?.showSuccess('Default categories added!');
                        loadData();
                      } catch (err) {
                        toast?.showError('Failed to add defaults: ' + err.message);
                      }
                    }}
                    style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize:'0.95rem' }}
                  >
                    ➕ {t('add_default_categories')}
                  </button>
                </div>
              )}
              
              <form onSubmit={async (e)=>{
                e.preventDefault();
                if (!courseForm.id.trim()) { toast?.showError('Category ID required'); return; }
                try {
                  await setCourse(courseForm.id, { name_en: courseForm.name_en, name_ar: courseForm.name_ar, order: Number(courseForm.order) || 0 });
                  toast?.showSuccess(editingCourse ? 'Category updated!' : 'Category created!');
                  setCourseForm({ id: '', name_en: '', name_ar: '', order: 0 });
                  setEditingCourse(null);
                  loadData();
                } catch (err) {
                  toast?.showError('Failed to save category: ' + err.message);
                }
              }} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:'1.5rem', padding:'1rem', background:'#f8f9fa', borderRadius:8 }}>
                <input type="text" placeholder="ID (e.g., python)" value={courseForm.id} onChange={(e)=>setCourseForm({...courseForm, id: e.target.value.toLowerCase().trim()})} disabled={!!editingCourse} required style={{ padding:'0.6rem', border:'1px solid #ddd', borderRadius:6 }} />
                <input type="text" placeholder="Name (English)" value={courseForm.name_en} onChange={(e)=>setCourseForm({...courseForm, name_en: e.target.value})} required style={{ padding:'0.6rem', border:'1px solid #ddd', borderRadius:6 }} />
                <input type="text" placeholder="Name (Arabic)" value={courseForm.name_ar} onChange={(e)=>setCourseForm({...courseForm, name_ar: e.target.value})} style={{ padding:'0.6rem', border:'1px solid #ddd', borderRadius:6 }} />
                <input type="number" placeholder="Order" value={courseForm.order} onChange={(e)=>setCourseForm({...courseForm, order: e.target.value})} style={{ padding:'0.6rem', border:'1px solid #ddd', borderRadius:6 }} />
                <button type="submit" style={{ padding:'0.6rem 1rem', background:'linear-gradient(135deg, #667eea, #764ba2)', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>{editingCourse ? 'Update' : 'Add'}</button>
                {editingCourse && <button type="button" onClick={()=>{ setCourseForm({ id: '', name_en: '', name_ar: '', order: 0 }); setEditingCourse(null); }} style={{ padding:'0.6rem 1rem', background:'#6c757d', color:'white', border:'none', borderRadius:6, cursor:'pointer' }}>Cancel</button>}
              </form>

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', background:'white', borderRadius:8 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa' }}>
                      <th style={{ textAlign:'left', padding:'12px', borderBottom:'2px solid #ddd', fontWeight:600 }}>ID</th>
                      <th style={{ textAlign:'left', padding:'12px', borderBottom:'2px solid #ddd', fontWeight:600 }}>Name (EN)</th>
                      <th style={{ textAlign:'left', padding:'12px', borderBottom:'2px solid #ddd', fontWeight:600 }}>Name (AR)</th>
                      <th style={{ textAlign:'left', padding:'12px', borderBottom:'2px solid #ddd', fontWeight:600 }}>Order</th>
                      <th style={{ textAlign:'left', padding:'12px', borderBottom:'2px solid #ddd', fontWeight:600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.docId} style={{ borderBottom:'1px solid #f3f3f3' }}>
                        <td style={{ padding:'12px' }}><code>{c.docId}</code></td>
                        <td style={{ padding:'12px' }}>{c.name_en || '—'}</td>
                        <td style={{ padding:'12px' }}>{c.name_ar || '—'}</td>
                        <td style={{ padding:'12px' }}>{c.order ?? 0}</td>
                        <td style={{ padding:'12px', display:'flex', gap:8 }}>
                          <button onClick={()=>{ setCourseForm({ id: c.docId, name_en: c.name_en||'', name_ar: c.name_ar||'', order: c.order||0 }); setEditingCourse(c.docId); }} style={{ padding:'6px 12px', background:'#0d6efd', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.85rem' }}>Edit</button>
                          <button onClick={()=>{ setModalState({ open: true, title: 'Delete Category', message: `Delete "${c.name_en || c.docId}"? Activities with this category will fallback to "General".`, onConfirm: async () => { await deleteCourse(c.docId); toast?.showSuccess('Category deleted'); loadData(); setModalState({ open: false, title: '', message: '', onConfirm: null }); } }); }} style={{ padding:'6px 12px', background:'#dc3545', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:'0.85rem' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding:'2rem', color:'#888', textAlign:'center' }}>{t('no_categories_yet')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'emailTemplates' && (
            <div className="email-templates-tab">
              <EmailTemplates />
            </div>
          )}

          {activeTab === 'emailLogs' && (
            <div className="email-logs-tab">
              <EmailLogs />
            </div>
          )}

          {activeTab === 'allowlist' && (
            <div className="allowlist-tab">
              <h2>{t('allowlist_management')}</h2>
              
              <EmailManager
                emails={allowlist.allowedEmails || []}
                onEmailsChange={(emails) => setAllowlist({...allowlist, allowedEmails: emails})}
                title={t('student_emails')}
                placeholder="student@example.edu"
                description={t('students_can_register')}
                excludeEmails={allowlist.adminEmails || []}
                excludeMessage="This email is already in the admin list"
              />
              
              <EmailManager
                emails={allowlist.adminEmails || []}
                onEmailsChange={(emails) => setAllowlist({...allowlist, adminEmails: emails})}
                title={t('admin_emails')}
                placeholder="admin@example.edu"
                description={t('admins_get_privileges')}
                excludeEmails={allowlist.allowedEmails || []}
                excludeMessage="This email is already in the student list"
              />
              
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button onClick={handleAllowlistSave} className="submit-btn" disabled={loading}>
                  {loading ? t('saving') : t('save') + ' Allowlist Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Email Composer Modal */}
      <EmailComposer
        open={emailComposerOpen}
        onClose={() => setEmailComposerOpen(false)}
        onSend={async (emailData) => {
          const result = await sendEmail(emailData);
          // Log the attempt
          await addEmailLog({
            to: emailData.to,
            subject: emailData.subject,
            type: emailData.type || 'custom',
            status: result.success ? 'sent' : 'failed',
            error: result.success ? null : result.error,
            sentBy: user?.uid || 'unknown'
          });
          if (!result.success) throw new Error(result.error);
        }}
      />

      {/* Set Password Modal */}
      {showPasswordModal && passwordUser && (
        <Modal
          isOpen={showPasswordModal}
          onClose={() => { setShowPasswordModal(false); setPasswordUser(null); setNewPassword(''); }}
          title="Set User Password"
        >
          <div style={{ padding: '1rem' }}>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Set a new password for <strong>{passwordUser.displayName || passwordUser.email}</strong>
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (newPassword.length < 6) {
                toast?.showError('Password must be at least 6 characters');
                return;
              }
              try {
                const { httpsCallable } = await import('firebase/functions');
                const { functions } = await import('../firebase/config');
                const adminSetPassword = httpsCallable(functions, 'adminSetPassword');
                console.log('Calling adminSetPassword with:', { uid: passwordUser.docId, newPassword: '***' });
                const result = await adminSetPassword({ uid: passwordUser.docId, newPassword });
                console.log('adminSetPassword result:', result);
                if (result.data && result.data.success) {
                  toast?.showSuccess(result.data.message || 'Password updated successfully!');
                  setShowPasswordModal(false);
                  setPasswordUser(null);
                  setNewPassword('');
                } else {
                  toast?.showError('Failed to set password: ' + (result.data?.error || 'Unknown error'));
                }
              } catch (error) {
                console.error('Error setting password:', error);
                const msg = error.message || error.code || 'Unknown error';
                toast?.showError('Failed to set password: ' + msg);
              }
            }}>
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8, marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowPasswordModal(false); setPasswordUser(null); setNewPassword(''); }} style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Set Password</button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DashboardPage;
