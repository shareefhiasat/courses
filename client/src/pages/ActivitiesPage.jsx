import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { Navigate, useLocation } from 'react-router-dom';
import { getActivities, getStudentPoints } from '../firebase/firestore';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { submitActivity, getUserSubmissions, canRetakeActivity } from '../firebase/submissions';
import Loading from '../components/Loading';
import { useToast } from '../components/ToastProvider';
import './HomePage.css';
import { CheckCircle, Hourglass, CalendarDays, Repeat, Star, StarOff, Pin, Award, MessageSquareText } from 'lucide-react';
import { addNotification } from '../firebase/notifications';
import { sendEmail } from '../firebase/firestore';
import { formatDateTime } from '../utils/date';

const ActivitiesPage = () => {
  const { user, isAdmin } = useAuth();
  const { t, lang } = useLang();
  const location = useLocation();
  const toast = useToast();
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [bookmarkFilter, setBookmarkFilter] = useState(false);
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [retakeFilter, setRetakeFilter] = useState(false);
  const [gradedFilter, setGradedFilter] = useState('all'); // 'all', 'graded', 'not_graded'
  const [completedFilter, setCompletedFilter] = useState(false);
  const [bookmarks, setBookmarks] = useState({}); // { [activityId]: true }
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [activityMedals, setActivityMedals] = useState({}); // { [activityId]: [{medal, points}] }
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    fetchActivities();
    if (user) {
      fetchUserSubmissions();
      loadBookmarks();
      loadActivityMedals();
    }
  }, [user]);

  const loadActivityMedals = async () => {
    if (!user) return;
    try {
      // Get all points for this student
      const q = query(
        collection(db, 'points'),
        where('studentId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      
      const medalsByActivity = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.activityId) {
          if (!medalsByActivity[data.activityId]) {
            medalsByActivity[data.activityId] = [];
          }
          medalsByActivity[data.activityId].push({
            category: data.category,
            points: data.points,
            timestamp: data.timestamp
          });
        }
      });
      
      setActivityMedals(medalsByActivity);
    } catch (error) {
      console.error('Error loading activity medals:', error);
    }
  };

  // Deep-link: tab=bookmarks sets bookmark filter initially
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if ((params.get('tab') || '').toLowerCase() === 'bookmarks') {
        setBookmarkFilter(true);
      }
    } catch {}
  }, [location.search]);

  // Load enrolled classes for filtering
  useEffect(() => {
    const loadEnrollments = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() : {};
        setEnrolledClasses(Array.isArray(data.enrolledClasses) ? data.enrolledClasses : []);
      } catch {}
    };
    loadEnrollments();
  }, [user]);

  // Add loading spinner when filters change
  useEffect(() => {
    setFilterLoading(true);
    const timer = setTimeout(() => setFilterLoading(false), 300);
    return () => clearTimeout(timer);
  }, [typeFilter, levelFilter]);

  const fetchActivities = async () => {
    setLoading(true);
    const result = await getActivities();
    if (result.success) {
      setActivities(result.data || []);
    }
    setLoading(false);
  };

  const loadBookmarks = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.data() || {};
      setBookmarks((data.bookmarks && data.bookmarks.activities) || {});
    } catch {}
  };

  const fetchUserSubmissions = async () => {
    const result = await getUserSubmissions(user.uid);
    if (result.success) {
      const submissionMap = {};
      result.data.forEach(sub => {
        submissionMap[sub.activityId] = sub;
      });
      setSubmissions(submissionMap);
    }
  };

  const handleMarkComplete = async (activity) => {
    try {
      const activityId = activity.docId || activity.id;
      
      if (!activityId) {
        toast?.showError('Activity ID not found');
        return;
      }
      
      // Check if can retake
      if (submissions[activityId]) {
        const retakeCheck = await canRetakeActivity(user.uid, activityId, activity);
        if (!retakeCheck.canRetake) {
          toast?.showError(retakeCheck.reason);
          return;
        }
      }

      // Submit activity
      const result = await submitActivity(user.uid, activityId, activity.classId || 'general', {
        answers: {}, // This would be filled from a quiz form
        timeSpent: 0
      });

      if (result.success) {
        toast?.showSuccess(result.message || 'Activity marked as complete!');
        // In-app notification to the student
        try {
          await addNotification({
            userId: user.uid,
            title: (t('activity_completed') || 'Activity completed'),
            message: `${activity.title_en || activity.title_ar || activity.id}`,
            type: 'activity_complete',
            data: { activityId }
          });
        } catch {}
        // Email confirmation to the student
        try {
          if (user.email) {
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #800020;">✅ ${(t('activity_completed') || 'Activity completed')}</h2>
                <p style="margin:0.5rem 0 0.25rem 0;"><strong>${t('activity') || 'Activity'}:</strong> ${activity.title_en || activity.title_ar || activity.id}</p>
                <p style="margin:0.25rem 0;"><strong>${t('submitted_at') || 'Submitted'}:</strong> ${formatDateTime(new Date())}</p>
              </div>`;
            await sendEmail({
              to: [user.email],
              subject: `Completed: ${activity.title_en || activity.title_ar || activity.id}`,
              html,
              type: 'activity_complete'
            });
          }
        } catch {}
        await fetchUserSubmissions();
      } else {
        toast?.showError(result.error || 'Failed to submit activity');
      }
    } catch (error) {
      console.error('Error marking complete:', error);
      toast?.showError('Failed to submit activity: ' + error.message);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const activityId = activity.docId || activity.id;
    const submission = submissions[activityId];
    
    const typeMatch = typeFilter === 'all' || activity.type === typeFilter;
    const levelMatch = levelFilter === 'all' || (activity.level || 'beginner') === levelFilter;
    const bookmarkMatch = !bookmarkFilter || !!bookmarks[activityId];
    const featuredMatch = !featuredFilter || !!activity.featured;
    const enrolledGate = !activity.classId || (enrolledClasses || []).includes(activity.classId);
    
    // New filters
    const retakeMatch = !retakeFilter || activity.allowRetake;
    const gradedMatch = gradedFilter === 'all' || 
      (gradedFilter === 'graded' && submission?.status === 'graded') ||
      (gradedFilter === 'not_graded' && (!submission || submission?.status !== 'graded'));
    const completedMatch = !completedFilter || submission?.status === 'graded';
    
    return typeMatch && levelMatch && bookmarkMatch && featuredMatch && retakeMatch && gradedMatch && completedMatch && (activity.show || false) && enrolledGate;
  });

  if (!user) return <Navigate to="/login" />;

  if (loading) return <Loading />;

  return (
    <div className="activities-page" style={{ padding: '1rem 1.25rem' }}>
      {/* Filters */}
      <div className="filters-section" style={{
        background: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div className="filter-group" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666', whiteSpace: 'nowrap', display:'inline-flex', alignItems:'center', gap:6 }}><MessageSquareText size={14}/> {t('type')}:</span>
              <button type="button"
                onClick={() => setTypeFilter('all')}
                className={`filter-pill ${typeFilter === 'all' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: typeFilter === 'all' ? '#800020' : '#f0f0f0',
                  color: typeFilter === 'all' ? 'white' : '#666',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {t('all_types')}
              </button>
              <button type="button"
                onClick={() => setTypeFilter('training')}
                className={`filter-pill ${typeFilter === 'training' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: typeFilter === 'training' ? '#800020' : '#f0f0f0',
                  color: typeFilter === 'training' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {t('training')}
              </button>
              <button type="button"
                onClick={() => setTypeFilter('homework')}
                className={`filter-pill ${typeFilter === 'homework' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: typeFilter === 'homework' ? '#800020' : '#f0f0f0',
                  color: typeFilter === 'homework' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {t('homework')}
              </button>
              <button type="button"
                onClick={() => setTypeFilter('quiz')}
                className={`filter-pill ${typeFilter === 'quiz' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: typeFilter === 'quiz' ? '#800020' : '#f0f0f0',
                  color: typeFilter === 'quiz' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {t('quiz')}
              </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666', whiteSpace: 'nowrap', display:'inline-flex', alignItems:'center', gap:6 }}><Award size={14}/> {t('level')}:</span>
              <button type="button"
                onClick={() => setLevelFilter('all')}
                className={`filter-pill ${levelFilter === 'all' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: levelFilter === 'all' ? '#800020' : '#f0f0f0',
                  color: levelFilter === 'all' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {t('all_levels')}
              </button>
              <button type="button"
                onClick={() => setLevelFilter('beginner')}
                className={`filter-pill ${levelFilter === 'beginner' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: levelFilter === 'beginner' ? '#800020' : '#f0f0f0',
                  color: levelFilter === 'beginner' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {t('beginner')}
              </button>
              <button type="button"
                onClick={() => setLevelFilter('intermediate')}
                className={`filter-pill ${levelFilter === 'intermediate' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: levelFilter === 'intermediate' ? '#800020' : '#f0f0f0',
                  color: levelFilter === 'intermediate' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {t('intermediate')}
              </button>
              <button type="button"
                onClick={() => setLevelFilter('advanced')}
                className={`filter-pill ${levelFilter === 'advanced' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: levelFilter === 'advanced' ? '#800020' : '#f0f0f0',
                  color: levelFilter === 'advanced' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {t('advanced')}
              </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666', whiteSpace: 'nowrap', display:'inline-flex' }}><Star size={14} /></span>
              <button type="button"
                onClick={() => setBookmarkFilter(!bookmarkFilter)}
                className={`filter-pill ${bookmarkFilter ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: bookmarkFilter ? '#667eea' : '#f0f0f0',
                  color: bookmarkFilter ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {bookmarkFilter ? t('bookmarked') : t('all')}
              </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666', whiteSpace: 'nowrap', display:'inline-flex' }}><Pin size={14} /></span>
              <button type="button"
                onClick={() => setFeaturedFilter(!featuredFilter)}
                className={`filter-pill ${featuredFilter ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: featuredFilter ? '#667eea' : '#f0f0f0',
                  color: featuredFilter ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {featuredFilter ? (t('featured') || 'Featured') : t('all')}
              </button>
          </div>

          {/* New Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666', whiteSpace: 'nowrap', display:'inline-flex' }}><Repeat size={14} /></span>
              <button type="button"
                onClick={() => setRetakeFilter(!retakeFilter)}
                className={`filter-pill ${retakeFilter ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: retakeFilter ? '#17a2b8' : '#f0f0f0',
                  color: retakeFilter ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {retakeFilter ? (t('retake_allowed') || 'Retake Allowed') : t('all')}
              </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666', whiteSpace: 'nowrap', display:'inline-flex' }}><CheckCircle size={14} /></span>
              <button type="button"
                onClick={() => setGradedFilter('all')}
                className={`filter-pill ${gradedFilter === 'all' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: gradedFilter === 'all' ? '#800020' : '#f0f0f0',
                  color: gradedFilter === 'all' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {t('all')}
              </button>
              <button type="button"
                onClick={() => setGradedFilter('graded')}
                className={`filter-pill ${gradedFilter === 'graded' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: gradedFilter === 'graded' ? '#28a745' : '#f0f0f0',
                  color: gradedFilter === 'graded' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {t('graded') || 'Graded'}
              </button>
              <button type="button"
                onClick={() => setGradedFilter('not_graded')}
                className={`filter-pill ${gradedFilter === 'not_graded' ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: gradedFilter === 'not_graded' ? '#ffc107' : '#f0f0f0',
                  color: gradedFilter === 'not_graded' ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {t('not_graded') || 'Not Graded'}
              </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666', whiteSpace: 'nowrap' }}>✔️</span>
              <button type="button"
                onClick={() => setCompletedFilter(!completedFilter)}
                className={`filter-pill ${completedFilter ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: completedFilter ? '#28a745' : '#f0f0f0',
                  color: completedFilter ? 'white' : '#666',
                  cursor: 'pointer'
                }}
              >
                {completedFilter ? (t('completed') || 'Completed Only') : t('all')}
              </button>
          </div>
          {/* View toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" onClick={()=>setViewMode('grid')} className={`filter-pill ${viewMode==='grid'?'active':''}`} style={{ padding:'0.5rem 0.75rem', borderRadius: 8, border:'none', background: viewMode==='grid' ? '#800020' : '#f0f0f0', color: viewMode==='grid' ? 'white' : '#666' }}>Grid</button>
            <button type="button" onClick={()=>setViewMode('list')} className={`filter-pill ${viewMode==='list'?'active':''}`} style={{ padding:'0.5rem 0.75rem', borderRadius: 8, border:'none', background: viewMode==='list' ? '#800020' : '#f0f0f0', color: viewMode==='list' ? 'white' : '#666' }}>List</button>
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      {filterLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading />
        </div>
      ) : (
        <div className="activities-grid" style={{
          display: 'grid',
          gridTemplateColumns: viewMode==='grid' ? 'repeat(auto-fill, minmax(350px, 1fr))' : '1fr',
          gap: '1.5rem'
        }}>
          {filteredActivities.map(activity => {
            const activityId = activity.docId || activity.id;
            const submission = submissions[activityId];
            const isCompleted = submission && submission.status === 'completed';
            const isGraded = submission && submission.status === 'graded';
            const isBookmarked = !!bookmarks[activityId];
            
            return (
              <div key={activity.id} className="activity-card" style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Corner star bookmark */}
                {user && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const next = { ...bookmarks };
                        if (next[activityId]) delete next[activityId]; else next[activityId] = true;
                        setBookmarks(next);
                        await setDoc(doc(db, 'users', user.uid), { bookmarks: { activities: next } }, { merge: true });
                        // Send in-app notification and email on activity completion
                        if (isCompleted) {
                          sendNotification(t('activity_completed'), t('activity_completed_message'));
                          sendEmail(t('activity_completed_email_subject'), t('activity_completed_email_body'));
                        }
                      } catch {}
                    }}
                    aria-label={isBookmarked ? t('remove_bookmark') : t('add_bookmark')}
                    style={{
                      position: 'absolute',
                      top: 10,
                      [lang === 'ar' ? 'left' : 'right']: 12,
                      background: 'white', border: '1px solid #eee', borderRadius: 20,
                      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)', cursor: 'pointer', color: isBookmarked ? '#f5c518' : '#bbb'
                    }}
                  >
                    {isBookmarked ? <Star size={18} /> : <StarOff size={18} />}
                  </button>
                )}
                {/* Activity Header */}
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>{lang === 'ar' ? (activity.title_ar || activity.title_en || activity.id) : (activity.title_en || activity.title_ar || activity.id)}</span>
                    {activity.allowRetake && (
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#17a2b8',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Repeat size={14} /> {t('retake_allowed') || 'Retake Allowed'}</span>
                      </span>
                    )}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    {lang === 'ar' ? (activity.description_ar || activity.description_en || '—') : (activity.description_en || activity.description_ar || '—')}
                  </p>
                </div>

                {/* Activity Details */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  flexWrap: 'wrap',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem'
                  }}>
                    {t(activity.level || 'beginner')}
                  </span>
                  <span style={{
                    background: '#e3f2fd',
                    color: '#1976d2',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem'
                  }}>
                    {t(activity.type || 'training')}
                  </span>
                  {activity.optional && (
                    <span style={{
                      background: '#fff3e0',
                      color: '#f57c00',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem'
                    }}>
                      {t('optional')}
                    </span>
                  )}
                  
                  {/* Show medals earned for this activity */}
                  {activityMedals[activityId] && activityMedals[activityId].length > 0 && (
                    <>
                      {activityMedals[activityId].map((medal, idx) => (
                        <span key={idx} style={{
                          background: 'linear-gradient(135deg, #D4AF37, #FFD700)',
                          color: '#2E3B4E',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          border: '2px solid #D4AF37',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          🏅 +{medal.points}
                        </span>
                      ))}
                    </>
                  )}
                </div>

                {/* Activity Info */}
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#666',
                  marginBottom: '1rem',
                  lineHeight: '1.6'
                }}>
                  {activity.createdAt && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}><CalendarDays size={14} /> {t('created') || 'Created'}: {formatDateTime(activity.createdAt)}</div>
                  )}
                  {activity.dueDate && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}><CalendarDays size={14} /> {t('due_date_label')}: {formatDateTime(activity.dueDate)}</div>
                  )}
                  {activity.allowRetakes && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Repeat size={14} /> {t('retakes_allowed')}: <CheckCircle size={14} /></div>
                  )}
                  {activity.totalQuestions && (
                    <div>❓ {t('total_questions')}: {activity.totalQuestions}</div>
                  )}
                </div>

                {/* Grading Details for Students */}
                {submission && (
                  <div style={{
                    background: isGraded ? '#e8f5e9' : '#fff3e0',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    border: `1px solid ${isGraded ? '#c8e6c9' : '#ffe0b2'}`
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: isGraded ? '#2e7d32' : '#f57c00', display:'inline-flex', alignItems:'center', gap:6 }}>
                      {isGraded ? <><CheckCircle size={16} /> {t('graded') || 'Graded'}</> : <><Hourglass size={16} /> {t('pending') || 'Pending'}</>}
                    </div>
                    
                    {submission.submittedAt && (
                      <div style={{ color: '#666', marginBottom: '0.25rem', display:'inline-flex', alignItems:'center', gap:6 }}>
                        <MessageSquareText size={14} /> {t('submitted_at') || 'Submitted'}: {formatDateTime(submission.submittedAt)}
                      </div>
                    )}
                    
                    {isGraded && (
                      <>
                        <div style={{ color: '#666', marginBottom: '0.25rem', display:'inline-flex', alignItems:'center', gap:6 }}>
                          <FileSignature size={14} /> {t('graded_on') || 'Graded On'}: {submission.gradedAt ? formatDateTime(submission.gradedAt) : (t('unknown') || 'Unknown')}
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '1rem', color: '#2e7d32', marginTop: '0.5rem' }}>
                          🎯 {t('score') || 'Score'}: {submission.score}/{activity.maxScore || 100}
                        </div>
                        {submission.feedback && (
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '4px', color: '#555', fontStyle: 'italic', display:'inline-flex', alignItems:'center', gap:6 }}>
                            <MessageSquareText size={14} /> {submission.feedback}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Status/Featured Badge */}
                {isGraded && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: '#4caf50',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><CheckCircle size={14} /> {t('graded') || 'Graded'}: {submission.score}%</span>
                  </div>
                )}
                {isCompleted && !isGraded && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: '#ff9800',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Hourglass size={14} /> {t('pending') || 'Pending'}</span>
                  </div>
                )}
                {activity.featured && (
                  <div style={{
                    position: 'absolute', top: '1rem', [lang === 'ar' ? 'left' : 'right']: '4.5rem',
                    background: '#ecf0ff', color: '#4a57d6', padding: '0.25rem 0.5rem', borderRadius: 8, fontSize: '0.8rem'
                  }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Pin size={14} /> {t('featured') || 'Featured'}</span>
                  </div>
                )}

                {/* Action Buttons - Anchored to bottom */}
                <div style={{ 
                  marginTop: 'auto',
                  display: 'flex', 
                  gap: '0.5rem' 
                }}>
                  <button
                    onClick={() => {
                      // If activity has quizId, navigate to quiz player
                      if (activity.quizId) {
                        window.location.href = `/quiz/${activity.quizId}`;
                      } else {
                        window.open(activity.url, '_blank');
                      }
                    }}
                    style={{
                      flex: 1,
                      background: activity.quizId ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    {activity.quizId ? '🎮 ' + (t('start_quiz') || 'Start Quiz') : (activity.type === 'assignment' ? '📤 ' + (t('submit') || 'Submit') : t('start_activity'))}
                  </button>
                  <button
                    onClick={() => { window.location.href = `/activity/${activityId}`; }}
                    style={{
                      flex: 1,
                      background: '#f5f5f5',
                      color: '#333',
                      border: '1px solid #e5e5e5',
                      borderRadius: 8,
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {t('details') || 'Details / Share'}
                  </button>
                  {!isCompleted && !isAdmin && (
                    <button
                      onClick={() => handleMarkComplete(activity)}
                      style={{
                        padding: '0.75rem',
                        background: 'white',
                        color: '#667eea',
                        border: '2px solid #667eea',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={e => {
                        e.target.style.background = '#667eea';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#667eea';
                      }}
                    >
                      {t('mark_complete')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredActivities.length === 0 && !filterLoading && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <h3>No activities found</h3>
          <p>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;
